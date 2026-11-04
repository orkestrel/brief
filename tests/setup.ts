import {
	briefShape,
	citationShape,
	exampleShape,
	gapShape,
	givenShape,
	isBrief,
	isCitation,
	isExample,
	isGap,
	isGiven,
	isManifest,
	isOutcome,
	isOutput,
	isProof,
	isReference,
	isRisk,
	isTask,
	manifestShape,
	outcomeShape,
	outputShape,
	proofShape,
	referenceShape,
	riskShape,
	taskShape,
	textShape,
	lineShape,
	isText,
	isLine,
} from '@src/core'
import { createContract } from '@orkestrel/contract'
import type {
	Brief,
	BriefErrorCode,
	BriefInput,
	BriefManagerInterface,
	Manifest,
	Task,
	Outcome,
	Reference,
} from '@src/core'
import type {
	Ambiguity,
	Entity,
	FieldMapping,
	Intent,
	Interpretation,
	InterpretInterface,
	StageFailure,
	StageRecord,
} from '@orkestrel/interpret'
import type {
	Check,
	CheckState,
	EvaluatorInterface,
	LogicalResult,
	ReasonInterface,
	ReasonResult,
	RuleResult,
} from '@orkestrel/reason'
import {
	buildBrief,
	buildManifest,
	buildOutcome,
	buildProof,
	buildReference,
	buildTask,
	isBriefError,
} from '@src/core'
import { createInterpret } from '@orkestrel/interpret'
import { numberShape, objectShape } from '@orkestrel/contract'
import { createQuantitativeDefinition, createReason } from '@orkestrel/reason'

/** Holds the single rule result the counting and stable engines agree on for a first read. */
export const FIRST_RULE: RuleResult = Object.freeze({
	id: 'ready',
	state: 'met',
	checks: Object.freeze([]),
	premises: Object.freeze(['met'] as const),
})

/** Holds the refused rule a captured shifting verdict must retain. */
export const CAPTURED_RULE: RuleResult = Object.freeze({
	id: 'captured',
	state: 'unmet',
	checks: Object.freeze([]),
	premises: Object.freeze(['unmet'] as const),
})

/** Returns the canonical valid task every fixture builds on. */
export function buildReadyTask(): Task {
	return buildTask('refactor', 'code', 'Refactor useForm to native browser form APIs.')
}

/** Returns a manifest whose partitions are populated and disjoint. */
export function buildReadyManifest(): Manifest {
	return buildManifest({
		read: [buildReference('AGENTS.md', 'project law')],
		edit: [buildReference('src/browser/composables/useForm.ts', 'the composable being refactored')],
		locked: [buildReference('src/browser/types.ts', 'the published contract')],
		forbidden: [buildReference('app/**', 'out of scope')],
	})
}

/**
 * Returns a gate-passing brief: one sentence, a required outcome, a proof, disjoint partitions.
 * Override any section to build the near-miss a specific assertion needs.
 */
export function buildReadyBrief(overrides?: Partial<Omit<Brief, 'task'>>): Brief {
	return buildBrief(buildReadyTask(), {
		manifest: buildReadyManifest(),
		outcomes: [buildOutcome(1, 'useForm uses native FormData with no behavior change')],
		proofs: [buildProof('type-check and lint pass', 'npm run check')],
		...overrides,
	})
}

/** Returns a `BriefInput` the gate passes: a task, a disjoint manifest, one outcome, one proof. */
export function buildReadyInput(): BriefInput {
	return {
		task: buildReadyTask(),
		manifest: buildReadyManifest(),
		outcomes: [buildOutcome(1, 'useForm uses native FormData with no behavior change')],
		proofs: [buildProof('type-check and lint pass', 'npm run check')],
	}
}

/**
 * Returns a real interpret pipeline driven by an injected extractor.
 *
 * @remarks
 * `createInterpret`'s `extractor` option is the package's own documented injection seam,
 * so nothing project-owned is replaced. Pass `matched: false` to register no recipe,
 * which is how the pipeline raises its own required ambiguity.
 */
export function buildInterpret(
	action: string,
	domain: string,
	matched: boolean,
): InterpretInterface {
	return createInterpret({
		extractor: {
			extract: () => ({ intent: { action, domain, confidence: 1 }, numbers: [3] }),
		},
		recipes: matched
			? [
					{
						id: 'migration',
						name: 'Migration',
						domain,
						intents: [action],
						mappings: [{ entity: 'count', aliases: ['stores'], field: 'count' }],
						shape: objectShape({ count: numberShape() }),
						computations: [],
						definition: createQuantitativeDefinition('migration', 'Migration', []),
					},
				]
			: [],
	})
}

