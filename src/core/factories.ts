import type { ContractInterface } from '@orkestrel/contract'
import type {
	Brief,
	BriefManagerInterface,
	BriefManagerOptions,
	BriefCompilerInterface,
	BriefCompilerOptions,
} from './types.js'
import { createContract } from '@orkestrel/contract'
import { BriefManager } from './BriefManager.js'
import { BriefCompiler } from './BriefCompiler.js'
import { briefShape } from './shapers.js'

/**
 * Creates a compilation orchestrator.
 *
 * @remarks
 * With no engines supplied the compiler wires its own: a default `createInterpret()`
 * (empty vocabularies, so `options.actions` / `options.domains` drive `deriveTask`) and a
 * `createReason` carrying one `LogicalReasoner` for the gate. Pass your own to share
 * instances or observe their emitters — the compiler destroys ONLY what it created.
 *
 * @param options - Engines to borrow, the `actions` and `domains` intent vocabularies, and
 * emitter hooks.
 * @returns A working {@link BriefCompilerInterface}.
 *
 * @example Compile and project a brief
 * ```ts
 * import {
 * 	briefToGoal,
 * 	briefToMarkdown,
 * 	buildOutcome,
 * 	buildProof,
 * 	buildTask,
 * 	createBriefCompiler,
 * } from '@orkestrel/brief'
 *
 * const compiler = createBriefCompiler()
 *
 * const briefing = compiler.compile({
 * 	task: buildTask('refactor', 'code', 'Refactor useForm to native browser form APIs.'),
 * 	authority: [{ path: 'AGENTS.md', note: 'project law; wins every conflict' }],
 * 	manifest: {
 * 		read: [
 * 			{ path: 'AGENTS.md', note: 'project law; wins every conflict' },
 * 			{ path: 'guides/browser.md', note: 'the composable contract' },
 * 		],
 * 		edit: [{ path: 'src/browser/composables/useForm.ts', note: 'the composable being refactored' }],
 * 		locked: [{ path: 'src/browser/types.ts', note: 'the published contract' }],
 * 		forbidden: [{ path: 'app/**', note: 'out of scope' }],
 * 	},
 * 	outcomes: [buildOutcome(1, 'useForm uses native FormData with no behavior change')],
 * 	proofs: [buildProof('type-check and lint pass', 'npm run check')],
 * })
 *
 * briefing.brief !== undefined // true — the brief is present exactly when the gate passed
 * if (briefing.brief !== undefined) {
 * 	briefToMarkdown(briefing.brief) // the copy-ready agent prompt
 * 	briefToGoal(briefing.brief) // the /goal completion condition
 * }
 *
 * compiler.emitter.on('block', (questions) => questions.length)
 * compiler.destroy()
 * ```
 *
 * @example
 * ```ts
 * import { createBriefCompiler } from '@orkestrel/brief'
 *
 * const compiler = createBriefCompiler({ actions: { refactor: 'refactor' }, domains: { code: 'code' } })
 * compiler.destroy()
 * ```
 */
export function createBriefCompiler(options?: BriefCompilerOptions): BriefCompilerInterface {
	return new BriefCompiler(options)
}

/**
 * Creates a brief registry.
 *
 * @param options - An optional seed collection plus emitter hooks.
 * @returns A working {@link BriefManagerInterface}.
 *
 * @example
 * ```ts
 * import { createBriefManager } from '@orkestrel/brief'
 *
 * const briefs = createBriefManager()
 * briefs.count // 0
 * briefs.destroy()
 * ```
 */
export function createBriefManager(options?: BriefManagerOptions): BriefManagerInterface {
	return new BriefManager(options)
}

/**
 * Compiles `briefShape` into a guard, parser, JSON Schema, and seeded generator bundle.
 *
 * @remarks
 * The schema is what a tool boundary needs — hand it to `schemaToParameters` — and
 * `generate(seededRandom(n))` yields a reproducible on-contract brief for tests. This
 * bundle and the hand-composed `isBrief` are two independent mechanisms over one
 * vocabulary; `tests/src/core/shapers.test.ts` is what holds them in lockstep.
 *
 * @returns A `ContractInterface` over `Brief`.
 *
 * @example
 * ```ts
 * import { createBriefContract } from '@orkestrel/brief'
 * import { schemaToParameters, seededRandom } from '@orkestrel/contract'
 *
 * const contract = createBriefContract()
 * schemaToParameters(contract.schema) // the open tool-parameters record, no `as` anywhere
 * contract.generate(seededRandom(42)) // a reproducible on-contract brief
 * ```
 */
export function createBriefContract(): ContractInterface<Brief> {
	return createContract(briefShape)
}
