import type { BriefErrorCode } from './types.js'

/**
 * The one error class this package throws.
 *
 * @remarks
 * Throws are reserved for caller misuse: `assertBrief`, `snapshotBrief`, and `pinBrief` on
 * off-contract data throw `INVALID`; any method after `destroy()` throws `DESTROYED`; and `BriefCompiler.gate` throws
 * `GATE_FAILED` when a borrowed reasoner returns a non-logical result. A stage that fails
 * inside `compile` is CONTAINED as a `BriefStageFailure` on the `Briefing` instead.
 *
 * @example
 * ```ts
 * import { BriefError } from '@orkestrel/brief'
 *
 * const error = new BriefError('INVALID', 'Brief failed the exact-record contract', {
 * 	field: 'proofs',
 * })
 * error.code // 'INVALID'
 * error.context // { field: 'proofs' }
 * ```
 */
export class BriefError extends Error {
	readonly code: BriefErrorCode
	readonly context?: Readonly<Record<string, unknown>>

	constructor(code: BriefErrorCode, message: string, context?: Readonly<Record<string, unknown>>) {
		super(message)
		this.name = 'BriefError'
		this.code = code
		if (context !== undefined) this.context = context
	}
}

/**
 * Narrow a caught value to a {@link BriefError}.
 *
 * @param value - The caught value to inspect.
 * @returns `true` when `value` is a `BriefError`.
 *
 * @example
 * ```ts
 * import { BriefError, isBriefError } from '@orkestrel/brief'
 *
 * try {
 * 	throw new BriefError('DESTROYED', 'BriefCompiler has been destroyed')
 * } catch (error) {
 * 	if (isBriefError(error)) error.code // 'DESTROYED'
 * }
 * ```
 */
export function isBriefError(value: unknown): value is BriefError {
	return value instanceof BriefError
}
