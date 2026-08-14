import type { Brief } from '@src/core'
import {
	assertBrief,
	brief,
	briefToDispatch,
	briefToGoal,
	briefToHash,
	briefToMarkdown,
	briefToSubject,
	citation,
	countSentences,
	deriveGaps,
	deriveGivens,
	deriveStatement,
	deriveTask,
	errorToMessage,
	example,
	exampleToLines,
	findBlockingGaps,
	findUngrantedAuthority,
	findManifestOverlaps,
	findUnpairedGaps,
	findUnmetRules,
	freezeDeep,
	gap,
	gateDefinition,
	given,
	isBrief,
	isBriefError,
	isExample,
	isGap,
	isOutput,
	isReference,
	manifest,
	outcome,
	output,
	pinBrief,
	proof,
	reference,
	risk,
	snapshotBrief,
	task,
	validateBrief,
	GATE_ID,
} from '@src/core'
import { readFileSync } from 'node:fs'
import { createLogicalReasoner, createReason } from '@orkestrel/reason'
import { captureError } from '@orkestrel/test'
import { describe, expect, it } from 'vitest'
import {
	buildAdversarialValues,
	buildBrief,
	buildInheritedActions,
	buildManifest,
	buildTask,
	readConclusion,
	readErrorCode,
	readErrorContext,
} from '../../setup.js'

describe('builders', () => {
	it('builds a task, a reference, a citation, a risk, and a proof', () => {
		expect(task('refactor', 'code', 'Refactor useForm.')).toStrictEqual({
			operation: 'refactor',
			domain: 'code',
			statement: 'Refactor useForm.',
		})
		const ranked = reference('AGENTS.md', 'project law')
		expect(ranked).toStrictEqual({ path: 'AGENTS.md', note: 'project law' })
		// `note` carries no default and has no absent form: a path with no stated reason is
		// interpretation the executor would have to supply.
		expect(isReference(ranked)).toBe(true)
		expect(isReference({ path: 'AGENTS.md' })).toBe(false)
		expect(
			citation('MDN', 'https://developer.mozilla.org/', 'the native validity behavior'),
		).toStrictEqual({
			name: 'MDN',
			url: 'https://developer.mozilla.org/',
			note: 'the native validity behavior',
		})
		expect(risk('medium', 'subtle drift', 'assert in tests')).toStrictEqual({
			severity: 'medium',
			text: 'subtle drift',
			mitigation: 'assert in tests',
		})
		expect(proof('tests pass', 'npm test')).toStrictEqual({
			text: 'tests pass',
			command: 'npm test',
		})
		expect(given('convention', 'indentation', 'tabs')).toStrictEqual({
			category: 'convention',
			name: 'indentation',
			value: 'tabs',
		})
	})

	it('omits an absent optional key entirely', () => {
		const plain = example('in', 'out')
		expect(Object.hasOwn(plain, 'note')).toBe(false)
		expect(isExample(plain)).toBe(true)

		const open = gap('rules', 'Keep the wording?')
		expect(open).toStrictEqual({ field: 'rules', question: 'Keep the wording?', blocking: false })
		expect(Object.hasOwn(open, 'candidates')).toBe(false)
		expect(isGap(open)).toBe(true)

		const markdown = output('markdown')
		expect(markdown).toStrictEqual({ format: 'markdown' })
		expect(isOutput(markdown)).toBe(true)
	})

	it('fills the documented defaults', () => {
		expect(outcome(1, 'the tests pass').required).toBe(true)
		expect(outcome(2, 'the diff stays small', false).required).toBe(false)
		expect(manifest()).toStrictEqual({ read: [], edit: [], locked: [], forbidden: [] })
		expect(manifest({ edit: [reference('a', 'b')] }).edit).toHaveLength(1)
		expect(gap('output', 'Diff or files?', { blocking: true, candidates: ['diff'] })).toStrictEqual(
			{
				field: 'output',
				question: 'Diff or files?',
				blocking: true,
				candidates: ['diff'],
			},
		)
		expect(output('diff', { include: ['a'] })).toStrictEqual({ format: 'diff', include: ['a'] })
	})

	it('builds an on-contract brief from a task alone', () => {
		const bare = brief(buildTask())
		expect(isBrief(bare)).toBe(true)
		expect(bare.output).toStrictEqual({ format: 'markdown' })
		expect(bare.outcomes).toStrictEqual([])
		expect(Object.hasOwn(bare, 'trace')).toBe(false)
		expect(Object.hasOwn(bare, 'hash')).toBe(false)
	})

	it('never mutates the task it is handed', () => {
		const source = buildTask()
		const built = brief(source)
		expect(built.task).toBe(source)
		expect(source).toStrictEqual(buildTask())
	})
})

