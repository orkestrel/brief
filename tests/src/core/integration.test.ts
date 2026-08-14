import type { BriefInput } from '@src/core'
import {
	brief,
	briefToDispatch,
	briefToGoal,
	briefToHash,
	briefToMarkdown,
	createBriefManager,
	createBriefCompiler,
	findBlockingGaps,
	findManifestOverlaps,
	findUngrantedAuthority,
	findUnpairedGaps,
	gap,
	manifest,
	outcome,
	output,
	parseBrief,
	pinBrief,
	proof,
	reference,
	task,
	validateBrief,
} from '@src/core'
import { requireValue } from '@orkestrel/test'
import { describe, expect, it } from 'vitest'
import { buildInterpret, buildManifest } from '../../setup.js'

describe('text to brief to projections', () => {
	it('carries one request from raw text through every downstream view', () => {
		const compiler = createBriefCompiler({
			interpret: buildInterpret('migrate', 'code', true),
			actions: { migrate: 'migrate' },
			domains: { code: 'code' },
		})

		const briefing = compiler.compile({
			text: 'migrate the 3 legacy stores to the new driver seam',
			manifest: buildManifest(),
			outcomes: [outcome(1, 'all three stores implement the driver seam')],
			output: output('diff', { include: ['the migrated stores'] }),
			proofs: [proof('the core project passes', 'npm run test:src:core')],
		})

		expect(briefing.brief).toBeDefined()
		const compiled = requireValue(briefing.brief, 'a complete briefing carries its brief')

		expect(validateBrief(compiled)).toStrictEqual({ valid: true, errors: [], warnings: [] })
		expect(compiler.gate(compiled).conclusion).toBe(true)

		const prompt = briefToMarkdown(compiled)
		expect(prompt).toContain('# Brief: Migrate the 3 legacy stores to the new driver seam.')
		expect(prompt).toContain('- format: diff')

		expect(briefToGoal(compiled)).toBe(
			'Done when every proof passes: npm run test:src:core exits 0. Cap: 16 turns.',
		)

		const dispatch = briefToDispatch(compiled)
		// Pinned against the rendering's observable structure, not re-derived by calling the
		// renderer a second time — that would move with any change to it.
		expect(dispatch.prompt.startsWith('# Brief: Migrate')).toBe(true)
		expect(dispatch.prompt).toContain('## Manifest')
		expect(dispatch.edit).toStrictEqual(['src/browser/composables/useForm.ts'])
		expect(dispatch.locked).toStrictEqual(['src/browser/types.ts'])

		const stored = createBriefManager()
		const record = stored.add(compiled)
		expect(record.id).toBe(record.hash)
		// Structural: a stored brief is an owned null-prototype snapshot.
		expect(parseBrief(JSON.stringify(record.brief))).toEqual(compiled)
		stored.destroy()
		compiler.destroy()
	})
})

describe('the blocked brief and its answer', () => {
	it('refuses to emit, then emits once the blocking gap is answered', () => {
		const compiler = createBriefCompiler()
		const shared: BriefInput = {
			task: task('refactor', 'code', 'Refactor the session store.'),
			outcomes: [outcome(1, 'the store implements the async seam')],
			proofs: [proof('checks pass', 'npm run check')],
		}

		const blocked = compiler.compile({
			...shared,
			gaps: [
				gap('output', 'Diff or full files?', { blocking: true, candidates: ['diff', 'code'] }),
			],
		})
		expect(blocked.brief).toBeUndefined()
		expect(blocked.brief).toBeUndefined()
		expect(blocked.questions.map((entry) => entry.question)).toStrictEqual(['Diff or full files?'])

		const answered = compiler.compile({ ...shared, output: output('diff') })
		expect(answered.brief).toBeDefined()
		expect(answered.brief?.output).toEqual({ format: 'diff' })
		expect(answered.questions).toStrictEqual([])
		expect(answered.failures).toStrictEqual([])
		compiler.destroy()
	})

	it('keeps an open gap runnable and reports the missing assumption as a warning', () => {
		const compiler = createBriefCompiler()
		const shared: BriefInput = {
			task: { operation: 'plan', domain: 'ops', statement: 'Plan the release.' },
			outcomes: [outcome(1, 'the plan lands')],
			gaps: [gap('rules', 'Keep the wording?')],
			proofs: [proof('checks pass', 'npm run check')],
		}

		// An open gap proceeds on a recorded assumption. The pairing is a COUNT, not a
		// relation, so it advises rather than gates — one assumption answering two related
		// gaps would otherwise be refused for arithmetic.
		const unpaired = compiler.compile(shared)
		expect(unpaired.brief).toBeDefined()
		const drafted = requireValue(unpaired.brief, 'an open gap does not block emission')
		expect(validateBrief(drafted).valid).toBe(true)
		expect(validateBrief(drafted).warnings).toStrictEqual([
			'Open gap "rules" has no paired assumption',
		])

		const paired = compiler.compile({ ...shared, assumptions: ['The wording is preserved.'] })
		expect(paired.brief).toBeDefined()
		const compiled = requireValue(paired.brief, 'a paired open gap does not block emission')
		expect(validateBrief(compiled).warnings).toStrictEqual([])
		compiler.destroy()
	})
})

