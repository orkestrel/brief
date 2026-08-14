import type { ContractInterface } from '@orkestrel/contract'
import { createContract } from '@orkestrel/contract'
import { BriefManager } from './BriefManager.js'
import { BriefCompiler } from './BriefCompiler.js'
import { briefShape } from './shapers.js'
import type {
	Brief,
	BriefManagerInterface,
	BriefManagerOptions,
	BriefCompilerInterface,
	BriefCompilerOptions,
} from './types.js'

/**
 * Create a compilation orchestrator.
 *
 * @remarks
 * With no engines supplied the compiler wires its own: a default `createInterpret()`
 * (empty vocabularies, so `options.actions` / `options.domains` drive `deriveTask`) and a
 * `createReason` carrying one `LogicalReasoner` for the gate. Pass your own to share
 * instances or observe their emitters — the compiler destroys ONLY what it created.
 *
 * @param options - Engines to borrow, the two intent vocabularies, and emitter hooks.
 * @returns A working {@link BriefCompilerInterface}.
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
 * Create a brief registry.
 *
 * @param options - An optional seed collection plus emitter hooks.
 * @returns A working {@link BriefManagerInterface}.
 *
 * @example
 * ```ts
 * import { createBriefManager } from '@orkestrel/brief'
 *
 * const briefs = createBriefManager()
 * briefs.size // 0
 * briefs.destroy()
 * ```
 */
export function createBriefManager(options?: BriefManagerOptions): BriefManagerInterface {
	return new BriefManager(options)
}

/**
 * Compile `briefShape` into a guard, parser, JSON Schema, and seeded generator bundle.
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