describe('gateDefinition', () => {
	it('declares the six readiness rules plus the conjunction, in order', () => {
		const definition = gateDefinition()
		expect(definition.id).toBe(GATE_ID)
		expect(definition.reasoning).toBe('logical')
		expect(definition.strategy).toBe('forward')
		expect(definition.rules.map((entry) => entry.id)).toStrictEqual([
			'specified',
			'aimed',
			'proven',
			'disjoint',
			'granted',
			'single',
			'ready',
		])
	})

	it('takes no parameters, so no caller rule can enter its fact namespace', () => {
		// The gate is fixed by design. The reasoner overlays derived facts into one flat
		// namespace, so a caller rule named `specified` would overwrite the fact `ready`
		// conjoins and turn a refusal into a pass. There is no seam to reach it through.
		expect(gateDefinition).toHaveLength(0)
		const ids = gateDefinition().rules.map((entry) => entry.id)
		expect(ids[ids.length - 1]).toBe('ready')
		expect(new Set(ids).size).toBe(ids.length)
	})

	it('leaves an unpaired open gap runnable, and reports it as a warning', () => {
		// The gate refuses what no assumption can answer. An open gap is answerable by a
		// recorded assumption, and the pairing is a COUNT rather than a relation, so it is
		// advisory rather than a gate rule — one assumption resolving two related gaps would
		// otherwise be refused for arithmetic.
		const engine = createReason({ reasoners: [createLogicalReasoner()] })
		const unpaired = buildBrief({ gaps: [gap('rules', 'Keep the wording?')], assumptions: [] })
		expect(readConclusion(engine.reason(briefToSubject(unpaired), gateDefinition()))).toBe(true)
		expect(validateBrief(unpaired).valid).toBe(true)
		expect(validateBrief(unpaired).warnings).toStrictEqual([
			'Open gap "rules" has no paired assumption',
		])
		// The control: a BLOCKING gap is not advisory, and the gate refuses it.
		const blocked = buildBrief({ gaps: [gap('output', 'Diff or files?', { blocking: true })] })
		expect(readConclusion(engine.reason(briefToSubject(blocked), gateDefinition()))).toBe(false)
		engine.destroy()
	})

	it('agrees with findUnmetRules on every readiness case', () => {
		// The gate states readiness as DATA for a reasoner to narrate; `findUnmetRules` decides it
		// in CODE because the reasoner is borrowed. Two mechanisms over one property, driven
		// here over one value set so they cannot drift apart.
		const engine = createReason({ reasoners: [createLogicalReasoner()] })
		const cases: readonly Brief[] = [
			buildBrief(),
			buildBrief({ proofs: [] }),
			buildBrief({ outcomes: [] }),
			buildBrief({ outcomes: [outcome(1, 'desirable', false)] }),
			buildBrief({ gaps: [gap('output', 'Diff or files?', { blocking: true })] }),
			buildBrief({
				manifest: manifest({
					edit: [reference('src/core/BriefCompiler.ts', 'implementation')],
					locked: [reference('src/core/BriefCompiler.ts', 'contract')],
				}),
			}),
			brief(task('plan', 'ops', 'Do one thing. Then another.'), {
				outcomes: [outcome(1, 'x')],
				proofs: [proof('x', 'y')],
			}),
			buildBrief({
				authority: [reference('AGENTS.md', 'project law')],
				manifest: manifest({ forbidden: [reference('AGENTS.md', 'out of scope')] }),
			}),
		]
		for (const source of cases) {
			const verdict = engine.reason(briefToSubject(source), gateDefinition())
			// Rule by rule, not conclusion to conclusion. Comparing only the two booleans hides a
			// drift on one rule whenever a second rule fails alongside it and keeps the verdict
			// false — and the ids are what the `Gate refused: <ids>` message is built from.
			const refused =
				verdict.reasoning === 'logical'
					? verdict.rules
							.filter((entry) => !entry.conclusion && entry.id !== 'ready')
							.map((entry) => entry.id)
					: []
			expect([...findUnmetRules(source)].sort()).toStrictEqual([...refused].sort())
		}
		// The control: the comparison can report a difference, so it is not vacuously true.
		expect(findUnmetRules(buildBrief())).toStrictEqual([])
		expect(findUnmetRules(buildBrief({ proofs: [], outcomes: [] }))).toStrictEqual([
			'aimed',
			'proven',
		])
		engine.destroy()
	})

	it('returns a fresh definition each call', () => {
		expect(gateDefinition()).not.toBe(gateDefinition())
		expect(gateDefinition()).toStrictEqual(gateDefinition())
	})

	it('concludes true for a ready brief and false for each single missing measure', () => {
		const engine = createReason({ reasoners: [createLogicalReasoner()] })
		const ready = engine.reason(briefToSubject(buildBrief()), gateDefinition())
		expect(ready.reasoning === 'logical' && ready.conclusion).toBe(true)

		const unready = [
			buildBrief({ proofs: [] }),
			buildBrief({ outcomes: [] }),
			buildBrief({ gaps: [gap('output', 'Diff or files?', { blocking: true })] }),
			brief(task('plan', 'ops', 'Do one thing. Then another.'), {
				outcomes: [outcome(1, 'x')],
				proofs: [proof('x', 'y')],
			}),
			buildBrief({
				manifest: manifest({
					edit: [reference('src/core/BriefCompiler.ts', 'implementation')],
					locked: [reference('src/core/BriefCompiler.ts', 'contract')],
				}),
			}),
			buildBrief({
				authority: [reference('AGENTS.md', 'project law')],
				manifest: manifest({ forbidden: [reference('AGENTS.md', 'out of scope')] }),
			}),
		]
		for (const source of unready) {
			const verdict = engine.reason(briefToSubject(source), gateDefinition())
			expect(verdict.reasoning === 'logical' && verdict.conclusion).toBe(false)
		}
		engine.destroy()
	})
})

