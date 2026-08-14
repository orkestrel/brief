import type { EmitterInterface } from '@orkestrel/emitter'
import { Emitter } from '@orkestrel/emitter'
import type { Interpretation, InterpretInterface } from '@orkestrel/interpret'
import { createInterpret, digestValue } from '@orkestrel/interpret'
import { attempt } from '@orkestrel/contract'
import type { LogicalResult, ReasonInterface } from '@orkestrel/reason'
import { createLogicalReasoner, createReason } from '@orkestrel/reason'
import { snapshotBrief } from './cloners.js'
import { BriefError } from './errors.js'
import {
	brief,
	briefToSubject,
	deriveGaps,
	deriveGivens,
	deriveTask,
	errorToMessage,
	findBlockingGaps,
	findUnmetRules,
	freezeDeep,
	pinBrief,
	gateDefinition,
	manifest,
	output,
} from './helpers.js'
import { isLogicalVerdict } from './validators.js'
import type {
	Brief,
	BriefInput,
	Briefing,
	BriefStageFailure,
	BriefStageRecord,
	BriefCompilerEventMap,
	BriefCompilerInterface,
	BriefCompilerOptions,
	Gap,
	TaskDomain,
	TaskOperation,
} from './types.js'

/**
 * The compilation orchestrator — the four-stage `[interpret, draft, gate, pin]` pipeline.
 *
 * @remarks
 * `compile` is genuinely SYNCHRONOUS and never throws for a brief it cannot emit: a
 * blocking gap, a refused gate, and a thrown stage all yield a visible INCOMPLETE
 * `Briefing`. It owns the engines it created and BORROWS the ones passed in, so
 * `destroy()` releases only what it made.
 *
 * @example
 * ```ts
 * import { BriefCompiler, proof, task } from '@orkestrel/brief'
 *
 * const compiler = new BriefCompiler()
 * const briefing = compiler.compile({
 * 	task: task('audit', 'code', 'Audit the barrel for undocumented exports.'),
 * 	outcomes: [{ rank: 1, text: 'every export appears in the guide', required: true }],
 * 	proofs: [proof('parity passes', 'npm run test:guides')],
 * })
 * briefing.brief !== undefined // true — the presence of the brief IS the completeness test
 * compiler.destroy()
 * ```
 */
export class BriefCompiler implements BriefCompilerInterface {
	readonly #emitter: Emitter<BriefCompilerEventMap>
	readonly #interpret: InterpretInterface
	readonly #reason: ReasonInterface
	readonly #ownInterpret: boolean
	readonly #ownReason: boolean
	readonly #actions: Readonly<Record<string, TaskOperation>>
	readonly #domains: Readonly<Record<string, TaskDomain>>
	#destroyed = false

