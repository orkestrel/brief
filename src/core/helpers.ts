import { attempt } from '@orkestrel/contract'
import type { Ambiguity, Entity, Intent } from '@orkestrel/interpret'
import { canonicalize, collapseWhitespace, digestValue } from '@orkestrel/interpret'
import type { LogicalDefinition, ReasonValidationResult, Rule, Subject } from '@orkestrel/reason'
import { atom, compound, formatField, logicalDefinition, rule } from '@orkestrel/reason'
import { snapshotBrief } from './cloners.js'
import { BriefError } from './errors.js'
import { DEFAULT_BRIEF_TURNS, GATE_ID, LINE_BREAK_PATTERN } from './constants.js'
import type {
	Brief,
	Citation,
	Dispatch,
	Example,
	Gap,
	Given,
	Manifest,
	Outcome,
	Output,
	OutputFormat,
	Proof,
	Reference,
	Risk,
	RiskSeverity,
	Task,
	TaskDomain,
	TaskOperation,
} from './types.js'
import { isBrief, isTaskDomain, isTaskOperation } from './validators.js'

/**
 * Build a `Task`.
 *
 * @param operation - What the brief asks for, from the closed operation vocabulary.
 * @param domain - The subject matter, from the closed domain vocabulary.
 * @param statement - One imperative sentence naming the object of the work.
 * @returns A fresh `Task`.
 *
 * @example
 * ```ts
 * import { task } from '@orkestrel/brief'
 *
 * task('refactor', 'code', 'Refactor useForm to native browser form APIs.')
 * ```
 */
export function task(operation: TaskOperation, domain: TaskDomain, statement: string): Task {
	return { operation, domain, statement }
}

/**
 * Build a `Reference`.
 *
 * @param path - The referenced path or glob.
 * @param note - Why the path is listed.
 * @returns A fresh `Reference`.
 *
 * @example
 * ```ts
 * import { reference } from '@orkestrel/brief'
 *
 * reference('AGENTS.md', 'project law') // { path: 'AGENTS.md', note: 'project law' }
 * ```
 */
export function reference(path: string, note: string): Reference {
	return { path, note }
}

/**
 * Build a `Manifest`, defaulting every absent partition to an empty list.
 *
 * @param partitions - The partitions to fill; a partial literal is enough.
 * @returns A fresh `Manifest` with all four partitions present.
 *
 * @example
 * ```ts
 * import { manifest, reference } from '@orkestrel/brief'
 *
 * manifest({ edit: [reference('src/core/helpers.ts', 'implementation')] })
 * ```
 */
export function manifest(partitions?: Partial<Manifest>): Manifest {
	return {
		read: partitions?.read ?? [],
		edit: partitions?.edit ?? [],
		locked: partitions?.locked ?? [],
		forbidden: partitions?.forbidden ?? [],
	}
}

/**
 * Build an `Outcome`.
 *
 * @param rank - The one-based rank; lower ranks matter more.
 * @param text - The result, never a step.
 * @param required - Whether the outcome gates "done"; defaults to `true`.
 * @returns A fresh `Outcome`.
 *
 * @example
 * ```ts
 * import { outcome } from '@orkestrel/brief'
 *
 * outcome(1, 'useForm uses native FormData with no behavior change') // required: true
 * outcome(2, 'the diff stays under 200 lines', false)
 * ```
 */
export function outcome(rank: number, text: string, required = true): Outcome {
	return { rank, text, required }
}

/**
 * Build a `Given`.
 *
 * @param category - The kind of fact — a convention, a version, a constraint.
 * @param name - The fact's name.
 * @param value - The fact's value, already rendered as text.
 * @returns A fresh `Given`.
 *
 * @example
 * ```ts
 * import { given } from '@orkestrel/brief'
 *
 * given('convention', 'indentation', 'tabs')
 * ```
 */
export function given(category: string, name: string, value: string): Given {
	return { category, name, value }
}

/**
 * Build an `Example`.
 *
 * @param input - The exemplar input.
 * @param result - The expected output for that input.
 * @param note - Optional detail; the key is OMITTED when absent.
 * @returns A fresh `Example`.
 *
 * @example
 * ```ts
 * import { example } from '@orkestrel/brief'
 *
 * example('<input required>', 'validity read from el.validity')
 * ```
 */
export function example(input: string, result: string, note?: string): Example {
	return note === undefined ? { input, output: result } : { input, output: result, note }
}

/**
 * Build a `Citation`.
 *
 * @param name - The source's display name.
 * @param url - Where the source lives.
 * @param note - Why the source is cited.
 * @returns A fresh `Citation`.
 *
 * @example
 * ```ts
 * import { citation } from '@orkestrel/brief'
 *
 * citation(
 * 	'MDN Constraint Validation',
 * 	'https://developer.mozilla.org/',
 * 	'the native validity behavior being adopted',
 * )
 * ```
 */
export function citation(name: string, url: string, note: string): Citation {
	return { name, url, note }
}

/**
 * Build a `Gap`.
 *
 * @param field - The brief section the unknown belongs to.
 * @param question - The question that would close it.
 * @param overrides - Optional `blocking` (defaults `false`) and `candidates`; an absent
 *   `candidates` key is OMITTED entirely.
 * @returns A fresh `Gap`.
 *
 * @example
 * ```ts
 * import { gap } from '@orkestrel/brief'
 *
 * gap('rules', 'Should validation message wording change?') // blocking: false
 * gap('output', 'Diff or full files?', { blocking: true, candidates: ['diff', 'code'] })
 * ```
 */
export function gap(
	field: string,
	question: string,
	overrides?: Partial<Omit<Gap, 'field' | 'question'>>,
): Gap {
	const blocking = overrides?.blocking ?? false
	return overrides?.candidates === undefined
		? { field, question, blocking }
		: { field, question, blocking, candidates: overrides.candidates }
}

