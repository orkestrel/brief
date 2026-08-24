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
 * The half of the intake pair that is OWNED BY CONSTRUCTION, which is what separates it from
 * `assertBrief`. The argument is text, so the graph the guard reads is one `JSON.parse` built
 * inside this call: it carries no caller identity, no accessor, and no alias back into anything
 * the caller still holds, and the parse-and-guard primitive this file imports from
 * `@orkestrel/contract` returns that same parsed graph rather than a second reading of it.
 * Every member `isBrief` checked therefore answers a later reader identically. The value is
 * fresh rather than frozen, so the caller owns it outright — reach for `snapshotBrief` when the
 * value came from code instead of from text.
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