	constructor(options?: BriefCompilerOptions) {
		// ONE read per option, for the reason `compile` takes one reading of its input: a second
		// read lets a getter answer differently. Reading `interpret` twice decided ownership from
		// the first answer and stored the second, so a borrowed engine could be destroyed and a
		// self-made one leaked — the exact inversion of the documented contract.
		const hooks = options?.on
		const failed = options?.error
		const borrowedInterpret = options?.interpret
		const borrowedReason = options?.reason
		this.#emitter = new Emitter<BriefCompilerEventMap>({
			...(hooks === undefined ? {} : { on: hooks }),
			...(failed === undefined ? {} : { error: failed }),
		})
		this.#ownInterpret = borrowedInterpret === undefined
		this.#ownReason = borrowedReason === undefined
		this.#interpret = borrowedInterpret ?? createInterpret()
		this.#reason = borrowedReason ?? createReason({ reasoners: [createLogicalReasoner()] })
		this.#actions = options?.actions ?? {}
		this.#domains = options?.domains ?? {}
	}

	get emitter(): EmitterInterface<BriefCompilerEventMap> {
		return this.#emitter
	}

	get interpret(): InterpretInterface {
		return this.#interpret
	}

	get reason(): ReasonInterface {
		return this.#reason
	}

	compile(input: BriefInput): Briefing {
		this.#refuseDestroyed()
		const stages: BriefStageRecord[] = []
		const failures: BriefStageFailure[] = []

		// ONE reading of the caller's object, taken first and used by every stage below. Reading
		// it again per stage let a getter answer differently each time, so the replay could
		// describe a compilation that did not happen — and a getter that THREW escaped `compile`
		// as a foreign error, which this contains into the same visible refusal as any other
		// stage failure.
		const taken = attempt(() => this.#snapshot(input))
		if (!taken.success) {
			const message = errorToMessage(taken.error)
			stages.push(Object.freeze({ stage: 'draft', input: {}, error: message }))
			failures.push(Object.freeze({ stage: 'draft', code: 'DRAFT_FAILED', message }))
			this.#emitter.emit('error', taken.error)
			return this.#refuse(undefined, [], undefined, stages, failures)
		}
		const owned = taken.value

		const interpretation = this.#read(owned, stages, failures)

		const drafted = attempt(() => this.#draft(owned, interpretation))
		if (!drafted.success) {
			const message = errorToMessage(drafted.error)
			stages.push(Object.freeze({ stage: 'draft', input: owned, error: message }))
			failures.push(Object.freeze({ stage: 'draft', code: 'DRAFT_FAILED', message }))
			this.#emitter.emit('error', drafted.error)
			return this.#refuse(interpretation, [], undefined, stages, failures)
		}
		const draft = drafted.value
		stages.push(Object.freeze({ stage: 'draft', input: owned, output: draft }))

		const questions = findBlockingGaps(draft)
		const subject = Object.freeze(briefToSubject(draft))
		// The verdict is OWNED before it is recorded, for the reason the draft input is. It comes
		// from a borrowed engine, and nothing in `ReasonInterface` promises a fresh object per
		// call — an engine pooling one mutable result rewrote the verdict of a briefing already
		// returned. Cloning breaks the alias; freezing alone would only have sealed the engine's
		// own object. Contained, because a verdict carrying something unclonable is the engine's
		// fault and must not throw out of `compile`.
		const ruled = attempt(() => this.#own(this.gate(draft)))
		if (ruled.success) {
			stages.push(Object.freeze({ stage: 'gate', input: subject, output: ruled.value }))
		} else {
			const message = errorToMessage(ruled.error)
			stages.push(Object.freeze({ stage: 'gate', input: subject, error: message }))
			failures.push(Object.freeze({ stage: 'gate', code: 'GATE_FAILED', message }))
			this.#emitter.emit('error', ruled.error)
		}
		const verdict = ruled.success ? ruled.value : undefined

		// Readiness is decided HERE, from the measures, before the verdict is consulted. The
		// reasoner is borrowed — `BriefCompilerOptions.reason` is a documented seam — so its verdict
		// narrates and never decides: a supplied engine can add detail to a refusal and can
		// never turn one into a pass.
		const unready = findUnmetRules(draft)
		if (unready.length > 0 || verdict === undefined || !verdict.conclusion) {
			const refusal = this.#blockage(questions, unready, verdict)
			if (refusal !== undefined) failures.push(Object.freeze(refusal))
			return this.#refuse(interpretation, questions, verdict, stages, failures)
		}

		const stamped = attempt(() => pinBrief(draft))
		if (!stamped.success) {
			const message = errorToMessage(stamped.error)
			stages.push(Object.freeze({ stage: 'pin', input: draft, error: message }))
			failures.push(Object.freeze({ stage: 'pin', code: 'PIN_FAILED', message }))
			this.#emitter.emit('error', stamped.error)
			return this.#refuse(interpretation, questions, verdict, stages, failures)
		}
		const pinned = stamped.value
		stages.push(Object.freeze({ stage: 'pin', input: draft, output: pinned }))

		const briefing: Briefing = Object.freeze({
			...(interpretation === undefined ? {} : { interpretation }),
			brief: pinned,
			questions: Object.freeze([]),
			verdict,
			stages: Object.freeze([...stages]),
			failures: Object.freeze([...failures]),
			digest: digestValue({ brief: pinned, questions: [], failures }),
		})
		this.#emitter.emit('compile', briefing)
		return briefing
	}

	gate(source: Brief): LogicalResult {
		this.#refuseDestroyed()
		// The reasoner is BORROWED, so it can throw its own foreign error — a `ReasonError` from
		// an engine the caller already destroyed, for one. Every throw out of this module is a
		// `BriefError` that `isBriefError` narrows, so a foreign throw is translated rather than
		// leaked.
		const ruled = attempt(() => this.#reason.reason(briefToSubject(source), gateDefinition()))
		if (!ruled.success) {
			throw new BriefError('GATE_FAILED', errorToMessage(ruled.error), {
				stage: 'gate',
				field: 'reason',
			})
		}
		const verdict = ruled.value
		// Guard the WHOLE value, not one field. The reasoner is borrowed, so its return is
		// foreign data however well-typed the interface is: reading `.reasoning` off `undefined`
		// threw a raw TypeError where the contract promises `GATE_FAILED`, and a result that
		// claimed `reasoning: 'logical'` without a `rules` array crashed the caller of this
		// method instead. `isLogicalVerdict` is total, so every malformed shape lands here.
		if (!isLogicalVerdict(verdict)) {
			throw new BriefError('GATE_FAILED', 'The gate reasoner returned a non-logical result', {
				stage: 'gate',
				field: 'reasoning',
			})
		}
		return verdict
	}

	destroy(): void {
		if (this.#destroyed) return
		this.#destroyed = true
		if (this.#ownInterpret) this.#interpret.destroy()
		if (this.#ownReason) this.#reason.destroy()
		this.#emitter.emit('destroy')
		this.#emitter.destroy()
	}

	// THE reading of the caller's input — taken once, deep, and shared by every stage. A
	// per-field copy left the members aliased, and a second reading let a getter answer
	// differently, so there is exactly one and no fallback that re-reads. The freeze is DEEP
	// because `Object.freeze` alone left every nested array writable, so a consumer could
	// rewrite the recorded stage input after the digest describing it was sealed. Throws for
	// an input that cannot be cloned; `compile` contains that into a visible refusal.
	#snapshot(input: BriefInput): BriefInput {
		return freezeDeep(structuredClone(input))
	}

	// The same ownership boundary for a value a BORROWED engine returned. `Briefing` is
	// documented as replayable, and a foreign engine's object is neither ours nor stable — it
	// may be pooled, mutated later, or handed to another caller.
	#own<TValue>(value: TValue): TValue {
		return freezeDeep(structuredClone(value))
	}

	// The interpret stage. Skipped entirely when the input carries no text, in which case
	// a caller-supplied interpretation still reaches the draft.
	#read(
		input: BriefInput,
		stages: BriefStageRecord[],
		failures: BriefStageFailure[],
	): Interpretation | undefined {
		const text = input.text
		if (text === undefined) return input.interpretation
		// Owned for the same reason the verdict is: the engine is borrowed and its
		// `Interpretation` is foreign data the briefing then carries as a replay.
		const read = attempt(() => this.#own(this.#interpret.interpret(text)))
		if (read.success) {
			stages.push(Object.freeze({ stage: 'interpret', input: text, output: read.value }))
			return read.value
		}
		const message = errorToMessage(read.error)
		stages.push(Object.freeze({ stage: 'interpret', input: text, error: message }))
		failures.push(Object.freeze({ stage: 'interpret', code: 'INTERPRET_FAILED', message }))
		this.#emitter.emit('error', read.error)
		return input.interpretation
	}

	// The one place a refusal is coded. Blocking gaps ALWAYS produce `BLOCKED`, including
	// when the gate itself threw and left no verdict to report rules from.
	#blockage(
		questions: readonly Gap[],
		unready: readonly string[],
		verdict: LogicalResult | undefined,
	): BriefStageFailure | undefined {
		if (questions.length > 0) {
			return {
				stage: 'gate',
				code: 'BLOCKED',
				message: `${String(questions.length)} blocking gap(s)`,
			}
		}
		// The measured refusal is named first, because it is the one that decided.
		if (unready.length > 0) {
			return { stage: 'gate', code: 'BLOCKED', message: `Gate refused: ${unready.join(', ')}` }
		}
		// The same total guard `gate` applies. A borrowed engine can hand back a value that
		// satisfies the compiler and not the contract, and reading `.rules.filter` off one threw
		// out of `compile` — from the code whose whole job is containing a failure.
		if (!isLogicalVerdict(verdict)) return undefined
		const refused = verdict.rules
			.filter((entry) => !entry.conclusion)
			.map((entry) => entry.id)
			.join(', ')
		return { stage: 'gate', code: 'BLOCKED', message: `Gate refused: ${refused}` }
	}

	// The draft stage. Derived sections come first and caller sections merge OVER them,
	// so the user is never overridden; derived and caller gaps and givens accumulate.
	#draft(input: BriefInput, interpretation: Interpretation | undefined): Brief {
		const derived =
			interpretation === undefined
				? undefined
				: deriveTask(interpretation.intent, interpretation.text, this.#actions, this.#domains)
		const subject = input.task ?? derived
		if (subject === undefined) {
			throw new BriefError(
				'DRAFT_FAILED',
				'No task: supply BriefInput.task, or map the intent through the actions and domains vocabularies',
				{ stage: 'draft', field: 'task' },
			)
		}
		// Snapshot at the draft, not only at the pin. A drafted brief adopts the caller's
		// arrays, and it is what `Briefing.stages` records — a replay that changes when the
		// caller mutates their own input afterwards is not a replay.
		return snapshotBrief(
			brief(subject, {
				authority: input.authority ?? [],
				manifest: input.manifest ?? manifest(),
				outcomes: input.outcomes ?? [],
				rules: input.rules ?? [],
				invariants: input.invariants ?? [],
				givens: [
					...(interpretation === undefined ? [] : deriveGivens(interpretation.entities)),
					...(input.givens ?? []),
				],
				examples: input.examples ?? [],
				assumptions: input.assumptions ?? [],
				citations: input.citations ?? [],
				gaps: [
					...(interpretation === undefined ? [] : deriveGaps(interpretation.ambiguities)),
					...(input.gaps ?? []),
				],
				risks: input.risks ?? [],
				output: input.output ?? output('markdown'),
				proofs: input.proofs ?? [],
			}),
		)
	}

	// The one incomplete result shape: no brief, the questions visible, `block` emitted.
	#refuse(
		interpretation: Interpretation | undefined,
		questions: readonly Gap[],
		verdict: LogicalResult | undefined,
		stages: readonly BriefStageRecord[],
		failures: readonly BriefStageFailure[],
	): Briefing {
		// Frozen exactly as the complete path is. The incomplete briefing is this package's
		// headline artifact — the visible refusal — so it must not be the mutable one: a
		// `failures.pop()` would drop the `BLOCKED` marker the `digest` already attests to.
		// ONE frozen array, carried by the briefing AND handed to every listener. Emitting the
		// caller-reachable `questions` instead gave observers a mutable array that was not the
		// briefing's: one listener could rewrite what the next was handed, and neither reached
		// the record the digest attests to. Observation is a side-channel, so it reads exactly
		// what the briefing carries and can change nothing.
		const asked = Object.freeze([...questions])
		const briefing: Briefing = Object.freeze({
			...(interpretation === undefined ? {} : { interpretation }),
			questions: asked,
			...(verdict === undefined ? {} : { verdict }),
			stages: Object.freeze([...stages]),
			failures: Object.freeze([...failures]),
			digest: digestValue({ questions, failures }),
		})
		this.#emitter.emit('block', asked)
		return briefing
	}

	// Every method except the getters and `destroy` refuses a destroyed compiler.
	#refuseDestroyed(): void {
		if (this.#destroyed) throw new BriefError('DESTROYED', 'BriefCompiler has been destroyed')
	}
}
