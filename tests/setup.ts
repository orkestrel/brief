import type { Brief, BriefErrorCode, BriefInput, Manifest, Task } from '@src/core'
import { brief, isBriefError, manifest, outcome, proof, reference, task } from '@src/core'
import type { InterpretInterface } from '@orkestrel/interpret'
import { createInterpret } from '@orkestrel/interpret'
import type { Check, EvaluatorInterface, ReasonResult } from '@orkestrel/reason'
import { quantitativeDefinition } from '@orkestrel/reason'

/** The canonical valid task every fixture builds on. */
export function buildTask(): Task {
	return task('refactor', 'code', 'Refactor useForm to native browser form APIs.')
}

/** A manifest whose four partitions are populated and disjoint. */
export function buildManifest(): Manifest {
	return manifest({
		read: [reference('AGENTS.md', 'project law')],
		edit: [reference('src/browser/composables/useForm.ts', 'the composable being refactored')],
		locked: [reference('src/browser/types.ts', 'the published contract')],
		forbidden: [reference('app/**', 'out of scope')],
	})
}

/**
 * A gate-passing brief: one sentence, a required outcome, a proof, disjoint partitions.
 * Override any section to build the near-miss a specific assertion needs.
 */
export function buildBrief(overrides?: Partial<Omit<Brief, 'task'>>): Brief {
	return brief(buildTask(), {
		manifest: buildManifest(),
		outcomes: [outcome(1, 'useForm uses native FormData with no behavior change')],
		proofs: [proof('type-check and lint pass', 'npm run check')],
		...overrides,
	})
}

/** A `BriefInput` the gate passes: a task, a disjoint manifest, one outcome, one proof. */
export function buildReadyInput(): BriefInput {
	return {
		task: buildTask(),
		manifest: buildManifest(),
		outcomes: [outcome(1, 'useForm uses native FormData with no behavior change')],
		proofs: [proof('type-check and lint pass', 'npm run check')],
	}
}

/**
 * A real interpret pipeline driven by an injected extractor.
 *
 * @remarks
 * `createInterpret`'s `extractor` option is the package's own documented injection seam,
 * so nothing project-owned is replaced. Pass `matched: false` to register no template,
 * which is how the pipeline raises its own required ambiguity.
 */
export function buildInterpret(
	action: string,
	domain: string,
	matched: boolean,
): InterpretInterface {
	return createInterpret({
		extractor: {
			extract: () => ({ intent: { action, domain, confidence: 1 }, numbers: [3], complete: true }),
		},
		templates: matched
			? [
					{
						id: 'migration',
						name: 'Migration',
						domain,
						intents: [action],
						mappings: [{ entity: 'count', aliases: [], field: 'count' }],
						defaults: [],
						computations: [],
						definition: quantitativeDefinition('migration', 'Migration', []),
					},
				]
			: [],
	})
}

/**
 * An interpret engine whose `interpret` throws, for driving the `interpret` stage's failure.
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
		register: (template) => {
			real.register(template)
		},
		unregister: (id) => real.unregister(id),
		template: (id) => real.template(id),
		templates: () => real.templates(),
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
 * Read a caught value's `BriefErrorCode` without branching at the assertion site.
 *
 * @remarks
 * Returns `undefined` for anything that is not a `BriefError`, so one unconditional
 * `expect` covers both the narrowing and the code.
 */
export function readErrorCode(error: unknown): BriefErrorCode | undefined {
	return isBriefError(error) ? error.code : undefined
}

/**
 * An evaluator that reports every check met.
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
		evaluate: (check: Check) => ({ field: check.field, met: true, actual: true }),
		batch: (checks: readonly Check[]) =>
			checks.map((check) => ({ field: check.field, met: true, actual: true })),
	}
}

/**
 * Read a reasoner verdict's conclusion without narrowing at the assertion site.
 *
 * @remarks
 * `ReasonResult` is a union and only the logical arm carries `conclusion`, so this returns
 * `undefined` for any other reasoning — which makes a wrong-arm result fail the assertion
 * rather than silently skip it.
 */
export function readConclusion(result: ReasonResult): boolean | undefined {
	return result.reasoning === 'logical' ? result.conclusion : undefined
}

/** Read a caught `BriefError`'s `context`, or `undefined` for any other value. */
export function readErrorContext(error: unknown): Readonly<Record<string, unknown>> | undefined {
	return isBriefError(error) ? error.context : undefined
}

/**
 * A `Record` whose prototype carries the mapping, so a lookup that ignores ownership
 * resolves a key the caller never declared.
 */
export function buildInheritedActions(): Readonly<Record<string, 'migrate'>> {
	const parent: Record<string, 'migrate'> = { migrate: 'migrate' }
	const child: Record<string, 'migrate'> = Object.create(parent)
	return child
}
