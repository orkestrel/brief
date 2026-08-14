import {
	isBrief,
	isCitation,
	isLogicalVerdict,
	isRuleVerdict,
	isExample,
	isGap,
	isGiven,
	isManifest,
	isOutcome,
	isOutput,
	isOutputFormat,
	isProof,
	isReference,
	isRisk,
	isRiskSeverity,
	isTask,
	isTaskDomain,
	isTaskOperation,
} from '@src/core'
import { describe, expect, it } from 'vitest'
import { buildAdversarialValues, buildBrief } from '../../setup.js'

const VOCABULARY_GUARDS = [
	{ name: 'isTaskOperation', guard: isTaskOperation, valid: 'refactor', invalid: 'improve' },
	{ name: 'isTaskDomain', guard: isTaskDomain, valid: 'code', invalid: 'frontend' },
	{ name: 'isOutputFormat', guard: isOutputFormat, valid: 'diff', invalid: 'patch' },
	{ name: 'isRiskSeverity', guard: isRiskSeverity, valid: 'high', invalid: 'critical' },
]

const RECORD_GUARDS = [
	{
		name: 'isTask',
		guard: isTask,
		valid: { operation: 'refactor', domain: 'code', statement: 'Refactor useForm.' },
		offContract: { operation: 'improve', domain: 'code', statement: 'Refactor useForm.' },
	},
	{
		name: 'isReference',
		guard: isReference,
		valid: { path: 'src/core/types.ts', note: 'the published contract' },
		offContract: { path: 'src/core/types.ts' },
	},
	{
		name: 'isManifest',
		guard: isManifest,
		valid: { read: [], edit: [], locked: [], forbidden: [] },
		offContract: { read: [], edit: [], locked: [] },
	},
	{
		name: 'isOutcome',
		guard: isOutcome,
		valid: { rank: 1, text: 'the tests pass', required: true },
		offContract: { rank: 0, text: 'the tests pass', required: true },
	},
	{
		name: 'isGiven',
		guard: isGiven,
		valid: { category: 'convention', name: 'indentation', value: 'tabs' },
		offContract: { category: '', name: 'indentation', value: 'tabs' },
	},
	{
		name: 'isExample',
		guard: isExample,
		valid: { input: '<input required>', output: 'el.validity' },
		offContract: { input: '', output: 'el.validity' },
	},
	{
		name: 'isCitation',
		guard: isCitation,
		valid: { name: 'MDN', url: 'https://developer.mozilla.org/', note: 'native validity' },
		offContract: { name: 'MDN', url: 'https://developer.mozilla.org/' },
	},
	{
		name: 'isGap',
		guard: isGap,
		valid: { field: 'output', question: 'Diff or files?', blocking: true },
		offContract: { field: 'output', question: 'Diff or files?', blocking: 'yes' },
	},
	{
		name: 'isRisk',
		guard: isRisk,
		valid: { severity: 'medium', text: 'subtle drift', mitigation: 'assert in tests' },
		offContract: { severity: 'critical', text: 'subtle drift', mitigation: 'assert in tests' },
	},
	{
		name: 'isOutput',
		guard: isOutput,
		valid: { format: 'diff' },
		offContract: { format: 'patch' },
	},
	{
		name: 'isProof',
		guard: isProof,
		valid: { text: 'tests pass', command: 'npm test' },
		offContract: { text: 'tests pass', command: '' },
	},
]

const OPTIONAL_MEMBERS = [
	{
		name: 'isExample',
		guard: isExample,
		key: 'note',
		valid: { input: '<input required>', output: 'el.validity' },
	},
	{
		name: 'isGap',
		guard: isGap,
		key: 'candidates',
		valid: { field: 'output', question: 'Diff or files?', blocking: true },
	},
	{ name: 'isOutput', guard: isOutput, key: 'sections', valid: { format: 'diff' } },
	{ name: 'isOutput', guard: isOutput, key: 'include', valid: { format: 'diff' } },
	{ name: 'isOutput', guard: isOutput, key: 'exclude', valid: { format: 'diff' } },
	{ name: 'isBrief', guard: isBrief, key: 'trace', valid: buildBrief() },
	{ name: 'isBrief', guard: isBrief, key: 'hash', valid: buildBrief() },
]

describe('vocabulary guards', () => {
	it('covers every closed vocabulary', () => {
		expect(VOCABULARY_GUARDS.map((entry) => entry.name)).toStrictEqual([
			'isTaskOperation',
			'isTaskDomain',
			'isOutputFormat',
			'isRiskSeverity',
		])
	})

	for (const entry of VOCABULARY_GUARDS) {
		it(`${entry.name} accepts an on-vocabulary literal and refuses everything else`, () => {
			expect(entry.guard(entry.valid)).toBe(true)
			expect(entry.guard(entry.invalid)).toBe(false)
			for (const value of buildAdversarialValues()) expect(entry.guard(value)).toBe(false)
		})
	}
})

describe('record guards', () => {
	it('covers every documented record type', () => {
		expect(RECORD_GUARDS.map((entry) => entry.name)).toStrictEqual([
			'isTask',
			'isReference',
			'isManifest',
			'isOutcome',
			'isGiven',
			'isExample',
			'isCitation',
			'isGap',
			'isRisk',
			'isOutput',
			'isProof',
		])
	})

	for (const entry of RECORD_GUARDS) {
		it(`${entry.name} accepts a well-formed record`, () => {
			expect(entry.guard(entry.valid)).toBe(true)
		})

		it(`${entry.name} refuses an off-contract record`, () => {
			expect(entry.guard(entry.offContract)).toBe(false)
		})

		it(`${entry.name} is exact — an extra key fails`, () => {
			expect(entry.guard({ ...entry.valid, surplus: 1 })).toBe(false)
		})

		it(`${entry.name} never throws on adversarial input`, () => {
			for (const value of buildAdversarialValues()) expect(entry.guard(value)).toBe(false)
		})
	}
})

