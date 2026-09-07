// The consumer-side guides-parity drop-in: runs `@orkestrel/guide`'s checks against
// this repo's own `guides/README.md` manifest. The constants that follow are this
// package's own, and are the only part a sibling package changes.

import { describe, expect, it } from 'vitest'
import {
	computeSymbolKey,
	createGuide,
	createSource,
	createSourceManager,
	extractDeclaration,
	extractFenceImports,
	findDrift,
	findMissing,
	findMissingSymbols,
	findUnexampled,
	findUnlisted,
	isExternalLink,
	parseManifest,
	resolveLink,
} from '@orkestrel/guide'
import { readFileSync } from 'node:fs'
import { requireValue } from '@orkestrel/test'
import { readInventory } from '@orkestrel/test/server'
import {
	briefToDispatch,
	briefToGoal,
	briefToHash,
	briefToMarkdown,
	buildBrief,
	buildCitation,
	buildExample,
	buildGap,
	buildGateDefinition,
	buildGiven,
	buildManifest,
	buildOutcome,
	buildOutput,
	buildProof,
	buildReference,
	buildRisk,
	buildTask,
	createBriefCompiler,
	findBlockingGaps,
	findManifestOverlaps,
	findUngrantedAuthority,
	findUnpairedGaps,
	INTERPRETATION_MEMBERS,
	pinBrief,
	validateBrief,
} from '@src/core'

/** Every fence language this package's guides are allowed to use. */
const FENCE_LANGUAGES = Object.freeze(['ts'])
/** The fence language whose blocks count as worked examples. */
const EXAMPLE_LANGUAGE = 'ts'
/** The one guide this package sources, whose tagline the README pitch equals. */
const GUIDE_SPEC = 'guides/brief.md'
/** Each import specifier this package's own guides may resolve against. */
const MODULES = Object.freeze({ '@orkestrel/brief': 'src/core', '@src/core': 'src/core' })
/**
 * Declarations deliberately kept out of the barrel, as `computeSymbolKey` strings.
 *
 * A class that one-class-per-file evicted from its single consumer cannot become a
 * local, so it stays exported without being public. Naming it here is what makes that
 * intentional rather than forgotten — and the assertion that follows it fails when a name
 * here stops being stranded, so the list cannot rot.
 */
const INTERNAL: readonly string[] = Object.freeze([])

/** Root-level files these checks read. `readInventory` walks directories only. */
const ROOT_FILES = Object.freeze(['AGENTS.md', 'README.md'])

/**
 * Names this package's TSDoc points at on purpose and does not own: dependency exports it
 * tells a reader to reach for directly, and platform intrinsics it names. Every OTHER
 * camelCase name in a `src/` TSDoc must resolve to a real export of this barrel — the list
 * is an enumerated exemption, so adding to it is a deliberate act rather than a silent one.
 */
const FOREIGN: readonly string[] = [
	// @orkestrel/contract
	'cloneJSONRecord',
	'parseEnum',
	'schemaToParameters',
	'stringShape',
	// @orkestrel/interpret
	'classifyIntent',
	'createInterpret',
	'digestValue',
	// @orkestrel/reason
	'createReason',
	'formatField',
	// platform
	'lastIndex',
	'structuredClone',
]

const root = new URL('../', import.meta.url)
const files: Record<string, string> = {
	...readInventory(root, ['src', 'guides', 'tests'], { extensions: ['.ts', '.md'] }),
}
for (const name of ROOT_FILES) files[name] = readFileSync(new URL(name, root), 'utf8')
const manifest = parseManifest(
	requireValue(files['guides/README.md'], 'Missing file: guides/README.md'),
	'guides',
)
const sources = createSourceManager({ files, modules: MODULES })
const own = requireValue(
	manifest.find((entry) => entry.spec === GUIDE_SPEC),
	`Missing manifest row: ${GUIDE_SPEC}`,
)

it('manifest lists at least one guide', () => {
	expect(manifest.length).toBeGreaterThan(0)
})