describe('countSentences', () => {
	it('counts terminator runs and treats unterminated text as one sentence', () => {
		expect(countSentences('Refactor useForm to native APIs.')).toBe(1)
		expect(countSentences('Refactor useForm')).toBe(1)
		expect(countSentences('Refactor useForm. Then update the tests.')).toBe(2)
		expect(countSentences('Is it done? Yes!')).toBe(2)
		expect(countSentences('Wait...')).toBe(1)
		expect(countSentences('   ')).toBe(0)
		expect(countSentences('')).toBe(0)
	})

	it('counts an unterminated final sentence, so a compound statement cannot slip the gate', () => {
		// Counting terminators alone read this as ONE sentence, so the `single` rule passed a
		// genuinely compound statement whenever its last sentence had no terminator — which is
		// most of the time, because people drop the final period.
		expect(countSentences('Do one thing. Then another')).toBe(2)
		expect(countSentences('Refactor useForm. Then update the tests')).toBe(2)
		expect(countSentences('Is it done? Yes')).toBe(2)
		// And the gate refuses it, which is the property that actually matters.
		const compound = brief(task('plan', 'ops', 'Do one thing. Then another'), {
			outcomes: [outcome(1, 'x')],
			proofs: [proof('x', 'npm test')],
		})
		expect(findUnmetRules(compound)).toContain('single')
		expect(validateBrief(compound).errors).toContain(
			'Statement holds 2 sentences — a compound statement is two briefs',
		)
		// The control: one unterminated sentence is still one, and passes.
		expect(countSentences('Refactor useForm')).toBe(1)
		expect(findUnmetRules(buildBrief())).toStrictEqual([])
	})
})

describe('find leaves', () => {
	it('finds only the blocking gaps', () => {
		const source = buildBrief({
			gaps: [gap('rules', 'Keep the wording?'), gap('output', 'Diff?', { blocking: true })],
		})
		expect(findBlockingGaps(source).map((entry) => entry.field)).toStrictEqual(['output'])
		expect(findBlockingGaps(buildBrief())).toStrictEqual([])
	})

	it('finds a path in two partitions once, and ignores a duplicate inside one', () => {
		const overlapping = buildBrief({
			manifest: manifest({
				read: [reference('src/core/types.ts', 'contract')],
				edit: [reference('src/core/helpers.ts', 'implementation')],
				locked: [reference('src/core/types.ts', 'contract')],
			}),
		})
		expect(findManifestOverlaps(overlapping)).toStrictEqual(['src/core/types.ts'])

		const duplicated = buildBrief({
			manifest: manifest({
				edit: [reference('src/core/helpers.ts', 'a'), reference('src/core/helpers.ts', 'b')],
			}),
		})
		expect(findManifestOverlaps(duplicated)).toStrictEqual([])
		expect(findManifestOverlaps(buildBrief())).toStrictEqual([])
	})

	it('treats all three of read, edit, and locked as grants', () => {
		const granted = buildBrief({
			authority: [
				reference('README.md', 'orientation'),
				reference('src/a.ts', 'the file under repair'),
				reference('guides/brief.md', 'the spec'),
			],
			manifest: manifest({
				read: [reference('README.md', 'orientation')],
				edit: [reference('src/a.ts', 'the file under repair')],
				locked: [reference('guides/brief.md', 'the spec')],
			}),
		})
		// `locked` grants: read-only is exactly what obeying a file requires. So does `edit`.
		expect(findUngrantedAuthority(granted)).toStrictEqual([])
		expect(findUngrantedAuthority(buildBrief())).toStrictEqual([])
	})

	it('reports an authority no partition opens, whether banned or simply absent', () => {
		// The case a forbidden-only check missed entirely: the brief never says the executor
		// may open what it must obey. Nothing is banned here — the manifest is just silent.
		const absent = buildBrief({
			authority: [reference('AGENTS.md', 'project law')],
			manifest: manifest(),
		})
		expect(findUngrantedAuthority(absent)).toStrictEqual(['AGENTS.md'])
		// And the banned case still reports, because the partitions are disjoint: a forbidden
		// path is in none of the three grants, so it arrives here without a special branch.
		const banned = buildBrief({
			authority: [reference('AGENTS.md', 'project law')],
			manifest: manifest({ forbidden: [reference('AGENTS.md', 'out of scope')] }),
		})
		expect(findUngrantedAuthority(banned)).toStrictEqual(['AGENTS.md'])
	})

	it('compares paths exactly, so a glob never grants what it would match', () => {
		// The documented limit, pinned so it cannot change silently. Closing it means glob
		// intersection, which needs a matcher this package does not carry; `findManifestOverlaps`
		// has compared exact strings since before the authority checks existed.
		const globbed = buildBrief({
			authority: [reference('guides/brief.md', 'the spec')],
			manifest: manifest({ read: [reference('guides/**', 'the guides')] }),
		})
		expect(findUngrantedAuthority(globbed)).toStrictEqual(['guides/brief.md'])
		expect(
			findManifestOverlaps(
				buildBrief({
					manifest: manifest({
						edit: [reference('app/file.ts', 'the file under repair')],
						forbidden: [reference('app/**', 'out of scope')],
					}),
				}),
			),
		).toStrictEqual([])
		// The control: spelled identically, the grant lands.
		const literal = buildBrief({
			authority: [reference('guides/**', 'the guides')],
			manifest: manifest({ read: [reference('guides/**', 'the guides')] }),
		})
		expect(findUngrantedAuthority(literal)).toStrictEqual([])
	})

	it('finds the open gaps past the assumption count and never a blocking one', () => {
		const source = buildBrief({
			gaps: [gap('rules', 'a'), gap('output', 'b'), gap('proofs', 'c', { blocking: true })],
			assumptions: ['One narrow assumption.'],
		})
		expect(findUnpairedGaps(source).map((entry) => entry.field)).toStrictEqual(['output'])
		expect(findUnpairedGaps(buildBrief())).toStrictEqual([])
	})
})

