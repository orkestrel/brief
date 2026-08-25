import type { BriefInput, Briefing, Gap, Outcome } from '@src/core'
import {
	BriefCompiler,
	briefToSubject,
	createBriefCompiler,
	gap,
	gateDefinition,
	INTERPRETATION_MEMBERS,
	isBriefError,
	manifest,
	outcome,
	proof,
	reference,
	task,
} from '@src/core'
import type { Interpretation } from '@orkestrel/interpret'
import { createInterpret } from '@orkestrel/interpret'
import { createLogicalReasoner, createReason } from '@orkestrel/reason'
import { captureError, createRecorder } from '@orkestrel/test'
import { describe, expect, expectTypeOf, it } from 'vitest'
import {
	buildBrief,
	buildInterpret,
	buildPermissiveEvaluator,
	buildReadyInput,
	AccessorInterpretation,
	ShiftingAccessorInterpretation,
	buildAccessorInterpret,
	buildCountingReason,
	buildFailingInterpret,
	buildForeignInterpret,
	buildSilentReason,
	buildShiftingInterpret,
	buildShiftingReason,
	buildStableReason,
	buildTask,
	readErrorCode,
} from '../../setup.js'

describe('BriefCompiler pipeline', () => {
	it('skips the interpret stage when the input carries no text', () => {
		const compiler = createBriefCompiler()
		const briefing = compiler.compile(buildReadyInput())
		expect(briefing.stages.map((record) => record.stage)).toStrictEqual(['draft', 'gate', 'pin'])
		expect(briefing.interpretation).toBeUndefined()
		expect(briefing.brief).toBeDefined()
		compiler.destroy()
	})

	it('runs all four stages when the input carries text', () => {
		const compiler = createBriefCompiler({
			interpret: buildInterpret('migrate', 'code', true),
			actions: { migrate: 'migrate' },
			domains: { code: 'code' },
		})
		const briefing = compiler.compile({
			text: 'migrate the 3 legacy stores to the new driver seam',
			outcomes: [outcome(1, 'all three stores implement the driver seam')],
			proofs: [proof('the core project passes', 'npm run test:src:core')],
		})
		expect(briefing.stages.map((record) => record.stage)).toStrictEqual([
			'interpret',
			'draft',
			'gate',
			'pin',
		])
		expect(briefing.stages.every((record) => record.error === undefined)).toBe(true)
		// The text lives on the interpretation, not echoed onto the briefing.
		expect(briefing.interpretation?.text).toBe('migrate the 3 legacy stores to the new driver seam')
		expect(briefing.interpretation?.intent.action).toBe('migrate')
		expect(briefing.brief?.task).toEqual({
			operation: 'migrate',
			domain: 'code',
			statement: 'Migrate the 3 legacy stores to the new driver seam.',
		})
		expect(briefing.brief?.givens).toEqual([{ category: 'extracted', name: 'count', value: '3' }])
		expect(briefing.brief).toBeDefined()
		compiler.destroy()
	})

	it('pins the emitted brief', () => {
		const compiler = createBriefCompiler()
		const briefing = compiler.compile(buildReadyInput())
		expect(briefing.brief?.hash).toMatch(/^[0-9a-f]{8}$/u)
		expect(briefing.brief?.trace).toBe('refactor/code · outcomes:1 · gaps:0/0 · proofs:1')
		compiler.destroy()
	})

	it('produces the same briefing for the same input', () => {
		const compiler = createBriefCompiler()
		const first = compiler.compile(buildReadyInput())
		const second = compiler.compile(buildReadyInput())
		expect(first.digest).toBe(second.digest)
		expect(first.brief).toEqual(second.brief)
		compiler.destroy()
	})

	it('merges caller sections over the derived draft and accumulates gaps and givens', () => {
		const compiler = createBriefCompiler({
			interpret: buildInterpret('migrate', 'code', true),
			actions: { migrate: 'migrate' },
			domains: { code: 'code' },
		})
		const briefing = compiler.compile({
			text: 'migrate the 3 legacy stores',
			task: task('plan', 'ops', 'Plan the store migration.'),
			givens: [{ category: 'convention', name: 'indentation', value: 'tabs' }],
			gaps: [gap('rules', 'Keep the wording?')],
			assumptions: ['Wording is preserved.'],
			outcomes: [outcome(1, 'the plan lands')],
			proofs: [proof('checks pass', 'npm run check')],
		})
		expect(briefing.brief?.task).toEqual({
			operation: 'plan',
			domain: 'ops',
			statement: 'Plan the store migration.',
		})
		expect(briefing.brief?.givens).toEqual([
			{ category: 'extracted', name: 'count', value: '3' },
			{ category: 'convention', name: 'indentation', value: 'tabs' },
		])
		expect(briefing.brief?.gaps).toEqual([
			{ field: 'rules', question: 'Keep the wording?', blocking: false },
		])
		compiler.destroy()
	})

	it('records each stage input and output', () => {
		const compiler = createBriefCompiler()
		const briefing = compiler.compile(buildReadyInput())
		const gateRecord = briefing.stages.find((record) => record.stage === 'gate')
		expect(gateRecord?.input).toEqual(briefToSubject(briefing.brief ?? buildBrief()))
		expect(gateRecord?.output).toBe(briefing.verdict)
		expect(briefing.stages.find((record) => record.stage === 'pin')?.output).toBe(briefing.brief)
	})
})

