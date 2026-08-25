import { BriefError, briefToSubject, gateDefinition } from '@src/core'
import type { ReasonResult } from '@orkestrel/reason'
import { describe, expect, it } from 'vitest'
import {
	AccessorInterpretation,
	CAPTURED_RULE,
	FIRST_RULE,
	ShiftingAccessorInterpretation,
	ShiftingForeignInterpretation,
	ShiftingLogicalResult,
	buildAccessorInterpret,
	buildAdversarialValues,
	buildBrief,
	buildCountingReason,
	buildFailingInterpret,
	buildForeignInterpret,
	buildInheritedActions,
	buildInterpret,
	buildManifest,
	buildPermissiveEvaluator,
	buildReadyInput,
	buildShiftingInterpret,
	buildShiftingReason,
	buildSilentReason,
	buildStableReason,
	buildTask,
	readConclusion,
	readErrorCode,
	readErrorContext,
} from './setup.js'

// `tests/setup.ts` is reusable test infrastructure: every case here proves a contract a
// consuming suite (tests/src/core/**, tests/policy.test.ts, tests/config.test.ts) relies on,
// never production behavior the fixtures merely pass through to a real engine.

describe('task and manifest fixtures', () => {
	it('buildTask returns the fixed refactor task the suites key their assertions on', () => {
		const task = buildTask()
		expect(task.operation).toBe('refactor')
		expect(task.domain).toBe('code')
		expect(task.statement).toBe('Refactor useForm to native browser form APIs.')
	})

	it('buildManifest returns four disjoint, populated partitions', () => {
		const manifest = buildManifest()
		const paths = [
			...manifest.read.map((entry) => entry.path),
			...manifest.edit.map((entry) => entry.path),
			...manifest.locked.map((entry) => entry.path),
			...manifest.forbidden.map((entry) => entry.path),
		]
		// Disjoint: no path repeats across partitions.
		expect(new Set(paths).size).toBe(paths.length)
		expect(manifest.read).toHaveLength(1)
		expect(manifest.edit).toHaveLength(1)
		expect(manifest.locked).toHaveLength(1)
		expect(manifest.forbidden).toHaveLength(1)
		expect(manifest.edit[0]?.path).toBe('src/browser/composables/useForm.ts')
	})
})

describe('buildBrief and buildReadyInput', () => {
	it('buildBrief composes a gate-passing brief from buildTask and buildManifest', () => {
		const built = buildBrief()
		expect(built.task).toEqual(buildTask())
		expect(built.manifest).toEqual(buildManifest())
		expect(built.outcomes).toHaveLength(1)
		expect(built.proofs).toHaveLength(1)
	})

	it('buildBrief overrides replace only the named section, keeping the rest at default', () => {
		const overriddenManifest = { ...buildManifest(), read: [] }
		const built = buildBrief({ manifest: overriddenManifest })
		expect(built.manifest.read).toEqual([])
		// Untouched sections still carry the default fixture's values.
		expect(built.outcomes).toEqual(buildBrief().outcomes)
		expect(built.proofs).toEqual(buildBrief().proofs)
	})

	it('buildReadyInput carries the same task, manifest, outcomes, and proofs as buildBrief', () => {
		const input = buildReadyInput()
		const built = buildBrief()
		expect(input.task).toEqual(built.task)
		expect(input.manifest).toEqual(built.manifest)
		expect(input.outcomes).toEqual(built.outcomes)
		expect(input.proofs).toEqual(built.proofs)
	})
})

describe('FIRST_RULE and CAPTURED_RULE', () => {
	it('FIRST_RULE is a frozen, conclusion-true rule result', () => {
		expect(Object.isFrozen(FIRST_RULE)).toBe(true)
		expect(FIRST_RULE.conclusion).toBe(true)
		expect(FIRST_RULE.applied).toBe(true)
	})

	it('CAPTURED_RULE is a frozen, conclusion-false rule result distinct from FIRST_RULE', () => {
		expect(Object.isFrozen(CAPTURED_RULE)).toBe(true)
		expect(CAPTURED_RULE.conclusion).toBe(false)
		expect(CAPTURED_RULE.id).not.toBe(FIRST_RULE.id)
	})
})

