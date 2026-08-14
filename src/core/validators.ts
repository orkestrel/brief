import type { Guard } from '@orkestrel/contract'
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
	AUTHORITY_ROLES,
	CITATION_ROLES,
	LINE_BREAK_PATTERN,
	OUTPUT_FORMATS,
	RISK_SEVERITIES,
	TASK_DOMAINS,
	TASK_OPERATIONS,
} from './constants.js'
import type {
	Authority,
	AuthorityRole,
	Brief,
	Citation,
	CitationRole,
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

/** `true` when the value is one of the seven `AuthorityRole` literals. */
export const isAuthorityRole: Guard<AuthorityRole> = literalOf(AUTHORITY_ROLES)

/** `true` when the value is one of the four `CitationRole` literals. */
export const isCitationRole: Guard<CitationRole> = literalOf(CITATION_ROLES)

/** `true` when the value is one of the five `OutputFormat` literals. */
export const isOutputFormat: Guard<OutputFormat> = literalOf(OUTPUT_FORMATS)

/** `true` when the value is one of the three `RiskSeverity` literals. */
export const isRiskSeverity: Guard<RiskSeverity> = literalOf(RISK_SEVERITIES)

/** `true` when the value is a well-formed `Task` — both vocabularies closed, statement one line. */
export const isTask: Guard<Task> = recordOf({
	operation: isTaskOperation,
	domain: isTaskDomain,
	statement: isLine,
})

/** `true` when the value is a well-formed `Authority` — `role` on the closed vocabulary. */
export const isAuthority: Guard<Authority> = recordOf({
	path: isLine,
	role: isAuthorityRole,
	note: isLine,
})

/** `true` when the value is a well-formed `Reference` — `role` is any single-line string. */
export const isReference: Guard<Reference> = recordOf(
	{
		path: isLine,
		role: isLine,
		note: isLine,
	},
	['note'],
)

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

/** `true` when the value is a well-formed `Citation` — `role` on the closed vocabulary. */
export const isCitation: Guard<Citation> = recordOf({
	name: isLine,
	role: isCitationRole,
	url: isLine,
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
		authority: arrayOf(isAuthority),
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