/**
 * Build a `Risk`.
 *
 * @param severity - The closed severity.
 * @param text - What could go wrong.
 * @param mitigation - What answers it.
 * @returns A fresh `Risk`.
 *
 * @example
 * ```ts
 * import { risk } from '@orkestrel/brief'
 *
 * risk('medium', 'native validation differs subtly', 'assert message and state in tests')
 * ```
 */
export function risk(severity: RiskSeverity, text: string, mitigation: string): Risk {
	return { severity, text, mitigation }
}

/**
 * Build an `Output`.
 *
 * @param format - The closed deliverable format.
 * @param overrides - Optional `sections` / `include` / `exclude`; absent keys are OMITTED.
 * @returns A fresh `Output`.
 *
 * @example
 * ```ts
 * import { output } from '@orkestrel/brief'
 *
 * output('markdown') // { format: 'markdown' }
 * output('diff', { include: ['updated useForm.ts'] })
 * ```
 */
export function output(format: OutputFormat, overrides?: Partial<Omit<Output, 'format'>>): Output {
	return {
		format,
		...(overrides?.sections === undefined ? {} : { sections: overrides.sections }),
		...(overrides?.include === undefined ? {} : { include: overrides.include }),
		...(overrides?.exclude === undefined ? {} : { exclude: overrides.exclude }),
	}
}

/**
 * Build a `Proof`.
 *
 * @param text - What the check settles.
 * @param command - The command whose exit signal settles it.
 * @returns A fresh `Proof`.
 *
 * @example
 * ```ts
 * import { proof } from '@orkestrel/brief'
 *
 * proof('type-check and lint pass', 'npm run check')
 * ```
 */
export function proof(text: string, command: string): Proof {
	return { text, command }
}

/**
 * Build a `Brief` from a `Task` plus section overrides.
 *
 * @param subject - The task the brief is about.
 * @param overrides - Any sections to fill; every absent collection defaults to `[]`,
 *   `output` defaults to `output('markdown')`, and `trace` / `hash` stay OMITTED so
 *   `pinBrief` can fill them.
 * @returns A fresh, unpinned `Brief`.
 *
 * @example
 * ```ts
 * import { brief, outcome, proof, task } from '@orkestrel/brief'
 *
 * brief(task('audit', 'code', 'Audit the barrel for undocumented exports.'), {
 * 	outcomes: [outcome(1, 'every export appears in the guide')],
 * 	proofs: [proof('parity passes', 'npm run test:guides')],
 * })
 * ```
 */
export function brief(subject: Task, overrides?: Partial<Omit<Brief, 'task'>>): Brief {
	return {
		task: subject,
		authority: overrides?.authority ?? [],
		manifest: overrides?.manifest ?? manifest(),
		outcomes: overrides?.outcomes ?? [],
		rules: overrides?.rules ?? [],
		invariants: overrides?.invariants ?? [],
		givens: overrides?.givens ?? [],
		examples: overrides?.examples ?? [],
		assumptions: overrides?.assumptions ?? [],
		citations: overrides?.citations ?? [],
		gaps: overrides?.gaps ?? [],
		risks: overrides?.risks ?? [],
		output: overrides?.output ?? output('markdown'),
		proofs: overrides?.proofs ?? [],
		...(overrides?.trace === undefined ? {} : { trace: overrides.trace }),
		...(overrides?.hash === undefined ? {} : { hash: overrides.hash }),
	}
}

/**
 * Build the fail-closed readiness gate as a reasons `LogicalDefinition`.
 *
 * @remarks
 * Six readiness rules each derive one named fact from `briefToSubject`'s measures, and a
 * final `ready` rule conjoins all six. Forward chaining reports the LAST rule's
 * conclusion, so `LogicalResult.conclusion` is exactly `ready`.
 *
 * The gate takes NO parameters, and that is deliberate rather than unfinished. The
 * reasoner overlays every derived fact into one flat namespace, so a caller rule named
 * for a readiness fact overwrites it and `ready` then conjoins a fact no base rule
 * proved — a refusal silently becomes a pass. Readiness is this package's contract, not
 * a caller setting. A caller who needs different readiness composes their own
 * `LogicalDefinition` over `briefToSubject` and evaluates it on their own reasoner; both
 * are exported for exactly that, and neither can reach this definition.
 *
 * @returns A fresh `LogicalDefinition` with id `GATE_ID`.
 *
 * @example
 * ```ts
 * import { briefToSubject, gateDefinition } from '@orkestrel/brief'
 * import { createLogicalReasoner, createReason } from '@orkestrel/reason'
 *
 * const reason = createReason({ reasoners: [createLogicalReasoner()] })
 * const verdict = reason.reason(briefToSubject(pinned), gateDefinition())
 * reason.destroy()
 * ```
 */
export function gateDefinition(): LogicalDefinition {
	const readiness: readonly Rule[] = [
		rule('specified', [atom('blocking', 'equals', 0)], atom('specified', 'equals', true)),
		rule(
			'aimed',
			[compound('and', [atom('outcomes', 'above', 0), atom('required', 'above', 0)])],
			atom('aimed', 'equals', true),
		),
		rule('proven', [atom('proofs', 'above', 0)], atom('proven', 'equals', true)),
		rule('disjoint', [atom('overlaps', 'equals', 0)], atom('disjoint', 'equals', true)),
		rule('granted', [atom('ungranted', 'equals', 0)], atom('granted', 'equals', true)),
		rule('single', [atom('sentences', 'equals', 1)], atom('single', 'equals', true)),
	]
	return logicalDefinition(GATE_ID, 'Brief readiness', [
		...readiness,
		rule(
			'ready',
			[
				compound(
					'and',
					readiness.map((entry) => atom(entry.id, 'equals', true)),
				),
			],
			atom('ready', 'equals', true),
		),
	])
}