describe('BriefCompiler fail-closed paths', () => {
	it('blocks on a blocking gap, carrying the questions and no brief', () => {
		const compiler = createBriefCompiler()
		const briefing = compiler.compile({
			...buildReadyInput(),
			gaps: [
				gap('output', 'Diff or full files?', { blocking: true, candidates: ['diff', 'code'] }),
			],
		})
		expect(briefing.brief).toBeUndefined()
		expect(briefing.brief).toBeUndefined()
		expect(briefing.questions).toEqual([
			{
				field: 'output',
				question: 'Diff or full files?',
				blocking: true,
				candidates: ['diff', 'code'],
			},
		])
		expect(briefing.failures).toStrictEqual([
			{ stage: 'gate', code: 'BLOCKED', message: '1 blocking gap(s)' },
		])
		expect(briefing.verdict?.conclusion).toBe(false)
		expect(briefing.verdict?.trace.length).toBeGreaterThan(0)
		expect(briefing.stages.map((record) => record.stage)).toStrictEqual(['draft', 'gate'])
		compiler.destroy()
	})

	it('refuses an unready brief even when a borrowed reasoner answers met to everything', () => {
		// The engine is BORROWED through a documented option, so its verdict narrates and never
		// decides. `evaluator` is @orkestrel/reason's own published injection point, so this
		// drives the real reasoner rather than replacing project-owned behaviour — and it is
		// the control the previous version of this test lacked: it supplied the DEFAULT engine,
		// which refuses these briefs anyway, so it would have passed with the guard deleted.
		const permissive = createReason({
			reasoners: [createLogicalReasoner({ evaluator: buildPermissiveEvaluator() })],
		})
		const compiler = createBriefCompiler({ reason: permissive })

		const verdict = compiler.gate(buildBrief({ proofs: [] }))
		expect(verdict.conclusion).toBe(true) // the engine really does say yes

		for (const unready of [
			{ ...buildReadyInput(), proofs: [] },
			{ ...buildReadyInput(), outcomes: [] },
			{ ...buildReadyInput(), gaps: [gap('output', 'Diff or files?', { blocking: true })] },
			{ ...buildReadyInput(), task: task('plan', 'ops', 'Do one thing. Then another.') },
		]) {
			const briefing = compiler.compile(unready)
			expect(briefing.brief).toBeUndefined()
			expect(briefing.brief).toBeUndefined()
			expect(briefing.failures.map((entry) => entry.code)).toStrictEqual(['BLOCKED'])
		}

		// The control: the same permissive engine still emits a genuinely ready brief.
		expect(compiler.compile(buildReadyInput()).brief).toBeDefined()
		compiler.destroy()
		permissive.destroy()
	})

	it('freezes the INCOMPLETE briefing as hard as the complete one', () => {
		// The refusal is this package's headline artifact, and it was the mutable one: nothing
		// in the incomplete path was frozen, so `failures.pop()` dropped the BLOCKED marker the
		// digest already attested to.
		const compiler = createBriefCompiler()
		const briefing = compiler.compile({
			...buildReadyInput(),
			gaps: [gap('output', 'Diff or files?', { blocking: true })],
		})
		expect(briefing.brief).toBeUndefined()
		expect(Object.isFrozen(briefing)).toBe(true)
		expect(Object.isFrozen(briefing.stages)).toBe(true)
		expect(Object.isFrozen(briefing.failures)).toBe(true)
		expect(Object.isFrozen(briefing.questions)).toBe(true)
		// Each record too: freezing the array alone still lets a member be swapped.
		for (const record of briefing.stages) expect(Object.isFrozen(record)).toBe(true)
		compiler.destroy()
	})

	it('freezes every stage record on the complete path too', () => {
		const compiler = createBriefCompiler()
		const briefing = compiler.compile(buildReadyInput())
		expect(briefing.brief).toBeDefined()
		for (const record of briefing.stages) expect(Object.isFrozen(record)).toBe(true)
		compiler.destroy()
	})

	it('freezes each failure, not only the array that holds them', () => {
		// `digest` attests to `failures`, so a writable member moves what the digest describes.
		const compiler = createBriefCompiler()
		const briefing = compiler.compile({ task: buildTask(), outcomes: [outcome(1, 'x')] })
		expect(briefing.failures.length).toBeGreaterThan(0)
		for (const failure of briefing.failures) expect(Object.isFrozen(failure)).toBe(true)
		compiler.destroy()
	})

	it('reads the caller input exactly once, so the replay cannot describe another call', () => {
		// Reading per stage let a getter answer differently each time: the draft record said it
		// was handed one outcome while its own output carried two.
		let reads = 0
		const shifting: BriefInput = {
			task: buildTask(),
			proofs: [proof('x', 'npm test')],
			get outcomes(): readonly Outcome[] {
				reads += 1
				return reads === 1 ? [outcome(1, 'first')] : [outcome(1, 'first'), outcome(2, 'second')]
			},
		}
		const compiler = createBriefCompiler()
		const briefing = compiler.compile(shifting)
		const drafted = briefing.stages.find((record) => record.stage === 'draft')
		expect(reads).toBe(1)
		expect(drafted?.input.outcomes).toHaveLength(1)
		expect(drafted?.output?.outcomes).toHaveLength(1)
		expect(briefing.brief?.outcomes).toHaveLength(1)
		compiler.destroy()
	})

	it('contains a throwing getter instead of letting a foreign error escape', () => {
		// `compile` promises it never throws for a brief it cannot emit. A getter on the input
		// used to propagate straight out as whatever it threw.
		const hostile: BriefInput = {
			task: buildTask(),
			proofs: [proof('x', 'npm test')],
			outcomes: [outcome(1, 'x')],
			get text(): string {
				throw new TypeError('hostile text getter')
			},
		}
		const compiler = createBriefCompiler()
		const briefing = compiler.compile(hostile)
		expect(briefing.brief).toBeUndefined()
		expect(briefing.brief).toBeUndefined()
		expect(briefing.failures.map((entry) => entry.code)).toStrictEqual(['DRAFT_FAILED'])
		expect(briefing.failures[0]?.message).toContain('hostile text getter')
		compiler.destroy()
	})

	it('records an input the caller cannot move after the call', () => {
		const outcomes = [outcome(1, 'shipped')]
		const compiler = createBriefCompiler()
		const briefing = compiler.compile({ ...buildReadyInput(), outcomes })
		const drafted = briefing.stages.find((record) => record.stage === 'draft')
		outcomes.push(outcome(2, 'forged'))
		// Both halves of the record, not only the output the earlier version checked.
		expect(drafted?.input.outcomes).toHaveLength(1)
		expect(drafted?.output?.outcomes).toHaveLength(1)
		expect(Object.isFrozen(briefing)).toBe(true)
		expect(Object.isFrozen(briefing.stages)).toBe(true)
		compiler.destroy()
	})

	it('records a replay that a later mutation of the caller input cannot change', () => {
		const outcomes = [outcome(1, 'shipped')]
		const compiler = createBriefCompiler()
		const briefing = compiler.compile({ ...buildReadyInput(), outcomes })
		const drafted = briefing.stages.find((record) => record.stage === 'draft')
		const before = drafted?.output?.outcomes.length
		outcomes.push(outcome(2, 'forged'))
		expect(drafted?.output?.outcomes.length).toBe(before)
		expect(drafted?.output?.outcomes).toHaveLength(1)
		compiler.destroy()
	})

	it('names the unmet rules when the gate refuses for another reason', () => {
		const compiler = createBriefCompiler()
		const briefing = compiler.compile({ task: buildTask(), outcomes: [outcome(1, 'x')] })
		expect(briefing.brief).toBeUndefined()
		expect(briefing.questions).toEqual([])
		// The MEASURED refusal, named from findUnmetRules — the rules that actually decided, without
		// the derived conjunction they roll up into.
		expect(briefing.failures[0]?.message).toBe('Gate refused: proven')
		compiler.destroy()
	})

	it('refuses a brief whose authority no manifest partition opens', () => {
		// The cross-section check the merged `Reference` makes possible: `authority` and every
		// manifest partition hold one record type, so the two are comparable by path. Driven
		// through `compile` rather than the leaf, because the gate is where it has to bite.
		const compiler = createBriefCompiler()
		// Banned outright.
		const banned = compiler.compile({
			task: buildTask(),
			authority: [reference('AGENTS.md', 'project law')],
			manifest: manifest({ forbidden: [reference('AGENTS.md', 'out of scope')] }),
			outcomes: [outcome(1, 'x')],
			proofs: [proof('x', 'npm test')],
		})
		expect(banned.brief).toBeUndefined()
		expect(banned.failures[0]?.message).toBe('Gate refused: granted')
		// Never granted at all. A forbidden-only check let this compile, projecting an authority
		// the executor has no permission to open — the emptiest possible manifest, and the whole
		// reason the rule is "every authority is granted" rather than "none is forbidden".
		const ungranted = compiler.compile({
			task: buildTask(),
			authority: [reference('AGENTS.md', 'project law')],
			manifest: manifest(),
			outcomes: [outcome(1, 'x')],
			proofs: [proof('x', 'npm test')],
		})
		expect(ungranted.brief).toBeUndefined()
		expect(ungranted.failures[0]?.message).toBe('Gate refused: granted')
		// The control: granted by `locked`, and it compiles.
		const allowed = compiler.compile({
			task: buildTask(),
			authority: [reference('AGENTS.md', 'project law')],
			manifest: manifest({ locked: [reference('AGENTS.md', 'read, never written')] }),
			outcomes: [outcome(1, 'x')],
			proofs: [proof('x', 'npm test')],
		})
		expect(allowed.brief).toBeDefined()
		compiler.destroy()
	})

	it('reads each constructor option exactly once, so ownership cannot invert', () => {
		// `compile` already takes ONE reading of its input because a second lets a getter answer
		// differently. The constructor did not: it decided ownership from read one and stored
		// read two, so a borrowed engine could be destroyed and a self-made one leaked.
		//
		// Driven with two REAL engines rather than an undefined-then-engine getter: under
		// `exactOptionalPropertyTypes` a getter typed `InterpretInterface | undefined` is not
		// assignable to the options, so the undefined vector needs a cast or an untyped JS
		// caller. The one-reading property is what the fix establishes, and this pins it
		// directly and type-validly.
		const first = createInterpret()
		const second = createInterpret()
		let reads = 0
		const compiler = new BriefCompiler({
			get interpret() {
				reads += 1
				return reads === 1 ? first : second
			},
		})
		expect(reads).toBe(1)
		// The stored engine IS the one ownership was decided from. Reading twice stored the
		// second answer while deciding from the first.
		expect(compiler.interpret).toBe(first)
		compiler.destroy()
		first.destroy()
		second.destroy()

		// The control: a plainly-supplied engine is read once and borrowed.
		const borrowed = createInterpret()
		let plainReads = 0
		const third = new BriefCompiler({
			get interpret() {
				plainReads += 1
				return borrowed
			},
		})
		expect(plainReads).toBe(1)
		expect(third.interpret).toBe(borrowed)
		third.destroy()
		borrowed.destroy()
	})

	it('records a deeply frozen stage input, so the replay cannot be rewritten', () => {
		// `Briefing` is documented as the replayable outcome and its `digest` attests to what
		// the stages hold. A shallow freeze left every nested array writable, so a consumer
		// could rewrite the recorded input after the digest describing it was sealed.
		const compiler = createBriefCompiler()
		const briefing = compiler.compile({
			task: buildTask(),
			outcomes: [outcome(1, 'x')],
			proofs: [proof('x', 'npm test')],
		})
		const drafted = briefing.stages.find((record) => record.stage === 'draft')
		expect(drafted?.stage).toBe('draft')
		const recorded = drafted?.stage === 'draft' ? drafted.input : undefined
		expect(recorded).toBeDefined()
		expect(Object.isFrozen(recorded)).toBe(true)
		// The nested array is the half a shallow freeze left writable.
		expect(recorded?.outcomes).toHaveLength(1)
		expect(Object.isFrozen(recorded?.outcomes)).toBe(true)
		expect(Object.isFrozen(recorded?.outcomes?.[0])).toBe(true)
		compiler.destroy()
	})

	it('hands every block listener the same frozen array the briefing carries', () => {
		// Observation is a side-channel: a listener reads what the briefing holds and can change
		// nothing. Emitting a separate mutable array let one listener rewrite what the next was
		// handed, and neither saw the record the digest attests to.
		const compiler = createBriefCompiler()
		const seen: Array<readonly Gap[]> = []
		compiler.emitter.on('block', (questions) => {
			seen.push(questions)
		})
		compiler.emitter.on('block', (questions) => {
			seen.push(questions)
		})
		const briefing = compiler.compile({
			task: buildTask(),
			outcomes: [outcome(1, 'x')],
			proofs: [proof('x', 'npm test')],
			gaps: [gap('output', 'Diff or files?', { blocking: true })],
		})
		expect(seen).toHaveLength(2)
		expect(seen[0]).toBe(briefing.questions)
		expect(seen[1]).toBe(briefing.questions)
		expect(Object.isFrozen(briefing.questions)).toBe(true)
		compiler.destroy()
	})

	it('owns the verdict it records, rather than aliasing the borrowed engine', () => {
		// The verdict comes from a BORROWED engine, and nothing in `ReasonInterface` promises a
		// fresh object per call. An engine pooling one mutable result rewrote the verdict of a
		// briefing already returned, so the recorded value is cloned and frozen like the draft
		// input — a `Briefing` is documented as replayable.
		const compiler = createBriefCompiler()
		const briefing = compiler.compile(buildReadyInput())
		expect(briefing.verdict).toBeDefined()
		expect(Object.isFrozen(briefing.verdict)).toBe(true)
		expect(Object.isFrozen(briefing.verdict?.rules)).toBe(true)
		expect(Object.isFrozen(briefing.verdict?.rules[0])).toBe(true)
		const recorded = briefing.stages.find((entry) => entry.stage === 'gate')
		expect(Object.isFrozen(recorded?.stage === 'gate' ? recorded.output : undefined)).toBe(true)
		compiler.destroy()
	})

	it('translates a borrowed reasoner throwing into a BriefError', () => {
		// Guide clause 7: every throw out of this module is a `BriefError` an `isBriefError`
		// catch narrows. A borrowed engine the caller already destroyed throws its OWN error,
		// which leaked straight through `gate`.
		const borrowed = createReason({ reasoners: [createLogicalReasoner()] })
		const compiler = createBriefCompiler({ reason: borrowed })
		borrowed.destroy()
		const failure = captureError(() => compiler.gate(buildBrief()))
		expect(isBriefError(failure)).toBe(true)
		expect(readErrorCode(failure)).toBe('GATE_FAILED')
		// And `compile` still contains it rather than throwing.
		const briefing = compiler.compile(buildReadyInput())
		expect(briefing.brief).toBeUndefined()
		expect(briefing.failures[0]?.code).toBe('GATE_FAILED')
		compiler.destroy()
	})

	it('reads a borrowed verdict exactly once, whatever the engine answers on a second read', () => {
		// The property, not the symptom. A foreign object's read COUNT is this package's
		// decision, so a briefing must not depend on it: `gate` owns the verdict at arrival and
		// validates the owned copy, so every later read is of this compiler's own frozen value.
		//
		// Driven with an engine whose every verdict member is a counting getter, and compared
		// against a static engine returning each member's FIRST answer. Equal briefings mean one
		// reading — and it covers every member at once, including ones added later.
		const counted = createBriefCompiler({ reason: buildCountingReason() })
		const first = counted.compile(buildReadyInput())
		counted.destroy()

		const stable = createBriefCompiler({ reason: buildStableReason() })
		const second = stable.compile(buildReadyInput())
		stable.destroy()

		expect(first.verdict).toStrictEqual(second.verdict)
		expect(first.brief !== undefined).toBe(second.brief !== undefined)
		expect(first.failures).toStrictEqual(second.failures)
	})

	it('uses one captured conclusion and rule set from an uncloneable shifting verdict', () => {
		const compiler = createBriefCompiler({ reason: buildShiftingReason() })
		const briefing = compiler.compile(buildReadyInput())
		expect(briefing.brief).toBeUndefined()
		expect(briefing.verdict?.conclusion).toBe(false)
		expect(briefing.verdict?.rules.map((entry) => entry.id)).toStrictEqual(['captured'])
		expect(briefing.failures[0]?.message).toBe('Gate refused: captured')
		compiler.destroy()
	})

	it('names the cause when a borrowed reasoner refuses without naming a rule', () => {
		// The one case where the supplied engine is the sole decider rendered as
		// `Gate refused: ` — a refusal with its cause cut off.
		const compiler = createBriefCompiler({ reason: buildSilentReason() })
		const briefing = compiler.compile(buildReadyInput())
		expect(briefing.brief).toBeUndefined()
		expect(briefing.failures[0]?.message).toBe(
			'Gate refused: the supplied reasoner named no failing rule',
		)
		compiler.destroy()
	})

	it('digests a refused outcome by its draft, so two different refusals differ', () => {
		// `digest` is documented as identifying the outcome and offered as a cache key. Digesting
		// only questions and failures gave EVERY ordinary refusal one value — two entirely
		// different requests refused for "no proofs" were indistinguishable.
		const compiler = createBriefCompiler()
		const shared = { outcomes: [outcome(1, 'x')] }
		const one = compiler.compile({ ...shared, task: buildTask() })
		const two = compiler.compile({
			...shared,
			task: task('plan', 'ops', 'Plan the release.'),
		})
		expect(one.brief).toBeUndefined()
		expect(two.brief).toBeUndefined()
		expect(one.failures).toStrictEqual(two.failures)
		expect(one.digest).not.toBe(two.digest)
		// The control: the same request refused twice keeps one digest.
		expect(compiler.compile({ ...shared, task: buildTask() }).digest).toBe(one.digest)
		compiler.destroy()
	})

	it('owns a foreign value without narrowing it, so a non-JSON entity cannot slip the gate', () => {
		// The fail-open this boundary exists to prevent. `Entity.value` is declared `unknown`, so
		// a function is a CONFORMING value — but the ownership boundary cloned unconditionally,
		// the clone threw, the interpret stage was contained as failed, and with the
		// interpretation went the ambiguities it had derived. `findBlockingGaps` was empty, the
		// gate passed, and a brief was emitted for a request the same code refused a moment
		// earlier with a JSON-expressible value in the same field.
		//
		// The two runs below must be INDISTINGUISHABLE. That is the property; the refusal is
		// only how it shows.
		const readings = [' a string ', () => 'anything'].map((value) => {
			const compiler = createBriefCompiler({
				interpret: buildForeignInterpret(value),
				actions: { migrate: 'migrate' },
				domains: { code: 'code' },
			})
			const briefing = compiler.compile({
				text: 'migrate the stores',
				task: buildTask(),
				outcomes: [outcome(1, 'x')],
				proofs: [proof('x', 'npm test')],
			})
			compiler.destroy()
			return {
				emitted: briefing.brief !== undefined,
				questions: briefing.questions.length,
				read: briefing.interpretation !== undefined,
				codes: briefing.failures.map((entry) => entry.code),
			}
		})
		expect(readings[0]).toStrictEqual({
			emitted: false,
			questions: 1,
			read: true,
			codes: ['BLOCKED'],
		})
		expect(readings[1]).toStrictEqual(readings[0])
	})

	it('refuses a conforming engine result the ownership clone cannot carry, with a coded failure', () => {
		// A class instance satisfies `Interpretation` through prototype getters, and
		// `structuredClone` keeps own members only, so the owned copy arrives with every member
		// missing. Before the stage guarded with interprets' published `isInterpretation`, the
		// draft dereferenced `intent` off that empty copy and threw a raw TypeError out of
		// `compile`; now the stage records INTERPRET_FAILED and the refusal names the unread
		// request.
		const compiler = createBriefCompiler({
			interpret: buildAccessorInterpret(),
			actions: { migrate: 'migrate' },
			domains: { code: 'code' },
		})
		const briefing = compiler.compile({
			text: 'migrate the stores',
			task: buildTask(),
			outcomes: [outcome(1, 'x')],
			proofs: [proof('x', 'npm test')],
		})
		compiler.destroy()
		expect(briefing.failures[0]?.stage).toBe('interpret')
		expect(briefing.failures[0]?.code).toBe('INTERPRET_FAILED')
		const record = briefing.stages.find((entry) => entry.stage === 'interpret')
		expect(record?.stage === 'interpret' ? record.error : undefined).toBe(
			'The interpret engine returned a non-interpretation result',
		)
		expect(briefing.brief).toBeUndefined()
		expect(briefing.questions[0]?.blocking).toBe(true)
	})

	it('captures a supplied prototype-accessor interpretation instead of refusing it', () => {
		// The whole-input snapshot clone-drops prototype members before the supplied-door
		// guard runs, so a CONFORMING class-instance interpretation arrived empty and was
		// refused — a wrong refusal against a valid caller. The capture fallback materializes
		// the published members into a frozen view: the published contract is wider than the
		// whole-input copy mechanism.
		const compiler = createBriefCompiler()
		const briefing = compiler.compile({
			interpretation: new AccessorInterpretation(),
			task: buildTask(),
			outcomes: [outcome(1, 'x')],
			proofs: [proof('x', 'npm test')],
		})
		compiler.destroy()
		expect(briefing.interpretation?.digest).toBe('accessor')
		expect(briefing.failures.map((entry) => entry.code)).not.toContain('INTERPRET_FAILED')
	})

	it('materializes every published member of a captured interpretation', () => {
		// The capture list decides what survives a prototype-accessor value, so a member missing
		// from it is a member the captured view drops — silently, and past the guard that would
		// have caught an empty copy. The equality assertion compares the list against interprets
		// own declaration, so a member added upstream fails the typecheck rather than the guard.
		// The engine reading is the second mechanism: a real interpretation must carry no member
		// the list does not name.
		const engine = createInterpret()
		const live = engine.interpret('migrate the stores')
		engine.destroy()
		const compiler = createBriefCompiler()
		const briefing = compiler.compile({
			interpretation: new AccessorInterpretation(),
			task: buildTask(),
			outcomes: [outcome(1, 'x')],
			proofs: [proof('x', 'npm test')],
		})
		compiler.destroy()
		expectTypeOf<(typeof INTERPRETATION_MEMBERS)[number]>().toEqualTypeOf<keyof Interpretation>()
		expect(
			Object.keys(live).filter((key) => !INTERPRETATION_MEMBERS.some((member) => member === key)),
		).toStrictEqual([])
		const captured: object = briefing.interpretation ?? {}
		expect(
			INTERPRETATION_MEMBERS.filter((member) => !Object.hasOwn(captured, member)),
		).toStrictEqual([])
	})

	it('drafts from the captured answers of a supplied prototype-accessor interpretation', () => {
		const compiler = createBriefCompiler({
			actions: { migrate: 'migrate', audit: 'audit' },
			domains: { code: 'code', ops: 'ops' },
		})
		const briefing = compiler.compile({
			interpretation: new ShiftingAccessorInterpretation(),
			outcomes: [outcome(1, 'x')],
			proofs: [proof('x', 'npm test')],
		})
		expect(briefing.interpretation?.digest).toBe('captured')
		expect(briefing.brief?.task).toEqual({
			operation: 'migrate',
			domain: 'code',
			statement: 'Migrate the captured stores.',
		})
		expect(briefing.brief?.givens).toEqual([
			{ category: 'extracted', name: 'reading', value: 'captured' },
		])
		compiler.destroy()
	})

	it('captures shifting engine getters while carrying a function-valued entity by reference', () => {
		const compiler = createBriefCompiler({
			interpret: buildShiftingInterpret(),
			actions: { migrate: 'migrate', audit: 'audit' },
			domains: { code: 'code', ops: 'ops' },
		})
		const briefing = compiler.compile({
			text: 'migrate the captured stores',
			outcomes: [outcome(1, 'x')],
			proofs: [proof('x', 'npm test')],
		})
		expect(briefing.interpretation?.digest).toBe('captured')
		expect(briefing.interpretation?.entities[0]?.value).toBe(Math.max)
		expect(briefing.failures).toStrictEqual([])
		expect(briefing.brief?.task).toEqual({
			operation: 'migrate',
			domain: 'code',
			statement: 'Migrate the captured stores.',
		})
		compiler.destroy()
	})

	it('refuses a supplied interpretation that is malformed live, with a coded failure', () => {
		// `structuredClone(new AccessorInterpretation())` is still typed `Interpretation` and
		// is empty at runtime — a type-admitted malformed supplied vector. The capture fallback
		// must not rescue it: the live value fails the same guard the snapshot copy failed.
		const compiler = createBriefCompiler()
		const briefing = compiler.compile({
			interpretation: structuredClone(new AccessorInterpretation()),
			task: buildTask(),
			outcomes: [outcome(1, 'x')],
			proofs: [proof('x', 'npm test')],
		})
		compiler.destroy()
		expect(briefing.interpretation).toBeUndefined()
		expect(briefing.failures[0]?.code).toBe('INTERPRET_FAILED')
		expect(briefing.brief).toBeUndefined()
	})

	it('contains an interpret failure and REFUSES, because the request went unread', () => {
		// `@orkestrel/interpret` contains its own stage failures, so this needs a foreign engine —
		// which `BriefCompilerOptions.interpret` publishes as a seam.
		//
		// Containing the failure is right; letting it through the gate is not. The stage would
		// have produced the request's ambiguities, so a failure DELETES evidence — and a failure
		// that removes evidence must never read as evidence of readiness.
		const compiler = createBriefCompiler({
			interpret: buildFailingInterpret(),
			actions: { migrate: 'migrate' },
			domains: { code: 'code' },
		})
		const briefing = compiler.compile({
			text: 'migrate the stores',
			task: buildTask(),
			outcomes: [outcome(1, 'x')],
			proofs: [proof('x', 'npm test')],
		})
		expect(briefing.failures[0]?.stage).toBe('interpret')
		expect(briefing.failures[0]?.code).toBe('INTERPRET_FAILED')
		const record = briefing.stages.find((entry) => entry.stage === 'interpret')
		expect(record?.stage === 'interpret' ? record.error : undefined).toBe(
			'the interpret engine failed',
		)
		// Contained, not thrown — and refused, with the unknown visible as a question the caller
		// can answer rather than as silence.
		expect(briefing.brief).toBeUndefined()
		expect(briefing.questions.map((entry) => entry.field)).toStrictEqual(['gaps'])
		expect(briefing.questions[0]?.blocking).toBe(true)

		// The control: the SAME failing engine with the caller supplying their own
		// interpretation. Nothing was lost, so nothing is added, and the compile completes.
		const carried = compiler.compile({
			text: 'migrate the stores',
			interpretation: buildInterpret('migrate', 'code', true).interpret('migrate the stores'),
			task: buildTask(),
			outcomes: [outcome(1, 'x')],
			proofs: [proof('x', 'npm test')],
		})
		expect(carried.brief).toBeDefined()
		expect(carried.brief?.task).toEqual(buildTask())
		compiler.destroy()
	})

	it('contains a draft failure rather than throwing when no task can be derived', () => {
		const compiler = createBriefCompiler()
		const briefing = compiler.compile({ proofs: [proof('x', 'y')] })
		expect(briefing.brief).toBeUndefined()
		expect(briefing.brief).toBeUndefined()
		expect(briefing.verdict).toBeUndefined()
		expect(briefing.failures).toStrictEqual([
			{
				stage: 'draft',
				code: 'DRAFT_FAILED',
				message:
					'No task: supply BriefInput.task, or map the intent through the actions and domains vocabularies',
			},
		])
		expect(briefing.stages).toStrictEqual([
			{
				stage: 'draft',
				input: { proofs: [{ text: 'x', command: 'y' }] },
				error: briefing.failures[0]?.message,
			},
		])
		// A failed phase carries `error` and no `output`; there is no second stored flag to
		// drift away from it.
		expect(
			briefing.stages.every((record) => record.error === undefined || !('output' in record)),
		).toBe(true)
		compiler.destroy()
	})

	it('blocks on the language pipeline own required ambiguity when no template matches', () => {
		const compiler = createBriefCompiler({
			interpret: buildInterpret('migrate', 'code', false),
			actions: { migrate: 'migrate' },
			domains: { code: 'code' },
		})
		const briefing = compiler.compile({
			text: 'migrate the 3 legacy stores',
			outcomes: [outcome(1, 'x')],
			proofs: [proof('x', 'y')],
		})
		expect(briefing.brief).toBeUndefined()
		expect(briefing.questions).toHaveLength(1)
		expect(briefing.questions[0]?.blocking).toBe(true)
		compiler.destroy()
	})

	it('reports GATE_FAILED when the reason engine has no logical reasoner', () => {
		const compiler = createBriefCompiler({ reason: createReason() })
		const briefing = compiler.compile(buildReadyInput())
		expect(briefing.brief).toBeUndefined()
		expect(briefing.verdict).toBeUndefined()
		expect(briefing.failures.map((entry) => entry.code)).toStrictEqual(['GATE_FAILED'])
		compiler.destroy()
	})
})