describe('optional record members', () => {
	it('covers every guard carrying an optional key', () => {
		expect(OPTIONAL_MEMBERS.map((entry) => `${entry.name}.${entry.key}`)).toStrictEqual([
			'isExample.note',
			'isGap.candidates',
			'isOutput.sections',
			'isOutput.include',
			'isOutput.exclude',
			'isBrief.trace',
			'isBrief.hash',
		])
	})

	for (const entry of OPTIONAL_MEMBERS) {
		it(`${entry.name} accepts an absent ${entry.key} and refuses a present-but-undefined one`, () => {
			expect(Object.hasOwn(entry.valid, entry.key)).toBe(false)
			expect(entry.guard(entry.valid)).toBe(true)
			expect(entry.guard({ ...entry.valid, [entry.key]: undefined })).toBe(false)
		})
	}
})

describe('isLogicalVerdict', () => {
	const sound = {
		reasoning: 'logical',
		conclusion: true,
		rules: [{ id: 'proven', applied: true, premises: [true], conclusion: true }],
		count: 1,
		success: true,
		trace: ['proven'],
		errors: [],
	}

	it('accepts a whole logical result and refuses every partial one', () => {
		// The gate's reasoner is BORROWED, so its return is foreign data whatever the interface
		// says. `BriefCompiler` dereferences `reasoning`, `conclusion`, and `rules`; checking
		// one field let `undefined` throw a raw TypeError where the contract promises
		// GATE_FAILED, and a result claiming `reasoning: 'logical'` with no `rules` crash later.
		expect(isLogicalVerdict(sound)).toBe(true)
		expect(isLogicalVerdict(undefined)).toBe(false)
		expect(isLogicalVerdict(null)).toBe(false)
		expect(isLogicalVerdict({ reasoning: 'logical' })).toBe(false)
		expect(isLogicalVerdict({ ...sound, rules: undefined })).toBe(false)
		expect(isLogicalVerdict({ ...sound, reasoning: 'quantitative' })).toBe(false)
		// Narrowing to `LogicalResult` while ignoring four of its members would be unsound, so
		// every published member is checked — not only the three read today.
		expect(isLogicalVerdict({ ...sound, trace: undefined })).toBe(false)
		expect(isLogicalVerdict({ ...sound, rules: [{ id: 'x' }] })).toBe(false)
	})

	it('accepts a richer result, because the foreign interface permits one', () => {
		// An EXACT guard over a foreign interface refuses what that interface allows. A
		// conforming reasoner returning extra members is still returning a `LogicalResult`, and
		// refusing it failed the gate closed on a valid engine — a wrong refusal in place of a
		// loud crash, which is worse. Exactness belongs on records this package owns.
		expect(isLogicalVerdict({ ...sound, elapsed: 12 })).toBe(true)
		expect(isRuleVerdict({ ...sound.rules[0], weight: 0.5 })).toBe(true)
		// `count` follows the published type, which is `number` — not `integer`.
		expect(isLogicalVerdict({ ...sound, count: 1.5 })).toBe(true)
		// The control: an extra member does not excuse a missing or wrong one.
		expect(isLogicalVerdict({ ...sound, elapsed: 12, conclusion: 'yes' })).toBe(false)
	})

	it('accepts a verdict carrying a prototype, because an interface admits one', () => {
		// `isRecord` admits only a PLAIN record, so it refused any object with its own prototype
		// — a class instance among them. `LogicalResult` is a TypeScript interface, and a class
		// instance satisfies an interface as readily as a literal does, so refusing one is the
		// same narrowing-past-a-foreign-contract mistake that failed the gate closed once
		// already.
		const carried: unknown = Object.assign(Object.create({ inherited: true }), sound)
		expect(isLogicalVerdict(carried)).toBe(true)
		// The control: the prototype does not excuse a member that is wrong.
		expect(
			isLogicalVerdict(Object.assign(Object.create({ inherited: true }), sound, { count: 'one' })),
		).toBe(false)
		// And an array is still refused — no interface this narrows is an array.
		expect(isLogicalVerdict(Object.assign([], sound))).toBe(false)
	})

	it('is total for adversarial input', () => {
		for (const value of buildAdversarialValues()) expect(isLogicalVerdict(value)).toBe(false)
		for (const value of buildAdversarialValues()) expect(isRuleVerdict(value)).toBe(false)
	})
})

describe('isBrief', () => {
	it('accepts the whole exact-record contract', () => {
		expect(isBrief(buildBrief())).toBe(true)
	})

	it('refuses a brief missing its sections', () => {
		expect(isBrief({ task: { operation: 'plan', domain: 'ops', statement: 'x.' } })).toBe(false)
	})

	it('refuses an extra top-level key', () => {
		expect(isBrief({ ...buildBrief(), surplus: 1 })).toBe(false)
	})

	it('refuses a brief whose nested section is off-contract', () => {
		expect(isBrief({ ...buildBrief(), outcomes: [{ rank: 1, text: 'x' }] })).toBe(false)
		expect(
			isBrief({ ...buildBrief(), gaps: [{ field: 'a', question: 'b', blocking: 'yes' }] }),
		).toBe(false)
	})

	it('accepts a pinned brief and refuses an empty trace', () => {
		expect(isBrief({ ...buildBrief(), trace: 't', hash: 'abcd1234' })).toBe(true)
		expect(isBrief({ ...buildBrief(), trace: '' })).toBe(false)
	})

	it('never throws on adversarial input', () => {
		for (const value of buildAdversarialValues()) expect(isBrief(value)).toBe(false)
	})
})