/**
 * The readiness rules a brief fails, computed directly from its own measures.
 *
 * @remarks
 * The gate's decision, in code. `gateDefinition()` states the same six rules as data for a
 * reasoner to narrate, and a narration is not a decision: `BriefCompilerOptions.reason` lets a
 * caller supply the engine, and an engine that answers "met" to everything would otherwise
 * emit a brief with no proofs. `compile` refuses on THIS and keeps the verdict for its
 * trace, so a supplied engine can add detail and never remove a refusal.
 *
 * The two must agree. `tests/src/core/helpers.test.ts` drives both over one value set, which
 * is what stops the data and the code from drifting apart.
 *
 * @param source - The brief to measure.
 * @returns The unmet rule ids, in gate order; empty when the brief is ready.
 *
 * @example
 * ```ts
 * import { brief, findUnmetRules, outcome, proof, task } from '@orkestrel/brief'
 *
 * findUnmetRules(brief(task('plan', 'ops', 'Plan the release.'))) // ['aimed', 'proven']
 * findUnmetRules(
 * 	brief(task('plan', 'ops', 'Plan the release.'), {
 * 		outcomes: [outcome(1, 'shipped')],
 * 		proofs: [proof('x', 'npm test')],
 * 	}),
 * ) // []
 * ```
 */
export function findUnmetRules(source: Brief): readonly string[] {
	const unready: string[] = []
	if (findBlockingGaps(source).length !== 0) unready.push('specified')
	if (
		source.outcomes.length === 0 ||
		source.outcomes.filter((entry) => entry.required).length === 0
	)
		unready.push('aimed')
	if (source.proofs.length === 0) unready.push('proven')
	if (findManifestOverlaps(source).length !== 0) unready.push('disjoint')
	if (findUngrantedAuthority(source).length !== 0) unready.push('granted')
	if (countSentences(source.task.statement) !== 1) unready.push('single')
	return unready
}

/**
 * Count the sentences a statement holds.
 *
 * @remarks
 * A terminator run (`.`, `!`, `?`) followed by whitespace or the end of the text closes
 * one sentence; text with no terminator at all is still one sentence. An embedded
 * abbreviation therefore reads as a boundary, which is why `validateBrief` reports the
 * count rather than guessing at intent.
 *
 * @param statement - The statement to measure.
 * @returns The sentence count; `0` for empty or whitespace-only text.
 *
 * @example
 * ```ts
 * import { countSentences } from '@orkestrel/brief'
 *
 * countSentences('Refactor useForm to native APIs.') // 1
 * countSentences('Refactor useForm. Then update the tests.') // 2
 * countSentences('') // 0
 * ```
 */
export function countSentences(statement: string): number {
	const text = collapseWhitespace(statement)
	if (text.length === 0) return 0
	const matches = text.match(/[.!?]+(?=\s|$)/gu)
	return matches === null ? 1 : matches.length
}

/**
 * The gaps that block emission.
 *
 * @param source - The brief to inspect.
 * @returns Every gap carrying `blocking: true`, in declaration order.
 *
 * @example
 * ```ts
 * import { brief, findBlockingGaps, gap, task } from '@orkestrel/brief'
 *
 * const draft = brief(task('plan', 'ops', 'Plan the release.'), {
 * 	gaps: [gap('output', 'Diff or files?', { blocking: true })],
 * })
 * findBlockingGaps(draft).length // 1
 * ```
 */
export function findBlockingGaps(source: Brief): readonly Gap[] {
	return source.gaps.filter((entry) => entry.blocking)
}

/**
 * The authority paths the manifest never grants access to.
 *
 * @remarks
 * An authority the executor cannot open is an instruction it cannot follow, so every ranked
 * path must appear in `read`, `edit`, or `locked`. Those three are the grants: `locked` is a
 * grant, because read-only is exactly what obeying a file requires.
 *
 * This subsumes the narrower question of an authority sitting in `forbidden`. The four
 * partitions are disjoint — `findManifestOverlaps` and the `disjoint` rule enforce it — so a
 * forbidden path is in none of the three grants and is reported here. An authority named in
 * NO partition at all is reported for the same reason, and that is the case a forbidden-only
 * check misses entirely: the brief simply never says the executor may open what it must obey.
 *
 * Paths are compared as EXACT strings, matching `findManifestOverlaps`. A glob is never
 * expanded, so `read: 'guides/**'` does not grant `authority: 'guides/brief.md'`. State a
 * grant as the same literal path the authority carries.
 *
 * @param source - The brief to inspect.
 * @returns Each ungranted authority path once, in authority order; empty when all are granted.
 *
 * @example
 * ```ts
 * import { brief, findUngrantedAuthority, manifest, reference, task } from '@orkestrel/brief'
 *
 * const draft = brief(task('debug', 'code', 'Fix the leak.'), {
 * 	authority: [reference('AGENTS.md', 'project law')],
 * 	manifest: manifest(),
 * })
 * findUngrantedAuthority(draft) // ['AGENTS.md'] — ranked, but no partition opens it
 * ```
 */
export function findUngrantedAuthority(source: Brief): readonly string[] {
	const granted = new Set(
		[...source.manifest.read, ...source.manifest.edit, ...source.manifest.locked].map(
			(entry) => entry.path,
		),
	)
	const ungranted: string[] = []
	for (const path of new Set(source.authority.map((entry) => entry.path))) {
		if (!granted.has(path)) ungranted.push(path)
	}
	return ungranted
}