/**
 * Returns an interpret engine whose `interpret` throws, for driving the `interpret`
 * stage's failure.
 *
 * @remarks
 * A boundary stub, not a fake: every other member delegates to a REAL `createInterpret`
 * instance, so nothing project-owned is reimplemented. Only the one method under test is
 * scripted.
 *
 * A throwing extractor does not reach `BriefCompiler` — `@orkestrel/interpret` contains its
 * own stage failures and returns a degraded `Interpretation` rather than throwing. So
 * `INTERPRET_FAILED` is reachable only through a FOREIGN `InterpretInterface`, which
 * `BriefCompilerOptions.interpret` publishes as a seam. This is that caller.
 */
export function buildFailingInterpret(): InterpretInterface {
	const real = createInterpret()
	return {
		get emitter() {
			return real.emitter
		},
		interpret: () => {
			throw new Error('the interpret engine failed')
		},
		add: (recipe) => {
			real.add(recipe)
		},
		// `remove` is an overload set, which an object literal cannot restate: an arrow
		// delegating to all three arms returns `boolean | void` and matches no arm. A bound
		// reference carries the whole set and keeps the real engine as its receiver.
		remove: real.remove.bind(real),
		recipe: (id) => real.recipe(id),
		recipes: () => real.recipes(),
		describe: (definition) => real.describe(definition),
		narrate: (result) => real.narrate(result),
		destroy: () => {
			real.destroy()
		},
	}
}

/**
 * Returns an interpret engine whose entity carries whatever value the caller names.
 *
 * @remarks
 * A boundary stub: every member delegates to a REAL `createInterpret`, and only the returned
 * `Interpretation` is decorated. `Entity.value` is declared `unknown` by
 * `@orkestrel/interpret`, so a function or a class instance is a CONFORMING value — which is
 * the point. It also always raises one required ambiguity, so a brief built from it is
 * genuinely under-specified and the gate must refuse it.
 *
 * @param value - The entity value to carry; pass a non-JSON value to drive the ownership
 *   boundary's clone fallback.
 */
export function buildForeignInterpret(value: unknown): InterpretInterface {
	const real = createInterpret({
		extractor: {
			extract: () => ({
				intent: { action: 'migrate', domain: 'code', confidence: 1 },
				numbers: [],
			}),
		},
	})
	return {
		get emitter() {
			return real.emitter
		},
		interpret: (text: string) => ({
			...real.interpret(text),
			entities: [{ name: 'callback', value, provenance: { category: 'computed' }, confidence: 1 }],
			ambiguities: [
				{ field: 'output', question: 'Diff or files?', candidates: [], required: true },
			],
		}),
		add: (recipe) => {
			real.add(recipe)
		},
		remove: real.remove.bind(real),
		recipe: (id) => real.recipe(id),
		recipes: () => real.recipes(),
		describe: (definition) => real.describe(definition),
		narrate: (result) => real.narrate(result),
		destroy: () => {
			real.destroy()
		},
	}
}

/**
 * Implements a conforming `Interpretation` carried entirely by prototype getters — the
 * class satisfies the interface, and `structuredClone` keeps own members only, so the
 * compiler's ownership copy arrives with every member missing. The vector the
 * interpret-stage guard exists for: type-valid at the engine, malformed after the clone.
 */
export class AccessorInterpretation {
	get text(): string {
		return 'migrate the stores'
	}

	get normalized(): string {
		return 'migrate the stores'
	}

	get intent(): Intent {
		return { action: 'migrate', domain: 'code', confidence: 1 }
	}

	get entities(): readonly Entity[] {
		return []
	}

	get mappings(): readonly FieldMapping[] {
		return []
	}

	get ambiguities(): readonly Ambiguity[] {
		return []
	}

	get prompt(): string {
		return ''
	}

	get stages(): readonly StageRecord[] {
		return []
	}

	get failures(): readonly StageFailure[] {
		return []
	}

	get repairs(): readonly [] {
		return []
	}
	get defaulted(): readonly [] {
		return []
	}

	get confidence(): number {
		return 1
	}

	get digest(): string {
		return 'accessor'
	}
}

/**
 * Implements a conforming supplied interpretation whose prototype getters change after
 * their first read. The compiler must draft from one captured view rather than guard one
 * reading and draft another.
 */