describe('interpret fixtures', () => {
	it('buildInterpret registers the matched template and completes the pipeline', () => {
		const interpret = buildInterpret('migrate', 'code', true)
		const result = interpret.interpret('anything')
		expect(result.intent).toEqual({ action: 'migrate', domain: 'code', confidence: 1 })
		expect(result.complete).toBe(true)
		expect(result.ambiguities).toEqual([])
	})

	it('buildInterpret with matched=false registers no template and raises an ambiguity', () => {
		const interpret = buildInterpret('migrate', 'code', false)
		const result = interpret.interpret('anything')
		expect(result.ambiguities.length).toBeGreaterThan(0)
	})

	it('buildFailingInterpret throws only from interpret, and delegates every other member', () => {
		const interpret = buildFailingInterpret()
		expect(() => interpret.interpret('x')).toThrow('the interpret engine failed')
		// A real, unregistered template is rejected identically to how the real engine rejects it,
		// proving `register`/`unregister`/`template` truly delegate rather than stub a fixed reply.
		expect(interpret.template('missing')).toBeUndefined()
	})

	it('buildForeignInterpret carries the given value on a computed entity and forces a required ambiguity', () => {
		const marker = () => 'marker'
		const interpret = buildForeignInterpret(marker)
		const result = interpret.interpret('migrate the stores')
		expect(result.entities).toEqual([
			{ name: 'callback', value: marker, provenance: { category: 'computed' }, confidence: 1 },
		])
		expect(result.ambiguities).toEqual([
			{ field: 'output', question: 'Diff or files?', candidates: [], required: true },
		])
	})
})

describe('AccessorInterpretation and its engines', () => {
	it('AccessorInterpretation reports every member through a prototype getter', () => {
		const interpretation = new AccessorInterpretation()
		expect(interpretation.digest).toBe('accessor')
		expect(interpretation.complete).toBe(false)
		expect(interpretation.entities).toEqual([])
		// Own-enumerable-key count is the exact defect the fixture exists to prove: every member
		// is a getter, so `Object.keys` — which lists only own enumerable keys — sees none of them.
		expect(Object.keys(interpretation)).toEqual([])
	})

	it('buildAccessorInterpret returns the accessor-only interpretation from a real engine', () => {
		const interpret = buildAccessorInterpret()
		const result = interpret.interpret('migrate the stores')
		expect(result).toBeInstanceOf(AccessorInterpretation)
		expect(result.digest).toBe('accessor')
	})
})

describe('ShiftingAccessorInterpretation and ShiftingForeignInterpretation', () => {
	it('ShiftingAccessorInterpretation returns a different reading on the second access of each shifting member', () => {
		const interpretation = new ShiftingAccessorInterpretation()
		expect(interpretation.text).toBe('migrate the captured stores')
		expect(interpretation.text).toBe('audit the forged stores')
		expect(interpretation.digest).toBe('captured')
		expect(interpretation.digest).toBe('forged')
	})

	it('ShiftingForeignInterpretation carries a fixed function-valued entity across shifting reads', () => {
		const interpretation = new ShiftingForeignInterpretation()
		expect(interpretation.entities).toHaveLength(1)
		expect(interpretation.entities[0]?.value).toBe(Math.max)
		expect(interpretation.intent.action).toBe('migrate')
		expect(interpretation.intent.action).toBe('audit')
	})

	it('buildShiftingInterpret returns a fresh ShiftingForeignInterpretation on every call', () => {
		const interpret = buildShiftingInterpret()
		const first = interpret.interpret('x')
		const second = interpret.interpret('x')
		expect(first).toBeInstanceOf(ShiftingForeignInterpretation)
		expect(first).not.toBe(second)
		// A fresh instance resets the internal counters, so the first read of the new instance
		// returns the captured reading again rather than continuing the prior instance's sequence.
		expect(first.text).toBe('migrate the captured stores')
		expect(second.text).toBe('migrate the captured stores')
	})
})

describe('buildAdversarialValues', () => {
	it('includes a self-referential object and a null-prototype hostile record', () => {
		const values = buildAdversarialValues()
		const cyclic = values.find(
			(value): value is Record<string, unknown> =>
				typeof value === 'object' && value !== null && !Array.isArray(value) && 'self' in value,
		)
		expect(cyclic).toBeDefined()
		expect(cyclic?.['self']).toBe(cyclic)

		const hostile = values.find(
			(value): value is Record<string, unknown> =>
				typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === null,
		)
		expect(hostile).toBeDefined()
		expect(hostile?.['__proto__']).toEqual({ polluted: true })
	})

	it('spans the primitive vocabulary a total guard must refuse: nullish, numeric edges, and collections', () => {
		const values = buildAdversarialValues()
		expect(values).toContain(undefined)
		expect(values).toContain(null)
		expect(values.some((value) => Number.isNaN(value))).toBe(true)
		expect(values.some((value) => Object.is(value, -0))).toBe(true)
		expect(values.some((value) => value instanceof Map)).toBe(true)
		expect(values.some((value) => value instanceof Set)).toBe(true)
		expect(values.some((value) => typeof value === 'symbol')).toBe(true)
	})
})