it('reads a real inventory covering the documented source', () => {
	expect(Object.keys(files)).toContain('src/core/index.ts')
	expect(Object.keys(files)).toContain(GUIDE_SPEC)
	// The instrument must be able to report absence, not only presence.
	expect(Object.keys(files)).not.toContain('src/core/absent.ts')
})

// The example half of the equality case is silent over an empty population: with no
// title on both sides `findDrift` compares no pair and the case passes on the summaries
// alone. This pins the population this repository's own guide contributes, so removing
// every `@example` title reddens the suite instead of quietly retiring half the gate.
// The failure names both title sets, because a pin reporting only its own emptiness
// leaves the reader to work out which side dropped the title.
it('pairs at least one example title across the guide and the source', () => {
	const guide = createGuide(requireValue(files[GUIDE_SPEC], `Missing file: ${GUIDE_SPEC}`))
	const source = createSource({ files, module: own.source })
	const declared = source
		.examples()
		.map((example) => example.title)
		.filter((title) => title !== undefined)
	const titled = new Set(declared)
	const headings: string[] = []
	const paired: string[] = []
	for (const fence of guide.fences()) {
		if (fence.title === undefined) continue
		headings.push(fence.title)
		if (titled.has(fence.title)) paired.push(fence.title)
	}
	const unpaired =
		paired.length > 0
			? []
			: [
					`${GUIDE_SPEC} pairs: guide ${JSON.stringify(headings)} source ${JSON.stringify(declared)}`,
				]
	expect(unpaired).toEqual([])
})

// The README's pitch and the guide's tagline are one text, each read as the blockquote
// under its file's H1. `README.md` is outside the concept index, so the reader is
// applied to it directly rather than through a manifest row. Each side is guarded
// against `undefined` first, so a file that lost its blockquote reports that rather
// than reporting two absences as agreement.
it('opens the README with the guide tagline', () => {
	const pitch = createGuide(requireValue(files['README.md'], 'Missing file: README.md')).tagline()
	const tagline = createGuide(
		requireValue(files[GUIDE_SPEC], `Missing file: ${GUIDE_SPEC}`),
	).tagline()

	expect(pitch).not.toBeUndefined()
	expect(tagline).not.toBeUndefined()
	expect(pitch).toBe(tagline)
})

