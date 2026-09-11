// The consumer-side guides-parity drop-in: runs `@orkestrel/guide`'s checks against
// this repo's own `guides/README.md` manifest. The constants that follow are this
// package's own, as is the executed section that closes the file.

import { GuideCommand } from '@orkestrel/guide/server'
import { readInventory } from '@orkestrel/test/server'
import { createVitest } from 'vitest/node'

/** Every fence language this package's guides are allowed to use. */
const FENCE_LANGUAGES = Object.freeze(['ts'])
/** The fence language whose blocks count as worked examples. */
const EXAMPLE_LANGUAGE = 'ts'
/** The package identity that binds its manifest, module map, and README pitch. */
const PACKAGE_NAME = '@orkestrel/brief'
/** The one guide this package sources, whose tagline the README pitch equals. */
const GUIDE_SPEC = 'guides/brief.md'
/** Each import specifier this package's own guides may resolve against. */
const MODULES = Object.freeze({ [PACKAGE_NAME]: 'src/core', '@src/core': 'src/core' })
/**
 * Declarations deliberately kept out of the barrel, as `computeSymbolKey` strings.
 *
 * A class that one-class-per-file evicted from its single consumer cannot become a
 * local, so it stays exported without being public. Naming it here is what makes that
 * intentional rather than forgotten — and the assertion that follows it fails when a name
 * here stops being stranded, so the list cannot rot.
 */
const INTERNAL: readonly string[] = Object.freeze([])

