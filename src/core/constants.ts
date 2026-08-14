import type { OutputFormat, RiskSeverity, TaskDomain, TaskOperation } from './types.js'

/** The twelve `TaskOperation` values, frozen. */
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

/** The eight `TaskDomain` values, frozen. */
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

/** The five `OutputFormat` values, frozen. */
export const OUTPUT_FORMATS: readonly OutputFormat[] = Object.freeze([
	'markdown',
	'json',
	'code',
	'diff',
	'prose',
])

/** The three `RiskSeverity` values, frozen. */
export const RISK_SEVERITIES: readonly RiskSeverity[] = Object.freeze(['low', 'medium', 'high'])

/**
 * `16` — the default turn cap `briefToGoal` renders.
 *
 * @remarks
 * Domain-qualified so the barrel stays collision-free as sibling modules add their own
 * turn defaults.
 */
export const DEFAULT_BRIEF_TURNS = 16

/** `'gate'` — the id of the `gateDefinition()` logical definition. */
export const GATE_ID = 'gate'

/**
 * Every line terminator a brief field refuses.
 *
 * @remarks
 * The four ECMAScript line terminators, not just `\n`: a renderer that splits on any of
 * them would let the other three forge a markdown row. CRLF leads the alternation so a
 * Windows exemplar splits as ONE break rather than two, which would insert a blank line the
 * caller never wrote. Kept unanchored and stateless — no `g` flag — so `test` never carries
 * `lastIndex` between calls.
 */
export const LINE_BREAK_PATTERN = /\r\n|[\n\r\u2028\u2029]/

/**
 * The positive form of {@link LINE_BREAK_PATTERN}, for the shape DSL.
 *
 * @remarks
 * `stringShape`'s `pattern` must MATCH an accepted value, so the guard's refusal regex
 * cannot be reused directly. Both are derived from one character class, which is what
 * keeps the hand-composed guards and the compiled shapes refusing the same strings.
 */
export const SINGLE_LINE_PATTERN = /^[^\n\r\u2028\u2029]*$/

/**
 * A string that is empty or entirely spaces.
 *
 * @remarks
 * The one exemplar side `exampleToLines` must NOT pad. CommonMark strips a fully-blank code
 * span to nothing rather than one space from each end, so padding inflates an all-space value
 * while every other value needs the pad to keep its own boundary spaces.
 */
export const BLANK_PATTERN = /^ *$/
