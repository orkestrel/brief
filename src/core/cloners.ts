import { attempt, cloneJSONRecord } from '@orkestrel/contract'
import { BriefError } from './errors.js'
import type { Brief } from './types.js'
import { isBrief } from './validators.js'

/**
 * Return a deeply owned, deeply frozen copy of a brief, refusing anything off-contract.
 *
 * @remarks
 * The one reading boundary this package has, used by the pin, the registry, and every
 * projection. It matters twice over. A brief built from caller collections ADOPTS those
 * arrays, so a later `outcomes.push` would change content a hash already described. And a
 * caller's object may answer differently on each read, so validating one reading and
 * rendering from a second let a brief that passed the contract render a row it does not
 * contain — this takes ONE reading, validates that, and freezes it.
 *
 * `cloneJSONRecord` is `@orkestrel/contract`'s primitive rather than the ambient
 * `structuredClone`: it deep-freezes, it refuses a value JSON cannot express, and it is a
 * captured import rather than a mutable global. The result is a null-prototype record, so
 * compare it structurally rather than by prototype.
 *
 * This file imports no sibling helper, which is what lets `helpers.ts` consume it without a
 * module cycle.
 *
 * @param source - The brief to snapshot.
 * @returns A deeply frozen `Brief` sharing no reference with `source`.
 * @throws {@link BriefError} `INVALID` when the value is off-contract or JSON cannot express it.
 *
 * @example
 * ```ts
 * import { brief, outcome, snapshotBrief, task } from '@orkestrel/brief'
 *
 * const outcomes = [outcome(1, 'shipped')]
 * const owned = snapshotBrief(brief(task('plan', 'ops', 'Plan the release.'), { outcomes }))
 * owned.outcomes === outcomes // false — the alias is broken
 * Object.isFrozen(owned.outcomes) // true
 * ```
 */
export function snapshotBrief(source: Brief): Brief {
	const owned = attempt(() => cloneJSONRecord(source))
	if (!owned.success || !isBrief(owned.value)) {
		throw new BriefError('INVALID', 'Brief carries data that cannot be read as one value', {
			field: 'brief',
		})
	}
	return owned.value
}
