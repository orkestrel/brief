import {
	isBrief,
	isCitation,
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