/**
 * The paths appearing in more than one manifest partition.
 *
 * @remarks
 * Duplicates WITHIN one partition are not an overlap; the four partitions must be
 * mutually disjoint, which is what `validateBrief` errors on.
 *
 * Paths are compared as EXACT strings. A glob is never expanded, so `edit: 'app/file.ts'`
 * and `forbidden: 'app/**'` are not reported as an overlap even though a walker would place
 * one inside the other. Disjointness here is a property of the written paths.
 *
 * @param source - The brief to inspect.
 * @returns Each overlapping path once, in first-seen partition order.
 *
 * @example
 * ```ts
 * import { brief, findManifestOverlaps, manifest, reference, task } from '@orkestrel/brief'
 *
 * const draft = brief(task('debug', 'code', 'Fix the leak.'), {
 * 	manifest: manifest({
 * 		edit: [reference('src/core/BriefCompiler.ts', 'the leaking pipeline')],
 * 		locked: [reference('src/core/BriefCompiler.ts', 'the published contract')],
 * 	}),
 * })
 * findManifestOverlaps(draft) // ['src/core/BriefCompiler.ts']
 * ```
 */
export function findManifestOverlaps(source: Brief): readonly string[] {
	const counts = new Map<string, number>()
	const partitions: ReadonlyArray<readonly Reference[]> = [
		source.manifest.read,
		source.manifest.edit,
		source.manifest.locked,
		source.manifest.forbidden,
	]
	for (const partition of partitions) {
		for (const path of new Set(partition.map((entry) => entry.path))) {
			counts.set(path, (counts.get(path) ?? 0) + 1)
		}
	}
	const overlaps: string[] = []
	for (const [path, count] of counts) {
		if (count > 1) overlaps.push(path)
	}
	return overlaps
}

/**
 * The open gaps with no assumption to stand on.
 *
 * @remarks
 * The discipline is exactly one recorded assumption per open gap, so the open gaps past
 * the assumption count are the unpaired ones. A blocking gap is never unpaired — it is
 * a question, not something to assume around.
 *
 * @param source - The brief to inspect.
 * @returns The surplus open gaps, in declaration order.
 *
 * @example
 * ```ts
 * import { brief, findUnpairedGaps, gap, task } from '@orkestrel/brief'
 *
 * const draft = brief(task('plan', 'ops', 'Plan the release.'), {
 * 	gaps: [gap('rules', 'Keep the wording?'), gap('output', 'Diff or files?')],
 * 	assumptions: ['Wording is preserved.'],
 * })
 * findUnpairedGaps(draft).length // 1
 * ```
 */
export function findUnpairedGaps(source: Brief): readonly Gap[] {
	return source.gaps.filter((entry) => !entry.blocking).slice(source.assumptions.length)
}

/**
 * Project a brief into the reasons `Subject` of readiness measures the gate reads.
 *
 * @param source - The brief to measure.
 * @returns A flat record of counts plus the task's two vocabulary values.
 *
 * @example
 * ```ts
 * import { brief, briefToSubject, proof, task } from '@orkestrel/brief'
 *
 * briefToSubject(brief(task('test', 'code', 'Cover the gate.'), { proofs: [proof('x', 'y')] }))
 * // { operation: 'test', domain: 'code', sentences: 1, proofs: 1, … }
 * ```
 */
export function briefToSubject(source: Brief): Subject {
	return {
		operation: source.task.operation,
		domain: source.task.domain,
		sentences: countSentences(source.task.statement),
		authority: source.authority.length,
		gaps: source.gaps.length,
		blocking: findBlockingGaps(source).length,
		unpaired: findUnpairedGaps(source).length,
		outcomes: source.outcomes.length,
		required: source.outcomes.filter((entry) => entry.required).length,
		proofs: source.proofs.length,
		reads: source.manifest.read.length,
		edits: source.manifest.edit.length,
		locks: source.manifest.locked.length,
		bans: source.manifest.forbidden.length,
		overlaps: findManifestOverlaps(source).length,
		ungranted: findUngrantedAuthority(source).length,
		risks: source.risks.length,
		examples: source.examples.length,
	}
}

/**
 * The semantic pass over an already-shape-valid brief.
 *
 * @remarks
 * ERRORS are the structural violations no assumption can paper over: a manifest
 * overlap, an authority no partition grants access to, an empty `proofs` list, and a
 * statement that is not exactly one sentence.
 * WARNINGS are runnable but suspicious: duplicate outcome ranks, an unpaired open gap,
 * and an optional outcome ranked above a required one. Never throws.
 *
 * @param source - The brief to inspect.
 * @returns A reasons `ReasonValidationResult`; `valid` exactly when `errors` is empty.
 *
 * @example
 * ```ts
 * import { brief, proof, task, validateBrief } from '@orkestrel/brief'
 *
 * validateBrief(brief(task('plan', 'ops', 'Plan the release.'))) // valid: false — no proofs
 * validateBrief(
 * 	brief(task('plan', 'ops', 'Plan the release.'), { proofs: [proof('ok', 'npm test')] }),
 * ) // valid: true
 * ```
 */
export function validateBrief(source: Brief): ReasonValidationResult {
	const errors: string[] = []
	const warnings: string[] = []

	for (const path of findManifestOverlaps(source)) {
		errors.push(`Path "${path}" appears in more than one manifest partition`)
	}
	for (const path of findUngrantedAuthority(source)) {
		errors.push(
			`Authority "${path}" is in no manifest partition that grants access — the executor cannot obey what it cannot open`,
		)
	}
	if (source.proofs.length === 0) {
		errors.push('Brief records no proof — nothing can settle "done"')
	}
	const sentences = countSentences(source.task.statement)
	if (sentences !== 1) {
		errors.push(
			`Statement holds ${String(sentences)} sentences — a compound statement is two briefs`,
		)
	}

	const ranks = new Map<number, number>()
	for (const entry of source.outcomes) ranks.set(entry.rank, (ranks.get(entry.rank) ?? 0) + 1)
	for (const [rank, count] of ranks) {
		if (count > 1) warnings.push(`Outcome rank ${String(rank)} is used ${String(count)} times`)
	}
	for (const entry of findUnpairedGaps(source)) {
		warnings.push(`Open gap "${entry.field}" has no paired assumption`)
	}
	const required = source.outcomes.filter((entry) => entry.required).map((entry) => entry.rank)
	if (required.length > 0) {
		const floor = Math.min(...required)
		for (const entry of source.outcomes) {
			if (!entry.required && entry.rank < floor) {
				warnings.push(
					`Outcome ${String(entry.rank)} is optional but outranks every required outcome`,
				)
			}
		}
	}

	return { valid: errors.length === 0, errors, warnings }
}

