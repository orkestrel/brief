import type { StringShape } from '@orkestrel/contract'
import {
	arrayShape,
	booleanShape,
	integerShape,
	literalShape,
	objectShape,
	optionalShape,
	stringShape,
} from '@orkestrel/contract'
import {
	OUTPUT_FORMATS,
	RISK_SEVERITIES,
	TASK_DOMAINS,
	TASK_OPERATIONS,
	SINGLE_LINE_PATTERN,
} from './constants.js'

/** A single-line string of any length, including empty. */
export const textShape: StringShape = stringShape({ pattern: SINGLE_LINE_PATTERN })

/** A non-empty single-line string — the shape mirror of `isLine`. */
export const lineShape: StringShape = stringShape({ min: 1, pattern: SINGLE_LINE_PATTERN })

/** The `Task` shape — closed operation and domain vocabularies plus a non-empty statement. */
export const taskShape = objectShape(
	{
		operation: literalShape(TASK_OPERATIONS),
		domain: literalShape(TASK_DOMAINS),
		statement: lineShape,
	},
	{ description: 'What the brief asks for, in one imperative sentence.' },
)

/** The `Reference` shape — a path and the note that justifies listing it. */
export const referenceShape = objectShape(
	{
		path: lineShape,
		note: lineShape,
	},
	{ description: 'One referenced path and why it is listed.' },
)

/** The `Manifest` shape — disjoint reference partitions. */
export const manifestShape = objectShape(
	{
		read: arrayShape(referenceShape),
		edit: arrayShape(referenceShape),
		locked: arrayShape(referenceShape),
		forbidden: arrayShape(referenceShape),
	},
	{ description: 'The disjoint file partitions of a brief.' },
)

/** The `Outcome` shape — a one-based rank, the result text, and whether it gates done. */
export const outcomeShape = objectShape(
	{
		rank: integerShape({ min: 1 }),
		text: lineShape,
		required: booleanShape(),
	},
	{ description: 'One ranked outcome — a result, never a step.' },
)

/** The `Given` shape — one categorized context fact. */
export const givenShape = objectShape(
	{
		category: lineShape,
		name: lineShape,
		value: textShape,
	},
	{ description: 'One context fact handed to the executor.' },
)

/** The `Example` shape — one input to output exemplar. */
export const exampleShape = objectShape(
	{
		input: stringShape({ min: 1 }),
		output: stringShape({ min: 1 }),
		note: optionalShape(lineShape),
	},
	{ description: 'One input to output exemplar.' },
)

/** The `Citation` shape — a name, a locator, and why the source is cited. */
export const citationShape = objectShape(
	{
		name: lineShape,
		url: lineShape,
		note: lineShape,
	},
	{ description: 'One external source; list order is the trust order.' },
)

/** The `Gap` shape — an unknown, whether it blocks, and the candidates that would close it. */
export const gapShape = objectShape(
	{
		field: lineShape,
		question: lineShape,
		blocking: booleanShape(),
		candidates: optionalShape(arrayShape(lineShape)),
	},
	{ description: 'One unresolved decision; blocking means the gate fails closed.' },
)

/** The `Risk` shape — a closed severity, the risk, and its mitigation. */
export const riskShape = objectShape(
	{
		severity: literalShape(RISK_SEVERITIES),
		text: lineShape,
		mitigation: lineShape,
	},
	{ description: 'One pre-empted risk and the mitigation that answers it.' },
)

/** The `Output` shape — a closed format plus its optional refinements. */
export const outputShape = objectShape(
	{
		format: literalShape(OUTPUT_FORMATS),
		sections: optionalShape(arrayShape(lineShape)),
		include: optionalShape(arrayShape(lineShape)),
		exclude: optionalShape(arrayShape(lineShape)),
	},
	{ description: 'The closed shape of the deliverable.' },
)

/** The `Proof` shape — the claim and the command that settles it. */
export const proofShape = objectShape(
	{
		text: lineShape,
		command: lineShape,
	},
	{ description: 'One mechanical, transcript-provable check.' },
)

/**
 * The whole `Brief` shape, section shapes composed.
 *
 * @remarks
 * `trace` and `hash` are optional because `pinBrief` fills them; an unpinned draft is
 * on-contract without them.
 */
export const briefShape = objectShape(
	{
		task: taskShape,
		authority: arrayShape(referenceShape),
		manifest: manifestShape,
		outcomes: arrayShape(outcomeShape),
		rules: arrayShape(lineShape),
		invariants: arrayShape(lineShape),
		givens: arrayShape(givenShape),
		examples: arrayShape(exampleShape),
		assumptions: arrayShape(lineShape),
		citations: arrayShape(citationShape),
		gaps: arrayShape(gapShape),
		risks: arrayShape(riskShape),
		output: outputShape,
		proofs: arrayShape(proofShape),
		trace: optionalShape(lineShape),
		hash: optionalShape(lineShape),
	},
	{ description: 'The closed execution contract one agent can run with no interpretation left.' },
)