export class ShiftingAccessorInterpretation implements Interpretation {
	#text = 0
	#intent = 0
	#entities = 0
	#digest = 0

	get text(): string {
		this.#text += 1
		return this.#text === 1 ? 'migrate the captured stores' : 'audit the forged stores'
	}

	get normalized(): string {
		return 'migrate the captured stores'
	}

	get intent(): Intent {
		this.#intent += 1
		return this.#intent === 1
			? { action: 'migrate', domain: 'code', confidence: 1 }
			: { action: 'audit', domain: 'ops', confidence: 1 }
	}

	get entities(): readonly Entity[] {
		this.#entities += 1
		return [
			{
				name: 'reading',
				value: this.#entities === 1 ? 'captured' : 'forged',
				provenance: { category: 'computed' },
				confidence: 1,
			},
		]
	}

	get mappings(): readonly FieldMapping[] {
		return []
	}

	get ambiguities(): readonly Ambiguity[] {
		return []
	}

	get prompt(): string {
		return ''
	}

	get stages(): readonly StageRecord[] {
		return []
	}

	get failures(): readonly StageFailure[] {
		return []
	}

	get repairs(): readonly [] {
		return []
	}
	get defaulted(): readonly [] {
		return []
	}

	get confidence(): number {
		return 1
	}

	get digest(): string {
		this.#digest += 1
		return this.#digest === 1 ? 'captured' : 'forged'
	}
}

/**
 * Implements a conforming engine interpretation with shifting prototype getters and a
 * function-valued `Entity.value`. The entity member forces the clone fallback and names
 * the retained leaf.
 */
export class ShiftingForeignInterpretation implements Interpretation {
	#text = 0
	#intent = 0
	#digest = 0
	readonly entities: readonly Entity[] = Object.freeze([
		Object.freeze({
			name: 'callback',
			value: Math.max,
			provenance: Object.freeze({ category: 'computed' }),
			confidence: 1,
		}),
	])

	get text(): string {
		this.#text += 1
		return this.#text === 1 ? 'migrate the captured stores' : 'audit the forged stores'
	}

	get normalized(): string {
		return 'migrate the captured stores'
	}

	get intent(): Intent {
		this.#intent += 1
		return this.#intent === 1
			? { action: 'migrate', domain: 'code', confidence: 1 }
			: { action: 'audit', domain: 'ops', confidence: 1 }
	}

	get mappings(): readonly FieldMapping[] {
		return []
	}

	get ambiguities(): readonly Ambiguity[] {
		return []
	}

	get prompt(): string {
		return ''
	}

	get stages(): readonly StageRecord[] {
		return []
	}

	get failures(): readonly StageFailure[] {
		return []
	}

	get repairs(): readonly [] {
		return []
	}
	get defaulted(): readonly [] {
		return []
	}

	get confidence(): number {
		return 1
	}

	get digest(): string {
		this.#digest += 1
		return this.#digest === 1 ? 'captured' : 'forged'
	}
}

/** Returns a borrowed engine that yields the shifting function-valued interpretation. */
export function buildShiftingInterpret(): InterpretInterface {
	const real = createInterpret()
	return {
		get emitter() {
			return real.emitter
		},
		interpret: () => new ShiftingForeignInterpretation(),
		add: (recipe) => {
			real.add(recipe)
		},
		remove: real.remove.bind(real),
		recipe: (id) => real.recipe(id),
		recipes: () => real.recipes(),
		describe: (definition) => real.describe(definition),
		narrate: (result) => real.narrate(result),
		destroy: () => {
			real.destroy()
		},
	}
}

/**
 * Returns a borrowed engine whose `interpret` yields a CONFORMING class-instance
 * `Interpretation` that the ownership clone cannot carry — see
 * {@link AccessorInterpretation}. Every other member delegates to a real engine.
 */
export function buildAccessorInterpret(): InterpretInterface {
	const real = createInterpret()
	return {
		get emitter() {
			return real.emitter
		},
		interpret: () => new AccessorInterpretation(),
		add: (recipe) => {
			real.add(recipe)
		},
		remove: real.remove.bind(real),
		recipe: (id) => real.recipe(id),
		recipes: () => real.recipes(),
		describe: (definition) => real.describe(definition),
		narrate: (result) => real.narrate(result),
		destroy: () => {
			real.destroy()
		},
	}
}

/**
 * Values a total guard must refuse without throwing.
 *
 * @remarks
 * Includes a self-referential object and a null-prototype record, so a guard that walks
 * structure or reads inherited keys fails here rather than in production.
 */