/**
 * The canonical structural digest of a brief's content.
 *
 * @remarks
 * `trace` and `hash` are stripped before digesting, so the value is the identity of what
 * the brief SAYS rather than of a particular pinning. Deterministic across runs — the
 * same interprets `digestValue` the fleet uses everywhere else.
 *
 * @param source - The brief to digest.
 * @returns An eight-hex-digit digest.
 *
 * @example
 * ```ts
 * import { brief, briefToHash, pinBrief, task } from '@orkestrel/brief'
 *
 * const draft = brief(task('plan', 'ops', 'Plan the release.'))
 * briefToHash(draft) === briefToHash(pinBrief(draft)) // true — pinning does not move it
 * ```
 */
export function briefToHash(source: Brief): string {
	return digestValue(briefToContent(source))
}

/**
 * The canonical text of exactly what a brief's hash describes.
 *
 * @remarks
 * `trace` and `hash` are stripped, then interprets `canonicalize` renders the rest in a
 * key-order-stable form. Two briefs with the same hash are the same brief only when this
 * text matches — the digest is eight hex digits, so hash equality alone is not identity.
 *
 * @param source - The brief to render.
 * @returns The canonical content text.
 *
 * @example
 * ```ts
 * import { brief, briefToContent, pinBrief, task } from '@orkestrel/brief'
 *
 * const draft = brief(task('plan', 'ops', 'Plan the release.'))
 * briefToContent(draft) === briefToContent(pinBrief(draft)) // true — pinning adds no content
 * ```
 */
export function briefToContent(source: Brief): string {
	const { trace: _trace, hash: _hash, ...content } = source
	return canonicalize(content)
}

/**
 * Freeze a value and everything reachable from it.
 *
 * @remarks
 * `Object.freeze` is SHALLOW, so freezing a record leaves every nested array and object
 * writable. A `Briefing` is documented as a replayable record, and a shallow freeze let a
 * consumer rewrite the recorded stage input after the digest describing it was already
 * sealed — the replay and its hash could disagree.
 *
 * Cycles terminate: `structuredClone` preserves them, so a naive walk would not return.
 * Delegates each branch to `freezeBranch` with the shared visited set.
 *
 * @param value - The value to freeze in place; returned for convenience.
 * @returns The same value, now deeply frozen.
 *
 * @example
 * ```ts
 * import { freezeDeep } from '@orkestrel/brief'
 *
 * const owned = freezeDeep({ outcomes: [{ rank: 1 }] })
 * Object.isFrozen(owned.outcomes) // true — the nested array too
 * ```
 */
export function freezeDeep<T>(value: T): T {
	return freezeBranch(value, new WeakSet())
}

/**
 * Freeze one branch of a value graph, skipping what the visited set already holds.
 *
 * @param value - The branch to freeze.
 * @param seen - The objects already frozen on this walk; what makes a cycle terminate.
 * @returns The same branch, now frozen.
 *
 * @example
 * ```ts
 * import { freezeBranch } from '@orkestrel/brief'
 *
 * freezeBranch({ a: [1] }, new WeakSet()) // frozen, one level of nesting included
 * ```
 */
export function freezeBranch<T>(value: T, seen: WeakSet<object>): T {
	if (value === null || typeof value !== 'object') return value
	if (seen.has(value)) return value
	seen.add(value)
	Object.freeze(value)
	for (const nested of Object.values(value)) freezeBranch(nested, seen)
	return value
}

/**
 * Render a value thrown by a stage into a message.
 *
 * @remarks
 * TOTAL: it never throws, for any input. That is load-bearing rather than tidy, because this
 * is the containment code itself — `compile` calls it inside the `catch` that turns a thrown
 * stage into a recorded `BriefStageFailure`. A throw here escapes `compile` uncontained and
 * falsifies the package's central promise that a failing stage yields an incomplete
 * `Briefing` rather than an exception.
 *
 * Three real inputs used to throw: an `Error` subclass whose `message` getter throws, a value
 * whose string conversion throws, and a null-prototype object, which has no inherited
 * conversion for String() to reach. Each is wrapped, and an unreadable value degrades to its
 * type rather than propagating.
 *
 * @param error - The caught value, of any shape.
 * @returns The `Error` message when there is one, otherwise the value stringified; a fixed
 *   description when the value cannot be read at all.
 *
 * @example
 * ```ts
 * import { errorToMessage } from '@orkestrel/brief'
 *
 * errorToMessage(new Error('boom')) // 'boom'
 * errorToMessage('boom') // 'boom'
 * errorToMessage(Object.create(null)) // 'an unreadable object was thrown'
 * ```
 */
export function errorToMessage(error: unknown): string {
	const read = attempt(() => (error instanceof Error ? error.message : String(error)))
	if (read.success && typeof read.value === 'string') return read.value
	return `an unreadable ${typeof error} was thrown`
}

/**
 * Narrow unknown data to a `Brief`, throwing when it is off-contract.
 *
 * @remarks
 * The throwing half of the intake pair: this returns its argument by IDENTITY once the
 * guard passes, while `parseBrief` returns `undefined` for bad input. It constructs
 * nothing, so it is an assertion rather than a factory. Reserve it for programmer-error
 * contexts where invalidity is a bug.
 *
 * @param data - The candidate brief data.
 * @returns The same value, now known to satisfy {@link Brief}.
 * @throws {@link BriefError} `INVALID` when `data` fails `isBrief`.
 *
 * @example
 * ```ts
 * import { assertBrief, brief, proof, task } from '@orkestrel/brief'
 *
 * assertBrief(brief(task('plan', 'ops', 'Plan the release.'), { proofs: [proof('x', 'y')] }))
 * assertBrief({ task: { operation: 'plan', domain: 'ops', statement: 'x.' } }) // throws INVALID
 * ```
 */
