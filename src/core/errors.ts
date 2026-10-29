import type { BriefErrorCode } from './types.js'
import { holds, INTRINSICS, isFunction, isInstance, isObject, literalOf } from '@orkestrel/contract'

/**
 * Represents the one error class this package throws.
 *
 * @remarks
 * Extends `Error` with a readonly `code` on the `BriefErrorCode` vocabulary and an optional
 * readonly `context` record carrying whatever the raising site can supply.
 *
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
		Object.defineProperty(this, Symbol.for('@orkestrel/brief.BriefError'), { value: this })
		this.name = 'BriefError'
		this.code = code
		if (context !== undefined) this.context = context
	}
}

/**
 * Narrows a caught value to a {@link BriefError}.
 *
 * @param value - The caught value to inspect.
 * @returns True if `value` is a `BriefError`; false otherwise.
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
	return holds(() => {
		if (!isInstance(value, Error)) return false
		if (INTRINSICS.prototype(value) === Error.prototype) return false
		const brand = INTRINSICS.describe(value, Symbol.for('@orkestrel/brief.BriefError'))
		if (brand?.value !== value) return false
		const code = INTRINSICS.reflect.read(value, 'code')
		const context = INTRINSICS.reflect.read(value, 'context')
		return (
			literalOf(
				'INTERPRET_FAILED',
				'DRAFT_FAILED',
				'GATE_FAILED',
				'PIN_FAILED',
				'BLOCKED',
				'INVALID',
				'DESTROYED',
			)(code) &&
			(context === undefined || isObject(context) || isFunction(context))
		)
	})
}
