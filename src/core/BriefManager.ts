import type { EmitterInterface } from '@orkestrel/emitter'
import { Emitter } from '@orkestrel/emitter'
import type { ManagerAddOptions } from '@orkestrel/interpret'
import { snapshotBrief } from './cloners.js'
import { BriefError } from './errors.js'
import { briefToContent, briefToHash } from './helpers.js'
import type {
	Brief,
	BriefManagerEventMap,
	BriefManagerInterface,
	BriefManagerOptions,
	BriefRecord,
} from './types.js'

/**
 * The self-owning, versioned and content-hashed brief registry.
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
		this.#emitter = new Emitter<BriefManagerEventMap>({
			...(options?.on === undefined ? {} : { on: options.on }),
			...(options?.error === undefined ? {} : { error: options.error }),
		})
		for (const entry of options?.briefs ?? []) this.add(entry)
	}

	get emitter(): EmitterInterface<BriefManagerEventMap> {
		return this.#emitter
	}

	get size(): number {
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

	add(source: Brief, options?: ManagerAddOptions): BriefRecord {
		this.#refuseDestroyed()
		// Snapshot first: a record whose brief still aliases the caller's arrays would let a
		// later push change content this hash already described.
		const owned = snapshotBrief(source)
		const hash = briefToHash(owned)
		const id = options?.id ?? hash
		const previous = this.#records.get(id)
		const record: BriefRecord = Object.freeze({
			id,
			brief: owned,
			version: previous === undefined ? 1 : this.#version(previous, owned, hash),
			hash,
		})
		this.#records.set(id, record)
		this.#emitter.emit('add', id)
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
		let removed = true
		for (const id of target) {
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
