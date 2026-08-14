import {
	briefShape,
	citationShape,
	createBriefContract,
	exampleShape,
	gapShape,
	givenShape,
	isBrief,
	isCitation,
	isExample,
	isGap,
	isGiven,
	isManifest,
	isOutcome,
	isOutput,
	isProof,
	isReference,
	isRisk,
	isTask,
	manifestShape,
	outcomeShape,
	outputShape,
	proofShape,
	referenceShape,
	riskShape,
	taskShape,
} from '@src/core'
import { createContract, seededRandom } from '@orkestrel/contract'
import { describe, expect, it } from 'vitest'
import { buildBrief } from '../../setup.js'

// Each row pairs the two independent mechanisms over one vocabulary — the hand-composed
// guard and the compiled shape — with values chosen so a divergence in either shows up.
const PAIRS = [
	{
		name: 'task',
		shape: taskShape,
		guard: isTask,
		accepted: { operation: 'refactor', domain: 'code', statement: 'Refactor useForm.' },
		refused: { operation: 'improve', domain: 'code', statement: 'Refactor useForm.' },
	},
	{
		name: 'reference',
		shape: referenceShape,
		guard: isReference,
		accepted: { path: 'src/core/types.ts', note: 'the published contract' },
		refused: { path: '', note: 'the published contract' },
	},
	{
		name: 'manifest',
		shape: manifestShape,
		guard: isManifest,
		accepted: { read: [], edit: [], locked: [], forbidden: [] },
		refused: { read: [], edit: [], locked: [] },
	},
	{
		name: 'outcome',
		shape: outcomeShape,
		guard: isOutcome,
		accepted: { rank: 1, text: 'the tests pass', required: true },
		refused: { rank: 0, text: 'the tests pass', required: true },
	},
	{
		name: 'given',
		shape: givenShape,
		guard: isGiven,
		accepted: { category: 'convention', name: 'indentation', value: 'tabs' },
		refused: { category: 'convention', name: '', value: 'tabs' },
	},
	{
		name: 'example',
		shape: exampleShape,
		guard: isExample,
		accepted: { input: '<input required>', output: 'el.validity' },
		refused: { input: '<input required>', output: '' },
	},
	{
		name: 'citation',
		shape: citationShape,
		guard: isCitation,
		accepted: { name: 'MDN', role: 'docs', url: 'https://developer.mozilla.org/' },
		refused: { name: 'MDN', role: 'blog', url: 'https://developer.mozilla.org/' },
	},
	{
		name: 'gap',
		shape: gapShape,
		guard: isGap,
		accepted: { field: 'output', question: 'Diff or files?', blocking: true },
		refused: { field: 'output', question: 'Diff or files?', blocking: 'yes' },
	},
	{
		name: 'risk',
		shape: riskShape,
		guard: isRisk,
		accepted: { severity: 'medium', text: 'subtle drift', mitigation: 'assert in tests' },
		refused: { severity: 'critical', text: 'subtle drift', mitigation: 'assert in tests' },
	},
	{
		name: 'output',
		shape: outputShape,
		guard: isOutput,
		accepted: { format: 'diff' },
		refused: { format: 'patch' },
	},
	{
		name: 'proof',
		shape: proofShape,
		guard: isProof,
		accepted: { text: 'tests pass', command: 'npm test' },
		refused: { text: 'tests pass', command: '' },
	},
]

// The single-line contract is the property `LINE_BREAK_PATTERN` and `SINGLE_LINE_PATTERN` exist to hold in
// lockstep, and no row above carries a line terminator — so the two derivations of that one
// character class were proven by nothing. One value per terminator, on both mechanisms.
const TERMINATORS: readonly string[] = ['\n', '\r', '\u2028', '\u2029']

// Only `Example.input`/`output` may span lines, and `Given.value` may be empty but not span
// them. Everything else in `PAIRS` is a single-line field, and every one is driven — testing
// two of them let a field silently drop from `isLine` to `isNonEmptyString`.
const MULTILINE: Readonly<Record<string, readonly string[]>> = { example: ['input', 'output'] }

// Every single-line field the sweep below must reach, in `PAIRS` order. `manifest` contributes
// none: its four members are arrays of references, and the reference row drives those fields.
//
// COVERAGE, stated because a conclusion inherits its instrument's scope and an unstated one
// reads as complete: the sweep walks the TOP-LEVEL string members of each row's `accepted`
// value. It therefore does not reach an optional member absent from `accepted`
// (`example.note`), a string inside a nested array (`gap.candidates`, `output.sections`),
// or a brief-level string list (`rules`, `invariants`, `assumptions`). Weakening only
// `gapShape.candidates` to a multiline string leaves this sweep green. Those fields are
// proved by their own row's guard tests, not here.
const SINGLE_LINE_FIELDS: readonly string[] = [
	'task.operation',
	'task.domain',
	'task.statement',
	'reference.path',
	'reference.note',
	'outcome.text',
	'given.category',
	'given.name',
	'given.value',
	'citation.name',
	'citation.role',
	'citation.url',
	'gap.field',
	'gap.question',
	'risk.severity',
	'risk.text',
	'risk.mitigation',
	'output.format',
	'proof.text',
	'proof.command',
]