describe('briefToSubject', () => {
	it('measures every readiness axis the gate reads', () => {
		expect(briefToSubject(buildBrief())).toStrictEqual({
			operation: 'refactor',
			domain: 'code',
			sentences: 1,
			authority: 0,
			gaps: 0,
			blocking: 0,
			unpaired: 0,
			outcomes: 1,
			required: 1,
			proofs: 1,
			reads: 1,
			edits: 1,
			locks: 1,
			bans: 1,
			overlaps: 0,
			ungranted: 0,
			risks: 0,
			examples: 0,
		})
	})

	it('counts required outcomes separately from every outcome', () => {
		const measures = briefToSubject(
			buildBrief({ outcomes: [outcome(1, 'a'), outcome(2, 'b', false)] }),
		)
		expect(measures['outcomes']).toBe(2)
		expect(measures['required']).toBe(1)
	})
})

describe('validateBrief', () => {
	it('passes a well-formed brief', () => {
		expect(validateBrief(buildBrief())).toStrictEqual({ valid: true, errors: [], warnings: [] })
	})

	it('errors on a manifest overlap', () => {
		const result = validateBrief(
			buildBrief({
				manifest: manifest({
					edit: [reference('src/core/types.ts', 'implementation')],
					locked: [reference('src/core/types.ts', 'contract')],
				}),
			}),
		)
		expect(result.valid).toBe(false)
		expect(result.errors).toContain(
			'Path "src/core/types.ts" appears in more than one manifest partition',
		)
	})

	it('errors on an empty proofs list', () => {
		const result = validateBrief(buildBrief({ proofs: [] }))
		expect(result.valid).toBe(false)
		expect(result.errors).toContain('Brief records no proof — nothing can settle "done"')
	})

	it('errors on a compound statement', () => {
		const result = validateBrief(
			brief(task('plan', 'ops', 'Do one thing. Then another.'), {
				proofs: [proof('x', 'npm test')],
			}),
		)
		expect(result.valid).toBe(false)
		expect(result.errors).toContain(
			'Statement holds 2 sentences — a compound statement is two briefs',
		)
	})

	it('errors on an authority no partition grants access to', () => {
		const message =
			'Authority "AGENTS.md" is in no manifest partition that grants access — the executor cannot obey what it cannot open'
		// Banned outright.
		const banned = validateBrief(
			buildBrief({
				authority: [reference('AGENTS.md', 'project law')],
				manifest: manifest({ forbidden: [reference('AGENTS.md', 'out of scope')] }),
			}),
		)
		expect(banned.valid).toBe(false)
		expect(banned.errors).toContain(message)
		// Simply never granted — the case a forbidden-only check could not see.
		const absent = validateBrief(
			buildBrief({
				authority: [reference('AGENTS.md', 'project law')],
				manifest: manifest(),
			}),
		)
		expect(absent.valid).toBe(false)
		expect(absent.errors).toContain(message)
	})

	it('warns without failing on duplicate ranks, unpaired gaps, and a misranked optional', () => {
		const result = validateBrief(
			buildBrief({
				outcomes: [outcome(1, 'a', false), outcome(2, 'b'), outcome(2, 'c')],
				gaps: [gap('rules', 'Keep the wording?')],
			}),
		)
		expect(result.valid).toBe(true)
		expect(result.errors).toStrictEqual([])
		expect(result.warnings).toStrictEqual([
			'Outcome rank 2 is used 2 times',
			'Open gap "rules" has no paired assumption',
			'Outcome 1 is optional but outranks every required outcome',
		])
	})

	it('never throws for a brief carrying every section', () => {
		const full = buildBrief({
			authority: [reference('AGENTS.md', 'project law')],
			givens: [given('convention', 'indentation', 'tabs')],
			examples: [example('in', 'out', 'note')],
			citations: [
				citation('MDN', 'https://developer.mozilla.org/', 'the native validity behavior'),
			],
			risks: [risk('low', 'drift', 'assert')],
			output: output('diff', { sections: ['a'], include: ['b'], exclude: ['c'] }),
		})
		expect(validateBrief(full).valid).toBe(true)
	})
})

describe('pinBrief and briefToHash', () => {
	it('derives a stable trace and an eight-hex-digit hash', () => {
		const pinned = pinBrief(buildBrief())
		expect(pinned.trace).toBe('refactor/code · outcomes:1 · gaps:0/0 · proofs:1')
		expect(pinned.hash).toMatch(/^[0-9a-f]{8}$/u)
		expect(isBrief(pinned)).toBe(true)
	})

	it('counts blocking gaps against total gaps in the trace', () => {
		const pinned = pinBrief(
			buildBrief({ gaps: [gap('a', 'q', { blocking: true }), gap('b', 'q')] }),
		)
		expect(pinned.trace).toBe('refactor/code · outcomes:1 · gaps:1/2 · proofs:1')
	})

	it('is deterministic across runs and idempotent across pins', () => {
		expect(pinBrief(buildBrief()).hash).toBe(pinBrief(buildBrief()).hash)
		const once = pinBrief(buildBrief())
		expect(pinBrief(once)).toStrictEqual(once)
	})

	it('moves the hash when the content moves', () => {
		expect(pinBrief(buildBrief()).hash).not.toBe(pinBrief(buildBrief({ rules: ['No deps.'] })).hash)
	})

	it('ignores an existing trace and hash when digesting', () => {
		const source = buildBrief()
		expect(briefToHash(source)).toBe(briefToHash(pinBrief(source)))
		expect(briefToHash({ ...source, trace: 'anything', hash: 'deadbeef' })).toBe(
			briefToHash(source),
		)
	})

	it('never mutates its input', () => {
		const source = buildBrief()
		pinBrief(source)
		expect(Object.hasOwn(source, 'trace')).toBe(false)
		expect(Object.hasOwn(source, 'hash')).toBe(false)
	})
})