export function assertBrief(data: unknown): Brief {
	if (!isBrief(data)) {
		throw new BriefError('INVALID', 'Brief failed the exact-record contract', { field: 'brief' })
	}
	return data
}

/**
 * Return a fresh brief with `trace` and `hash` derived from its own content.
 *
 * @remarks
 * Deterministic: no clock, no randomness, no run-specific data. Any existing `trace` /
 * `hash` is stripped before the digest, so pinning is idempotent and a re-pin of unchanged
 * content produces the same hash.
 *
 * The snapshot is taken FIRST, before any member is read, so a hostile input whose getters
 * throw surfaces as this package's coded error rather than as whatever it threw.
 *
 * @param source - The brief to pin.
 * @returns A fresh, pinned, deeply frozen `Brief`.
 * @throws {@link BriefError} `INVALID` when the brief carries data JSON cannot express.
 *
 * @example
 * ```ts
 * import { brief, pinBrief, task } from '@orkestrel/brief'
 *
 * const pinned = pinBrief(brief(task('document', 'writing', 'Write the brief guide.')))
 * pinned.hash // an 8-hex-digit structural digest
 * pinned.trace // 'document/writing · outcomes:0 · gaps:0/0 · proofs:0'
 * ```
 */
export function pinBrief(source: Brief): Brief {
	const owned = snapshotBrief(source)
	const { trace: _trace, hash: _hash, ...content } = owned
	const blocking = findBlockingGaps(owned).length
	const trace = [
		`${owned.task.operation}/${owned.task.domain}`,
		`outcomes:${String(owned.outcomes.length)}`,
		`gaps:${String(blocking)}/${String(owned.gaps.length)}`,
		`proofs:${String(owned.proofs.length)}`,
	].join(' · ')
	return snapshotBrief({ ...content, trace, hash: briefToHash(owned) })
}

/**
 * Render one exemplar as markdown lines.
 *
 * @remarks
 * An `Example`'s two sides are the only brief members permitted to span lines, so a
 * single-line pair renders as one row and a multi-line pair renders as a fenced block.
 * Fencing is what stops the one permissive field from forging a heading.
 *
 * @param entry - The exemplar to render.
 * @returns The markdown lines, without a trailing blank.
 *
 * @example
 * ```ts
 * import { example, exampleToLines } from '@orkestrel/brief'
 *
 * exampleToLines(example('<input required>', 'el.validity')) // ['- `<input required>` → `el.validity`']
 * ```
 */
export function exampleToLines(entry: Example): readonly string[] {
	const note = entry.note === undefined ? '' : ` (${entry.note})`
	// The longest unbroken backtick run across both sides, so the delimiter can outrun it.
	let runs = 0
	let current = 0
	for (const character of `${entry.input} ${entry.output}`) {
		current = character === '`' ? current + 1 : 0
		if (current > runs) runs = current
	}
	if (!LINE_BREAK_PATTERN.test(entry.input) && !LINE_BREAK_PATTERN.test(entry.output)) {
		// The inline delimiter outruns the content too. A fixed single backtick is closed by an
		// exemplar containing one, which puts the rest of the value outside the code span.
		// CommonMark strips one leading and trailing space, so a padded span survives content
		// that begins or ends with a backtick.
		//
		// ALWAYS padded, not only when the content carries a backtick. CommonMark strips exactly
		// one space from each end of a code span, so padding is lossless — while withholding it
		// deleted an exemplar's own boundary spaces, silently changing the value the executor
		// reads. An all-spaces side is the one value no padding can preserve; it renders empty,
		// and no fence choice fixes that.
		const tick = '`'.repeat(runs + 1)
		const pad = ' '
		return [
			`- ${tick}${pad}${entry.input}${pad}${tick} → ${tick}${pad}${entry.output}${pad}${tick}${note}`,
		]
	}
	// The fence must outrun the content. A fixed three-backtick fence is closed by an
	// exemplar that contains one, which puts the rest of the example back into the
	// document as structure.
	const fence = '`'.repeat(Math.max(3, runs) + 1)
	return [
		`- exemplar${note}`,
		'',
		`  ${fence}text`,
		...entry.input.split(LINE_BREAK_PATTERN).map((line) => `  ${line}`),
		`  ${fence}`,
		'',
		`  ${fence}text`,
		...entry.output.split(LINE_BREAK_PATTERN).map((line) => `  ${line}`),
		`  ${fence}`,
	]
}

/**
 * Project a brief into the copy-ready agent prompt.
 *
 * @remarks
 * Paths are REFERENCED, never inlined — the executor retrieves them. An empty section is
 * omitted entirely, so the rendering carries no filler an executor must read past.
 *
 * @param source - The brief to render.
 * @returns The markdown prompt.
 *
 * @example
 * ```ts
 * import { brief, briefToMarkdown, task } from '@orkestrel/brief'
 *
 * briefToMarkdown(brief(task('review', 'code', 'Review the gate rules.')))
 * // '# Brief: Review the gate rules.\n\nreview · code\n\n## Output\n\n- format: markdown\n'
 * ```
 */
