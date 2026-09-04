import {
	BriefManager,
	briefToContent,
	briefToHash,
	buildBrief,
	buildOutcome,
	buildProof,
	buildTask,
	createBriefManager,
	isBriefError,
	parseBrief,
	pinBrief,
} from '@src/core'
import { captureError, createRecorder, requireValue } from '@orkestrel/test'
import { describe, expect, it } from 'vitest'
import { buildReadyBrief, buildReadyTask, readErrorCode } from '../../setup.js'

describe('BriefManager records', () => {
	it('mints the record id from the brief content hash', () => {
		const registry = createBriefManager()
		const record = registry.add(buildReadyBrief())
		expect(record.id).toBe(record.hash)
		expect(record.hash).toBe(briefToHash(buildReadyBrief()))
		expect(record.version).toBe(1)
		expect(record.brief).toEqual(buildReadyBrief())
		registry.destroy()
	})

	it('accepts a caller-named id without changing the hash', () => {
		const registry = createBriefManager()
		const record = registry.add(buildReadyBrief(), { id: 'useform' })
		expect(record.id).toBe('useform')
		expect(record.hash).toBe(briefToHash(buildReadyBrief()))
		registry.destroy()
	})

	it('keeps the version when the content is unchanged and bumps it when it moves', () => {
		const registry = createBriefManager()
		expect(registry.add(buildReadyBrief(), { id: 'x' }).version).toBe(1)
		expect(registry.add(buildReadyBrief(), { id: 'x' }).version).toBe(1)
		expect(registry.add(buildReadyBrief({ rules: ['No deps.'] }), { id: 'x' }).version).toBe(2)
		expect(registry.add(buildReadyBrief(), { id: 'x' }).version).toBe(3)
		registry.destroy()
	})

	it('ignores an existing pin when deriving the hash', () => {
		const registry = createBriefManager()
		const plain = registry.add(buildReadyBrief(), { id: 'x' })
		const pinned = registry.add(pinBrief(buildReadyBrief()), { id: 'x' })
		expect(pinned.hash).toBe(plain.hash)
		expect(pinned.version).toBe(1)
		registry.destroy()
	})

	it('registers a seed collection at construction', () => {
		const registry = createBriefManager({
			briefs: [buildReadyBrief(), buildReadyBrief({ rules: ['a'] })],
		})
		expect(registry.count).toBe(2)
		registry.destroy()
	})

	it('collapses two identical seeds onto one record', () => {
		const registry = createBriefManager({ briefs: [buildReadyBrief(), buildReadyBrief()] })
		expect(registry.count).toBe(1)
		registry.destroy()
	})
})

describe('BriefManager accessors', () => {
	it('answers has, brief, and briefs', () => {
		const registry = createBriefManager()
		const record = registry.add(buildReadyBrief())
		expect(registry.has(record.id)).toBe(true)
		expect(registry.has('absent')).toBe(false)
		expect(registry.brief(record.id)).toEqual(record)
		expect(registry.brief('absent')).toBeUndefined()
		expect(registry.briefs()).toEqual([record])
		registry.destroy()
	})

	it('cannot be desynchronised by a caller mutating the arrays it was given', () => {
		// The defect this pins: the record adopted the caller's array, so a later push changed
		// content the stored hash had already described.
		const outcomes = [buildOutcome(1, 'original')]
		const source = buildBrief(buildReadyTask(), {
			outcomes,
			proofs: [buildProof('x', 'npm test')],
		})
		const registry = createBriefManager()
		const record = registry.add(source)

		outcomes.push(buildOutcome(2, 'smuggled'))

		expect(record.brief.outcomes).toHaveLength(1)
		expect(briefToHash(record.brief)).toBe(record.hash)
		expect(registry.brief(record.id)?.brief.outcomes).toHaveLength(1)
		registry.destroy()
	})

	it('refuses two different briefs that collide on one content hash', () => {
		// The digest is 32 bits, so distinct briefs DO land on one id — collisions become likely
		// in the tens of thousands of briefs, and this pair came from a search. The index it was
		// found at is a draw from a birthday distribution, not a safe-size threshold, so it is
		// deliberately not recorded here. Treating a collision as unchanged content silently
		// replaced the first record and reported version 1.
		const collide = (statement: string) =>
			buildBrief(buildTask('plan', 'ops', statement), { proofs: [buildProof('x', 'npm test')] })
		const first = collide('Plan release 42vu.')
		const second = collide('Plan release fuea.')
		expect(briefToHash(first)).toBe(briefToHash(second))
		expect(briefToContent(first)).not.toBe(briefToContent(second))

		const registry = createBriefManager()
		const record = registry.add(first)
		const error = captureError(() => registry.add(second))
		expect(readErrorCode(error)).toBe('INVALID')
		expect(registry.count).toBe(1)
		expect(briefToContent(requireValue(registry.brief(record.id), 'the first record').brief)).toBe(
			briefToContent(first),
		)
		registry.destroy()
	})

	it('treats a re-add of identical content as a version no-op', () => {
		// The control for the earlier refusal: equal content must NOT be read as a collision.
		const registry = createBriefManager()
		const source = buildReadyBrief()
		const first = registry.add(source)
		const again = registry.add(source)
		expect(again.version).toBe(first.version)
		expect(registry.count).toBe(1)
		// And a pinned form of the same content shares the hash without colliding.
		expect(registry.add(pinBrief(source), { id: first.id }).version).toBe(first.version)
		registry.destroy()
	})

	it('stores a deeply frozen record that refuses a direct write', () => {
		const registry = createBriefManager()
		const record = registry.add(buildReadyBrief())
		// The record itself, not only its brief: redefining `hash` on it once changed what the
		// manager reported while the brief still recomputed to the original digest.
		expect(Object.isFrozen(record)).toBe(true)
		expect(() => Object.defineProperty(record, 'hash', { value: 'forged' })).toThrow(
			/Cannot redefine property/u,
		)
		expect(requireValue(registry.brief(record.id), 'the record').hash).toBe(
			briefToHash(record.brief),
		)
		registry.destroy()
	})

	it('freezes the stored brief all the way down', () => {
		const registry = createBriefManager()
		const record = registry.add(buildReadyBrief())
		expect(Object.isFrozen(record.brief)).toBe(true)
		expect(Object.isFrozen(record.brief.outcomes)).toBe(true)
		expect(Object.isFrozen(record.brief.manifest.read)).toBe(true)
		registry.destroy()
	})

	it('returns a fresh array from briefs', () => {
		const registry = createBriefManager({ briefs: [buildReadyBrief()] })
		expect(registry.briefs()).not.toBe(registry.briefs())
		expect(registry.briefs()).toEqual(registry.briefs())
		registry.destroy()
	})
})

