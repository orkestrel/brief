import type { Interpretation } from '@orkestrel/interpret'
import type { OutputFormat, RiskSeverity, TaskDomain, TaskOperation } from './types.js'

/** Lists the `TaskOperation` values, frozen. */
export const TASK_OPERATIONS: readonly TaskOperation[] = Object.freeze([
	'create',
	'refactor',
	'debug',
	'extract',
	'migrate',
	'explain',
	'review',
	'optimize',
	'audit',
	'test',
	'document',
	'plan',
])

/** Lists the `TaskDomain` values, frozen. */
export const TASK_DOMAINS: readonly TaskDomain[] = Object.freeze([
	'code',
	'writing',
	'research',
	'analysis',
	'design',
	'data',
	'ops',
	'other',
])

/** Lists the `OutputFormat` values, frozen. */
export const OUTPUT_FORMATS: readonly OutputFormat[] = Object.freeze([
	'markdown',
	'json',
	'code',
	'diff',
	'prose',
])

/** Lists the `RiskSeverity` values, frozen. */
export const RISK_SEVERITIES: readonly RiskSeverity[] = Object.freeze(['low', 'medium', 'high'])

/**
 * Lists every published `Interpretation` member name, frozen.
 *
 * @remarks
 * The capture list `BriefCompiler` hands `captureValue` at each interpret door — the borrowed
 * engine's return, and the caller's supplied interpretation. A class instance carries its
 * contract on the prototype, so the captured view materializes exactly the members named here,
 * and a name missing from the list is a member the view drops.
 *
 * The `satisfies` clause refuses a name `Interpretation` does not declare, and it holds the
 * element type at the listed names rather than widening it to `string`. That is what lets the
 * equality assertion beside the capture cases refuse a list that has fallen short of the
 * published shape.
 */
export const INTERPRETATION_MEMBERS = Object.freeze([
	'text',
	'normalized',
	'intent',
	'entities',
	'subject',
	'definition',
	'mappings',
	'ambiguities',
	'prompt',
	'stages',
	'failures',
	'confidence',
	'digest',
] satisfies ReadonlyArray<keyof Interpretation>)

/**
 * Holds `16` — the default turn cap `briefToGoal` renders.
 *
 * @remarks
 * Domain-qualified so the barrel stays collision-free as sibling modules add their own
 * turn defaults.
 */
export const DEFAULT_BRIEF_TURNS = 16

/** Holds `'gate'` — the id of the `buildGateDefinition()` logical definition. */
export const GATE_ID = 'gate'

/**
 * Matches every line terminator a brief field refuses.
 *
 * @remarks
 * Every ECMAScript line terminator, not just `\n`: a renderer that splits on any of them
 * would let the others forge a markdown row. CRLF leads the alternation so a Windows
 * exemplar splits as ONE break rather than two, which would insert a blank line the caller
 * never wrote. Kept unanchored and stateless — no `g` flag — so `test` never carries
 * `lastIndex` between calls.
 */
export const LINE_BREAK_PATTERN = /\r\n|[\n\r\u2028\u2029]/

/**
 * Holds the positive form of {@link LINE_BREAK_PATTERN}, for the shape DSL.
 *
 * @remarks
 * `stringShape`'s `pattern` must MATCH an accepted value, so the guard's refusal regex
 * cannot be reused directly. Both are derived from one character class, which is what
 * keeps the hand-composed guards and the compiled shapes refusing the same strings.
 */
export const SINGLE_LINE_PATTERN = /^[^\n\r\u2028\u2029]*$/

/**
 * Matches a string of one or more spaces and nothing else.
 *
 * @remarks
 * The one exemplar side `exampleToLines` must NOT pad. CommonMark strips a fully-blank code
 * span to nothing rather than one space from each end, so padding inflates an all-space value
 * while every other value needs the pad to keep its own boundary spaces.
 *
 * `+` rather than `*`, because the EMPTY string is not that case: it has no spaces to
 * preserve, and withholding the pad emitted an empty backtick run that does not close.
 */
export const BLANK_PATTERN = /^ +$/