describe('BriefCompiler gate', () => {
	it('returns the traceable logical verdict for one brief', () => {
		const compiler = createBriefCompiler()
		const verdict = compiler.gate(buildBrief())
		expect(verdict.reasoning).toBe('logical')
		expect(verdict.conclusion).toBe(true)
		expect(verdict.rules.map((entry) => entry.id)).toStrictEqual(
			gateDefinition().rules.map((entry) => entry.id),
		)
		expect(verdict.trace.length).toBeGreaterThan(0)
		compiler.destroy()
	})

	it('refuses a brief that misses one readiness rule', () => {
		const compiler = createBriefCompiler()
		expect(compiler.gate(buildBrief({ proofs: [] })).conclusion).toBe(false)
		compiler.destroy()
	})
})

describe('BriefCompiler observation', () => {
	it('emits compile for a complete briefing and block for an incomplete one, never both', () => {
		const compiled = createRecorder<readonly [Briefing]>()
		const blocked = createRecorder<readonly [readonly Gap[]]>()
		const compiler = createBriefCompiler({
			on: { compile: compiled.handler, block: blocked.handler },
		})

		compiler.compile(buildReadyInput())
		expect(compiled.count).toBe(1)
		expect(blocked.count).toBe(0)

		compiler.compile({ ...buildReadyInput(), gaps: [gap('output', 'q', { blocking: true })] })
		expect(compiled.count).toBe(1)
		expect(blocked.count).toBe(1)
		expect(blocked.calls[0]?.[0]).toHaveLength(1)
		compiler.destroy()
	})

	it('emits the compile event after the briefing it reports', () => {
		const compiled = createRecorder<readonly [Briefing]>()
		const compiler = createBriefCompiler({ on: { compile: compiled.handler } })
		const briefing = compiler.compile(buildReadyInput())
		expect(compiled.calls[0]?.[0]).toBe(briefing)
		compiler.destroy()
	})

	it('emits error when a stage throws', () => {
		const failures = createRecorder<readonly [unknown]>()
		const compiler = createBriefCompiler({ on: { error: failures.handler } })
		compiler.compile({ proofs: [proof('x', 'y')] })
		expect(failures.count).toBe(1)
		expect(isBriefError(failures.calls[0]?.[0])).toBe(true)
		compiler.destroy()
	})

	it('routes a throwing listener to the error handler and keeps its siblings running', () => {
		const handled = createRecorder<readonly [unknown, string]>()
		const survivor = createRecorder<readonly [Briefing]>()
		const compiler = new BriefCompiler({
			on: { compile: survivor.handler },
			error: handled.handler,
		})
		compiler.emitter.on('compile', () => {
			throw new Error('listener boom')
		})
		compiler.compile(buildReadyInput())
		expect(survivor.count).toBe(1)
		expect(handled.count).toBe(1)
		expect(handled.calls[0]?.[1]).toBe('compile')
		compiler.destroy()
	})

	it('emits destroy once and tears the emitter down last', () => {
		const stopped = createRecorder<readonly []>()
		const compiler = createBriefCompiler({ on: { destroy: stopped.handler } })
		compiler.destroy()
		compiler.destroy()
		expect(stopped.count).toBe(1)
		expect(compiler.emitter.destroyed).toBe(true)
	})
})