export function briefToMarkdown(input: Brief): string {
	const source = snapshotBrief(input)
	const lines: string[] = [`# Brief: ${source.task.statement}`, '']
	lines.push(`${source.task.operation} · ${source.task.domain}`, '')
	if (source.trace !== undefined) lines.push(`Trace: ${source.trace}`, '')
	if (source.hash !== undefined) lines.push(`Hash: ${source.hash}`, '')

	if (source.authority.length > 0) {
		lines.push('## Authority (ranked)', '')
		lines.push(
			...source.authority.map(
				(entry, index) => `${String(index + 1)}. ${entry.path} — ${entry.note}`,
			),
		)
		lines.push('')
	}

	const partitions: ReadonlyArray<readonly [string, readonly Reference[]]> = [
		['Read', source.manifest.read],
		['Edit', source.manifest.edit],
		['Locked', source.manifest.locked],
		['Forbidden', source.manifest.forbidden],
	]
	if (partitions.some((partition) => partition[1].length > 0)) {
		lines.push('## Manifest', '')
		for (const [heading, entries] of partitions) {
			if (entries.length === 0) continue
			lines.push(`### ${heading}`, '')
			lines.push(...entries.map((entry) => `- ${entry.path} — ${entry.note}`))
			lines.push('')
		}
	}

	if (source.outcomes.length > 0) {
		lines.push('## Outcomes', '')
		lines.push(
			...source.outcomes.map(
				(entry) =>
					`${String(entry.rank)}. ${entry.text}${entry.required ? ' (required)' : ' (optional)'}`,
			),
		)
		lines.push('')
	}

	const prose: ReadonlyArray<readonly [string, readonly string[]]> = [
		['Rules', source.rules],
		['Invariants', source.invariants],
		['Assumptions', source.assumptions],
	]
	for (const [heading, entries] of prose) {
		if (entries.length === 0) continue
		lines.push(`## ${heading}`, '')
		lines.push(...entries.map((entry) => `- ${entry}`))
		lines.push('')
	}

	if (source.givens.length > 0) {
		lines.push('## Givens', '')
		lines.push(
			...source.givens.map((entry) => `- ${entry.category} · ${entry.name}: ${entry.value}`),
		)
		lines.push('')
	}

	if (source.examples.length > 0) {
		lines.push('## Examples', '')
		for (const entry of source.examples) {
			lines.push(...exampleToLines(entry))
		}
		lines.push('')
	}

	if (source.citations.length > 0) {
		lines.push('## Citations (trust order)', '')
		lines.push(
			...source.citations.map(
				(entry, index) => `${String(index + 1)}. ${entry.name} — ${entry.note} — ${entry.url}`,
			),
		)
		lines.push('')
	}

	if (source.gaps.length > 0) {
		lines.push('## Gaps', '')
		lines.push(
			...source.gaps.map((entry) => {
				const mark = entry.blocking ? 'blocking' : 'open'
				const candidates =
					entry.candidates === undefined ? '' : ` (candidates: ${entry.candidates.join(', ')})`
				return `- [${mark}] ${entry.field}: ${entry.question}${candidates}`
			}),
		)
		lines.push('')
	}

	if (source.risks.length > 0) {
		lines.push('## Risks', '')
		lines.push(
			...source.risks.map((entry) => `- ${entry.severity}: ${entry.text} — ${entry.mitigation}`),
		)
		lines.push('')
	}

	lines.push('## Output', '', `- format: ${source.output.format}`)
	const refinements: ReadonlyArray<readonly [string, readonly string[] | undefined]> = [
		['sections', source.output.sections],
		['include', source.output.include],
		['exclude', source.output.exclude],
	]
	for (const [label, entries] of refinements) {
		if (entries === undefined || entries.length === 0) continue
		lines.push(`- ${label}: ${entries.join(', ')}`)
	}
	lines.push('')

	if (source.proofs.length > 0) {
		lines.push('## Proofs', '')
		lines.push(...source.proofs.map((entry) => `- ${entry.text} — \`${entry.command}\``))
		lines.push('')
	}

	return lines.join('\n')
}

/**
 * Project a brief into a `/goal` completion condition.
 *
 * @remarks
 * The proofs' commands VERBATIM plus a turn cap — the goal never adds a condition the
 * brief does not carry.
 *
 * @param source - The brief to render.
 * @param turns - The turn cap; defaults to `DEFAULT_BRIEF_TURNS`.
 * @returns The one-line completion condition.
 *
 * @example
 * ```ts
 * import { brief, briefToGoal, proof, task } from '@orkestrel/brief'
 *
 * briefToGoal(brief(task('test', 'code', 'Cover the gate.'), { proofs: [proof('x', 'npm test')] }))
 * // 'Done when every proof passes: npm test exits 0. Cap: 16 turns.'
 * ```
 */
export function briefToGoal(input: Brief, turns: number = DEFAULT_BRIEF_TURNS): string {
	// Every projection takes ONE owned reading. A shifting `proofs` getter would otherwise let
	// this emit a command that was not in the reading the contract validated.
	const source = snapshotBrief(input)
	const conditions =
		source.proofs.length === 0
			? 'no proofs recorded'
			: source.proofs.map((entry) => `${entry.command} exits 0`).join('; ')
	return `Done when every proof passes: ${conditions}. Cap: ${String(turns)} turns.`
}

/**
 * Project a brief into a subagent `Dispatch`.
 *
 * @remarks
 * `edit` is exactly `manifest.edit`, so two dispatches whose `edit` sets do not intersect
 * can run concurrently under the same brief without conflict.
 *
 * `authority` is exactly `brief.authority` in rank order, and it is a SEPARATE axis from the
 * four permission sets rather than a fifth partition — a ranked path normally also appears in
 * `read` or `locked`, because the executor has to open what it obeys. It is projected as
 * paths so a machine consumer never has to parse `prompt`, which is written for a model.
 *
 * @param source - The brief to project.
 * @returns The dispatch — the rendered prompt, the ranked authority, and the four path sets.
 *
 * @example
 * ```ts
 * import { brief, briefToDispatch, manifest, reference, task } from '@orkestrel/brief'
 *
 * const draft = brief(task('migrate', 'code', 'Migrate the stores.'), {
 * 	authority: [reference('AGENTS.md', 'project law')],
 * 	manifest: manifest({ edit: [reference('src/core/stores/**', 'the legacy stores')] }),
 * })
 * briefToDispatch(draft).edit // ['src/core/stores/**']
 * briefToDispatch(draft).authority // ['AGENTS.md']
 * ```
 */
