import type { EmitterInterface } from '@orkestrel/emitter'
import { Emitter } from '@orkestrel/emitter'
import type { RecordOptions } from '@orkestrel/interpret'
import { snapshotBrief } from './cloners.js'
import { BriefError } from './errors.js'
import { briefToContent, briefToHash, briefToTrace } from './helpers.js'
import type {
	Brief,
	BriefManagerEventMap,
	BriefManagerInterface,
	BriefManagerOptions,
	BriefRecord,
} from './types.js'

/**
 * Implements the self-owning, versioned and content-hashed brief registry.
 *
 * @remarks
 * Record ids are MINTED from each brief's own content hash unless the caller names one,
 * so registering unchanged content twice is a version no-op and two callers who compiled
 * the same request land on the same id with no coordination. A call after `destroy()`
 * throws `BriefError('DESTROYED', …)`.
 *
 * @example
 * ```ts
 * import { BriefManager, brief, task } from '@orkestrel/brief'
 *
 * const briefs = new BriefManager()
 * const record = briefs.add(brief(task('document', 'writing', 'Write the brief guide.')))
 * record.id === record.hash // true
 * briefs.destroy()
 * ```
 */
export class BriefManager implements BriefManagerInterface {
	readonly #emitter: Emitter<BriefManagerEventMap>
	readonly #records = new Map<string, BriefRecord>()
	#destroyed = false

	constructor(options?: BriefManagerOptions) {
		// One read per option; a second read lets a getter answer differently.
		const hooks = options?.on
		const failed = options?.error
		const seeds = options?.briefs ?? []
		// Seeding is ALL-OR-NOTHING. `add` throws INVALID for an off-contract or colliding
		// entry, so seeding straight into the registry emitted `add` for earlier entries and
		// then abandoned a constructor that never returns — hooks observing ids for an instance
		// the caller does not have, and an emitter nothing can destroy. Validate every seed
		// first, then build the emitter, then commit.
		const staged = new Map<string, BriefRecord>()
		for (const entry of seeds) {
			const record = this.#stage(entry, staged)
			staged.set(record.id, record)
		}
		this.#emitter = new Emitter<BriefManagerEventMap>({
			...(hooks === undefined ? {} : { on: hooks }),
			...(failed === undefined ? {} : { error: failed }),
		})
		for (const record of staged.values()) this.#commit(record)
	}

	get emitter(): EmitterInterface<BriefManagerEventMap> {
		return this.#emitter
	}

	get count(): number {
		return this.#records.size
	}

	has(id: string): boolean {
		this.#refuseDestroyed()
		return this.#records.has(id)
	}

	brief(id: string): BriefRecord | undefined {
		this.#refuseDestroyed()
		return this.#records.get(id)
	}

	briefs(): readonly BriefRecord[] {
		this.#refuseDestroyed()
		return [...this.#records.values()]
	}

	add(source: Brief, options?: RecordOptions): BriefRecord {
		this.#refuseDestroyed()
		const record = this.#stage(source, this.#records, options)
		this.#commit(record)
		return record
	}

	remove(ids: readonly string[]): boolean
	remove(id: string): boolean
	remove(): void
	remove(target?: string | readonly string[]): boolean | void {
		this.#refuseDestroyed()
		if (target === undefined) {
			for (const id of [...this.#records.keys()]) this.#discard(id)
			return
		}
		if (typeof target === 'string') return this.#discard(target)
		// Deduplicated, because the contract is about the listed SET. A repeated id was removed
		// on its first pass and then reported missing on its second, so `remove(['a', 'a'])`
		// returned false for a record it had just removed.
		let removed = true
		for (const id of new Set(target)) {
			if (!this.#discard(id)) removed = false
		}
		return removed
	}

	destroy(): void {
		if (this.#destroyed) return
		this.#destroyed = true
		this.#records.clear()
		this.#emitter.emit('destroy')
		this.#emitter.destroy()
	}

	// Build the record without registering or announcing it. Split out of `add` so the
	// constructor can validate every seed before committing any: `snapshotBrief` and `#version`
	// both throw INVALID, and seeding straight into the registry left earlier entries announced
	// on an instance that never returned. `against` is the registry to version against — the
	// live one for `add`, the in-progress staging map while seeding, so two colliding seeds are
	// caught the same way two colliding adds are.
	#stage(
		source: Brief,
		against: ReadonlyMap<string, BriefRecord>,
		options?: RecordOptions,
	): BriefRecord {
		// Snapshot first: a record whose brief still aliases the caller's arrays would let a
		// later push change content this hash already described.
		const owned = snapshotBrief(source)
		const hash = briefToHash(owned)
		// An inbound brief's own `hash` is shape-checked, not verified — that is what lets a
		// pinned brief round-trip through JSON. So a record arriving with a hash that
		// contradicts its content is refused HERE, at the identity boundary, rather than
		// stored and later projected into an executor's prompt as if it were pinned.
		if (owned.hash !== undefined && owned.hash !== hash) {
			throw new BriefError('INVALID', 'Brief carries a hash that does not describe it', {
				field: 'hash',
				hash: owned.hash,
			})
		}
		// `trace` gets the same reconciliation, and needs it more: `hash` is an opaque digest a
		// reader cannot check, while `trace` is the census line `briefToMarkdown` prints at the
		// top of the executor's prompt. A stale one misdescribes the brief exactly where it is
		// most read.
		const trace = briefToTrace(owned)
		if (owned.trace !== undefined && owned.trace !== trace) {
			throw new BriefError('INVALID', 'Brief carries a trace that does not describe it', {
				field: 'trace',
				trace: owned.trace,
			})
		}
		const id = options?.id ?? hash
		const previous = against.get(id)
		return Object.freeze({
			id,
			brief: owned,
			version: previous === undefined ? 1 : this.#version(previous, owned, hash),
			hash,
		})
	}

	// Register a staged record and announce it. Nothing here can throw, which is what makes
	// seeding all-or-nothing once every entry has been staged.
	#commit(record: BriefRecord): void {
		this.#records.set(record.id, record)
		this.#emitter.emit('add', record.id)
	}

	// The version a re-add earns, and the one place a digest collision is caught. The hash is
	// eight hex digits, so two DIFFERENT briefs can land on one id; treating that as
	// "unchanged content" would silently replace the first and report version 1. Content is
	// compared canonically, and only equal content is a version no-op.
	#version(previous: BriefRecord, incoming: Brief, hash: string): number {
		if (previous.hash !== hash) return previous.version + 1
		// Compare exactly what the hash describes. `briefToHash` strips `trace` and `hash`
		// first, so a draft and its own pinned form share a hash while their whole records
		// differ — comparing whole records would report that as a collision.
		if (briefToContent(previous.brief) === briefToContent(incoming)) return previous.version
		throw new BriefError(
			'INVALID',
			'Two different briefs share one content hash — name them with distinct ids',
			{ field: 'hash', hash },
		)
	}

	// Deletes one record and emits only when a record was actually there.
	#discard(id: string): boolean {
		if (!this.#records.delete(id)) return false
		this.#emitter.emit('remove', id)
		return true
	}

	// Every method except the getters and `destroy` refuses a destroyed manager.
	#refuseDestroyed(): void {
		if (this.#destroyed) {
			throw new BriefError('DESTROYED', 'BriefManager has been destroyed')
		}
	}
}
