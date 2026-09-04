import type { Guard } from '@orkestrel/contract'
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
import {
	andOf,
	arrayOf,
	boundsOf,
	isBoolean,
	isInteger,
	isNonEmptyString,
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

/**
 * Checks whether the value is a string holding no line terminator, empty included.
 *
 * @remarks
 * `briefToMarkdown` renders each brief field as ONE markdown row, so a field carrying a
 * line break would forge a heading or an extra manifest row — which is how a rendered
 * prompt and `briefToDispatch`'s path sets could disagree about the same brief.
 *
 * @param value - The value to inspect.
 * @returns True if `value` is a string holding no line terminator, empty included; false
 *   otherwise.
 */
export const isText: Guard<string> = (value: unknown): value is string =>
	isString(value) && !LINE_BREAK_PATTERN.test(value)

/**
 * Checks whether the value is a non-empty string holding no line terminator.
 *
 * @param value - The value to inspect.
 * @returns True if `value` is a non-empty string holding no line terminator; false otherwise.
 */
export const isLine: Guard<string> = andOf(isNonEmptyString, isText)

/**
 * Checks whether the value is one of the `TaskOperation` literals.
 *
 * @param value - The value to inspect.
 * @returns True if `value` is one of the `TaskOperation` literals; false otherwise.
 */
export const isTaskOperation: Guard<TaskOperation> = literalOf(TASK_OPERATIONS)

/**
 * Checks whether the value is one of the `TaskDomain` literals.
 *
 * @param value - The value to inspect.
 * @returns True if `value` is one of the `TaskDomain` literals; false otherwise.
 */
export const isTaskDomain: Guard<TaskDomain> = literalOf(TASK_DOMAINS)

/**
 * Checks whether the value is one of the `OutputFormat` literals.
 *
 * @param value - The value to inspect.
 * @returns True if `value` is one of the `OutputFormat` literals; false otherwise.
 */
export const isOutputFormat: Guard<OutputFormat> = literalOf(OUTPUT_FORMATS)

/**
 * Checks whether the value is one of the `RiskSeverity` literals.
 *
 * @param value - The value to inspect.
 * @returns True if `value` is one of the `RiskSeverity` literals; false otherwise.
 */
export const isRiskSeverity: Guard<RiskSeverity> = literalOf(RISK_SEVERITIES)

/**
 * Checks whether the value is a well-formed `Task` — both vocabularies closed, statement one line.
 *
 * @param value - The value to inspect.
 * @returns True if `value` is a well-formed `Task`; false otherwise.
 */
export const isTask: Guard<Task> = recordOf({
	operation: isTaskOperation,
	domain: isTaskDomain,
	statement: isLine,
})

/**
 * Checks whether the value is a well-formed `Reference` — both members required, both single-line.
 *
 * @param value - The value to inspect.
 * @returns True if `value` is a well-formed `Reference`; false otherwise.
 */
export const isReference: Guard<Reference> = recordOf({
	path: isLine,
	note: isLine,
})

/**
 * Checks whether the value is a well-formed `Manifest`.
 *
 * @remarks
 * Partition presence only — disjointness is `validateBrief`'s semantic pass.
 *
 * @param value - The value to inspect.
 * @returns True if `value` is a well-formed `Manifest`; false otherwise.
 */
export const isManifest: Guard<Manifest> = recordOf({
	read: arrayOf(isReference),
	edit: arrayOf(isReference),
	locked: arrayOf(isReference),
	forbidden: arrayOf(isReference),
})

/**
 * Checks whether the value is a well-formed `Outcome` — `rank` a positive integer.
 *
 * @param value - The value to inspect.
 * @returns True if `value` is a well-formed `Outcome`; false otherwise.
 */
export const isOutcome: Guard<Outcome> = recordOf({
	rank: andOf(isInteger, boundsOf(1)),
	text: isLine,
	required: isBoolean,
})

/**
 * Checks whether the value is a well-formed `Given` — its `value` may be empty but stays one line.
 *
 * @param value - The value to inspect.
 * @returns True if `value` is a well-formed `Given`; false otherwise.
 */
export const isGiven: Guard<Given> = recordOf({
	category: isLine,
	name: isLine,
	value: isText,
})

/**
 * Checks whether the value is a well-formed `Example`.
 *
 * @remarks
 * An exemplar's two sides are the ONLY members a brief lets span lines, because they
 * carry code. `briefToMarkdown` fences them rather than rendering them as a row.
 *
 * @param value - The value to inspect.
 * @returns True if `value` is a well-formed `Example`; false otherwise.
 */
export const isExample: Guard<Example> = recordOf(
	{
		input: isNonEmptyString,
		output: isNonEmptyString,
		note: isLine,
	},
	['note'],
)

/**
 * Checks whether the value is a well-formed `Citation` — every member single-line.
 *
 * @param value - The value to inspect.
 * @returns True if `value` is a well-formed `Citation`; false otherwise.
 */
export const isCitation: Guard<Citation> = recordOf({
	name: isLine,
	url: isLine,
	note: isLine,
})

/**
 * Checks whether the value is a well-formed `Gap`.
 *
 * @param value - The value to inspect.
 * @returns True if `value` is a well-formed `Gap`; false otherwise.
 */
export const isGap: Guard<Gap> = recordOf(
	{
		field: isLine,
		question: isLine,
		blocking: isBoolean,
		candidates: arrayOf(isLine),
	},
	['candidates'],
)

/**
 * Checks whether the value is a well-formed `Risk` — `severity` on the closed vocabulary.
 *
 * @param value - The value to inspect.
 * @returns True if `value` is a well-formed `Risk`; false otherwise.
 */
export const isRisk: Guard<Risk> = recordOf({
	severity: isRiskSeverity,
	text: isLine,
	mitigation: isLine,
})

/**
 * Checks whether the value is a well-formed `Output` — `format` on the closed vocabulary.
 *
 * @param value - The value to inspect.
 * @returns True if `value` is a well-formed `Output`; false otherwise.
 */
export const isOutput: Guard<Output> = recordOf(
	{
		format: isOutputFormat,
		sections: arrayOf(isLine),
		include: arrayOf(isLine),
		exclude: arrayOf(isLine),
	},
	['sections', 'include', 'exclude'],
)

/**
 * Checks whether the value is a well-formed `Proof`.
 *
 * @param value - The value to inspect.
 * @returns True if `value` is a well-formed `Proof`; false otherwise.
 */
export const isProof: Guard<Proof> = recordOf({
	text: isLine,
	command: isLine,
})

/**
 * Checks whether the value satisfies the whole exact-record `Brief` contract.
 *
 * @remarks
 * Every section must be present; an extra key fails. `trace` and `hash` are the only
 * optional members, because `pinBrief` rather than the author fills them.
 *
 * @param value - The value to inspect.
 * @returns True if `value` satisfies the whole exact-record `Brief` contract; false otherwise.
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
