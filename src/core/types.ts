import type { EmitterErrorHandler, EmitterHooks, EmitterInterface } from '@orkestrel/emitter'
import type { Interpretation, InterpretInterface, ManagerAddOptions } from '@orkestrel/interpret'
import type { LogicalResult, ReasonInterface, Subject } from '@orkestrel/reason'

/**
 * The closed vocabulary of what a brief asks for.
 *
 * @remarks
 * A request that fits none of these twelve is mis-scoped rather than a missing
 * literal. Compose with `literalOf(TASK_OPERATIONS)` or `parseEnum(value, TASK_OPERATIONS)`.
 */
export type TaskOperation =
	| 'create'
	| 'refactor'
	| 'debug'
	| 'extract'
	| 'migrate'
	| 'explain'
	| 'review'
	| 'optimize'
	| 'audit'
	| 'test'
	| 'document'
	| 'plan'

/** The closed vocabulary of the subject matter a brief operates on. */
export type TaskDomain =
	| 'code'
	| 'writing'
	| 'research'
	| 'analysis'
	| 'design'
	| 'data'
	| 'ops'
	| 'other'

/** The closed vocabulary of deliverable shapes. */
export type OutputFormat = 'markdown' | 'json' | 'code' | 'diff' | 'prose'

/** The closed vocabulary of risk severities. */
export type RiskSeverity = 'low' | 'medium' | 'high'

/** The four fixed compilation phases, in pipeline order. */
export type BriefStage = 'interpret' | 'draft' | 'gate' | 'pin'

/**
 * The machine-readable reasons a {@link BriefError} carries.
 *
 * @remarks
 * Inside `compile` every stage failure is CONTAINED: the four `*_FAILED` codes and
 * `BLOCKED` mark it on the {@link Briefing} rather than throwing.
 *
 * `INTERPRET_FAILED` needs a FOREIGN `InterpretInterface`. `@orkestrel/interpret` contains
 * its own stage failures and returns a degraded `Interpretation` rather than throwing, so
 * the default engine never raises it; `BriefCompilerOptions.interpret` is the seam a caller
 * reaches it through. Three codes also reach a
 * throw, from methods outside that containment — `INVALID` from `assertBrief`,
 * `snapshotBrief`, and `pinBrief`; `DESTROYED` from any method after
 * `destroy()`; and `GATE_FAILED` from `BriefCompiler.gate` when a borrowed reasoner returns a
 * non-logical result OR throws its own error, which is translated rather than leaked so that
 * every throw out of this module stays a `BriefError` an `isBriefError` catch can narrow.
 */
export type BriefErrorCode =
	| 'INTERPRET_FAILED'
	| 'DRAFT_FAILED'
	| 'GATE_FAILED'
	| 'PIN_FAILED'
	| 'BLOCKED'
	| 'INVALID'
	| 'DESTROYED'

/**
 * What the brief asks for, in one imperative sentence.
 *
 * @remarks
 * A compound `statement` is two briefs — `validateBrief` errors on more than one sentence.
 */
export interface Task {
	readonly operation: TaskOperation
	readonly domain: TaskDomain
	readonly statement: string
}

/**
 * One referenced path and why it is listed.
 *
 * @remarks
 * The ONE path record. A reference means different things in different containers, and the
 * container is what says which: `Brief.authority` ranks its entries so index 0 wins every
 * conflict, and each `Manifest` partition states a permission. The record itself carries no
 * classifier, because a second label on the row would restate what the container already
 * fixed — and the label this package used to carry was one repository's document taxonomy
 * rather than a domain.
 *
 * `note` is required. A path with no rationale is interpretation left to do, which is the
 * one thing a brief exists to remove.
 */
export interface Reference {
	readonly path: string
	readonly note: string
}

/**
 * The four disjoint file partitions of a brief.
 *
 * @remarks
 * `read` order is the reading order. A path in more than one partition is a
 * `validateBrief` error, found by `findManifestOverlaps`.
 */
export interface Manifest {
	readonly read: readonly Reference[]
	readonly edit: readonly Reference[]
	readonly locked: readonly Reference[]
	readonly forbidden: readonly Reference[]
}

/**
 * One ranked outcome — a result, never a step.
 *
 * @remarks
 * `required: true` gates "done"; a demoted outcome is desirable but not blocking.
 */
