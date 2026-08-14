// The guides-parity gate. Every check reduces to `expect([]).toEqual([])`, each paired with
// a non-vacuousness guard so a renamed heading fails loudly instead of passing on an empty
// extraction.

import { globSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
	createGuide,
	createSource,
	createSourceManager,
	declarationBody,
	fenceImports,
	findMissing,
	findUnexampled,
	findUnlisted,
	isExternalLink,
	missingSymbols,
	parseManifest,
	resolveLink,
} from '@orkestrel/guide'
import { describe, expect, it } from 'vitest'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** The fence languages this package documents examples in. */
const LANGUAGES: readonly string[] = ['ts']

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
	'createInterpret',
	'digestValue',
	// @orkestrel/reason
	'createReason',
	'formatField',
	// platform
	'lastIndex',
	'structuredClone',
]

/** Every published specifier this package answers to, mapped to the module behind it. */
const SPECIFIERS: Readonly<Record<string, string>> = { '@orkestrel/brief': 'src/core' }

/** The globs whose files and ancestor directories form the reflection inventory. */
const INVENTORY_GLOBS: readonly string[] = [
	'src/**/*.ts',
	'tests/**/*.ts',
	'configs/**/*.ts',
	'guides/*.md',
	'*.md',
]

// Node-only and single-use: the guides project is the only proof that needs an on-disk
// inventory, and `tests/setup.ts` is host-independent, so this stays with its proof.
function readInventory(): Readonly<Record<string, string>> {
	const files: Record<string, string> = {}
	for (const raw of globSync([...INVENTORY_GLOBS], { cwd: ROOT })) {
		const key = raw.replaceAll('\\', '/')
		files[key] = readFileSync(resolve(ROOT, key), 'utf8')
		let parent = dirname(key).replaceAll('\\', '/')
		while (parent !== '.' && parent !== '' && parent !== '/') {
			files[parent] ??= ''
			parent = dirname(parent).replaceAll('\\', '/')
		}
	}
	return files
}

const FILES = readInventory()
const MANIFEST = parseManifest(readFileSync(resolve(ROOT, 'guides/README.md'), 'utf8'), 'guides')

describe('guides manifest', () => {
	it('lists at least one documented concept', () => {
		expect(MANIFEST.length).toBeGreaterThan(0)
	})

	it('reads a real inventory covering the documented source', () => {
		expect(Object.keys(FILES)).toContain('src/core/index.ts')
		expect(Object.keys(FILES)).toContain('src/core')
		expect(Object.keys(FILES)).toContain('guides/brief.md')
		// The instrument must be able to report absence, not only presence.
		expect(Object.keys(FILES)).not.toContain('src/core/absent.ts')
	})
})