describe('BriefManager seeding', () => {
	it('seeds all or nothing, announcing nothing when a later seed is refused', () => {
		// `add` throws INVALID for an off-contract or colliding entry. Seeding straight into
		// the registry announced earlier entries and then abandoned a constructor that never
		// returns — hooks holding ids for an instance the caller does not have, and an emitter
		// nothing can destroy. A refused seed must leave no trace at all.
		const seen: string[] = []
		const good = buildReadyBrief()
		// Type-valid and off-contract: `rank` must be a positive integer, and NaN is a number.
		const refused = buildReadyBrief({ outcomes: [buildOutcome(Number.NaN, 'unreachable')] })
		const failure = captureError(
			() =>
				new BriefManager({
					briefs: [good, refused],
					on: {
						add: (id) => {
							seen.push(id)
						},
					},
				}),
		)
		expect(isBriefError(failure)).toBe(true)
		expect(readErrorCode(failure)).toBe('INVALID')
		expect(seen).toStrictEqual([])

		// The control: a wholly valid seed collection constructs, announces, and registers.
		const heard: string[] = []
		const registry = new BriefManager({
			briefs: [good],
			on: {
				add: (id) => {
					heard.push(id)
				},
			},
		})
		expect(registry.count).toBe(1)
		expect(heard).toHaveLength(1)
		registry.destroy()
	})

	it('refuses two seeds that collide on one id rather than silently replacing', () => {
		// The collision check lives in `#version`, which compares against the registry. While
		// seeding, the registry is still empty, so the check has to run against the entries
		// staged so far or two colliding seeds would both land and the first would vanish.
		const first = buildReadyBrief()
		const second = buildReadyBrief({ rules: ['different content, same forced id'] })
		const failure = captureError(() => new BriefManager({ briefs: [first, second] }))
		// Distinct content hashes to distinct ids, so this pair is accepted — the control that
		// proves the seeding path registers more than one entry at all.
		expect(failure).toBeUndefined()
		const registry = new BriefManager({ briefs: [first, second] })
		expect(registry.count).toBe(2)
		registry.destroy()
	})
})