export interface Outcome {
	readonly rank: number
	readonly text: string
	readonly required: boolean
}

/** One context fact handed to the executor — a convention, a version, a constraint value. */
export interface Given {
	readonly category: string
	readonly name: string
	readonly value: string
}

/** One input to output exemplar — the highest-leverage ambiguity remover. */
export interface Example {
	readonly input: string
	readonly output: string
	readonly note?: string
}

/**
 * One external source — what it is called, where it lives, and why it is cited.
 *
 * @remarks
 * List ORDER is the trust order; there is no per-entry weight.
 *
 * The off-repository twin of {@link Reference}: `note` says why the entry is listed, in both.
 * It carries `name` where a reference does not because a path is already readable and a URL
 * is not, so the name is the citation's readable half rather than a classifier in disguise.
 *
 * It carries no classifier for a different reason than a reference does. A reference has none
 * because its container already fixes what it is; a citation has none because the closed
 * vocabulary this once held — `docs`, `spec`, `api`, `standard` — was a document taxonomy no
 * mechanism read, and its members were not disjoint, so a page documenting an API or a
 * specification that is also a standard forced an arbitrary choice.
 *
 * `url` is validated as a single line and NOT as a URL, so `url: 'docs'` is on-contract. That
 * is a limit rather than an oversight: constraining it needs a `pattern` on `citationShape`,
 * and the shape DSL's seeded generator builds a random alphanumeric string and throws when it
 * fails the pattern — so any pattern requiring a scheme's colon makes `createBriefContract()`
 * ungeneratable for the whole brief. Constraining only the guard would leave the guard and the
 * compiled shape disagreeing, which is the parity this package holds in lockstep. Four working
 * mechanisms beat one stricter member.
 *
 * The cost lands on one migration: `citation` takes `(name, url, note)` where it once took
 * `(name, role, url)` — three strings either way, so a stale call still compiles and still
 * passes the guard, and only renders wrong. Nothing is published, so a version bump carries it.
 */
export interface Citation {
	readonly name: string
	readonly url: string
	readonly note: string
}

/**
 * One unknown the brief has not resolved.
 *
 * @remarks
 * `blocking: true` means no safe default exists and the gate must fail closed. An
 * open gap proceeds on a narrow recorded assumption instead.
 */
export interface Gap {
	readonly field: string
	readonly question: string
	readonly blocking: boolean
	readonly candidates?: readonly string[]
}

/** One pre-empted risk and the mitigation that answers it. */
export interface Risk {
	readonly severity: RiskSeverity
	readonly text: string
	readonly mitigation: string
}

/**
 * The closed shape of the deliverable.
 *
 * @remarks
 * `format` is required; `sections` / `include` / `exclude` refine it.
 */
export interface Output {
	readonly format: OutputFormat
	readonly sections?: readonly string[]
	readonly include?: readonly string[]
	readonly exclude?: readonly string[]
}

/**
 * One mechanical, transcript-provable check.
 *
 * @remarks
 * `command` should carry a clear exit signal — it becomes the `/goal` condition verbatim.
 */
export interface Proof {
	readonly text: string
	readonly command: string
}

/**
 * The closed execution contract — a rough request with every implicit decision resolved.
 *
 * @remarks
 * `trace` and `hash` are DERIVED by `pinBrief`. The `brief` builder cannot set them, so
 * nothing this package produces authors them.
 *
 * They are still SHAPE-checked rather than verified on the way in: `isBrief` and `parseBrief`
 * accept any single-line string, because that is what lets a pinned brief round-trip through
 * JSON and back. So an inbound brief's `hash` is not proof of its content — re-derive it with
 * `briefToHash` if the source is untrusted. `BriefManager` does exactly that, and refuses a
 * record whose stored hash contradicts its content.
 */
export interface Brief {
	readonly task: Task
	readonly authority: readonly Reference[]
	readonly manifest: Manifest
	readonly outcomes: readonly Outcome[]
	readonly rules: readonly string[]
	readonly invariants: readonly string[]
	readonly givens: readonly Given[]
	readonly examples: readonly Example[]
	readonly assumptions: readonly string[]
	readonly citations: readonly Citation[]
	readonly gaps: readonly Gap[]
	readonly risks: readonly Risk[]
	readonly output: Output
	readonly proofs: readonly Proof[]
	readonly trace?: string
	readonly hash?: string
}