export function briefToDispatch(input: Brief): Dispatch {
	// Both halves derive from ONE owned reading of the caller's value. `briefToMarkdown`
	// snapshots again, but of `source` rather than of `input`, and re-snapshotting an owned
	// frozen record is idempotent — so the prompt and the path arrays cannot disagree. Reading
	// the CALLER's value twice is what let a shifting getter put a row in the prompt that the
	// path arrays do not contain.
	const source = snapshotBrief(input)
	return {
		prompt: briefToMarkdown(source),
		authority: source.authority.map((entry) => entry.path),
		read: source.manifest.read.map((entry) => entry.path),
		edit: source.manifest.edit.map((entry) => entry.path),
		locked: source.manifest.locked.map((entry) => entry.path),
		forbidden: source.manifest.forbidden.map((entry) => entry.path),
	}
}

/**
 * Derive one imperative statement from free text.
 *
 * @remarks
 * Whitespace collapses, the first character uppercases, and a terminator is appended
 * when the text carries none. Nothing else is invented.
 *
 * @param text - The raw request text.
 * @returns The statement, or `''` for empty or whitespace-only text.
 *
 * @example
 * ```ts
 * import { deriveStatement } from '@orkestrel/brief'
 *
 * deriveStatement('  clean up   useForm ') // 'Clean up useForm.'
 * deriveStatement('') // ''
 * ```
 */
export function deriveStatement(text: string): string {
	const collapsed = collapseWhitespace(text)
	if (collapsed.length === 0) return ''
	const capitalized = collapsed.charAt(0).toUpperCase() + collapsed.slice(1)
	return /[.!?]$/u.test(capitalized) ? capitalized : `${capitalized}.`
}

/**
 * Derive a `Task` from an interprets `Intent` through the caller's vocabularies.
 *
 * @remarks
 * The vocabularies are the CALLER's policy: this maps and never guesses. An action or
 * domain the caller did not map — or mapped to an off-vocabulary value — yields
 * `undefined` rather than an invented task. Inherited keys never resolve.
 *
 * @param intent - The classified intent from an interpret pipeline.
 * @param text - The text the statement derives from.
 * @param actions - Maps an intent action onto a closed `TaskOperation`.
 * @param domains - Maps an intent domain onto a closed `TaskDomain`.
 * @returns The derived `Task`, or `undefined` when either side is unmapped.
 *
 * @example
 * ```ts
 * import { deriveTask } from '@orkestrel/brief'
 *
 * const intent = { action: 'migrate', domain: 'code', confidence: 1 }
 * deriveTask(intent, 'migrate the stores', { migrate: 'migrate' }, { code: 'code' })
 * // { operation: 'migrate', domain: 'code', statement: 'Migrate the stores.' }
 * deriveTask(intent, 'migrate the stores', {}, { code: 'code' }) // undefined
 * ```
 */
export function deriveTask(
	intent: Intent,
	text: string,
	actions: Readonly<Record<string, TaskOperation>>,
	domains: Readonly<Record<string, TaskDomain>>,
): Task | undefined {
	const operation = Object.hasOwn(actions, intent.action) ? actions[intent.action] : undefined
	const domain = Object.hasOwn(domains, intent.domain) ? domains[intent.domain] : undefined
	if (!isTaskOperation(operation) || !isTaskDomain(domain)) return undefined
	const statement = deriveStatement(text)
	return statement.length === 0 ? undefined : task(operation, domain, statement)
}

/**
 * Derive `Given[]` from an interprets `Entity[]`.
 *
 * @remarks
 * Every extracted entity becomes one `extracted` fact. A nameless entity is dropped; an
 * object value renders through interprets `canonicalize`, so the text is key-order stable.
 *
 * @param entities - The entities an interpret pipeline extracted.
 * @returns One `Given` per named entity, in extraction order.
 *
 * @example
 * ```ts
 * import { deriveGivens } from '@orkestrel/brief'
 *
 * deriveGivens([
 * 	{ name: 'value', value: 3, provenance: { category: 'extracted' }, confidence: 1 },
 * ]) // [{ category: 'extracted', name: 'value', value: '3' }]
 * ```
 */
export function deriveGivens(entities: readonly Entity[]): readonly Given[] {
	return entities
		.filter((entity) => entity.name.length > 0)
		.map((entity) =>
			given(
				'extracted',
				entity.name,
				typeof entity.value === 'string'
					? entity.value
					: typeof entity.value === 'object' && entity.value !== null
						? canonicalize(entity.value)
						: String(entity.value),
			),
		)
}

/**
 * Derive `Gap[]` from an interprets `Ambiguity[]`.
 *
 * @remarks
 * A REQUIRED ambiguity becomes a BLOCKING gap — the gate must fail closed on it. The
 * rest stay open, to be answered with a recorded assumption. An array field path flattens
 * through reasons `formatField`.
 *
 * @param ambiguities - The ambiguities an interpret pipeline surfaced.
 * @returns One `Gap` per ambiguity, in surfacing order.
 *
 * @example
 * ```ts
 * import { deriveGaps } from '@orkestrel/brief'
 *
 * deriveGaps([{ field: 'output', question: 'Diff or files?', candidates: [], required: true }])
 * // [{ field: 'output', question: 'Diff or files?', blocking: true }]
 * ```
 */
export function deriveGaps(ambiguities: readonly Ambiguity[]): readonly Gap[] {
	return ambiguities.map((ambiguity) => {
		const candidates = ambiguity.candidates.filter((candidate) => candidate.length > 0)
		return gap(formatField(ambiguity.field), ambiguity.question, {
			blocking: ambiguity.required,
			...(candidates.length === 0 ? {} : { candidates }),
		})
	})
}
