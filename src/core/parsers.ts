import { parseJSONAs } from '@orkestrel/contract'
import type { Brief } from './types.js'
import { isBrief } from './validators.js'

/**
 * Parse a JSON string into a `Brief`.
 *
 * @remarks
 * The parse-then-trust boundary for a stored brief, a tool argument, or an agent's
 * emission. Invalid JSON, an extra key, an off-vocabulary literal, and a missing section
 * all fail the same way — `undefined`, never a throw. Coerce a bare vocabulary value with
 * `parseEnum` from `@orkestrel/contract` against the exported tuple instead.
 *
 * @param value - The JSON text to parse.
 * @returns The `Brief` when the parsed value satisfies `isBrief`, otherwise `undefined`.
 *
 * @example
 * ```ts
 * import { parseBrief } from '@orkestrel/brief'
 *
 * parseBrief('not json') // undefined
 * parseBrief('{"task":{"operation":"plan","domain":"ops","statement":"x."}}') // undefined
 * ```
 */
export function parseBrief(value: string): Brief | undefined {
	return parseJSONAs(value, isBrief)
}