/**
 * One `compile()` input.
 *
 * @remarks
 * THREE classes of input, not two. `text` selects the interpret stage. `interpretation`
 * supplies that stage's result directly: with no `text` it drives `deriveTask`,
 * `deriveGivens`, and `deriveGaps` without running the language pipeline at all, and with
 * `text` present it is also the FALLBACK the draft uses when the interpret engine throws.
 * Every remaining key is a caller-authored section merged OVER whatever the draft derived.
 *
 * Supplying both `text` and `interpretation` is therefore meaningful: the engine's result
 * wins when it succeeds, and the supplied one carries the compile when it does not.
 */
export interface BriefInput {
	readonly text?: string
	readonly interpretation?: Interpretation
	readonly task?: Task
	readonly authority?: readonly Reference[]
	readonly manifest?: Manifest
	readonly outcomes?: readonly Outcome[]
	readonly rules?: readonly string[]
	readonly invariants?: readonly string[]
	readonly givens?: readonly Given[]
	readonly examples?: readonly Example[]
	readonly assumptions?: readonly string[]
	readonly citations?: readonly Citation[]
	readonly gaps?: readonly Gap[]
	readonly risks?: readonly Risk[]
	readonly output?: Output
	readonly proofs?: readonly Proof[]
}

/**
 * The `interpret` phase snapshot — raw text in, an `Interpretation` out.
 *
 * @remarks
 * `output` is absent exactly when `error` is present, which is what makes the phase
 * failure derivable rather than stored twice.
 */
export interface InterpretStageRecord {
	readonly stage: 'interpret'
	readonly input: string
	readonly output?: Interpretation
	readonly error?: string
}

/** The `draft` phase snapshot — the caller's input in, an unpinned `Brief` out. */
export interface DraftStageRecord {
	readonly stage: 'draft'
	readonly input: BriefInput
	readonly output?: Brief
	readonly error?: string
}

/** The `gate` phase snapshot — the readiness `Subject` in, the reasoner's verdict out. */
export interface GateStageRecord {
	readonly stage: 'gate'
	readonly input: Subject
	readonly output?: LogicalResult
	readonly error?: string
}

/** The `pin` phase snapshot — the drafted `Brief` in, the pinned `Brief` out. */
export interface PinStageRecord {
	readonly stage: 'pin'
	readonly input: Brief
	readonly output?: Brief
	readonly error?: string
}

/**
 * One pipeline phase, discriminated by `stage`.
 *
 * @remarks
 * Narrowing on `stage` types both payloads exactly, so a consumer reads a replay without
 * a type assertion. A phase failed exactly when `error` is present.
 */
export type BriefStageRecord =
	| InterpretStageRecord
	| DraftStageRecord
	| GateStageRecord
	| PinStageRecord

/** A visible marker for a phase that failed. */
export interface BriefStageFailure {
	readonly stage: BriefStage
	readonly code: BriefErrorCode
	readonly message: string
}

/**
 * The full, replayable outcome of one `compile()` call.
 *
 * @remarks
 * `brief` is present exactly when the compile completed, so it is ALSO the completeness
 * test — there is no `complete` flag, because a second stored fact is free to disagree
 * with the first. `questions` carries what the caller must answer when it is absent.
 *
 * Nor is the caller's `text` echoed back. It is the caller's own value on the direct
 * path, and `interpretation.text` on the interpret path, so storing it here would be one
 * fact in two places. `interpretation` and `verdict` are the originating packages' own
 * types — import them from `@orkestrel/interpret` and `@orkestrel/reason`.
 *
 * `digest` identifies this OUTCOME — the brief, the questions, and the failures together — so
 * two identical compiles share it and a refused compile has one just as a complete one does.
 * It is not `Brief.hash`, which identifies the brief's content alone and exists only on an
 * emitted brief. Key a cache of compile results by `digest`; key a registry of briefs by
 * `hash`.
 */
export interface Briefing {
	readonly interpretation?: Interpretation
	readonly brief?: Brief
	readonly questions: readonly Gap[]
	readonly verdict?: LogicalResult
	readonly stages: readonly BriefStageRecord[]
	readonly failures: readonly BriefStageFailure[]
	readonly digest: string
}

