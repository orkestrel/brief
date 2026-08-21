// The packed-package proof. It answers the one question no other project can: does the
// artifact a consumer actually installs resolve through the export map this package
// publishes? Every other suite imports through the `@src/core` alias and the source graph,
// which a bundler resolves differently — a cycle or a missing file that is fatal in the
// shipped form can stay invisible under every one of them.

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { attempt, isRecord, resolveField } from '@orkestrel/contract'
import { createScratch } from '@orkestrel/test/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/u, '$1')
const RELEASE = import.meta.env.MODE === 'release'
const MANIFEST: unknown = JSON.parse(
	readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
)

const scratch = createScratch({ prefix: 'brief-distribution-' })
let tarball: string | undefined
let installed = false
let refusal: string | undefined

// npm is a `.cmd` shim on Windows and Node refuses to spawn one without a shell, so npm
// goes through a shell with every argument quoted here. `node` is a real executable and is
// spawned directly, where argument escaping is the runtime's own job.
function npm(args: readonly string[], cwd: string): string {
	const quoted = args.map((arg) => (/[\s"]/u.test(arg) ? JSON.stringify(arg) : arg))
	return execFileSync('npm', [...quoted], {
		cwd,
		encoding: 'utf8',
		shell: true,
		stdio: ['ignore', 'pipe', 'pipe'],
	})
}

function node(args: readonly string[], cwd: string): string {
	return execFileSync(process.execPath, [...args], {
		cwd,
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'pipe'],
	})
}

// `npm pack --json` reports one entry per packed package: keyed by package name on npm 11,
// and as an array on earlier majors. Both shapes are read rather than assumed, and any
// notice around the payload is sliced off by the payload's own delimiters.
function readPackReport(output: string): Readonly<Record<string, unknown>> {
	const opening = output.search(/[[{]/u)
	if (opening < 0) throw new Error(`no JSON in npm output: ${output.slice(0, 200)}`)
	const closing = Math.max(output.lastIndexOf(']'), output.lastIndexOf('}'))
	const parsed: unknown = JSON.parse(output.slice(opening, closing + 1))
	const entry: unknown = Array.isArray(parsed)
		? parsed[0]
		: isRecord(parsed)
			? Object.values(parsed)[0]
			: undefined
	if (!isRecord(entry)) throw new Error(`npm pack reported no entry: ${output.slice(0, 200)}`)
	return entry
}

function readPackedPaths(output: string): readonly string[] {
	const files = resolveField(readPackReport(output), 'files')
	if (!Array.isArray(files)) throw new Error('npm pack reported no file list')
	const paths: string[] = []
	for (const file of files) {
		const path = isRecord(file) ? resolveField(file, 'path') : undefined
		if (typeof path === 'string') paths.push(path)
	}
	return paths
}

function readExportedNames(output: string): readonly string[] {
	const parsed: unknown = JSON.parse(output.trim())
	if (!Array.isArray(parsed)) throw new Error('the consumer printed no name list')
	return parsed.filter((name: unknown): name is string => typeof name === 'string')
}

beforeAll(() => {
	if (!existsSync(`${ROOT}/dist/src/core/index.js`)) {
		throw new Error('dist is absent: run `npm run build` before the distribution proof')
	}
	const report = readPackReport(
		npm(['pack', '--json', '--ignore-scripts', `--pack-destination=${scratch.path}`], ROOT),
	)
	const filename = resolveField(report, 'filename')
	if (typeof filename !== 'string') throw new Error('npm pack reported no filename')
	tarball = `${scratch.path}/${filename}`

	scratch.write(
		'consumer/package.json',
		JSON.stringify({ name: 'consumer', private: true, type: 'module' }),
	)
	try {
		npm(
			['install', tarball, '--no-audit', '--no-fund', '--loglevel=error'],
			`${scratch.path}/consumer`,
		)
		installed = true
	} catch (error) {
		refusal = error instanceof Error ? error.message : String(error)
	}
}, 300_000)

afterAll(() => {
	scratch.destroy()
})

describe('packed artifact', () => {
	it('packs the published file set and nothing private', () => {
		const paths = readPackedPaths(npm(['pack', '--dry-run', '--json', '--ignore-scripts'], ROOT))

		// Membership, not a count: a total passes while one half of the set is empty.
		expect(paths).toContain('package.json')
		expect(paths).toContain('README.md')
		expect(paths).toContain('dist/src/core/index.js')
		expect(paths).toContain('dist/src/core/index.cjs')
		expect(paths).toContain('dist/src/core/index.d.ts')
		expect(paths).toContain('dist/src/core/index.d.cts')

		// Nothing private, development-only, or campaign-local may ship.
		const leaked = paths.filter(
			(path) =>
				path.startsWith('tests/') ||
				path.startsWith('tmp/') ||
				path.startsWith('guides/') ||
				path.startsWith('configs/') ||
				path.startsWith('src/') ||
				path.endsWith('.env') ||
				path === 'AGENTS.md' ||
				path === 'CLAUDE.md',
		)
		expect(leaked).toStrictEqual([])
	})

	it('declares every export condition the proofs below resolve', () => {
		const exports = isRecord(MANIFEST) ? resolveField(MANIFEST, 'exports') : undefined
		expect(isRecord(exports)).toBe(true)
		expect(JSON.stringify(exports)).toContain('./dist/src/core/index.js')
		expect(JSON.stringify(exports)).toContain('./dist/src/core/index.cjs')
	})
})

describe('installed package', () => {
	it('installs from the tarball', () => {
		// A developer offline is not a defect; a release run is. `--mode release` is what
		// prepublishOnly passes, so an unreachable registry there collapses to `refused` and
		// fails this assertion instead of skipping past it.
		const outcome = installed ? 'installed' : RELEASE ? `refused: ${String(refusal)}` : 'offline'
		expect(['installed', 'offline']).toContain(outcome)
	}, 300_000)

	it('resolves through the ESM condition and exposes the whole surface', () => {
		if (!installed && !RELEASE) return
		const script =
			"import('@orkestrel/brief').then((m) => { console.log(JSON.stringify(Object.keys(m).sort())) })"
		const names = readExportedNames(
			node(['--input-type=module', '-e', script], `${scratch.path}/consumer`),
		)
		// Compared against the COMPLETE declared surface, not a sample. A sample of four names
		// plus a length floor passes after an export is dropped, which is the one thing this
		// proof exists to catch.
		const declarations = readFileSync(
			new URL('../dist/src/core/index.d.ts', import.meta.url),
			'utf8',
		)
		const declared = [
			...declarations.matchAll(
				/export declare (?:abstract )?(?:function|const|class) ([A-Za-z_][A-Za-z0-9_]*)/gu,
			),
		]
			.map((match) => match[1])
			.filter((name): name is string => name !== undefined)
			.sort()
		expect(declared.length).toBeGreaterThan(60)
		expect(names.filter((name) => !declared.includes(name))).toStrictEqual([])
		expect(declared.filter((name) => !names.includes(name))).toStrictEqual([])
		// The control: a name this package deliberately does not re-export.
		expect(names).not.toContain('createInterpret')
	}, 120_000)

	it('resolves through the CJS condition and agrees with ESM', () => {
		if (!installed && !RELEASE) return
		const esm = readExportedNames(
			node(
				[
					'--input-type=module',
					'-e',
					"import('@orkestrel/brief').then((m) => { console.log(JSON.stringify(Object.keys(m).sort())) })",
				],
				`${scratch.path}/consumer`,
			),
		)
		const cjs = readExportedNames(
			node(
				[
					'--input-type=commonjs',
					'-e',
					"console.log(JSON.stringify(Object.keys(require('@orkestrel/brief')).sort()))",
				],
				`${scratch.path}/consumer`,
			),
		)
		expect(cjs.length).toBeGreaterThan(60)
		expect(cjs.filter((name) => !esm.includes(name))).toStrictEqual([])
		expect(esm.filter((name) => !cjs.includes(name) && name !== 'default')).toStrictEqual([])
	}, 120_000)

	it('resolves the installed types condition from a real TypeScript consumer', () => {
		if (!installed && !RELEASE) return
		// Every other proof here exercises RUNTIME resolution. The `types` condition can point
		// at a missing or wrong declaration and pass all of them, because nothing compiles
		// against the installed package — a consumer would be the first to find out.
		scratch.write(
			'consumer/probe.ts',
			[
				"import { createBriefCompiler, outcome, proof, task } from '@orkestrel/brief'",
				"import type { Brief, Briefing, BriefCompilerInterface } from '@orkestrel/brief'",
				'const compiler: BriefCompilerInterface = createBriefCompiler()',
				'const briefing: Briefing = compiler.compile({',
				"  task: task('plan', 'ops', 'Plan the release.'),",
				"  outcomes: [outcome(1, 'shipped')],",
				"  proofs: [proof('x', 'npm test')],",
				'})',
				'const emitted: Brief | undefined = briefing.brief',
				'// Narrowing the replay union must need no assertion.',
				"const drafted = briefing.stages.find((record) => record.stage === 'draft')",
				'const width: number | undefined = drafted?.output?.outcomes.length',
				'export const proven = [emitted?.hash, width, compiler.reason.supports] as const',
			].join('\n'),
		)
		scratch.write(
			'consumer/tsconfig.json',
			JSON.stringify({
				compilerOptions: {
					module: 'nodenext',
					moduleResolution: 'nodenext',
					target: 'esnext',
					strict: true,
					noEmit: true,
					skipLibCheck: false,
					types: [],
				},
				files: ['probe.ts'],
			}),
		)
		const compiled = attempt(() =>
			node([`${ROOT}/node_modules/typescript/lib/tsc.js`, '-p', '.'], `${scratch.path}/consumer`),
		)
		expect({
			compiled: compiled.success,
			output: compiled.success ? '' : String(compiled.error),
		}).toStrictEqual({ compiled: true, output: '' })
	}, 300_000)

	it('runs the documented example end to end against the installed package', () => {
		if (!installed && !RELEASE) return
		// Proves the shipped artifact does the documented work, not merely that it imports.
		const script = [
			"import { briefToGoal, createBriefCompiler, outcome, proof, task } from '@orkestrel/brief'",
			'const compiler = createBriefCompiler()',
			'const briefing = compiler.compile({',
			"  task: task('refactor', 'code', 'Refactor useForm to native browser form APIs.'),",
			"  outcomes: [outcome(1, 'useForm uses native FormData with no behavior change')],",
			"  proofs: [proof('type-check and lint pass', 'npm run check')],",
			'})',
			'compiler.destroy()',
			'console.log(JSON.stringify({',
			'  complete: briefing.brief !== undefined,',
			'  hash: briefing.brief?.hash,',
			'  goal: briefing.brief === undefined ? undefined : briefToGoal(briefing.brief),',
			'}))',
		].join('\n')
		const result: unknown = JSON.parse(
			node(['--input-type=module', '-e', script], `${scratch.path}/consumer`).trim(),
		)
		expect(isRecord(result)).toBe(true)
		expect(result).toMatchObject({
			complete: true,
			goal: 'Done when every proof passes: npm run check exits 0. Cap: 16 turns.',
		})
		const hash = isRecord(result) ? resolveField(result, 'hash') : undefined
		expect(typeof hash).toBe('string')
		expect(String(hash)).toHaveLength(8)
	}, 120_000)
})