describe('BriefCompiler engine ownership', () => {
	it('destroys the engines it created', () => {
		const compiler = createBriefCompiler()
		const owned = compiler.interpret
		const reasoner = compiler.reason
		compiler.destroy()
		expect(owned.emitter.destroyed).toBe(true)
		expect(reasoner.emitter.destroyed).toBe(true)
	})

	it('leaves a borrowed engine alive', () => {
		const borrowed = createInterpret()
		const shared = createReason({ reasoners: [createLogicalReasoner()] })
		const compiler = createBriefCompiler({ interpret: borrowed, reason: shared })
		expect(compiler.interpret).toBe(borrowed)
		expect(compiler.reason).toBe(shared)
		compiler.destroy()
		expect(borrowed.emitter.destroyed).toBe(false)
		expect(shared.emitter.destroyed).toBe(false)
		borrowed.destroy()
		shared.destroy()
	})

	it('destroys only the engine it owns when one is borrowed', () => {
		const borrowed = createInterpret()
		const compiler = createBriefCompiler({ interpret: borrowed })
		const owned = compiler.reason
		compiler.destroy()
		expect(borrowed.emitter.destroyed).toBe(false)
		expect(owned.emitter.destroyed).toBe(true)
		borrowed.destroy()
	})
})

describe('BriefCompiler teardown', () => {
	it('refuses compile and gate after destroy', () => {
		const compiler = createBriefCompiler()
		compiler.destroy()
		expect(() => compiler.compile(buildReadyInput())).toThrow('BriefCompiler has been destroyed')
		expect(() => compiler.gate(buildBrief())).toThrow('BriefCompiler has been destroyed')
	})

	it('throws a narrowable DESTROYED error', () => {
		const compiler = createBriefCompiler()
		compiler.destroy()
		const error = captureError(() => compiler.gate(buildBrief()))
		expect(isBriefError(error)).toBe(true)
		expect(readErrorCode(error)).toBe('DESTROYED')
	})

	it('keeps the getters working after destroy', () => {
		const compiler = createBriefCompiler()
		compiler.destroy()
		expect(compiler.emitter.destroyed).toBe(true)
		expect(compiler.interpret).toBeDefined()
		expect(compiler.reason).toBeDefined()
	})
})