for (const entry of manifest) {
	const guide = createGuide(requireValue(files[entry.spec], `Missing file: ${entry.spec}`))
	const source = createSource({ files, module: entry.source })

	describe(`${entry.concept}`, () => {
		it('uses only listed fence languages', () => {
			expect(findUnlisted(guide.fences(), FENCE_LANGUAGES)).toEqual([])
		})

		it('extracts a non-empty documented surface', () => {
			expect(guide.surface().length).toBeGreaterThan(0)
		})
		it('re-exports every direct declaration that is not named internal', () => {
			const stranded = findMissingSymbols(source.exports(), source.surface())
			expect(stranded.filter((key) => !INTERNAL.includes(key))).toEqual([])
		})
		it('names no symbol internal that the barrel already exports', () => {
			const stranded = findMissingSymbols(source.exports(), source.surface())
			expect(INTERNAL.filter((key) => !stranded.includes(key))).toEqual([])
		})
		it('re-exports only direct declarations', () => {
			expect(findMissingSymbols(source.surface(), source.exports())).toEqual([])
		})
		it('documents every barrel export', () => {
			expect(findMissingSymbols(source.surface(), guide.surface())).toEqual([])
		})
		it('documents only barrel exports', () => {
			expect(findMissingSymbols(guide.surface(), source.surface())).toEqual([])
		})

		it('exposes no hidden module-scope declarations', () => {
			expect(source.hidden().map(computeSymbolKey)).toEqual([])
		})

		for (const group of guide.methods()) {
			const members = source.methods(group.interface).map((method) => method.name)
			const documented = group.methods.map((method) => method.name)
			const entity = group.interface.replace(/Interface$/, '')
			describe(`${group.interface}`, () => {
				it('documents at least one method', () => {
					expect(group.methods.length).toBeGreaterThan(0)
				})
				it('documents every interface method', () => {
					expect(findMissing(members, documented)).toEqual([])
				})
				it('documents no phantom method', () => {
					expect(findMissing(documented, members)).toEqual([])
				})
				it(`${entity} exposes no undocumented method`, () => {
					const extra =
						entity === group.interface
							? []
							: findMissing(
									source.methods(entity).map((method) => method.name),
									documented,
								)
					expect(extra).toEqual([])
				})
			})
		}

		// The equality gate: a `Summary` cell against its export's description paragraph, a
		// titled fence against the `@example` of that title. `findDrift` owns the comparison
		// and names both sides; converge the two sides with `npm run docs`, never by
		// weakening this assertion. `findDrift` pairs an example only where a title is
		// present on both sides, so an untitled `@example` block is outside this case. Each
		// collected line is the spec, the key, and each side's text or `absent` — the same
		// worklist `npm run docs` prints, so a failure here is read the way that command's
		// output is.
		it('keeps every compared summary and example equal to its source', () => {
			const disagreeing: string[] = []
			for (const drift of findDrift(guide, source)) {
				const left = drift.guide === undefined ? 'absent' : JSON.stringify(drift.guide)
				const right = drift.source === undefined ? 'absent' : JSON.stringify(drift.source)
				disagreeing.push(`${entry.spec} ${drift.key}: guide ${left} source ${right}`)
			}
			expect(disagreeing).toEqual([])
		})

		it('documents an example for every Surface function', () => {
			const fences = guide
				.fences()
				.filter((fence) => fence.language === EXAMPLE_LANGUAGE)
				.map((fence) => fence.code)
			const names = guide
				.surface()
				.filter((symbol) => symbol.keyword === 'function')
				.map((symbol) => symbol.name)
			expect(
				findUnexampled(
					names,
					fences,
					source.examples().map((example) => example.name),
				),
			).toEqual([])
		})

		for (const group of guide.methods()) {
			const entity = group.interface.replace(/Interface$/, '')
			const documented = group.methods.map((method) => method.name)
			const examples =
				entity === group.interface
					? source.examples(group.interface).map((example) => example.name)
					: source
							.examples(group.interface)
							.map((example) => example.name)
							.concat(source.examples(entity).map((example) => example.name))
			describe(`${group.interface} examples`, () => {
				it('documents an example for every method', () => {
					const fences = guide
						.fences()
						.filter((fence) => fence.language === EXAMPLE_LANGUAGE)
						.map((fence) => fence.code)
					expect(findUnexampled(documented, fences, examples)).toEqual([])
				})
			})
		}

		it('imports only real exports in every ```ts fence', () => {
			const fences = guide.fences().filter((fence) => fence.language === EXAMPLE_LANGUAGE)
			for (const fence of fences) {
				for (const { specifier, names } of extractFenceImports(fence.code)) {
					const imported = sources.source(specifier)
					if (imported === undefined) continue
					const surface = imported.surface().map((symbol) => symbol.name)
					expect(findMissing(names, surface)).toEqual([])
				}
			}
		})

		it('resolves every relative link', () => {
			const broken = guide
				.links()
				.filter((href) => !isExternalLink(href))
				.map((href) => resolveLink(entry.spec, href))
				.filter((path) => !source.exists(path))
			expect(broken).toEqual([])
		})
		it('links only to test files that exist', () => {
			const missing = guide
				.tests()
				.map((href) => resolveLink(entry.spec, href))
				.filter((path) => !source.exists(path))
			expect(missing).toEqual([])
		})

		// The non-vacuousness guards for this package's own populations: an extraction that
		// came back empty would satisfy every `toEqual([])` assertion in this block.
		it('extracts every named section and a non-empty comparable population', () => {
			expect(guide.sections()).toContain('Surface')
			expect(guide.sections()).toContain('Methods')
			expect(guide.sections()).toContain('Tests')
			expect(source.surface().length).toBeGreaterThan(0)
			expect(guide.methods().length).toBeGreaterThan(0)
			expect(
				guide.fences().filter((fence) => fence.language === EXAMPLE_LANGUAGE).length,
			).toBeGreaterThan(0)
			expect(guide.links().filter((href) => !isExternalLink(href)).length).toBeGreaterThan(0)
			expect(guide.tests().length).toBeGreaterThan(0)
		})

		it('reports a symbol the barrel does not carry', () => {
			// The control for the surface comparison: a name outside the population it covers.
			expect(findMissingSymbols([{ name: 'Phantom', keyword: 'class' }], source.surface())).toEqual(
				['class Phantom'],
			)
			const [first] = source.surface()
			if (first === undefined) throw new Error('the barrel surface is empty')
			expect(
				findMissingSymbols(
					[{ name: first.name, keyword: first.keyword === 'const' ? 'class' : 'const' }],
					source.surface(),
				),
			).toHaveLength(1)
		})

		it('reports a function no fence and no source example demonstrates', () => {
			// The control for the example check: a name nothing documents must come back unexampled.
			const fences = guide
				.fences()
				.filter((fence) => fence.language === EXAMPLE_LANGUAGE)
				.map((fence) => fence.code)
			expect(
				findUnexampled(
					['neverDocumented'],
					fences,
					source.examples().map((example) => example.name),
				),
			).toEqual(['neverDocumented'])
		})

		it('reads every member of a documented options interface off its own owner', () => {
			// The gap this closes: the surface comparison reads export NAMES and the methods
			// comparison reads call signatures, so a dead member of an options interface —
			// declared, documented as live, read by nothing — passes every other check here.
			const types = files['src/core/types.ts']
			if (types === undefined) throw new Error('src/core/types.ts is not in the inventory')

			const options = guide
				.surface()
				.filter((symbol) => symbol.keyword === 'interface' && symbol.name.endsWith('Options'))
				.map((symbol) => symbol.name)
			expect(options.length).toBeGreaterThan(0)

			// Scoped to the OWNING file, not the whole tree. Searching every source at once let
			// `BriefManagerOptions.on` be satisfied by `BriefCompiler`'s own `options.on`, so a member
			// could go dead in one class while its namesake stayed live in the other.
			// Coverage: this proves each member is read off an options parameter IN ITS OWNER, not
			// that the value read is honoured.
			const dead: string[] = []
			for (const name of options) {
				const owner = `src/core/${name.replace(/Options$/, '')}.ts`
				const body = files[owner]
				expect({ interface: name, owner, found: body !== undefined }).toEqual({
					interface: name,
					owner,
					found: true,
				})
				const members = extractDeclaration(types, 'interface', name)?.body ?? []
				expect(members.length).toBeGreaterThan(0)
				for (const member of members) {
					const match = /^\s*readonly\s+([A-Za-z_][A-Za-z0-9_]*)\??:/.exec(member)
					const key = match?.[1]
					if (key === undefined || body === undefined) continue
					if (!new RegExp(`\\boptions\\??\\.${key}\\b`).test(body)) dead.push(`${name}.${key}`)
				}
			}
			expect(dead).toEqual([])
		})

		it('reports an options member no owner reads', () => {
			// The control: a member no source file mentions must be reported, or the preceding check
			// is satisfied by every interface it will ever read.
			const invented =
				'export interface PhantomOptions {\n\treadonly neverReadAnywhere?: number\n}\n'
			const members = extractDeclaration(invented, 'interface', 'PhantomOptions')?.body ?? []
			expect(members).toHaveLength(1)

			const consumers = Object.entries(files)
				.filter(([key]) => key.startsWith('src/') && key !== 'src/core/types.ts')
				.map(([, body]) => body)
				.join('\n')

			// Run the real detection over the invented member: it must come back dead.
			const dead: string[] = []
			for (const member of members) {
				const match = /^\s*readonly\s+([A-Za-z_][A-Za-z0-9_]*)\??:/.exec(member)
				const key = match?.[1]
				if (key === undefined) continue
				if (!new RegExp(`\\boptions\\??\\.${key}\\b`).test(consumers)) dead.push(key)
			}
			expect(dead).toEqual(['neverReadAnywhere'])

			// And the sharper control: the exact member this package once shipped dead. Its name
			// DOES occur in the source as another function's parameter, so a bare-name check
			// passes here and this one must not.
			expect(/\bturns\b/.test(consumers)).toBe(true)
			expect(/\boptions\??\.turns\b/.test(consumers)).toBe(false)
		})

		it('resolves every package symbol a source TSDoc backticks', () => {
			// The gap this closes: the surface comparison reads the GUIDE's backticked names
			// against the barrel and never the TSDoc beside the code. A renamed export left
			// `createBrief` in a published `.d.ts`, so every consumer's hover named a symbol they
			// could not import.
			const names = new Set(source.surface().map((symbol) => symbol.name))
			expect(names.size).toBeGreaterThan(60)
			const stale: string[] = []
			for (const [key, body] of Object.entries(files)) {
				if (!key.startsWith('src/')) continue
				for (const line of body.split('\n')) {
					if (!line.trimStart().startsWith('*')) continue
					// Any camelCase name carrying an internal capital. A hardcoded prefix family
					// missed `ownRead` when that export was removed — the exact defect this exists
					// for. Coverage: an all-lowercase single word (`task`, `gap`, `role`) is skipped,
					// because those are ordinary prose here and shape cannot tell them apart.
					for (const match of line.matchAll(/`([a-z][A-Za-z0-9]*[A-Z][A-Za-z0-9]*)`/g)) {
						const symbol = match[1]
						if (symbol === undefined) continue
						if (FOREIGN.includes(symbol)) continue
						if (!names.has(symbol)) stale.push(`${key}: ${symbol}`)
					}
				}
			}
			expect(stale).toEqual([])
		})

		it('reports a TSDoc identifier the barrel does not export', () => {
			// The control: a name matching the family pattern that the barrel does not export.
			const names = new Set(source.surface().map((symbol) => symbol.name))
			expect(names.has('createBrief')).toBe(false)
			expect(/^(assert|brief|create)/.test('createBrief')).toBe(true)
			expect(names.has('assertBrief')).toBe(true)
		})
	})
}