export function buildAdversarialValues(): readonly unknown[] {
	const cyclic: Record<string, unknown> = {}
	cyclic['self'] = cyclic
	const hostile: Record<string, unknown> = Object.create(null)
	hostile['__proto__'] = { polluted: true }
	return [
		undefined,
		null,
		0,
		Number.NaN,
		-0,
		'',
		'brief',
		true,
		[],
		[1, 2],
		{},
		cyclic,
		hostile,
		new Map(),
		new Set(),
		Symbol('brief'),
		() => undefined,
	]
}

/**
 * Reads a caught value's `BriefErrorCode` without branching at the assertion site.
 *
 * @remarks
 * Returns `undefined` for anything that is not a `BriefError`, so one unconditional
 * `expect` covers both the narrowing and the code.
 */
export function readBriefCode(error: unknown): BriefErrorCode | undefined {
	return isBriefError(error) ? error.code : undefined
}

/**
 * Returns an evaluator that reports every check met.
 *
 * @remarks
 * `createLogicalReasoner`'s `evaluator` is `@orkestrel/reason`'s own published injection
 * point, so this drives the REAL reasoner over a permissive check oracle rather than
 * replacing any project-owned behaviour. It is the engine a caller could legitimately pass
 * through `BriefCompilerOptions.reason`, and the reason readiness cannot be delegated to it.
 */
export function buildPermissiveEvaluator(): EvaluatorInterface {
	return {
		id: 'permissive',
		evaluate: (check: Check) => ({ field: check.field, state: 'met', actual: true }),
		batch: (checks: readonly Check[]) =>
			checks.map((check) => ({ field: check.field, state: 'met', actual: true })),
	}
}

/**
 * Returns a reasons engine whose verdict answers differently on every read after the first.
 *
 * @remarks
 * Registered through `createReason`'s published `reasoners` seam, so the REAL engine runs and
 * only the verdict it yields is scripted. Every member except `reasoning` is a counting
 * getter — `reasoning` cannot vary without lying about its literal type, and the other six
 * carry the property.
 *
 * Pair with `buildStableReason`, which returns each member's FIRST answer as static data. Two
 * briefings that compare equal prove `BriefCompiler` read the foreign verdict exactly once.
 */
export function buildCountingReason(): ReasonInterface {
	// One counter PER MEMBER. A single shared counter would only ever give the first member
	// read its first answer, which measures read ORDER rather than read count.
	const reads = { conclusion: 0, rules: 0, count: 0, success: 0, trace: 0, errors: 0 }
	return createReason({
		reasoners: [
			{
				id: 'counting',
				reasoning: 'logical',
				supports: () => true,
				validate: () => ({ valid: true, errors: [], warnings: [] }),
				reason: () => ({
					reasoning: 'logical',
					faults: [],
					repairs: [],
					defaulted: [],
					get conclusion() {
						reads.conclusion += 1
						return reads.conclusion === 1 ? 'met' : 'unmet'
					},
					get rules() {
						reads.rules += 1
						return reads.rules === 1 ? [FIRST_RULE] : []
					},
					get count() {
						reads.count += 1
						return reads.count === 1 ? 1 : 99
					},
					get success() {
						reads.success += 1
						return reads.success === 1
					},
					get trace() {
						reads.trace += 1
						return reads.trace === 1 ? ['ready'] : []
					},
					get errors() {
						reads.errors += 1
						return reads.errors === 1 ? [] : ['forged']
					},
				}),
			},
		],
	})
}

/**
 * Returns the static twin of `buildCountingReason` — each member's first answer, as plain
 * data.
 */
export function buildStableReason(): ReasonInterface {
	return createReason({
		reasoners: [
			{
				id: 'stable',
				reasoning: 'logical',
				supports: () => true,
				validate: () => ({ valid: true, errors: [], warnings: [] }),
				reason: () => ({
					reasoning: 'logical',
					faults: [],
					repairs: [],
					defaulted: [],
					conclusion: 'met',
					rules: [FIRST_RULE],
					count: 1,
					success: true,
					trace: ['ready'],
					errors: [],
				}),
			},
		],
	})
}

/** Returns a reasons engine whose uncloneable logical result shifts after its captured answers. */
export function buildShiftingReason(): ReasonInterface {
	return createReason({
		reasoners: [
			{
				id: 'shifting',
				reasoning: 'logical',
				supports: () => true,
				validate: () => ({ valid: true, errors: [], warnings: [] }),
				reason: () => new ShiftingLogicalResult(),
			},
		],
	})
}