describe('readErrorCode and readErrorContext', () => {
	it('reads the code and context from a real BriefError', () => {
		const error = new BriefError('INVALID', 'broke the contract', { field: 'task' })
		expect(readErrorCode(error)).toBe('INVALID')
		expect(readErrorContext(error)).toEqual({ field: 'task' })
	})

	it('returns undefined for a value that is not a BriefError', () => {
		expect(readErrorCode(new Error('plain'))).toBeUndefined()
		expect(readErrorCode('not an error')).toBeUndefined()
		expect(readErrorContext(new Error('plain'))).toBeUndefined()
	})
})

describe('reason fixtures', () => {
	it('buildPermissiveEvaluator reports every check met, singly and batched', () => {
		const evaluator = buildPermissiveEvaluator()
		const subject = briefToSubject(buildBrief())
		expect(evaluator.evaluate({ field: 'x', operator: 'any', value: undefined }, subject)).toEqual({
			field: 'x',
			met: true,
			actual: true,
		})
		expect(
			evaluator.batch(
				[
					{ field: 'a', operator: 'any', value: undefined },
					{ field: 'b', operator: 'any', value: undefined },
				],
				subject,
			),
		).toEqual([
			{ field: 'a', met: true, actual: true },
			{ field: 'b', met: true, actual: true },
		])
	})

	it('buildCountingReason answers each member differently after its first read; buildStableReason freezes the first answer', () => {
		const subject = briefToSubject(buildBrief())
		const definition = gateDefinition()
		const counting = buildCountingReason()
		const first = counting.reason(subject, definition)
		const second = counting.reason(subject, definition)
		expect(readConclusion(first)).toBe(true)
		expect(readConclusion(second)).toBe(false)

		const stable = buildStableReason()
		const stableFirst = stable.reason(subject, definition)
		const stableSecond = stable.reason(subject, definition)
		expect(readConclusion(stableFirst)).toBe(true)
		expect(readConclusion(stableSecond)).toBe(true)
		expect(stableFirst).toEqual(stableSecond)
	})

	it('buildShiftingReason yields a ShiftingLogicalResult whose conclusion only turns true on the third read', () => {
		const reason = buildShiftingReason()
		const result = reason.reason(briefToSubject(buildBrief()), gateDefinition())
		expect(result).toBeInstanceOf(ShiftingLogicalResult)
		if (result.reasoning !== 'logical') throw new Error('expected a logical result')
		expect(result.conclusion).toBe(false)
		expect(result.conclusion).toBe(false)
		expect(result.conclusion).toBe(true)
	})

	it('ShiftingLogicalResult carries a fixed function-valued leaf and CAPTURED_RULE on the first rules read only', () => {
		const result = new ShiftingLogicalResult()
		expect(result.leaf).toBe(Math.max)
		expect(result.rules).toEqual([CAPTURED_RULE])
		expect(result.rules).toEqual([])
	})

	it('buildSilentReason refuses through conclusion alone, naming no failing rule', () => {
		const reason = buildSilentReason()
		const result = reason.reason(briefToSubject(buildBrief()), gateDefinition())
		expect(readConclusion(result)).toBe(false)
		if (result.reasoning !== 'logical') throw new Error('expected a logical result')
		expect(result.rules).toEqual([])
	})

	it('readConclusion returns undefined for a non-logical reasoning result', () => {
		const quantitative: ReasonResult = {
			reasoning: 'quantitative',
			value: 0,
			groups: [],
			count: 0,
			success: true,
			trace: [],
			errors: [],
		}
		expect(readConclusion(quantitative)).toBeUndefined()
	})
})

describe('buildInheritedActions', () => {
	it('resolves an inherited key through the prototype while owning no key itself', () => {
		const actions = buildInheritedActions()
		expect(actions['migrate']).toBe('migrate')
		expect(Object.keys(actions)).toEqual([])
		expect(Object.prototype.hasOwnProperty.call(actions, 'migrate')).toBe(false)
	})
})
