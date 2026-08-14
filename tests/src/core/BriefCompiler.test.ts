import type { BriefInput, Briefing, Gap, Outcome } from '@src/core'
import {
	BriefCompiler,
	briefToSubject,
	createBriefCompiler,
	gap,
	gateDefinition,
	isBriefError,
	outcome,
	proof,
	task,
} from '@src/core'
import { createInterpret } from '@orkestrel/interpret'
import { createLogicalReasoner, createReason } from '@orkestrel/reason'
import { captureError, createRecorder } from '@orkestrel/test'
import { describe, expect, it } from 'vitest'
import {
	buildBrief,
	buildInterpret,
	buildPermissiveEvaluator,
	buildReadyInput,
	buildTask,
	readErrorCode,
} from '../../setup.js'

describe('BriefCompiler pipeline', () => {
	it('skips the interpret stage when the input carries no text', () => {
		const compiler = createBriefCompiler()
		const briefing = compiler.compile(buildReadyInput())
		expect(briefing.stages.map((record) => record.stage)).toStrictEqual(['draft', 'gate', 'pin'])
		expect(briefing.interpretation).toBeUndefined()
		expect(briefing.complete).toBe(true)
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
		expect(briefing.text).toBe('migrate the 3 legacy stores to the new driver seam')
		expect(briefing.interpretation?.intent.action).toBe('migrate')
		expect(briefing.brief?.task).toEqual({
			operation: 'migrate',
			domain: 'code',
			statement: 'Migrate the 3 legacy stores to the new driver seam.',
		})
		expect(briefing.brief?.givens).toEqual([{ category: 'extracted', name: 'count', value: '3' }])
		expect(briefing.complete).toBe(true)
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
		expect(briefing.complete).toBe(false)
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
			expect(briefing.complete).toBe(false)
			expect(briefing.brief).toBeUndefined()
			expect(briefing.failures.map((entry) => entry.code)).toStrictEqual(['BLOCKED'])
		}

		// The control: the same permissive engine still emits a genuinely ready brief.
		expect(compiler.compile(buildReadyInput()).complete).toBe(true)
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
		expect(briefing.complete).toBe(false)
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
		expect(briefing.complete).toBe(true)
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
		expect(briefing.complete).toBe(false)
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
		expect(briefing.complete).toBe(false)
		expect(briefing.questions).toEqual([])
		// The MEASURED refusal, named from findUnmetRules — the rules that actually decided, without
		// the derived conjunction they roll up into.
		expect(briefing.failures[0]?.message).toBe('Gate refused: proven')
		compiler.destroy()
	})

	it('contains a draft failure rather than throwing when no task can be derived', () => {
		const compiler = createBriefCompiler()
		const briefing = compiler.compile({ proofs: [proof('x', 'y')] })
		expect(briefing.complete).toBe(false)
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
		expect(briefing.complete).toBe(false)
		expect(briefing.questions).toHaveLength(1)
		expect(briefing.questions[0]?.blocking).toBe(true)
		compiler.destroy()
	})

	it('reports GATE_FAILED when the reason engine has no logical reasoner', () => {
		const compiler = createBriefCompiler({ reason: createReason() })
		const briefing = compiler.compile(buildReadyInput())
		expect(briefing.complete).toBe(false)
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