/**
 * The subagent projection of a brief.
 *
 * @remarks
 * Two orthogonal axes, not five partitions. PERMISSION is `read`, `edit`, `locked`, and
 * `forbidden`, with `edit` the owned set two concurrent dispatches must not intersect on and
 * `locked` and `forbidden` do-not-touch. PRECEDENCE is `authority`, in ranked order, index 0
 * winning every conflict.
 *
 * `authority` therefore OVERLAPS the permission arrays by design: a ranked path ALWAYS also
 * sits in `read`, `edit`, or `locked`, because the executor has to open what it obeys, and
 * the `granted` gate rule refuses a brief where it does not. Read the four to decide what may
 * be touched and `authority` to decide what wins. Never union all five — that was already
 * wrong before `authority` existed, because `forbidden` is an exclusion rather than a grant.
 * `authority` is a path list rather than a rendered section because a machine consumer must
 * reach mandatory authority without parsing `prompt`, which is written for a model.
 *
 * The four permission arrays are mutually disjoint in a GATED brief — `findManifestOverlaps`
 * measures it and the `disjoint` rule refuses on it. `briefToDispatch` is a pure projection
 * and runs no gate, so projecting an unvetted draft can produce arrays that intersect. Gate
 * before you dispatch, or treat disjointness as unproven.
 */
export interface Dispatch {
	readonly prompt: string
	readonly authority: readonly string[]
	readonly read: readonly string[]
	readonly edit: readonly string[]
	readonly locked: readonly string[]
	readonly forbidden: readonly string[]
}

/** A versioned, content-hashed `Brief` inside a {@link BriefManagerInterface}. */
export interface BriefRecord {
	readonly id: string
	readonly brief: Brief
	readonly version: number
	readonly hash: string
}

/** The `BriefCompiler`'s push observation surface. */
export type BriefCompilerEventMap = {
	compile: readonly [briefing: Briefing]
	block: readonly [questions: readonly Gap[]]
	error: readonly [error: unknown]
	destroy: readonly []
}

/**
 * Input to `createBriefCompiler`.
 *
 * @remarks
 * `interpret` and `reason` are BORROWED when supplied — the compiler destroys only
 * engines it created itself. `actions` and `domains` map an interpret `Intent`'s free
 * strings onto the closed task vocabularies; an unmapped value drafts no task. The gate
 * is FIXED: readiness is this package's contract, not a caller setting.
 */
export interface BriefCompilerOptions {
	readonly interpret?: InterpretInterface
	readonly reason?: ReasonInterface
	readonly actions?: Readonly<Record<string, TaskOperation>>
	readonly domains?: Readonly<Record<string, TaskDomain>>
	readonly on?: EmitterHooks<BriefCompilerEventMap>
	readonly error?: EmitterErrorHandler
}

/** The compilation orchestrator contract. */
export interface BriefCompilerInterface {
	readonly emitter: EmitterInterface<BriefCompilerEventMap>
	readonly interpret: InterpretInterface
	readonly reason: ReasonInterface
	compile(input: BriefInput): Briefing
	gate(brief: Brief): LogicalResult
	destroy(): void
}

/** The `BriefManager`'s push observation surface. */
export type BriefManagerEventMap = {
	add: readonly [id: string]
	remove: readonly [id: string]
	destroy: readonly []
}

/** Input to `createBriefManager`. */
export interface BriefManagerOptions {
	readonly briefs?: readonly Brief[]
	readonly on?: EmitterHooks<BriefManagerEventMap>
	readonly error?: EmitterErrorHandler
}

/**
 * The brief registry contract.
 *
 * @remarks
 * The array overload of `remove` is declared FIRST so an id list resolves to the batch
 * form. `add` takes the fleet's own `ManagerAddOptions` from `@orkestrel/interpret`;
 * omit its `id` and the record is keyed by the brief's own content hash, so re-adding
 * unchanged content is a version no-op.
 */
export interface BriefManagerInterface {
	readonly emitter: EmitterInterface<BriefManagerEventMap>
	readonly size: number
	has(id: string): boolean
	brief(id: string): BriefRecord | undefined
	briefs(): readonly BriefRecord[]
	add(brief: Brief, options?: ManagerAddOptions): BriefRecord
	remove(ids: readonly string[]): boolean
	remove(id: string): boolean
	remove(): void
	destroy(): void
}