describe('briefToMarkdown', () => {
	it('renders the title, the task line, and nothing for empty sections', () => {
		const lines = briefToMarkdown(brief(task('review', 'code', 'Review the gate rules.'))).split(
			'\n',
		)
		expect(lines.slice(0, 3)).toStrictEqual([
			'# Brief: Review the gate rules.',
			'',
			'review · code',
		])
		expect(lines).not.toContain('## Authority (ranked)')
		expect(lines).not.toContain('## Manifest')
		expect(lines).not.toContain('## Outcomes')
		expect(lines).toContain('## Output')
	})

	it('renders every populated section in authority order', () => {
		const rendered = briefToMarkdown(
			pinBrief(
				buildBrief({
					authority: [reference('AGENTS.md', 'project law')],
					rules: ['No new dependencies.'],
					invariants: ['Public method names.'],
					assumptions: ['Wording is preserved.'],
					givens: [given('convention', 'indentation', 'tabs')],
					examples: [example('<input required>', 'el.validity', 'the exemplar path')],
					citations: [
						citation('MDN', 'https://developer.mozilla.org/', 'the native validity behavior'),
						citation('WHATWG', 'https://html.spec.whatwg.org/', 'the parsing rules'),
					],
					gaps: [gap('rules', 'Keep the wording?')],
					risks: [risk('medium', 'subtle drift', 'assert in tests')],
					output: output('diff', { include: ['updated useForm.ts'] }),
				}),
			),
		)
		const headings = rendered
			.split('\n')
			.filter((line) => line.startsWith('## '))
			.map((line) => line.slice(3))
		expect(headings).toStrictEqual([
			'Authority (ranked)',
			'Manifest',
			'Outcomes',
			'Rules',
			'Invariants',
			'Assumptions',
			'Givens',
			'Examples',
			'Citations (trust order)',
			'Gaps',
			'Risks',
			'Output',
			'Proofs',
		])
		expect(rendered).toContain('1. AGENTS.md — project law')
		expect(rendered).toContain('### Read')
		expect(rendered).toContain('- AGENTS.md — project law')
		expect(rendered).toContain(
			'- src/browser/composables/useForm.ts — the composable being refactored',
		)
		expect(rendered).toContain('1. useForm uses native FormData with no behavior change (required)')
		expect(rendered).toContain('- convention · indentation: tabs')
		expect(rendered).toContain('- ` <input required> ` → ` el.validity ` (the exemplar path)')
		// The whole row, in field order. Asserting only the heading let the three members be
		// reordered without a red test, which is exactly what happened when `role` became `note`.
		expect(rendered).toContain(
			'1. MDN — the native validity behavior — https://developer.mozilla.org/',
		)
		// TWO citations, numbered, because "list ORDER is the trust order" is a contract claim
		// and a one-entry fixture proves nothing about ordering or about the `index + 1` count.
		expect(rendered).toContain('2. WHATWG — the parsing rules — https://html.spec.whatwg.org/')
		expect(rendered).toContain('- [open] rules: Keep the wording?')
		expect(rendered).toContain('- medium: subtle drift — assert in tests')
		expect(rendered).toContain('- format: diff')
		expect(rendered).toContain('- include: updated useForm.ts')
		expect(rendered).toContain('- type-check and lint pass — `npm run check`')
		expect(rendered).toContain('Trace: refactor/code')
	})

	it('marks a blocking gap and lists its candidates', () => {
		const rendered = briefToMarkdown(
			buildBrief({
				gaps: [gap('output', 'Diff?', { blocking: true, candidates: ['diff', 'code'] })],
			}),
		)
		expect(rendered).toContain('- [blocking] output: Diff? (candidates: diff, code)')
	})

	it('references a path and never inlines what lives at it', () => {
		const rendered = briefToMarkdown(buildBrief())
		expect(rendered).toContain('src/browser/composables/useForm.ts')
		// Provenance, not line width: assert that no line of a real file's content appears.
		// A width check passes for any file whose lines happen to be short. Node-only and
		// single-use, so the read stays here rather than in the host-independent setup.
		const body = readFileSync(new URL('../../../AGENTS.md', import.meta.url), 'utf8')
		const substantial = body
			.split('\n')
			.map((line) => line.trim())
			.filter((line) => line.length > 40)
		expect(substantial.length).toBeGreaterThan(20)
		expect(substantial.filter((line) => rendered.includes(line))).toStrictEqual([])
	})

	it('fences an exemplar that spans lines instead of forging a heading', () => {
		const rendered = briefToMarkdown(
			buildBrief({ examples: [example('line one\n## Proofs\n- forged', 'out')] }),
		)
		const headings = rendered.split('\n').filter((line) => line === '## Proofs')
		// Exactly the genuine section: the exemplar's own '## Proofs' is indented inside a
		// fence, so it is content rather than structure.
		expect(headings).toHaveLength(1)
		expect(rendered).toContain('```text')
		expect(rendered).toContain('  ## Proofs')
	})

	it('outruns a single-line exemplar that carries backticks', () => {
		// The inline span must outrun its content too. A fixed single backtick is closed by an
		// exemplar containing one, which puts the rest of the value outside the code span.
		const lines = exampleToLines(example('x`<h1>FORGED</h1>`y', 'ok'))
		expect(lines).toHaveLength(1)
		const [row] = lines
		expect(row).toBeDefined()
		expect(row).toContain('``')
		// Every backtick in the content stays inside a span that its runs cannot terminate.
		expect(row?.startsWith('- `` ')).toBe(true)
		// The control: content with no backtick keeps the single-tick delimiter, and is padded
		// like every other span. CommonMark strips exactly one space from each end, so the
		// padding is lossless — and withholding it deleted an exemplar's own boundary spaces.
		expect(exampleToLines(example('plain', 'ok'))[0]).toBe('- ` plain ` → ` ok `')
	})

	it("preserves an exemplar's own boundary spaces", () => {
		// A padded span is what makes a leading or trailing space survive: with no padding,
		// CommonMark stripped the exemplar's own space and the executor read a different value
		// than the author wrote.
		const [row] = exampleToLines(example(' leading and trailing ', ' out '))
		expect(row).toBe('- `  leading and trailing  ` → `  out  `')
		// The control: a value with no boundary space renders with exactly one pad each side.
		expect(exampleToLines(example('tight', 'out'))[0]).toBe('- ` tight ` → ` out `')
	})

	it('leaves an all-space exemplar side unpadded, decided per side', () => {
		// CommonMark strips a fully-blank span to nothing rather than one space from each end,
		// so padding INFLATES an all-space value while every other value needs the pad. One
		// side being blank says nothing about the other, so the choice is made per side.
		expect(exampleToLines(example('  ', 'out'))[0]).toBe('- `  ` → ` out `')
		expect(exampleToLines(example('in', ' '))[0]).toBe('- ` in ` → ` `')
		// The control: neither side blank, both padded.
		expect(exampleToLines(example('in', 'out'))[0]).toBe('- ` in ` → ` out `')
	})

	it('renders a CRLF exemplar losslessly, without inventing a blank line', () => {
		// CRLF is ONE break. Splitting on `\r` and `\n` separately turned a plain Windows
		// exemplar into content the caller never wrote.
		const lines = exampleToLines(example('a\r\nb', 'out'))
		const fenced = lines.filter((line) => line.startsWith('  ') && !line.trim().startsWith('`'))
		expect(fenced).toStrictEqual(['  a', '  b', '  out'])
		// The control: a bare LF exemplar renders the same two content lines.
		const bare = exampleToLines(example('a\nb', 'out'))
		expect(
			bare.filter((line) => line.startsWith('  ') && !line.trim().startsWith('`')),
		).toStrictEqual(['  a', '  b', '  out'])
	})

	it('outruns an exemplar that carries its own fence', () => {
		// A fixed three-backtick fence is CLOSED by content containing one, which puts the
		// rest of the exemplar back into the document as structure.
		const rendered = briefToMarkdown(
			buildBrief({ examples: [example('safe\n```\n## Proofs\n- forged', 'out')] }),
		)
		expect(rendered.split('\n').filter((line) => line === '## Proofs')).toHaveLength(1)
		expect(rendered).toContain('````text')
	})

	it('reads each field once, so a shifting getter cannot forge a row', () => {
		// A getter is free to answer differently on each read. Validating the caller's object
		// and then rendering from it read every field twice, so a brief that passed validation
		// rendered a manifest row it does not contain while its dispatch reported a third value.
		let reads = 0
		const shifting = {
			note: 'the leaking pipeline',
			get path() {
				reads += 1
				return reads === 2 ? 'safe.ts\n- forged.ts — forged' : 'safe.ts'
			},
		}
		const source = brief(buildTask(), {
			manifest: manifest({ edit: [shifting] }),
			proofs: [proof('x', 'npm test')],
		})
		// A brief is plain data. `snapshotBrief` refuses an accessor outright rather than
		// reading it, so the shifting getter never gets a second answer to give — the stronger
		// outcome, since rendering safely would still have let the value differ per call.
		expect(() => briefToDispatch(source)).toThrow('cannot be read as one value')
		expect(() => briefToMarkdown(source)).toThrow('cannot be read as one value')
		expect(reads).toBeLessThanOrEqual(2)

		// The control: the same projection over plain data renders and the two halves agree.
		const plain = briefToDispatch(buildBrief())
		expect(plain.edit).toStrictEqual(['src/browser/composables/useForm.ts'])
		expect(plain.prompt).toContain('src/browser/composables/useForm.ts')
	})

	it('refuses to render a brief that never crossed the contract', () => {
		// The builders adopt whatever they are handed, so the single-line contract only binds
		// where a guard runs. The projections are the exit door and validate there.
		const smuggled = brief(buildTask(), {
			manifest: manifest({
				edit: [reference('src/a.ts\n- src/secrets.ts — forged', 'the file under repair')],
			}),
			proofs: [proof('x', 'npm test')],
		})
		expect(() => briefToMarkdown(smuggled)).toThrow('cannot be read as one value')
		expect(() => briefToDispatch(smuggled)).toThrow('cannot be read as one value')
		// The control: the same projection over an on-contract brief renders.
		expect(briefToMarkdown(buildBrief())).toContain('# Brief: ')
	})

	it('renders exactly one manifest row per path the dispatch reports', () => {
		const source = buildBrief()
		const rendered = briefToMarkdown(source)
		const dispatch = briefToDispatch(source)
		const section = rendered.slice(rendered.indexOf('## Manifest'), rendered.indexOf('## Outcomes'))
		const rows = section.split('\n').filter((line) => line.startsWith('- '))
		const paths = [...dispatch.read, ...dispatch.edit, ...dispatch.locked, ...dispatch.forbidden]
		expect(paths).toHaveLength(4)
		expect(rows).toHaveLength(paths.length)
		for (const path of paths) expect(section).toContain(path)
	})
})