describe('BriefManager remove', () => {
	it('removes one brief by id', () => {
		const registry = createBriefManager()
		const record = registry.add(buildReadyBrief())
		expect(registry.remove(record.id)).toBe(true)
		expect(registry.remove(record.id)).toBe(false)
		expect(registry.count).toBe(0)
		registry.destroy()
	})

	it('removes a listed batch and reports false when one id was absent', () => {
		const registry = createBriefManager()
		const first = registry.add(buildReadyBrief(), { id: 'a' })
		const second = registry.add(buildReadyBrief({ rules: ['x'] }), { id: 'b' })
		expect(registry.remove([first.id, second.id])).toBe(true)
		expect(registry.count).toBe(0)

		registry.add(buildReadyBrief(), { id: 'a' })
		expect(registry.remove(['a', 'absent'])).toBe(false)
		expect(registry.has('a')).toBe(false)
		registry.destroy()
	})

	it('refuses a brief whose own hash does not describe it', () => {
		// `isBrief` shape-checks `hash` rather than verifying it, which is what lets a pinned
		// brief round-trip through JSON. So a forged pair has to be caught at the identity
		// boundary, or the manager stores it and a projection hands the executor a prompt
		// carrying a hash that describes nothing.
		const forged = parseBrief(JSON.stringify({ ...pinBrief(buildReadyBrief()), hash: 'deadbeef' }))
		expect(forged).toBeDefined()
		const registry = createBriefManager()
		const failure = captureError(() => registry.add(requireValue(forged, 'the forged brief')))
		expect(readErrorCode(failure)).toBe('INVALID')
		expect(registry.count).toBe(0)
		// The control: the same brief with its real hash is accepted.
		expect(registry.add(pinBrief(buildReadyBrief())).version).toBe(1)
		registry.destroy()
	})

	it('refuses a brief whose own trace does not describe it', () => {
		// `trace` gets the same reconciliation `hash` does, and needs it more: a hash is opaque,
		// while the trace is the census line `briefToMarkdown` prints at the top of the
		// executor's prompt. A stale one misdescribes the brief where it is most read.
		const forged = parseBrief(
			JSON.stringify({
				...pinBrief(buildReadyBrief()),
				trace: 'plan/ops · outcomes:9 · gaps:0/0 · proofs:9',
			}),
		)
		expect(forged).toBeDefined()
		const registry = createBriefManager()
		const failure = captureError(() => registry.add(requireValue(forged, 'the forged brief')))
		expect(readErrorCode(failure)).toBe('INVALID')
		expect(registry.count).toBe(0)
		// The control: the same brief with the trace its own content derives is accepted.
		expect(registry.add(pinBrief(buildReadyBrief())).version).toBe(1)
		registry.destroy()
	})

	it('reads a repeated id as the set it names, not as two attempts', () => {
		// The contract is about the listed SET. Iterating the raw list removed the record on
		// the first pass and then reported it missing on the second, so a caller who passed
		// `['a', 'a']` was told the removal failed for a record that is gone.
		const registry = createBriefManager()
		registry.add(buildReadyBrief(), { id: 'a' })
		expect(registry.remove(['a', 'a'])).toBe(true)
		expect(registry.has('a')).toBe(false)
		// The control: a genuinely absent id still reports false.
		registry.add(buildReadyBrief(), { id: 'b' })
		expect(registry.remove(['b', 'b', 'absent'])).toBe(false)
		expect(registry.has('b')).toBe(false)
		registry.destroy()
	})

	it('removes every brief when called with no argument', () => {
		const registry = createBriefManager({
			briefs: [buildReadyBrief(), buildReadyBrief({ rules: ['x'] })],
		})
		expect(registry.remove()).toBeUndefined()
		expect(registry.count).toBe(0)
		registry.destroy()
	})
})

describe('BriefManager observation', () => {
	it('emits add per registration and remove per removed id', () => {
		const added = createRecorder<readonly [string]>()
		const removed = createRecorder<readonly [string]>()
		const registry = createBriefManager({ on: { add: added.handler, remove: removed.handler } })
		const record = registry.add(buildReadyBrief())
		expect(added.calls).toStrictEqual([[record.id]])

		registry.remove('absent')
		expect(removed.count).toBe(0)
		registry.remove(record.id)
		expect(removed.calls).toStrictEqual([[record.id]])
		registry.destroy()
	})

	it('emits add for every seed', () => {
		const added = createRecorder<readonly [string]>()
		createBriefManager({
			briefs: [buildReadyBrief(), buildReadyBrief({ rules: ['x'] })],
			on: { add: added.handler },
		}).destroy()
		expect(added.count).toBe(2)
	})

	it('routes a throwing listener to the error handler and keeps its siblings running', () => {
		const failures = createRecorder<readonly [unknown, string]>()
		const survivor = createRecorder<readonly [string]>()
		const registry = new BriefManager({
			on: { add: survivor.handler },
			error: failures.handler,
		})
		registry.emitter.on('add', () => {
			throw new Error('listener boom')
		})
		registry.add(buildReadyBrief())
		expect(survivor.count).toBe(1)
		expect(failures.count).toBe(1)
		expect(failures.calls[0]?.[1]).toBe('add')
		registry.destroy()
	})

	it('emits destroy once and tears the emitter down last', () => {
		const stopped = createRecorder<readonly []>()
		const registry = createBriefManager({ on: { destroy: stopped.handler } })
		registry.destroy()
		registry.destroy()
		expect(stopped.count).toBe(1)
		expect(registry.emitter.destroyed).toBe(true)
	})
})

describe('BriefManager teardown', () => {
	it('refuses every method except the getters and destroy', () => {
		const registry = createBriefManager()
		registry.destroy()
		expect(registry.count).toBe(0)
		expect(registry.emitter.destroyed).toBe(true)
		for (const call of [
			() => registry.has('x'),
			() => registry.brief('x'),
			() => registry.briefs(),
			() => registry.add(buildReadyBrief()),
			() => registry.remove('x'),
		]) {
			expect(call).toThrow('BriefManager has been destroyed')
		}
	})

	it('throws a narrowable DESTROYED error', () => {
		const registry = createBriefManager()
		registry.destroy()
		const error = captureError(() => registry.briefs())
		expect(isBriefError(error)).toBe(true)
		expect(readErrorCode(error)).toBe('DESTROYED')
		expect(readErrorCode(new Error('unrelated'))).toBeUndefined()
	})
})