/**
 * Names this package's TSDoc points at on purpose and does not own: dependency exports it
 * tells a reader to reach for directly, and platform intrinsics it names. Every other
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

await new GuideCommand({
	root: new URL('../', import.meta.url),
	patterns: ['src/**/*.ts', 'tests/**/*.ts', 'guides/*.md', '*.md', 'package.json'],
	modules: MODULES,
	languages: FENCE_LANGUAGES,
	language: EXAMPLE_LANGUAGE,
	reader: readInventory,
	runner: createVitest,
}).execute(async ({ files, report, rows }) => {
	const { isRecord, parseJSON } = await import('@orkestrel/contract')
	const {
		computeSymbolKey,
		createSourceManager,
		extractDeclaration,
		extractFenceImports,
		findMissing,
		findMissingSymbols,
		findUnexampled,
		isExternalLink,
		resolveLink,
	} = await import('@orkestrel/guide')
	const { requireValue } = await import('@orkestrel/test')
	const {
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
		createBriefManager,
		findBlockingGaps,
		findManifestOverlaps,
		findUngrantedAuthority,
		findUnpairedGaps,
		INTERPRETATION_MEMBERS,
		pinBrief,
		validateBrief,
	} = await import('@src/core')
	const { describe, expect, it } = await import('vitest')
	const sources = createSourceManager({ files, modules: MODULES })
	const own = requireValue(
		rows.find((row) => row.entry.spec === GUIDE_SPEC),
		`Missing manifest row: ${GUIDE_SPEC}`,
	)
	const manifest = parseJSON(requireValue(files['package.json'], 'Missing inventory: package.json'))
	if (!isRecord(manifest)) throw new Error('Invalid package manifest: package.json')

	it('manifest lists at least one guide', () => {
		expect(report.input).toEqual([])
		expect(rows.length).toBeGreaterThan(0)
		expect(own.entry.spec).toBe(GUIDE_SPEC)
	})

	// The example half of the equality case is silent over an empty population: with no
	// title on both sides `findDrift` compares no pair and the case passes on the summaries
	// alone. This pins the population this repository's own guide contributes, so removing
	// every `@example` title reddens the suite instead of quietly retiring half the gate.
	// The failure names both title sets, because a pin reporting only its own emptiness
	// leaves the reader to work out which side dropped the title.
	it('pairs at least one example title across the guide and the source', () => {
		expect(report.examples.titles.filter((finding) => finding.spec === GUIDE_SPEC)).toEqual([])
	})

	// The README's pitch and the guide's tagline are one text, each read as the blockquote
	// under its file's H1. `README.md` is outside the concept index, so the reader is
	// applied to it directly rather than through a manifest row. Each side is guarded
	// against `undefined` first, so a file that lost its blockquote reports that rather
	// than reporting missing blockquotes as agreement.
	it('opens the README with the guide tagline', () => {
		expect(manifest.name).toBe(PACKAGE_NAME)
		expect(report.pitch).toEqual([])
	})

	it('reads a real inventory covering the documented source', () => {
		expect(Object.keys(files)).toContain('src/core/index.ts')
		expect(Object.keys(files)).toContain(GUIDE_SPEC)
		// The instrument must be able to report absence, not only presence.
		expect(Object.keys(files)).not.toContain('src/core/absent.ts')
	})

	for (const { entry, guide, source } of rows) {
		describe(`${entry.concept}`, () => {
			it('uses only listed fence languages', () => {
				expect(report.fences.filter((finding) => finding.spec === entry.spec)).toEqual([])
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
			// and names the guide and source; converge them with `npm run test:guides`, never by
			// weakening this assertion. `findDrift` pairs an example only where a title is
			// present on both sides, so an untitled `@example` block is outside this case. Each
			// collected line is the spec, the key, and each side's text or `absent` — the same
			// worklist `npm run test:guides` prints, so a failure here is read the way that command's
			// output is.
			it('keeps every compared summary and example equal to its source', () => {
				expect(report.drift.filter((finding) => finding.spec === entry.spec)).toEqual([])
			})

			it('documents an example for every Surface function', () => {
				expect(report.examples.functions.filter((finding) => finding.spec === entry.spec)).toEqual(
					[],
				)
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
				expect(
					findMissingSymbols([{ name: 'Phantom', keyword: 'class' }], source.surface()),
				).toEqual(['class Phantom'])
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
							buildReference(
								'src/browser/composables/useForm.ts',
								'the composable being refactored',
							),
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

		it('runs the blocking path fence and yields the readings its comments claim', () => {
			const blocked = createBriefCompiler()
			const stopped = blocked.compile({
				task: buildTask('refactor', 'code', 'Refactor the session store to the async seam.'),
				outcomes: [buildOutcome(1, 'the store implements the async seam')],
				gaps: [
					buildGap('output', 'Does the result need to land as a diff or as full files?', {
						blocking: true,
						candidates: ['diff', 'code'],
					}),
				],
				proofs: [buildProof('checks pass', 'npm run check')],
			})
			// Each assertion following is a documented `// value` comment from the blocking path fence.
			expect(stopped.brief).toBeUndefined()
			// `toEqual`, not `toStrictEqual`: a gap the compiler emits carries a null prototype, so a
			// prototype-sensitive matcher reports two records with no visual difference as unequal.
			expect(stopped.questions).toEqual([
				{
					field: 'output',
					question: 'Does the result need to land as a diff or as full files?',
					blocking: true,
					candidates: ['diff', 'code'],
				},
			])
			expect(stopped.questions.length).toBe(1)
			expect(stopped.failures).toEqual([
				{ stage: 'gate', code: 'BLOCKED', message: '1 blocking gap(s)' },
			])
			expect(stopped.verdict?.rules.filter((entry) => !entry.applied).length).toBeGreaterThan(0)
			blocked.destroy()
		})

		it('runs the identity fence and mints one record for repeated content', () => {
			const store = createBriefManager()
			const first = store.add(
				buildBrief(buildTask('plan', 'ops', 'Plan the 0.1 release.'), {
					outcomes: [buildOutcome(1, 'the layer order is written down')],
					proofs: [buildProof('the catalog regenerates', 'npx @orkestrel/scaffold catalog')],
				}),
			)
			// The section's own claim: the same content mints the same id and moves no version.
			const again = store.add(first.brief)
			expect(again.id).toBe(first.id)
			expect(again.version).toBe(1)
			expect(store.count).toBe(1)
			store.destroy()
		})
	})
})