describe('assertBrief', () => {
	it('returns the same value by identity once the guard passes', () => {
		const source = pinBrief(buildBrief())
		expect(assertBrief(source)).toBe(source)
	})

	it('throws a narrowable INVALID error for off-contract data', () => {
		const error = captureError(() =>
			assertBrief({ task: { operation: 'plan', domain: 'ops', statement: 'x.' } }),
		)
		expect(isBriefError(error)).toBe(true)
		expect(readErrorCode(error)).toBe('INVALID')
		expect(readErrorContext(error)).toStrictEqual({ field: 'brief' })
	})

	it('throws rather than returning for every adversarial value', () => {
		for (const value of buildAdversarialValues()) {
			expect(() => assertBrief(value)).toThrow('Brief failed the exact-record contract')
		}
	})
})

describe('snapshotBrief', () => {
	it('breaks every alias the caller still holds', () => {
		const outcomes = [outcome(1, 'original')]
		const source = brief(buildTask(), { outcomes, proofs: [proof('x', 'npm test')] })
		const owned = snapshotBrief(source)
		expect(owned.outcomes).not.toBe(outcomes)
		outcomes.push(outcome(2, 'smuggled'))
		expect(owned.outcomes).toHaveLength(1)
		expect(source.outcomes).toHaveLength(2)
	})

	it('freezes the whole tree, not only its root', () => {
		const owned = snapshotBrief(buildBrief())
		expect(Object.isFrozen(owned)).toBe(true)
		expect(Object.isFrozen(owned.outcomes)).toBe(true)
		expect(Object.isFrozen(owned.outcomes[0])).toBe(true)
		expect(Object.isFrozen(owned.manifest)).toBe(true)
		expect(Object.isFrozen(owned.manifest.read[0])).toBe(true)
	})

	it('keeps the hash describing the content it snapshotted', () => {
		const source = buildBrief()
		expect(briefToHash(snapshotBrief(source))).toBe(briefToHash(source))
	})
})