/**
 * Implements a logical result whose function member forces capture and whose declared
 * getters shift.
 */
export class ShiftingLogicalResult implements LogicalResult {
	#conclusion = 0
	#rules = 0
	readonly leaf = Math.max

	get faults(): readonly [] {
		return []
	}
	get repairs(): readonly [] {
		return []
	}
	get defaulted(): readonly [] {
		return []
	}

	get reasoning(): 'logical' {
		return 'logical'
	}

	get conclusion(): CheckState {
		this.#conclusion += 1
		return this.#conclusion >= 3 ? 'met' : 'unmet'
	}

	get rules(): readonly RuleResult[] {
		this.#rules += 1
		return this.#rules === 1 ? [CAPTURED_RULE] : []
	}

	get count(): number {
		return 1
	}

	get success(): boolean {
		return false
	}

	get trace(): readonly string[] {
		return []
	}

	get errors(): readonly string[] {
		return []
	}
}

/** Returns a reasons engine that refuses through `conclusion` alone and names no failing rule. */
export function buildSilentReason(): ReasonInterface {
	return createReason({
		reasoners: [
			{
				id: 'silent',
				reasoning: 'logical',
				supports: () => true,
				validate: () => ({ valid: true, errors: [], warnings: [] }),
				reason: () => ({
					reasoning: 'logical',
					faults: [],
					repairs: [],
					defaulted: [],
					conclusion: 'unmet',
					rules: [],
					count: 0,
					success: true,
					trace: [],
					errors: [],
				}),
			},
		],
	})
}

/**
 * Reads a reasoner verdict's conclusion without narrowing at the assertion site.
 *
 * @remarks
 * `ReasonResult` is a union and only the logical arm carries `conclusion`, so this returns
 * `undefined` for any other reasoning — which makes a wrong-arm result fail the assertion
 * rather than silently skip it.
 */
export function readConclusion(result: ReasonResult): CheckState | undefined {
	return result.reasoning === 'logical' ? result.conclusion : undefined
}

/** Reads a caught `BriefError`'s `context`, or `undefined` for any other value. */
export function readErrorContext(error: unknown): Readonly<Record<string, unknown>> | undefined {
	return isBriefError(error) ? error.context : undefined
}

/**
 * Returns a `Record` whose prototype carries the mapping, so a lookup that ignores ownership
 * resolves a key the caller never declared.
 */
export function buildInheritedActions(): Readonly<Record<string, 'migrate'>> {
	const parent: Record<string, 'migrate'> = { migrate: 'migrate' }
	const child: Record<string, 'migrate'> = Object.create(parent)
	return child
}

/** Counts reads made by one accessor fixture. */
export class BriefReadCounter {
	#count = 0

	get count(): number {
		return this.#count
	}

	next(): number {
		return ++this.#count
	}
}

/** Builds the prototype accessor captured by the ownership proof. */
export function buildCapturePrototype(reads: BriefReadCounter): object {
	return {
		get answer() {
			return reads.next() === 1 ? 'captured' : 'forged'
		},
	}
}

/** Builds an input whose own enumerable outcomes change after its initial read. */
export function buildChangingInput(reads: BriefReadCounter): BriefInput {
	return {
		task: buildReadyTask(),
		proofs: [buildProof('x', 'npm test')],
		get outcomes(): readonly Outcome[] {
			return reads.next() === 1
				? [buildOutcome(1, 'first')]
				: [buildOutcome(1, 'first'), buildOutcome(2, 'second')]
		},
	}
}

/** Builds an input whose own enumerable text accessor throws. */
export function buildUnreadableInput(): BriefInput {
	return {
		task: buildReadyTask(),
		proofs: [buildProof('x', 'npm test')],
		outcomes: [buildOutcome(1, 'x')],
		get text(): string {
			throw new TypeError('hostile text getter')
		},
	}
}

/** Builds the reference accessor used to test snapshot refusal. */
export function buildReferenceGetter(reads: BriefReadCounter): Reference {
	return {
		note: 'the leaking pipeline',
		get path() {
			return reads.next() === 2 ? 'safe.ts\n- forged.ts — forged' : 'safe.ts'
		},
	}
}

/** Builds the action mapping with an own enumerable accessor. */
export function buildActionGetter(reads: BriefReadCounter): Readonly<Record<string, 'migrate'>> {
	return {
		get migrate(): 'migrate' {
			reads.next()
			return 'migrate'
		},
	}
}