describe.each(MANIFEST)('$concept', (entry) => {
	const guide = createGuide(readFileSync(resolve(ROOT, entry.spec), 'utf8'))
	const source = createSource({ files: FILES, module: entry.source })
	const sources = createSourceManager({ files: FILES, modules: SPECIFIERS })
	const fences = guide
		.fences()
		.filter((fence) => fence.language === 'ts')
		.map((fence) => fence.code)

	it('NV — the guide extracts a non-empty surface and named sections', () => {
		expect(guide.surface().length).toBeGreaterThan(0)
		expect(guide.sections()).toContain('Surface')
		expect(guide.sections()).toContain('Methods')
		expect(guide.sections()).toContain('Tests')
		expect(source.surface().length).toBeGreaterThan(0)
		expect(fences.length).toBeGreaterThan(0)
	})

	it('SB — direct declarations and the barrel surface agree', () => {
		expect(missingSymbols(source.exports(), source.surface())).toStrictEqual([])
		expect(missingSymbols(source.surface(), source.exports())).toStrictEqual([])
	})

	it('SB — the barrel surface and the guide surface agree', () => {
		expect(missingSymbols(source.surface(), guide.surface())).toStrictEqual([])
		expect(missingSymbols(guide.surface(), source.surface())).toStrictEqual([])
	})

	it('SB — the comparison can report a difference', () => {
		expect(missingSymbols([{ name: 'Phantom', kind: 'class' }], source.surface())).toStrictEqual([
			'class Phantom',
		])
		const [first] = source.surface()
		if (first === undefined) throw new Error('the barrel surface is empty')
		expect(
			missingSymbols(
				[{ name: first.name, kind: first.kind === 'const' ? 'class' : 'const' }],
				source.surface(),
			),
		).toHaveLength(1)
	})

	it('EX — every documented export declares no hidden module-scope declaration', () => {
		expect(source.hidden()).toStrictEqual([])
	})

	it('MB — every documented interface matches its members and its class', () => {
		const groups = guide.methods()
		expect(groups.length).toBeGreaterThan(0)
		for (const group of groups) {
			expect(group.methods.length).toBeGreaterThan(0)
			const declared = source.methods(group.interface)
			expect(declared.length).toBeGreaterThan(0)
			expect(findMissing(group.methods, declared)).toStrictEqual([])
			expect(findMissing(declared, group.methods)).toStrictEqual([])
			const implementation = group.interface.replace(/Interface$/u, '')
			expect(findMissing(source.methods(implementation), group.methods)).toStrictEqual([])
		}
	})

	it('LI — every internal link resolves to a real path', () => {
		const targets = guide
			.links()
			.filter((href) => !isExternalLink(href))
			.map((href) => resolveLink(entry.spec, href))
		expect(targets.length).toBeGreaterThan(0)
		expect(targets.filter((target) => !source.exists(target))).toStrictEqual([])
	})

	it('TE — every declared test link resolves to a real file', () => {
		const targets = guide.tests().map((href) => resolveLink(entry.spec, href))
		expect(targets.length).toBeGreaterThan(0)
		expect(targets.filter((target) => !source.exists(target))).toStrictEqual([])
	})

	it('FL — every fence declares a listed language', () => {
		expect(findUnlisted(guide.fences(), LANGUAGES)).toStrictEqual([])
	})

	it('EX — every documented function and method carries an example', () => {
		const functions = guide
			.surface()
			.filter((symbol) => symbol.kind === 'function')
			.map((symbol) => symbol.name)
		expect(functions.length).toBeGreaterThan(0)
		expect(findUnexampled(functions, fences, source.examples())).toStrictEqual([])
		expect(findUnexampled(['neverDocumented'], fences, source.examples())).toStrictEqual([
			'neverDocumented',
		])
		for (const group of guide.methods()) {
			const implementation = group.interface.replace(/Interface$/u, '')
			expect(findUnexampled(group.methods, fences, source.examples(implementation))).toStrictEqual(
				[],
			)
		}
	})

	it('IM — every member of a documented options interface is read by the source', () => {
		// The gap this closes: SB compares export NAMES and MB compares call signatures, so a
		// dead member of an options interface — declared, documented as live, read by nothing —
		// passes every other check in this file.
		const types = FILES['src/core/types.ts']
		if (types === undefined) throw new Error('src/core/types.ts is not in the inventory')

		const options = guide
			.surface()
			.filter((symbol) => symbol.kind === 'interface' && symbol.name.endsWith('Options'))
			.map((symbol) => symbol.name)
		expect(options.length).toBeGreaterThan(0)

		// Scoped to the OWNING file, not the whole tree. Searching every source at once let
		// `BriefManagerOptions.on` be satisfied by `BriefCompiler`'s own `options.on`, so a member
		// could go dead in one class while its namesake stayed live in the other.
		// Coverage: this proves each member is read off an options parameter IN ITS OWNER, not
		// that the value read is honoured.
		const dead: string[] = []
		for (const name of options) {
			const owner = `src/core/${name.replace(/Options$/u, '')}.ts`
			const body = FILES[owner]
			expect({ interface: name, owner, found: body !== undefined }).toStrictEqual({
				interface: name,
				owner,
				found: true,
			})
			const members = declarationBody(types, 'interface', name)
			expect(members.length).toBeGreaterThan(0)
			for (const member of members) {
				const match = /^\s*readonly\s+([A-Za-z_][A-Za-z0-9_]*)\??:/u.exec(member)
				const key = match?.[1]
				if (key === undefined || body === undefined) continue
				if (!new RegExp(`\\boptions\\??\\.${key}\\b`, 'u').test(body)) dead.push(`${name}.${key}`)
			}
		}
		expect(dead).toStrictEqual([])
	})

	it('TD — every package symbol a source TSDoc backticks is a real export', () => {
		// The gap this closes: SB reads the GUIDE's backticked names against the barrel and
		// never the TSDoc beside the code. A renamed export left `createBrief` in a published
		// `.d.ts`, so every consumer's hover named a symbol they could not import.
		const names = new Set(source.surface().map((symbol) => symbol.name))
		expect(names.size).toBeGreaterThan(60)
		const stale: string[] = []
		for (const [key, body] of Object.entries(FILES)) {
			if (!key.startsWith('src/')) continue
			for (const line of body.split('\n')) {
				if (!line.trimStart().startsWith('*')) continue
				// Any camelCase name carrying an internal capital. A hardcoded prefix family
				// missed `ownRead` when that export was removed — the exact defect this exists
				// for. Coverage: an all-lowercase single word (`task`, `gap`, `role`) is skipped,
				// because those are ordinary prose here and shape cannot tell them apart.
				for (const match of line.matchAll(/`([a-z][A-Za-z0-9]*[A-Z][A-Za-z0-9]*)`/gu)) {
					const symbol = match[1]
					if (symbol === undefined) continue
					if (FOREIGN.includes(symbol)) continue
					if (!names.has(symbol)) stale.push(`${key}: ${symbol}`)
				}
			}
		}
		expect(stale).toStrictEqual([])
	})

	it('TD — the TSDoc check can report a stale identifier', () => {
		// The control: a name matching the family pattern that the barrel does not export.
		const names = new Set(source.surface().map((symbol) => symbol.name))
		expect(names.has('createBrief')).toBe(false)
		expect(/^(assert|brief|create)/u.test('createBrief')).toBe(true)
		expect(names.has('assertBrief')).toBe(true)
	})

	it('IM — the member check can report a dead member', () => {
		// The control: a member no source file mentions must be reported, or the check above
		// is satisfied by every interface it will ever read.
		const invented = 'export interface PhantomOptions {\n\treadonly neverReadAnywhere?: number\n}\n'
		const members = declarationBody(invented, 'interface', 'PhantomOptions')
		expect(members).toHaveLength(1)

		const consumers = Object.entries(FILES)
			.filter(([key]) => key.startsWith('src/') && key !== 'src/core/types.ts')
			.map(([, body]) => body)
			.join('\n')

		// Run the real detection over the invented member: it must come back dead.
		const dead: string[] = []
		for (const member of members) {
			const match = /^\s*readonly\s+([A-Za-z_][A-Za-z0-9_]*)\??:/u.exec(member)
			const key = match?.[1]
			if (key === undefined) continue
			if (!new RegExp(`\\boptions\\??\\.${key}\\b`, 'u').test(consumers)) dead.push(key)
		}
		expect(dead).toStrictEqual(['neverReadAnywhere'])

		// And the sharper control: the exact member this package once shipped dead. Its name
		// DOES occur in the source as another function's parameter, so a bare-name check
		// passes here and this one must not.
		expect(/\bturns\b/u.test(consumers)).toBe(true)
		expect(/\boptions\??\.turns\b/u.test(consumers)).toBe(false)
	})

	it('FI — every self import in a fence names a real export', () => {
		let checked = 0
		for (const code of fences) {
			for (const statement of fenceImports(code)) {
				const local = sources.source(statement.specifier)
				if (local === undefined) continue
				checked += 1
				expect(
					findMissing(
						[...statement.names],
						local.surface().map((symbol) => symbol.name),
					),
				).toStrictEqual([])
			}
		}
		expect(checked).toBeGreaterThan(0)
	})
})