describe('briefToGoal', () => {
	it('renders the proof commands verbatim with the default cap', () => {
		expect(briefToGoal(buildBrief())).toBe(
			'Done when every proof passes: npm run check exits 0. Cap: 16 turns.',
		)
	})

	it('joins several proofs and honours an explicit cap', () => {
		const source = buildBrief({
			proofs: [proof('checks pass', 'npm run check'), proof('tests pass', 'npm run test:src:core')],
		})
		expect(briefToGoal(source, 12)).toBe(
			'Done when every proof passes: npm run check exits 0; npm run test:src:core exits 0. Cap: 12 turns.',
		)
	})

	it('stays total for a brief carrying no proof', () => {
		expect(briefToGoal(buildBrief({ proofs: [] }))).toBe(
			'Done when every proof passes: no proofs recorded. Cap: 16 turns.',
		)
	})
})

describe('briefToDispatch', () => {
	it('maps each partition to its paths and carries the rendered prompt', () => {
		const dispatch = briefToDispatch(buildBrief())
		expect(dispatch.read).toStrictEqual(['AGENTS.md'])
		expect(dispatch.edit).toStrictEqual(['src/browser/composables/useForm.ts'])
		expect(dispatch.locked).toStrictEqual(['src/browser/types.ts'])
		expect(dispatch.forbidden).toStrictEqual(['app/**'])
		// Pinned against the rendering's own observable properties, not re-derived by calling
		// briefToMarkdown again — that would move with any change to the renderer.
		expect(dispatch.prompt.startsWith('# Brief: ')).toBe(true)
		expect(dispatch.prompt).toContain('## Manifest')
		expect(dispatch.prompt).toContain('src/browser/composables/useForm.ts')
	})

	it('carries ranked authority as paths, on its own axis rather than a fifth partition', () => {
		// Every ranked path is granted somewhere, because the gate refuses a brief where one is
		// not. A fixture that skipped that would model a brief `compile` rejects.
		const source = buildBrief({
			authority: [
				reference('src/browser/types.ts', 'the published contract'),
				reference('AGENTS.md', 'project law'),
			],
		})
		expect(findUngrantedAuthority(source)).toStrictEqual([])
		const dispatch = briefToDispatch(source)
		// Rank order, preserved — index 0 wins every conflict, so the order IS the contract.
		// Deliberately not the manifest's order, so a projection that re-sorted would report.
		expect(dispatch.authority).toStrictEqual(['src/browser/types.ts', 'AGENTS.md'])
		// The overlap is by design and now mandatory: the executor must open what it obeys, so
		// every ranked path also sits in a permission set. That is why the arrays are never
		// unioned — here one authority is granted by `locked` and the other by `read`.
		expect(dispatch.read).toStrictEqual(['AGENTS.md'])
		expect(dispatch.locked).toStrictEqual(['src/browser/types.ts'])
		// Every key the interface declares, so a member added later cannot go unasserted.
		expect(Object.keys(dispatch).sort()).toStrictEqual([
			'authority',
			'edit',
			'forbidden',
			'locked',
			'prompt',
			'read',
		])
		// The control: a brief with no authority projects an empty list, not a missing key.
		const bare = briefToDispatch(buildBrief())
		expect(bare.authority).toStrictEqual([])
		expect(Object.hasOwn(bare, 'authority')).toBe(true)
	})

	it('owns exactly manifest.edit', () => {
		const source = buildBrief({ manifest: manifest({ edit: [] }) })
		expect(briefToDispatch(source).edit).toStrictEqual([])
		// Compared against the literal path, not against the same `.map` the source runs.
		expect(briefToDispatch(buildBrief({ manifest: buildManifest() })).edit).toStrictEqual([
			'src/browser/composables/useForm.ts',
		])
	})
})