// `tests/guides.test.ts` proves every backticked NAME in the guide resolves to a real export.
// It cannot prove a `// value` comment beside a call is true, because it never runs one — so a
// fence documenting a value the code contradicts shipped green. It did: strengthening the
// `granted` rule made the guide's own headline example refuse at the gate, and every parity
// assertion stayed passing. These two tests transcribe the guide's flagship fences and assert
// the values their comments claim. Change a fence, change the test beside it.
describe('the guide fences, executed', () => {
	it("runs the ## Surface fence and yields the 'true' it documents", () => {
		const compiler = createBriefCompiler()
		const briefing = compiler.compile({
			task: task('refactor', 'code', 'Refactor useForm to native browser form APIs.'),
			authority: [{ path: 'AGENTS.md', note: 'project law; wins every conflict' }],
			manifest: {
				read: [
					{ path: 'AGENTS.md', note: 'project law; wins every conflict' },
					{ path: 'guides/browser.md', note: 'the composable contract' },
				],
				edit: [
					{ path: 'src/browser/composables/useForm.ts', note: 'the composable being refactored' },
				],
				locked: [{ path: 'src/browser/types.ts', note: 'the published contract' }],
				forbidden: [{ path: 'app/**', note: 'out of scope' }],
			},
			outcomes: [outcome(1, 'useForm uses native FormData with no behavior change')],
			proofs: [proof('type-check and lint pass', 'npm run check')],
		})
		// The fence's own comment: `briefing.brief !== undefined // true`.
		expect(briefing.failures).toStrictEqual([])
		expect(briefing.brief !== undefined).toBe(true)
		const emitted = requireValue(briefing.brief, 'the documented Surface fence compiles')
		expect(briefToMarkdown(emitted).startsWith('# Brief: ')).toBe(true)
		expect(briefToGoal(emitted)).toBe(
			'Done when every proof passes: npm run check exits 0. Cap: 16 turns.',
		)
		compiler.destroy()
	})

	it('runs the ### Builders fence and yields every value the Helpers fence documents', () => {
		const draft = brief(task('refactor', 'code', 'Refactor useForm to native browser form APIs.'), {
			authority: [reference('AGENTS.md', 'project law; wins every conflict')],
			manifest: manifest({
				read: [
					reference('AGENTS.md', 'project law; wins every conflict'),
					reference('guides/browser.md', 'the composable contract'),
				],
				edit: [reference('src/browser/composables/useForm.ts', 'the composable being refactored')],
				locked: [reference('src/browser/types.ts', 'the published contract')],
				forbidden: [reference('app/**', 'out of scope')],
			}),
			outcomes: [
				outcome(1, 'useForm uses native FormData with no behavior change'),
				outcome(2, 'tests cover the new code paths'),
			],
			proofs: [proof('type-check and lint pass', 'npm run check')],
		})
		const pinned = pinBrief(draft)
		// Each assertion below is a documented `// value` comment from `### Helpers`.
		expect(findUngrantedAuthority(pinned)).toStrictEqual([])
		expect(findManifestOverlaps(pinned)).toStrictEqual([])
		expect(findBlockingGaps(pinned)).toStrictEqual([])
		expect(findUnpairedGaps(pinned)).toStrictEqual([])
		expect(validateBrief(pinned)).toStrictEqual({ valid: true, errors: [], warnings: [] })
		expect(briefToHash(pinned)).toBe(briefToHash(draft))
		expect(briefToDispatch(pinned).edit).toStrictEqual(['src/browser/composables/useForm.ts'])
		expect(briefToDispatch(pinned).authority).toStrictEqual(['AGENTS.md'])
	})
})
