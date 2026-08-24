import { attempt, cloneJSONRecord } from '@orkestrel/contract'
import { BriefError } from './errors.js'
import type { Brief } from './types.js'
import { isBrief } from './validators.js'

/**
 * Captures one stable, frozen view of a foreign contract value.
 *
 * @remarks
 * Rebuilds the root and every reachable plain container from its own enumerable members.
 * Unknown own members survive. Each published member absent from that copied own set is read
 * once and materialized, which admits a class that supplies its contract through prototype
 * accessors without leaving later reads attached to the live instance. Non-container leaves
 * retain their identity, including functions that `structuredClone` cannot carry.
 *
 * @param source - The foreign value to capture.
 * @param members - The published root member names to materialize when absent from its own set.
 * @returns A deeply frozen plain view, or `source` itself when it is a primitive.
 *
 * @example
 * ```ts
 * import { captureValue } from '@orkestrel/brief'
 *
 * const leaf = () => 'ready'
 * const owned = captureValue({ leaf }, ['leaf'])
 * Reflect.get(owned, 'leaf') === leaf // true — an uncloneable leaf keeps its identity
 * Object.isFrozen(owned) // true
 * ```
 */
export function captureValue(source: unknown, members: readonly string[]): unknown {
	if (source === null || (typeof source !== 'object' && typeof source !== 'function')) {
		return source
	}

	const target: object = Array.isArray(source) ? [] : Object.create(null)
	const seen = new WeakMap<object, object>([[source, target]])
	const captured: object[] = [target]
	const pending: Array<
		readonly [source: object, target: object, members: readonly string[] | undefined]
	> = [[source, target, members]]

	while (pending.length > 0) {
		const frame = pending.pop()
		if (frame === undefined) continue
		const [current, view, expected] = frame
		const entries: Array<readonly [key: PropertyKey, value: unknown]> = []
		const copied = new Set<PropertyKey>()

		for (const key of Reflect.ownKeys(current)) {
			const descriptor = Reflect.getOwnPropertyDescriptor(current, key)
			if (descriptor === undefined || !descriptor.enumerable) continue
			copied.add(key)
			entries.push([key, 'value' in descriptor ? descriptor.value : Reflect.get(current, key)])
		}
		for (const key of expected ?? []) {
			if (!copied.has(key)) entries.push([key, Reflect.get(current, key)])
		}

		for (const [key, value] of entries) {
			let owned = value
			if (value !== null && typeof value === 'object') {
				const existing = seen.get(value)
				if (existing !== undefined) {
					owned = existing
				} else {
					const prototype = Reflect.getPrototypeOf(value)
					if (Array.isArray(value) || prototype === null || prototype === Object.prototype) {
						const branch: object = Array.isArray(value) ? [] : Object.create(null)
						seen.set(value, branch)
						captured.push(branch)
						pending.push([value, branch, undefined])
						owned = branch
					}
				}
			}
			Reflect.defineProperty(view, key, {
				value: owned,
				enumerable: true,
				configurable: false,
				writable: false,
			})
		}
	}

	for (const view of captured) Object.freeze(view)
	return target
}

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