describe('derivations', () => {
	it('derives one imperative statement from free text', () => {
		expect(deriveStatement('  clean up   useForm ')).toBe('Clean up useForm.')
		expect(deriveStatement('Already done.')).toBe('Already done.')
		expect(deriveStatement('Is it done?')).toBe('Is it done?')
		expect(deriveStatement('   ')).toBe('')
	})

	it('derives a task only through the caller vocabularies', () => {
		const intent = { action: 'migrate', domain: 'code', confidence: 1 }
		expect(
			deriveTask(intent, 'migrate the stores', { migrate: 'migrate' }, { code: 'code' }),
		).toStrictEqual({ operation: 'migrate', domain: 'code', statement: 'Migrate the stores.' })
		expect(deriveTask(intent, 'migrate the stores', {}, { code: 'code' })).toBeUndefined()
		expect(deriveTask(intent, 'migrate the stores', { migrate: 'migrate' }, {})).toBeUndefined()
		expect(deriveTask(intent, '   ', { migrate: 'migrate' }, { code: 'code' })).toBeUndefined()
	})

	it('refuses a mapping reached only through the prototype chain', () => {
		const inherited = buildInheritedActions()
		expect(inherited['migrate']).toBe('migrate')
		expect(
			deriveTask(
				{ action: 'migrate', domain: 'code', confidence: 1 },
				'migrate the stores',
				inherited,
				{ code: 'code' },
			),
		).toBeUndefined()
	})

	it('derives one extracted given per named entity and drops a nameless one', () => {
		expect(
			deriveGivens([
				{ name: 'count', value: 3, provenance: { category: 'extracted' }, confidence: 1 },
				{ name: 'label', value: 'stores', provenance: { category: 'extracted' }, confidence: 1 },
				{ name: '', value: 9, provenance: { category: 'extracted' }, confidence: 1 },
			]),
		).toStrictEqual([
			{ category: 'extracted', name: 'count', value: '3' },
			{ category: 'extracted', name: 'label', value: 'stores' },
		])
		expect(deriveGivens([])).toStrictEqual([])
	})

	it('renders an object value key-order stably', () => {
		const first = deriveGivens([
			{
				name: 'shape',
				value: { b: 1, a: 2 },
				provenance: { category: 'extracted' },
				confidence: 1,
			},
		])
		const second = deriveGivens([
			{
				name: 'shape',
				value: { a: 2, b: 1 },
				provenance: { category: 'extracted' },
				confidence: 1,
			},
		])
		expect(first[0]?.value).toBe(second[0]?.value)
		expect(first[0]?.value).not.toBe('[object Object]')
	})

	it('derives a blocking gap from a required ambiguity and an open one otherwise', () => {
		expect(
			deriveGaps([
				{ field: 'output', question: 'Diff or files?', candidates: ['diff', ''], required: true },
				{
					field: ['nested', 'rules'],
					question: 'Keep the wording?',
					candidates: [],
					required: false,
				},
			]),
		).toStrictEqual([
			{ field: 'output', question: 'Diff or files?', blocking: true, candidates: ['diff'] },
			{ field: 'nested.rules', question: 'Keep the wording?', blocking: false },
		])
	})
})

describe('errorToMessage', () => {
	it('reads an Error message and stringifies anything else', () => {
		expect(errorToMessage(new Error('boom'))).toBe('boom')
		expect(errorToMessage('boom')).toBe('boom')
		expect(errorToMessage(42)).toBe('42')
		expect(errorToMessage(undefined)).toBe('undefined')
	})

	it('is total, because it runs inside the catch that contains a stage failure', () => {
		// Each of these threw before. A throw here escapes `compile` uncontained, from the one
		// function whose job is turning a thrown stage into a recorded failure.
		const throwingMessage: unknown = Object.create(Error.prototype, {
			message: {
				get() {
					throw new Error('the message getter throws')
				},
			},
		})
		const throwingConversion: unknown = {
			toString() {
				throw new Error('conversion throws')
			},
		}
		expect(errorToMessage(throwingMessage)).toBe('an unreadable object was thrown')
		expect(errorToMessage(throwingConversion)).toBe('an unreadable object was thrown')
		expect(errorToMessage(Object.create(null))).toBe('an unreadable object was thrown')
		expect(errorToMessage(Symbol('s'))).toBe('Symbol(s)')
		// The control: a readable value still reports its own message rather than the fallback.
		expect(errorToMessage(new Error('readable'))).toBe('readable')
	})
})

describe('freezeDeep', () => {
	it('freezes what Object.freeze leaves writable', () => {
		const value = { outcomes: [{ rank: 1 }], nested: { deep: { list: [1] } } }
		// The control first: a shallow freeze leaves every nested member writable, which is the
		// defect this helper exists to close.
		const shallow = Object.freeze(structuredClone(value))
		expect(Object.isFrozen(shallow)).toBe(true)
		expect(Object.isFrozen(shallow.outcomes)).toBe(false)

		const owned = freezeDeep(structuredClone(value))
		expect(Object.isFrozen(owned)).toBe(true)
		expect(Object.isFrozen(owned.outcomes)).toBe(true)
		expect(Object.isFrozen(owned.outcomes[0])).toBe(true)
		expect(Object.isFrozen(owned.nested.deep.list)).toBe(true)
	})

	it('terminates on a cycle', () => {
		// `structuredClone` preserves cycles, so a naive walk would not return. Reaching the
		// assertion at all is the proof.
		const cyclic: Record<string, unknown> = { name: 'a' }
		cyclic['self'] = cyclic
		const owned = freezeDeep(cyclic)
		expect(Object.isFrozen(owned)).toBe(true)
		expect(owned['self']).toBe(owned)
	})
})
