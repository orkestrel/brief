import type { Guard } from '@orkestrel/contract'
import type { LogicalResult, RuleResult } from '@orkestrel/reason'
import {
	andOf,
	arrayOf,
	boundsOf,
	isBoolean,
	isInteger,
	isNonEmptyString,
	isNumber,
	isString,
	literalOf,
	recordOf,
} from '@orkestrel/contract'
import {
	LINE_BREAK_PATTERN,
	OUTPUT_FORMATS,
	RISK_SEVERITIES,
	TASK_DOMAINS,
	TASK_OPERATIONS,
} from './constants.js'
import type {
	Brief,
	Citation,
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

/**
 * `true` when the value is a string holding no line terminator, empty included.
 *
 * @remarks
 * `briefToMarkdown` renders each brief field as ONE markdown row, so a field carrying a
 * line break would forge a heading or an extra manifest row — which is how a rendered
 * prompt and `briefToDispatch`'s path sets could disagree about the same brief.
 */
export const isText: Guard<string> = (value: unknown): value is string =>
	isString(value) && !LINE_BREAK_PATTERN.test(value)

/** `true` when the value is a non-empty string holding no line terminator. */
export const isLine: Guard<string> = andOf(isNonEmptyString, isText)

/** `true` when the value is one of the twelve `TaskOperation` literals. */
export const isTaskOperation: Guard<TaskOperation> = literalOf(TASK_OPERATIONS)

/** `true` when the value is one of the eight `TaskDomain` literals. */
export const isTaskDomain: Guard<TaskDomain> = literalOf(TASK_DOMAINS)

/** `true` when the value is one of the five `OutputFormat` literals. */
export const isOutputFormat: Guard<OutputFormat> = literalOf(OUTPUT_FORMATS)

/** `true` when the value is one of the three `RiskSeverity` literals. */
export const isRiskSeverity: Guard<RiskSeverity> = literalOf(RISK_SEVERITIES)

/**
 * `true` when the value is a non-null object whose named members can be read.
 *
 * @remarks
 * Wider than the contract package's plain-record guard, which refuses any object carrying its
 * own prototype — a class instance among them. The verdict guards below narrow FOREIGN
 * interfaces, and an
 * interface is satisfied by a class instance as readily as by a literal — refusing one is the
 * same narrowing-past-the-contract mistake that made an exact-record verdict guard fail the
 * gate closed on a valid engine.
 *
 * Arrays are excluded because no interface this narrows is an array, and admitting one would
 * let index access stand in for member access.
 */
export const isObject: Guard<Record<string, unknown>> = (
	value: unknown,
): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * `true` when the value is a well-formed reasons `RuleResult`.
 *
 * @remarks
 * `@orkestrel/reason` publishes the type but no guard for it, and `BriefCompiler` reads these
 * off a BORROWED engine's return value, so the shape has to be checked rather than trusted.
 */
export const isRuleVerdict: Guard<RuleResult> = (value: unknown): value is RuleResult =>
	isObject(value) &&
	isNonEmptyString(value['id']) &&
	isBoolean(value['applied']) &&
	arrayOf(isBoolean)(value['premises']) &&
	isBoolean(value['conclusion'])

/**
 * `true` when the value is a well-formed reasons `LogicalResult`.
 *
 * @remarks
 * The gate's reasoner is supplied by the caller through `BriefCompilerOptions.reason`, so its
 * return value is FOREIGN data no matter how well-typed the interface is. `BriefCompiler`
 * dereferences `reasoning`, `conclusion`, and `rules`; checking one field left a malformed
 * result to throw a raw `TypeError` out of `compile`, from the very code that contains stage
 * failures. Total: returns `false` for `undefined`, `null`, and every off-shape value.
 *
 * Checks the WHOLE published shape rather than only the three members read today, because a
 * guard that narrows to `LogicalResult` while ignoring four of its members is unsound.
 *
 * OPEN on unknown keys, deliberately. The exact-record combinator this file uses elsewhere
 * refuses a value a FOREIGN interface permits: `LogicalResult` is a TypeScript interface,
 * so a conforming reasoner returning a richer result is still returning a `LogicalResult`. An
 * exact check refused it and failed the gate closed on a valid engine — trading a loud crash
 * for a wrong refusal, which is the worse of the two. Exactness belongs on records this
 * package OWNS, where an extra key means the caller misunderstood the contract.
 *
 * `count` is checked as a number rather than an integer for the same reason: the published
 * type says `number`, and narrowing past a foreign contract is the same mistake.
 */
export const isLogicalVerdict: Guard<LogicalResult> = (value: unknown): value is LogicalResult =>
	isObject(value) &&
	value['reasoning'] === 'logical' &&
	isBoolean(value['conclusion']) &&
	arrayOf(isRuleVerdict)(value['rules']) &&
	isNumber(value['count']) &&
	isBoolean(value['success']) &&
	arrayOf(isString)(value['trace']) &&
	arrayOf(isString)(value['errors'])

/** `true` when the value is a well-formed `Task` — both vocabularies closed, statement one line. */
export const isTask: Guard<Task> = recordOf({
	operation: isTaskOperation,
	domain: isTaskDomain,
	statement: isLine,
})

/** `true` when the value is a well-formed `Reference` — both members required, both single-line. */
export const isReference: Guard<Reference> = recordOf({
	path: isLine,
	note: isLine,
})

/**
 * `true` when the value is a well-formed `Manifest`.
 *
 * @remarks
 * Partition presence only — disjointness is `validateBrief`'s semantic pass.
 */
export const isManifest: Guard<Manifest> = recordOf({
	read: arrayOf(isReference),
	edit: arrayOf(isReference),
	locked: arrayOf(isReference),
	forbidden: arrayOf(isReference),
})

/** `true` when the value is a well-formed `Outcome` — `rank` a positive integer. */
export const isOutcome: Guard<Outcome> = recordOf({
	rank: andOf(isInteger, boundsOf(1)),
	text: isLine,
	required: isBoolean,
})

/** `true` when the value is a well-formed `Given` — `value` may be empty but stays one line. */
export const isGiven: Guard<Given> = recordOf({
	category: isLine,
	name: isLine,
	value: isText,
})

/**
 * `true` when the value is a well-formed `Example`.
 *
 * @remarks
 * An exemplar's two sides are the ONLY members a brief lets span lines, because they
 * carry code. `briefToMarkdown` fences them rather than rendering them as a row.
 */
export const isExample: Guard<Example> = recordOf(
	{
		input: isNonEmptyString,
		output: isNonEmptyString,
		note: isLine,
	},
	['note'],
)

/** `true` when the value is a well-formed `Citation` — all three members single-line. */
export const isCitation: Guard<Citation> = recordOf({
	name: isLine,
	url: isLine,
	note: isLine,
})

/** `true` when the value is a well-formed `Gap`. */
export const isGap: Guard<Gap> = recordOf(
	{
		field: isLine,
		question: isLine,
		blocking: isBoolean,
		candidates: arrayOf(isLine),
	},
	['candidates'],
)

/** `true` when the value is a well-formed `Risk` — `severity` on the closed vocabulary. */
export const isRisk: Guard<Risk> = recordOf({
	severity: isRiskSeverity,
	text: isLine,
	mitigation: isLine,
})

/** `true` when the value is a well-formed `Output` — `format` on the closed vocabulary. */
export const isOutput: Guard<Output> = recordOf(
	{
		format: isOutputFormat,
		sections: arrayOf(isLine),
		include: arrayOf(isLine),
		exclude: arrayOf(isLine),
	},
	['sections', 'include', 'exclude'],
)

/** `true` when the value is a well-formed `Proof`. */
export const isProof: Guard<Proof> = recordOf({
	text: isLine,
	command: isLine,
})

/**
 * `true` when the value satisfies the whole exact-record `Brief` contract.
 *
 * @remarks
 * Every section must be present; an extra key fails. `trace` and `hash` are the only
 * optional members, because `pinBrief` rather than the author fills them.
 */
export const isBrief: Guard<Brief> = recordOf(
	{
		task: isTask,
		authority: arrayOf(isReference),
		manifest: isManifest,
		outcomes: arrayOf(isOutcome),
		rules: arrayOf(isLine),
		invariants: arrayOf(isLine),
		givens: arrayOf(isGiven),
		examples: arrayOf(isExample),
		assumptions: arrayOf(isLine),
		citations: arrayOf(isCitation),
		gaps: arrayOf(isGap),
		risks: arrayOf(isRisk),
		output: isOutput,
		proofs: arrayOf(isProof),
		trace: isLine,
		hash: isLine,
	},
	['trace', 'hash'],
)