/** Builds the domain mapping with an own enumerable accessor. */
export function buildDomainGetter(reads: BriefReadCounter): Readonly<Record<string, 'code'>> {
	return {
		get code(): 'code' {
			reads.next()
			return 'code'
		},
	}
}

/** Builds a value that refuses string conversion. */
export function buildThrowingConversion(): unknown {
	return {
		toString() {
			throw new Error('conversion throws')
		},
	}
}

/** Builds a brief from the known hash-collision corpus. */
export function buildCollisionBrief(statement: string): Brief {
	return buildBrief(buildTask('plan', 'ops', statement), { proofs: [buildProof('x', 'npm test')] })
}

/** Collects every manager operation that teardown must refuse. */
export function collectDestroyedCalls(
	registry: BriefManagerInterface,
): ReadonlyArray<() => unknown> {
	return [
		() => registry.has('x'),
		() => registry.brief('x'),
		() => registry.briefs(),
		() => registry.add(buildReadyBrief()),
		() => registry.remove('x'),
	]
}

/** Returns the callable marker supplied to a foreign interpretation. */
export function readBriefMarker(): string {
	return 'marker'
}

/** Builds the foreign leaf values whose ownership must preserve gate decisions. */
export function buildForeignReadings(): readonly unknown[] {
	return [' a string ', () => 'anything']
}

/** Pairs each section shape with its structural guard and canonical controls. */

export const BRIEF_SECTION_CASES = [
	{
		name: 'task',
		shape: taskShape,
		guard: isTask,
		accepted: { operation: 'refactor', domain: 'code', statement: 'Refactor useForm.' },
		refused: { operation: 'improve', domain: 'code', statement: 'Refactor useForm.' },
	},
	{
		name: 'reference',
		shape: referenceShape,
		guard: isReference,
		accepted: { path: 'src/core/types.ts', note: 'the published contract' },
		refused: { path: '', note: 'the published contract' },
	},
	{
		name: 'manifest',
		shape: manifestShape,
		guard: isManifest,
		accepted: { read: [], edit: [], locked: [], forbidden: [] },
		refused: { read: [], edit: [], locked: [] },
	},
	{
		name: 'outcome',
		shape: outcomeShape,
		guard: isOutcome,
		accepted: { rank: 1, text: 'the tests pass', required: true },
		refused: { rank: 0, text: 'the tests pass', required: true },
	},
	{
		name: 'given',
		shape: givenShape,
		guard: isGiven,
		accepted: { category: 'convention', name: 'indentation', value: 'tabs' },
		refused: { category: 'convention', name: '', value: 'tabs' },
	},
	{
		name: 'example',
		shape: exampleShape,
		guard: isExample,
		accepted: { input: '<input required>', output: 'el.validity' },
		refused: { input: '<input required>', output: '' },
	},
	{
		name: 'citation',
		shape: citationShape,
		guard: isCitation,
		accepted: { name: 'MDN', url: 'https://developer.mozilla.org/', note: 'native validity' },
		refused: { name: 'MDN', url: 'https://developer.mozilla.org/', note: '' },
	},
	{
		name: 'gap',
		shape: gapShape,
		guard: isGap,
		accepted: { field: 'output', question: 'Diff or files?', blocking: true },
		refused: { field: 'output', question: 'Diff or files?', blocking: 'yes' },
	},
	{
		name: 'risk',
		shape: riskShape,
		guard: isRisk,
		accepted: { severity: 'medium', text: 'subtle drift', mitigation: 'assert in tests' },
		refused: { severity: 'critical', text: 'subtle drift', mitigation: 'assert in tests' },
	},
	{
		name: 'output',
		shape: outputShape,
		guard: isOutput,
		accepted: { format: 'diff' },
		refused: { format: 'patch' },
	},
	{
		name: 'proof',
		shape: proofShape,
		guard: isProof,
		accepted: { text: 'tests pass', command: 'npm test' },
		refused: { text: 'tests pass', command: '' },
	},
]

/** Declares each shape beside its structural guard and admission direction. */
export const BRIEF_CONTRACT_CASES = [
	...BRIEF_SECTION_CASES,
	{ name: 'text', shape: textShape, guard: isText, accepted: '', refused: '\n' },
	{ name: 'line', shape: lineShape, guard: isLine, accepted: 'line', refused: '' },
	{ name: 'brief', shape: briefShape, guard: isBrief, accepted: buildReadyBrief(), refused: {} },
].map((row) => ({
	...row,
	direction: 'is implies guard',
	project: undefined,
	wire: createContract(row.shape),
}))
