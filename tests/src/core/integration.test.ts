import type { BriefInput } from '@src/core'
import {
	briefToDispatch,
	briefToGoal,
	briefToMarkdown,
	buildGap,
	buildOutcome,
	buildOutput,
	buildProof,
	buildTask,
	createBriefManager,
	createBriefCompiler,
	parseBrief,
	validateBrief,
} from '@src/core'
import { requireValue } from '@orkestrel/test'
import { describe, expect, it } from 'vitest'
import { buildInterpret, buildReadyManifest } from '../../setup.js'

describe('text to brief to projections', () => {
	it('carries one request from raw text through every downstream view', () => {
		const compiler = createBriefCompiler({
			interpret: buildInterpret('migrate', 'code', true),
			actions: { migrate: 'migrate' },
			domains: { code: 'code' },
		})

		const briefing = compiler.compile({
			text: 'migrate the 3 legacy stores to the new driver seam',
			manifest: buildReadyManifest(),
			outcomes: [buildOutcome(1, 'all three stores implement the driver seam')],
			output: buildOutput('diff', { include: ['the migrated stores'] }),
			proofs: [buildProof('the core project passes', 'npm run test:src:core')],
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
			task: buildTask('refactor', 'code', 'Refactor the session store.'),
			outcomes: [buildOutcome(1, 'the store implements the async seam')],
			proofs: [buildProof('checks pass', 'npm run check')],
		}

		const blocked = compiler.compile({
			...shared,
			gaps: [
				buildGap('output', 'Diff or full files?', { blocking: true, candidates: ['diff', 'code'] }),
			],
		})
		expect(blocked.brief).toBeUndefined()
		expect(blocked.brief).toBeUndefined()
		expect(blocked.questions.map((entry) => entry.question)).toStrictEqual(['Diff or full files?'])

		const answered = compiler.compile({ ...shared, output: buildOutput('diff') })
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
			outcomes: [buildOutcome(1, 'the plan lands')],
			gaps: [buildGap('rules', 'Keep the wording?')],
			proofs: [buildProof('checks pass', 'npm run check')],
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