describe('line terminators across both mechanisms', () => {
	for (const terminator of TERMINATORS) {
		const label = `U+${terminator.codePointAt(0)?.toString(16).padStart(4, '0')}`
		it(`refuses ${label} in every single-line field, on both mechanisms`, () => {
			const driven: string[] = []
			for (const pair of PAIRS) {
				const compiled = createContract(pair.shape)
				const exempt = MULTILINE[pair.name] ?? []
				for (const [key, value] of Object.entries(pair.accepted)) {
					if (typeof value !== 'string' || exempt.includes(key)) continue
					const forged = { ...pair.accepted, [key]: `${value}${terminator}forged` }
					driven.push(`${pair.name}.${key}`)
					expect({ field: `${pair.name}.${key}`, guard: pair.guard(forged) }).toStrictEqual({
						field: `${pair.name}.${key}`,
						guard: false,
					})
					expect({ field: `${pair.name}.${key}`, shape: compiled.is(forged) }).toStrictEqual({
						field: `${pair.name}.${key}`,
						shape: false,
					})
				}
			}
			// Membership, not a total. A count passes for any population that reaches it, so a
			// field dropping out of the sweep — a section losing a member, a row losing its
			// accepted value — would go unreported while the number still cleared its floor.
			expect(driven).toStrictEqual(SINGLE_LINE_FIELDS)
		})

		it(`accepts ${label} in an exemplar's two code sides, on both mechanisms`, () => {
			const spanning = { input: `a${terminator}b`, output: `c${terminator}d` }
			expect(isExample(spanning)).toBe(true)
			expect(createContract(exampleShape).is(spanning)).toBe(true)
		})
	}

	it('accepts the same values on both sides once the terminator is gone', () => {
		// The control: the refusals above must come from the terminator, not from the shape.
		const clean = { path: 'a b', note: 'the file under repair' }
		expect(isReference(clean)).toBe(true)
		expect(createContract(referenceShape).is(clean)).toBe(true)
	})

	it('agrees on an empty Given value, which is a line but not a non-empty one', () => {
		const empty = { category: 'extracted', name: 'count', value: '' }
		expect(isGiven(empty)).toBe(true)
		expect(createContract(givenShape).is(empty)).toBe(true)
		const broken = { category: 'extracted', name: 'count', value: '\n' }
		expect(isGiven(broken)).toBe(false)
		expect(createContract(givenShape).is(broken)).toBe(false)
	})
})

describe('shape and guard lockstep', () => {
	it('pairs every section shape with its guard', () => {
		expect(PAIRS.map((pair) => pair.name)).toStrictEqual([
			'task',
			'reference',
			'manifest',
			'outcome',
			'given',
			'example',
			'citation',
			'gap',
			'risk',
			'output',
			'proof',
		])
	})

	for (const pair of PAIRS) {
		it(`${pair.name}Shape and its guard agree on the same values`, () => {
			const compiled = createContract(pair.shape)
			expect(compiled.is(pair.accepted)).toBe(pair.guard(pair.accepted))
			expect(compiled.is(pair.accepted)).toBe(true)
			expect(compiled.is(pair.refused)).toBe(pair.guard(pair.refused))
			expect(compiled.is(pair.refused)).toBe(false)
		})

		it(`${pair.name}Shape compiles an exact record`, () => {
			expect(createContract(pair.shape).is({ ...pair.accepted, surplus: 1 })).toBe(false)
		})
	}

	// The control: a value the shape family accepts and the guard family must not, proving
	// the comparison above can report a disagreement rather than only ever agreeing.
	it('reports a disagreement when the two mechanisms are given different vocabularies', () => {
		const drifted = createContract(taskShape)
		expect(drifted.is({ operation: 'refactor', domain: 'code', statement: 'x' })).toBe(true)
		expect(isTask({ operation: 'refactor', domain: 'data', statement: 'x' })).toBe(true)
		expect(drifted.is({ operation: 'refactor', domain: 'ux', statement: 'x' })).toBe(false)
		expect(isTask({ operation: 'refactor', domain: 'ux', statement: 'x' })).toBe(false)
	})
})

describe('briefShape', () => {
	it('agrees with isBrief on a real brief', () => {
		const contract = createBriefContract()
		const source = buildBrief()
		expect(contract.is(source)).toBe(true)
		expect(isBrief(source)).toBe(true)
		expect(contract.is({ ...source, surplus: 1 })).toBe(isBrief({ ...source, surplus: 1 }))
	})

	it('emits a JSON Schema carrying the closed vocabularies', () => {
		const { schema } = createBriefContract()
		expect(schema.type).toBe('object')
		expect(Object.keys(schema.properties ?? {}).sort()).toStrictEqual([
			'assumptions',
			'authority',
			'citations',
			'examples',
			'gaps',
			'givens',
			'hash',
			'invariants',
			'manifest',
			'outcomes',
			'output',
			'proofs',
			'risks',
			'rules',
			'task',
			'trace',
		])
		expect(schema.required).toContain('proofs')
		expect(schema.required).not.toContain('trace')
	})

	it('generates a reproducible brief both mechanisms accept', () => {
		const contract = createBriefContract()
		const first = contract.generate(seededRandom(42))
		const second = contract.generate(seededRandom(42))
		expect(first).toStrictEqual(second)
		expect(contract.is(first)).toBe(true)
		expect(isBrief(first)).toBe(true)
	})

	it('parses what it generated back to the same value', () => {
		const contract = createBriefContract()
		const generated = contract.generate(seededRandom(7))
		// The parser rebuilds an owned record, so the comparison is structural rather than
		// identical: `toStrictEqual` would fail on the prototype alone.
		expect(contract.parse(generated)).toEqual(generated)
		expect(contract.parse('not a brief')).toBeUndefined()
	})

	it('exposes briefShape as a composed object shape', () => {
		expect(briefShape.type).toBe('object')
		expect(Object.keys(briefShape.properties)).toContain('manifest')
	})
})