// The parity checks earlier in this file prove every backticked NAME in the guide resolves to a
// real export. They cannot prove a `// value` comment beside a call is true, because they never
// run one — so a fence documenting a value the code contradicts shipped green. It did:
// strengthening the `granted` rule made the guide's own headline example refuse at the gate, and
// every parity assertion stayed passing. These tests transcribe the guide's flagship fences
// and assert the values their comments claim. Change a fence, change the test beside it.
describe('flagship fences', () => {
	it('captures the optional Interpretation members the constants fence claims', () => {
		// Transcribes the guide's `INTERPRETATION_MEMBERS.includes('subject')` fence: the optional
		// members are captured too, so the claim is executed here rather than merely printed there.
		expect(INTERPRETATION_MEMBERS.includes('subject')).toBe(true)
		expect(INTERPRETATION_MEMBERS.includes('definition')).toBe(true)
	})

	it("runs the ## Surface fence and yields the 'true' it documents", () => {
		const compiler = createBriefCompiler()
		const briefing = compiler.compile({
			task: buildTask('refactor', 'code', 'Refactor useForm to native browser form APIs.'),
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
			outcomes: [buildOutcome(1, 'useForm uses native FormData with no behavior change')],
			proofs: [buildProof('type-check and lint pass', 'npm run check')],
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
		const draft = buildBrief(
			buildTask('refactor', 'code', 'Refactor useForm to native browser form APIs.'),
			{
				authority: [buildReference('AGENTS.md', 'project law; wins every conflict')],
				manifest: buildManifest({
					read: [
						buildReference('AGENTS.md', 'project law; wins every conflict'),
						buildReference('guides/browser.md', 'the composable contract'),
					],
					edit: [
						buildReference('src/browser/composables/useForm.ts', 'the composable being refactored'),
					],
					locked: [buildReference('src/browser/types.ts', 'the published contract')],
					forbidden: [buildReference('app/**', 'out of scope')],
				}),
				outcomes: [
					buildOutcome(1, 'useForm uses native FormData with no behavior change'),
					buildOutcome(2, 'tests cover the changed code paths'),
				],
				rules: ['Add no dependencies.'],
				invariants: ['useForm public method names and signatures in types.ts.'],
				givens: [buildGiven('convention', 'indentation', 'tabs')],
				examples: [buildExample('<input required>', 'validity read from el.validity')],
				assumptions: ['Validation message wording is preserved.'],
				citations: [
					buildCitation(
						'MDN Constraint Validation',
						'https://developer.mozilla.org/',
						'the native validity behavior being adopted',
					),
				],
				gaps: [buildGap('rules', 'Does validation message wording need to change?')],
				risks: [
					buildRisk(
						'medium',
						'native validation differs subtly',
						'assert message and state in tests',
					),
				],
				output: buildOutput('diff', { include: ['updated useForm.ts'] }),
				proofs: [buildProof('type-check and lint pass', 'npm run check')],
			},
		)
		expect(draft.task).toStrictEqual({
			operation: 'refactor',
			domain: 'code',
			statement: 'Refactor useForm to native browser form APIs.',
		})
		expect(draft.authority).toStrictEqual([
			{ path: 'AGENTS.md', note: 'project law; wins every conflict' },
		])
		expect(draft.manifest).toStrictEqual({
			read: [
				{ path: 'AGENTS.md', note: 'project law; wins every conflict' },
				{ path: 'guides/browser.md', note: 'the composable contract' },
			],
			edit: [
				{ path: 'src/browser/composables/useForm.ts', note: 'the composable being refactored' },
			],
			locked: [{ path: 'src/browser/types.ts', note: 'the published contract' }],
			forbidden: [{ path: 'app/**', note: 'out of scope' }],
		})
		expect(draft.outcomes).toStrictEqual([
			{
				rank: 1,
				text: 'useForm uses native FormData with no behavior change',
				required: true,
			},
			{ rank: 2, text: 'tests cover the changed code paths', required: true },
		])
		expect(draft.rules).toStrictEqual(['Add no dependencies.'])
		expect(draft.invariants).toStrictEqual([
			'useForm public method names and signatures in types.ts.',
		])
		expect(draft.givens).toStrictEqual([
			{ category: 'convention', name: 'indentation', value: 'tabs' },
		])
		expect(draft.examples).toStrictEqual([
			{ input: '<input required>', output: 'validity read from el.validity' },
		])
		expect(draft.assumptions).toStrictEqual(['Validation message wording is preserved.'])
		expect(draft.citations).toStrictEqual([
			{
				name: 'MDN Constraint Validation',
				url: 'https://developer.mozilla.org/',
				note: 'the native validity behavior being adopted',
			},
		])
		expect(draft.gaps).toStrictEqual([
			{
				field: 'rules',
				question: 'Does validation message wording need to change?',
				blocking: false,
			},
		])
		expect(draft.risks).toStrictEqual([
			{
				severity: 'medium',
				text: 'native validation differs subtly',
				mitigation: 'assert message and state in tests',
			},
		])
		expect(draft.output).toStrictEqual({ format: 'diff', include: ['updated useForm.ts'] })
		expect(draft.proofs).toStrictEqual([
			{ text: 'type-check and lint pass', command: 'npm run check' },
		])
		expect(draft.output.format).toBe('diff')
		expect(draft.trace).toBeUndefined()
		expect(draft.hash).toBeUndefined()
		expect(buildGateDefinition().rules.length).toBe(7)
		const pinned = pinBrief(draft)
		// Each assertion following is a documented `// value` comment from `### Helpers`.
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
