# Brief

> A synchronous, deterministic specification compiler on top of the `@orkestrel/reason`
> engine. A rough request compiles into a **`Brief`** — a closed, JSON-serializable
> execution contract another agent can run with no interpretation left to do — and every
> downstream artifact is PROJECTED from that one source of truth, never authored
> separately. FORWARD: raw text runs through an injected `@orkestrel/interpret` pipeline,
> its `Interpretation` is drafted into brief sections (intent to `task`, entities to
> `givens`, ambiguities to `gaps`), caller-supplied sections merge OVER the draft, the
> fail-closed gate is evaluated as a reasons `LogicalDefinition` — a traceable verdict,
> never an ad-hoc `if` — and a passing brief is pinned (`trace` and `hash` derived, never
> authored). REVERSE: `briefToMarkdown` / `briefToGoal` / `briefToDispatch` project the
> pinned brief into its downstream views. Nothing here is an LLM, provider, or agent: the
> markdown a projection renders is FOR an external model, never consumed internally. A
> brief with blocking gaps yields a visible INCOMPLETE `Briefing` carrying the questions,
> because a half-specified brief is worse than a question. Every discriminant names its
> axis, never `kind` or `type`: `stage` splits the four pipeline phases, `severity` splits
> risks, `code` splits coded errors — and a record whose container already fixes what it is,
> like a referenced path, or whose candidate vocabulary was neither closed nor disjoint, like
> a cited source, carries no discriminant at all.
> Source: [`src/core`](../src/core). Surfaced through the `@src/core` barrel.

You cannot make a model's sampling deterministic from a prompt, but you can make the TASK
deterministic: resolve every implicit decision ahead of time and pin the result with
mechanical proofs, so any correct execution is equivalent under the contract. The `Brief`
is that resolution as plain data, and the module is deliberately mechanism, never policy.
The judgment calls — which files, which outcomes, which proofs — belong to the caller,
whether a human or an agent. This module supplies the closed vocabularies, the exact-record
validation, the fail-closed gate, the deterministic pinning, and the lossless projections.
Separating the WHAT from the HOW is the whole design: `outcomes` and `proofs` pin the
result's shape and its transcript-provable evidence, while the method stays free unless the
method itself is the requirement.

## Surface

Compile a request into a `Briefing`, then project the brief it carries:

```ts
import {
	briefToGoal,
	briefToMarkdown,
	createBriefCompiler,
	outcome,
	proof,
	task,
} from '@orkestrel/brief'

const compiler = createBriefCompiler()

const briefing = compiler.compile({
	task: task('refactor', 'code', 'Refactor useForm to native browser form APIs.'),
	authority: [{ path: 'AGENTS.md', note: 'project law; wins every conflict' }],
	manifest: {
		read: [
			{ path: 'AGENTS.md', note: 'project law; wins every conflict' },
			{ path: 'guides/browser.md', note: 'the composable contract' },
		],
		edit: [{ path: 'src/browser/composables/useForm.ts', note: 'the composable being refactored' }],
		locked: [{ path: 'src/browser/types.ts', note: 'the published contract' }],
		forbidden: [{ path: 'app/**', note: 'out of scope' }],
	},
	outcomes: [outcome(1, 'useForm uses native FormData with no behavior change')],
	proofs: [proof('type-check and lint pass', 'npm run check')],
})

briefing.brief !== undefined // true — the brief is present exactly when the gate passed
if (briefing.brief !== undefined) {
	briefToMarkdown(briefing.brief) // the copy-ready agent prompt
	briefToGoal(briefing.brief) // the /goal completion condition
}

compiler.emitter.on('block', (questions) => questions.length)
compiler.destroy()
```

`compile()` is genuinely SYNCHRONOUS and runs the fixed four-stage pipeline
`[interpret, draft, gate, pin]`. Blocking gaps, a refused gate, and a thrown stage all
yield a visible INCOMPLETE `Briefing` — `brief` absent and the cause recorded on `failures` —
rather than a throw. `questions` carries the gaps when a BLOCKING GAP is the cause and is
empty otherwise, so `brief !== undefined` is the completeness test rather than
`questions.length`. The `interpret` stage is skipped entirely when the input carries no `text`,
so a fully caller-authored `BriefInput` drafts, gates, and pins without touching the language
pipeline at all.

### Types

| Type                     | Kind      | Shape                                                                                                                                                                                                                           |
| ------------------------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TaskOperation`          | type      | `'create' \| 'refactor' \| 'debug' \| 'extract' \| 'migrate' \| 'explain' \| 'review' \| 'optimize' \| 'audit' \| 'test' \| 'document' \| 'plan'` — the closed operation vocabulary.                                            |
| `TaskDomain`             | type      | `'code' \| 'writing' \| 'research' \| 'analysis' \| 'design' \| 'data' \| 'ops' \| 'other'` — the closed domain vocabulary.                                                                                                     |
| `OutputFormat`           | type      | `'markdown' \| 'json' \| 'code' \| 'diff' \| 'prose'` — the closed deliverable-format vocabulary.                                                                                                                               |
| `RiskSeverity`           | type      | `'low' \| 'medium' \| 'high'` — the closed severity vocabulary.                                                                                                                                                                 |
| `BriefStage`             | type      | `'interpret' \| 'draft' \| 'gate' \| 'pin'` — the four fixed pipeline phases, in order.                                                                                                                                         |
| `BriefErrorCode`         | type      | `'INTERPRET_FAILED' \| 'DRAFT_FAILED' \| 'GATE_FAILED' \| 'PIN_FAILED' \| 'BLOCKED' \| 'INVALID' \| 'DESTROYED'` — coded `BriefError` reasons.                                                                                  |
| `Task`                   | interface | `{ operation, domain, statement }` — ONE imperative sentence naming the object; a compound statement is two briefs.                                                                                                             |
| `Reference`              | interface | `{ path, note }` — one referenced path and why it is listed; the ONE path record, carrying no classifier because its container supplies the meaning.                                                                            |
| `Manifest`               | interface | `{ read, edit, locked, forbidden }` — the four DISJOINT file partitions, each `readonly Reference[]`; `read` order is the reading order.                                                                                        |
| `Outcome`                | interface | `{ rank, text, required }` — one ranked outcome, not a step; `required: true` gates "done".                                                                                                                                     |
| `Given`                  | interface | `{ category, name, value }` — one context fact handed to the executor.                                                                                                                                                          |
| `Example`                | interface | `{ input, output, note? }` — one input-to-output exemplar; the highest-leverage ambiguity remover.                                                                                                                              |
| `Citation`               | interface | `{ name, url, note }` — one external source and why it is cited; the off-repository twin of `Reference`. List ORDER is the trust order.                                                                                         |
| `Gap`                    | interface | `{ field, question, blocking, candidates? }` — one unknown; `blocking: true` means no safe default exists and the gate must fail closed.                                                                                        |
| `Risk`                   | interface | `{ severity, text, mitigation }` — one pre-empted risk.                                                                                                                                                                         |
| `Output`                 | interface | `{ format, sections?, include?, exclude? }` — the closed shape of the deliverable.                                                                                                                                              |
| `Proof`                  | interface | `{ text, command }` — one mechanical, transcript-provable check; `command` should carry a clear exit signal.                                                                                                                    |
| `Brief`                  | interface | `{ task, authority, manifest, outcomes, rules, invariants, givens, examples, assumptions, citations, gaps, risks, output, proofs, trace?, hash? }` — the closed execution contract.                                             |
| `BriefInput`             | interface | `{ text?, interpretation?, task?, … }` — one `compile()` input; every brief section is an optional caller-authored override.                                                                                                    |
| `Briefing`               | interface | `{ interpretation?, brief?, questions, verdict?, stages, failures, digest }` — the full, replayable outcome of one `compile()` call; `brief` is present exactly when it completed, so it IS the completeness test.              |
| `Dispatch`               | interface | `{ prompt, authority, read, edit, locked, forbidden }` — the subagent projection on TWO axes: `authority` is precedence, the four path sets are permission. `edit` is the owned set; `locked` and `forbidden` are do-not-touch. |
| `InterpretStageRecord`   | interface | `{ stage: 'interpret', input: string, output?: Interpretation, error? }` — the interpret phase snapshot.                                                                                                                        |
| `DraftStageRecord`       | interface | `{ stage: 'draft', input: BriefInput, output?: Brief, error? }` — the draft phase snapshot.                                                                                                                                     |
| `GateStageRecord`        | interface | `{ stage: 'gate', input: Subject, output?: LogicalResult, error? }` — the gate phase snapshot.                                                                                                                                  |
| `PinStageRecord`         | interface | `{ stage: 'pin', input: Brief, output?: Brief, error? }` — the pin phase snapshot.                                                                                                                                              |
| `BriefStageRecord`       | type      | `InterpretStageRecord \| DraftStageRecord \| GateStageRecord \| PinStageRecord` — one phase, discriminated by `stage`, so narrowing types BOTH payloads with no assertion.                                                      |
| `BriefStageFailure`      | interface | `{ stage, code, message }` — a visible marker for a stage that failed.                                                                                                                                                          |
| `BriefRecord`            | interface | `{ id, brief, version, hash }` — a versioned, content-hashed `Brief` inside a `BriefManager`.                                                                                                                                   |
| `BriefCompilerEventMap`  | type      | `BriefCompiler`'s push observation surface — `compile(briefing)` · `block(questions)` · `error(error)` · `destroy()`.                                                                                                           |
| `BriefCompilerOptions`   | interface | `{ interpret?, reason?, actions?, domains?, on?, error? }` — input to `createBriefCompiler`; the gate is FIXED and no option reaches it.                                                                                        |
| `BriefCompilerInterface` | interface | The compilation orchestrator contract — `emitter` / `interpret` / `reason` plus `compile` / `gate` / `destroy`.                                                                                                                 |
| `BriefManagerEventMap`   | type      | `BriefManager`'s push observation surface — `add(id)` · `remove(id)` · `destroy()`.                                                                                                                                             |
| `BriefManagerOptions`    | interface | `{ briefs?, on?, error? }` — input to `createBriefManager`.                                                                                                                                                                     |
| `BriefManagerInterface`  | interface | The brief registry contract — `emitter` / `size` plus `has` / `brief` / `briefs` / `add` / `remove` / `destroy`.                                                                                                                |

The `Briefing` deliberately carries CROSS-PACKAGE payloads by their originating types:
`interpretation` is an `@orkestrel/interpret` `Interpretation`, `verdict` is an
`@orkestrel/reason` `LogicalResult`, and `BriefManagerInterface.add` takes interprets
`ManagerAddOptions`. Each is imported at the consumer site from the package that owns it,
never re-exported here. The verdict is the gate's own traceable account: every readiness
check, met or missed, narrated by the reasoner.

### Constants

| API                   | Kind  | Summary                                                                                               |
| --------------------- | ----- | ----------------------------------------------------------------------------------------------------- |
| `TASK_OPERATIONS`     | const | The twelve `TaskOperation` values, frozen — compose with `literalOf(…)` / `parseEnum(…)`.             |
| `TASK_DOMAINS`        | const | The eight `TaskDomain` values, frozen.                                                                |
| `OUTPUT_FORMATS`      | const | The five `OutputFormat` values, frozen.                                                               |
| `RISK_SEVERITIES`     | const | The three `RiskSeverity` values, frozen.                                                              |
| `DEFAULT_BRIEF_TURNS` | const | `16` — the default turn cap `briefToGoal` renders; domain-qualified to keep the barrel clean.         |
| `GATE_ID`             | const | `'gate'` — the id of the `gateDefinition()` logical definition.                                       |
| `LINE_BREAK_PATTERN`  | const | The four ECMAScript line terminators a brief field refuses; unanchored and flagless-`g`.              |
| `SINGLE_LINE_PATTERN` | const | The positive form of `LINE_BREAK_PATTERN`, for `stringShape`'s `pattern` — one class, two mechanisms. |
| `BLANK_PATTERN`       | const | Empty or all spaces — the one exemplar side `exampleToLines` must not pad.                            |

```ts
import {
	DEFAULT_BRIEF_TURNS,
	GATE_ID,
	OUTPUT_FORMATS,
	RISK_SEVERITIES,
	TASK_DOMAINS,
	TASK_OPERATIONS,
} from '@orkestrel/brief'

TASK_OPERATIONS.length // 12
TASK_DOMAINS // ['code', 'writing', 'research', 'analysis', 'design', 'data', 'ops', 'other']
OUTPUT_FORMATS // ['markdown', 'json', 'code', 'diff', 'prose']
RISK_SEVERITIES // ['low', 'medium', 'high']
DEFAULT_BRIEF_TURNS // 16
GATE_ID // 'gate'
```

A closed-set field that does not fit a listed value is a signal the request is mis-scoped,
not licence to invent a value: the validators reject an off-vocabulary literal and the
shapers compile the same tuples into the JSON Schema `enum`s, so the vocabulary cannot
drift between the guard and the schema.

### Errors

| API            | Kind     | Summary                                            |
| -------------- | -------- | -------------------------------------------------- |
| `BriefError`   | class    | Carries a `BriefErrorCode` and optional `context`. |
| `isBriefError` | function | Narrow a caught value to a `BriefError`.           |

```ts
import { BriefError, isBriefError } from '@orkestrel/brief'

try {
	throw new BriefError('INVALID', 'Brief failed the exact-record contract')
} catch (error) {
	if (isBriefError(error)) error.code // 'INVALID'
}
```

Throws are reserved for caller misuse: `assertBrief` and `snapshotBrief` throw `INVALID` on
data the contract refuses, and any method after `destroy()` throws `DESTROYED`. Blocking gaps
are NOT an error — the gate fails closed into an incomplete `Briefing` whose `failures` carry
a `BLOCKED` marker, mirroring interprets `NO_TEMPLATE` visible-incomplete outcome.

Each code carries the `context` it can actually supply, and they are not uniform: `DRAFT_FAILED`
carries `{ stage, field }`, `GATE_FAILED` carries `{ stage, field, reasoning }`, `INVALID`
carries `{ field }` plus the offending value where the code has one — the hash on a
content-hash collision — and `DESTROYED` carries none.

### Validators

Total guards composed from the `@orkestrel/contract` combinators. Adversarial input — junk,
cycles, hostile prototypes — returns `false`, never throws. Every record guard is EXACT: an
extra key fails, which is why the builders below omit absent optional keys. A key that is
PRESENT but holds `undefined` also fails, matching this workspace's
`exactOptionalPropertyTypes` contract.

Exactness stops at this package's own records. The gate checks a BORROWED engine's return with
`@orkestrel/reason`'s published result guards — open on unknown keys, class instances accepted —
imported rather than reimplemented here. reason deliberately accepts an empty rule id, because
`RuleResult.id` is `string` and a non-empty check would narrow past the published contract; a
consumer wanting that stricter reading asserts it at its own boundary. The interpret stage
guards the same way with `@orkestrel/interpret`'s published `isInterpretation`, at both of its
doors: the borrowed engine's return and a caller-supplied `interpretation`. A malformed value at
either door records `INTERPRET_FAILED` instead of throwing out of `compile`.

| API               | Kind  | Narrows to                                                                        |
| ----------------- | ----- | --------------------------------------------------------------------------------- |
| `isText`          | const | A string carrying no line terminator, empty included.                             |
| `isLine`          | const | A NON-EMPTY string carrying no line terminator — the shape of nearly every field. |
| `isTaskOperation` | const | `TaskOperation`.                                                                  |
| `isTaskDomain`    | const | `TaskDomain`.                                                                     |
| `isOutputFormat`  | const | `OutputFormat`.                                                                   |
| `isRiskSeverity`  | const | `RiskSeverity`.                                                                   |
| `isTask`          | const | `Task` — `operation` and `domain` on-vocabulary, `statement` non-empty.           |
| `isReference`     | const | `Reference` — both `path` and `note` present and single-line.                     |
| `isManifest`      | const | `Manifest` — the four partitions present (disjointness is `validateBrief`'s job). |
| `isOutcome`       | const | `Outcome` — `rank` a positive integer.                                            |
| `isGiven`         | const | `Given`.                                                                          |
| `isExample`       | const | `Example`.                                                                        |
| `isCitation`      | const | `Citation` — `name`, `url`, and `note` all present and single-line.               |
| `isGap`           | const | `Gap`.                                                                            |
| `isRisk`          | const | `Risk` — `severity` must be a `RiskSeverity`.                                     |
| `isOutput`        | const | `Output` — `format` must be an `OutputFormat`.                                    |
| `isProof`         | const | `Proof`.                                                                          |
| `isBrief`         | const | `Brief` — the whole exact-record contract, section guards composed.               |

```ts
import {
	isBrief,
	isGap,
	isProof,
	isTask,
	isTaskDomain,
	isTaskOperation,
	isCitation,
	isExample,
	isGiven,
	isManifest,
	isOutcome,
	isOutput,
	isOutputFormat,
	isReference,
	isRisk,
	isRiskSeverity,
} from '@orkestrel/brief'

isTask({ operation: 'refactor', domain: 'code', statement: 'Refactor useForm.' }) // true
isTask({ operation: 'improve', domain: 'code', statement: 'x' }) // false — off-vocabulary
isTaskOperation('refactor') // true
isTaskDomain('frontend') // false
isReference({ path: 'AGENTS.md', note: 'project law' }) // true
isReference({ path: 'AGENTS.md' }) // false — `note` is required
isManifest({ read: [], edit: [], locked: [], forbidden: [] }) // true
isOutcome({ rank: 1, text: 'the tests pass', required: true }) // true
isGiven({ category: 'convention', name: 'indentation', value: 'tabs' }) // true
isExample({ input: '<input required>', output: 'el.validity' }) // true
isCitation({ name: 'MDN', url: 'https://developer.mozilla.org/', note: 'native validity' }) // true
isGap({ field: 'output', question: 'Diff or files?', blocking: true, candidates: ['diff'] }) // true
isRisk({ severity: 'medium', text: 'subtle drift', mitigation: 'assert in tests' }) // true
isRiskSeverity('medium') // true
isOutput({ format: 'diff' }) // true
isOutputFormat('diff') // true
isProof({ text: 'tests pass', command: 'npm run test:src:core' }) // true
isBrief({ task: { operation: 'plan', domain: 'ops', statement: 'x.' } }) // false — sections missing
```

### Shapers

The `Brief` contract declared a second time as a contracts `ContractShape`, because a shape
buys three things a guard cannot: the JSON Schema a tool boundary needs, a seeded generator
for test data, and per-field diagnostics through `explain`. Each shaper is a plain shape
VALUE; `briefShape` composes the section shapes, and `createBriefContract()` compiles it.

The guard family and the shape family are two independent mechanisms over one vocabulary.
That is deliberate: a single source could not disagree with itself, so it could never catch
a mistake. [`tests/src/core/shapers.test.ts`](../tests/src/core/shapers.test.ts) drives both
over the same values and fails the moment they diverge, and `createBriefContract`'s declared
`ContractInterface<Brief>` return type makes the compiler prove `Infer<typeof briefShape>`
is exactly `Brief`.

| API              | Kind  | Builds…                                                                                            |
| ---------------- | ----- | -------------------------------------------------------------------------------------------------- |
| `textShape`      | const | a single-line string of any length — the shape mirror of `isText`.                                 |
| `lineShape`      | const | a NON-EMPTY single-line string — the shape mirror of `isLine`.                                     |
| `taskShape`      | const | the `Task` object shape — `literalShape(TASK_OPERATIONS)`, `literalShape(TASK_DOMAINS)`, `min: 1`. |
| `referenceShape` | const | the `Reference` object shape.                                                                      |
| `manifestShape`  | const | the `Manifest` object shape — four `arrayShape(referenceShape)` partitions.                        |
| `outcomeShape`   | const | the `Outcome` object shape — `rank` an `integerShape({ min: 1 })`.                                 |
| `givenShape`     | const | the `Given` object shape.                                                                          |
| `exampleShape`   | const | the `Example` object shape.                                                                        |
| `citationShape`  | const | the `Citation` object shape.                                                                       |
| `gapShape`       | const | the `Gap` object shape.                                                                            |
| `riskShape`      | const | the `Risk` object shape.                                                                           |
| `outputShape`    | const | the `Output` object shape.                                                                         |
| `proofShape`     | const | the `Proof` object shape.                                                                          |
| `briefShape`     | const | the whole `Brief` object shape, section shapes composed; `trace` and `hash` optional.              |

```ts
import {
	briefShape,
	citationShape,
	createBriefContract,
	exampleShape,
	gapShape,
	givenShape,
	manifestShape,
	outcomeShape,
	outputShape,
	proofShape,
	referenceShape,
	riskShape,
	taskShape,
} from '@orkestrel/brief'
import { createContract, schemaToParameters, seededRandom } from '@orkestrel/contract'

const contract = createBriefContract()
contract.schema // the full JSON Schema — hand it to a tool boundary
contract.generate(seededRandom(42)) // a reproducible, on-contract seed brief for tests
schemaToParameters(contract.schema) // the open tool-parameters record, no `as` anywhere

createContract(taskShape).is({ operation: 'plan', domain: 'ops', statement: 'Plan it.' }) // true
briefShape.type // 'object'
referenceShape.type // 'object'
manifestShape.type // 'object'
outcomeShape.type // 'object'
givenShape.type // 'object'
exampleShape.type // 'object'
citationShape.type // 'object'
gapShape.type // 'object'
riskShape.type // 'object'
outputShape.type // 'object'
proofShape.type // 'object'
```

### Builders

Lowercase value builders following the reasons idiom — every builder returns a FRESH object
and OMITS absent optional keys entirely, so its SHAPE round-trips the exact-record validators
above.

Builders are structural, not validating: they adopt whatever they are handed. `reference('a',
'')` and `citation('MDN', 'https://x', 'a\nb')` both return a typed value the matching guard
rejects, because the single-line and non-empty contracts bind where a guard runs rather than
where a value is built. That is deliberate and uniform across all thirteen — validation lives
at the boundaries the data actually crosses: `parseBrief` on the way in, `snapshotBrief` inside
every projection, and the gate before emission. Pass on-contract arguments, or check the
result.

| API              | Kind     | Builds…                                                                                                                                                          |
| ---------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `task`           | function | a `Task` from operation / domain / statement.                                                                                                                    |
| `reference`      | function | a `Reference` from path / note — the one builder for an authority entry and a manifest entry alike.                                                              |
| `manifest`       | function | a `Manifest` — every absent partition defaults to `[]`, so a partial literal is enough.                                                                          |
| `outcome`        | function | an `Outcome` from rank / text; `required` defaults to `true` — an outcome gates "done" unless demoted.                                                           |
| `given`          | function | a `Given` from category / name / value.                                                                                                                          |
| `example`        | function | an `Example` from input / output; `note` is omitted when absent.                                                                                                 |
| `citation`       | function | a `Citation` from name / url / note.                                                                                                                             |
| `gap`            | function | a `Gap` from field / question; `blocking` defaults to `false` and `candidates` is omitted when absent.                                                           |
| `risk`           | function | a `Risk` from severity / text / mitigation.                                                                                                                      |
| `output`         | function | an `Output` from format; `sections` / `include` / `exclude` are omitted when absent.                                                                             |
| `proof`          | function | a `Proof` from text / command.                                                                                                                                   |
| `brief`          | function | a `Brief` from a `Task` plus overrides — every absent collection defaults to `[]`, `output` defaults to `output('markdown')`, and `trace` / `hash` stay omitted. |
| `gateDefinition` | function | the fail-closed readiness gate as a reasons `LogicalDefinition` with id `GATE_ID` — six readiness rules plus the `ready` conjunction, fixed and unparameterised. |

```ts
import {
	brief,
	citation,
	example,
	gap,
	gateDefinition,
	given,
	manifest,
	outcome,
	output,
	proof,
	reference,
	risk,
	task,
} from '@orkestrel/brief'

const draft = brief(task('refactor', 'code', 'Refactor useForm to native browser form APIs.'), {
	authority: [reference('AGENTS.md', 'project law; wins every conflict')],
	manifest: manifest({
		read: [
			// Ranked authority must also be granted here — the `granted` rule refuses a brief
			// that tells the executor to obey a file no partition lets it open.
			reference('AGENTS.md', 'project law; wins every conflict'),
			reference('guides/browser.md', 'the composable contract'),
		],
		edit: [reference('src/browser/composables/useForm.ts', 'the composable being refactored')],
		locked: [reference('src/browser/types.ts', 'the published contract')],
		forbidden: [reference('app/**', 'out of scope')],
	}),
	outcomes: [
		outcome(1, 'useForm uses native FormData with no behavior change'),
		outcome(2, 'tests cover the new code paths'),
	],
	rules: ['No new dependencies.'],
	invariants: ['useForm public method names and signatures in types.ts.'],
	givens: [given('convention', 'indentation', 'tabs')],
	examples: [example('<input required>', 'validity read from el.validity')],
	assumptions: ['Validation message wording is preserved.'],
	citations: [
		citation(
			'MDN Constraint Validation',
			'https://developer.mozilla.org/',
			'the native validity behavior being adopted',
		),
	],
	gaps: [gap('rules', 'Should validation message wording change?')],
	risks: [risk('medium', 'native validation differs subtly', 'assert message and state in tests')],
	output: output('diff', { include: ['updated useForm.ts'] }),
	proofs: [proof('type-check and lint pass', 'npm run check')],
})
draft.output.format // 'diff'
draft.trace // undefined — the pin fills it, never the author
gateDefinition().rules.length // 7 — six readiness rules plus the conjunction
```

### Helpers

Pure, exported utility functions — the referentially-transparent leaves behind the
`BriefCompiler` and the projection surface. Projections use the `{noun}To{Noun}` idiom: each
consumes a WHOLE and returns a derived view of it.

| API                      | Kind     | Summary                                                                                                                                                                |
| ------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `briefToMarkdown`        | function | Project a `Brief` into the copy-ready agent prompt — sections in authority order, paths referenced, never inlined; an empty section is omitted.                        |
| `briefToGoal`            | function | Project a `Brief` into a `/goal` completion condition — the proofs' commands verbatim plus a turn cap defaulting to `DEFAULT_BRIEF_TURNS`.                             |
| `briefToDispatch`        | function | Project a `Brief` into a `Dispatch` — `manifest.edit` becomes the owned set, `locked` and `forbidden` do-not-touch, and `authority` the ranked precedence list.        |
| `briefToSubject`         | function | Project a `Brief` into a reasons `Subject` of readiness measures the gate rules read.                                                                                  |
| `briefToHash`            | function | The canonical structural digest of a brief's content, with `trace` and `hash` stripped first.                                                                          |
| `briefToTrace`           | function | The one-line census `pinBrief` stamps on — operation/domain, outcomes, blocking-over-total gaps, proofs; re-derived by `BriefManager` to reconcile an inbound `trace`. |
| `briefToContent`         | function | The canonical TEXT the hash describes — the identity two briefs must share to be the same brief, since eight hex digits are not identity.                              |
| `findUnmetRules`         | function | The readiness rules a brief fails, measured in CODE — the gate's decision, which `compile` makes rather than delegating to a borrowed engine.                          |
| `pinBrief`               | function | Return a fresh `Brief` with `trace` and `hash` filled — deterministic, no clocks, no run-specific data, idempotent, and deeply frozen.                                 |
| `snapshotBrief`          | function | One deeply owned, deeply frozen, validated reading of a `Brief` — the identity boundary the pin, the registry, and every projection cross.                             |
| `assertBrief`            | function | Narrow unknown data to a `Brief` by IDENTITY, throwing `BriefError` `INVALID` when the guard refuses.                                                                  |
| `exampleToLines`         | function | Render one `Example` as markdown lines — a single-line pair becomes one row, a multi-line pair becomes a fenced block.                                                 |
| `validateBrief`          | function | The semantic pass over an already-shape-valid brief; returns a reasons `ReasonValidationResult`, never throws.                                                         |
| `countSentences`         | function | The sentence count of a statement — `validateBrief` errors when it is not exactly one.                                                                                 |
| `findBlockingGaps`       | function | The gaps with `blocking: true`; non-empty means the gate MUST fail closed.                                                                                             |
| `findManifestOverlaps`   | function | The paths appearing in more than one manifest partition, once each.                                                                                                    |
| `findUngrantedAuthority` | function | The authority paths no partition opens — every ranked path must appear in `read`, `edit`, or `locked`, because the executor cannot obey what it cannot open.           |
| `findUnpairedGaps`       | function | The open gaps past the assumption count — the discipline is exactly one recorded assumption per open gap.                                                              |
| `deriveStatement`        | function | Derive one imperative statement from free text — whitespace collapsed, first letter raised, terminator appended.                                                       |
| `deriveTask`             | function | Derive a `Task` from an interprets `Intent` through CALLER action and domain vocabularies; `undefined` when either side is unmapped.                                   |
| `deriveGivens`           | function | Derive `Given[]` from an interprets `Entity[]` — each becomes a `{ category: 'extracted', name, value }` fact.                                                         |
| `deriveGaps`             | function | Derive `Gap[]` from an interprets `Ambiguity[]` — REQUIRED ambiguities become BLOCKING gaps, the rest open.                                                            |
| `errorToMessage`         | function | Render a value thrown by a stage into the message a `BriefStageFailure` carries — TOTAL, because it runs inside the `catch` that contains a stage failure.             |
| `freezeDeep`             | function | Freeze a value and everything reachable from it, cycles included — `Object.freeze` is shallow, so a frozen record's nested arrays stayed writable.                     |
| `freezeBranch`           | function | Freeze one branch against a shared visited set — the recursion `freezeDeep` drives.                                                                                    |

```ts
import {
	briefToDispatch,
	briefToGoal,
	briefToHash,
	briefToTrace,
	briefToMarkdown,
	briefToSubject,
	countSentences,
	deriveGaps,
	deriveGivens,
	deriveStatement,
	deriveTask,
	errorToMessage,
	freezeDeep,
	findBlockingGaps,
	findUngrantedAuthority,
	findManifestOverlaps,
	findUnpairedGaps,
	pinBrief,
	validateBrief,
} from '@orkestrel/brief'

const pinned = pinBrief(draft)
pinned.hash // an eight-hex-digit digest of the brief's content, stable across runs
pinned.trace // 'refactor/code · outcomes:2 · gaps:0/1 · proofs:1' — derived, never authored
briefToTrace(pinned) === pinned.trace // true — one implementation, and what reconciles an inbound trace
briefToHash(pinned) === briefToHash(draft) // true — pinning does not move the identity

briefToMarkdown(pinned) // '# Brief: Refactor useForm…\n\nrefactor · code\n…'
briefToGoal(pinned) // 'Done when every proof passes: npm run check exits 0. Cap: 16 turns.'
briefToGoal(pinned, 12) // the same condition with a 12-turn cap
briefToDispatch(pinned).edit // ['src/browser/composables/useForm.ts'] — the owned set
briefToSubject(pinned) // { operation: 'refactor', blocking: 0, outcomes: 2, proofs: 1, … }

countSentences('Refactor useForm. Then update the tests.') // 2
findBlockingGaps(pinned) // [] — safe to emit
findManifestOverlaps(pinned) // [] — the four partitions are disjoint
findUngrantedAuthority(pinned) // [] — every ranked authority is opened by some partition
findUnpairedGaps(pinned) // [] — the one open gap has its assumption
validateBrief(pinned) // { valid: true, errors: [], warnings: [] }

deriveStatement('  clean up   useForm ') // 'Clean up useForm.'
deriveTask(
	{ action: 'migrate', domain: 'code', confidence: 1 },
	'migrate the stores',
	{ migrate: 'migrate' },
	{ code: 'code' },
) // { operation: 'migrate', domain: 'code', statement: 'Migrate the stores.' }
deriveGivens([{ name: 'count', value: 3, provenance: { category: 'extracted' }, confidence: 1 }]) // [{ category: 'extracted', name: 'count', value: '3' }]
deriveGaps([{ field: 'output', question: 'Diff or files?', candidates: [], required: true }])
errorToMessage(new Error('boom')) // 'boom'
errorToMessage(Object.create(null)) // 'an unreadable object was thrown' — never throws
freezeDeep({ outcomes: [{ rank: 1 }] }) // nested array frozen too, unlike Object.freeze
```

`validateBrief` ERRORS on the structural violations no assumption can paper over — a
manifest overlap (`Path "<path>" appears in more than one manifest partition`), an authority
no partition grants access to (`Authority "<path>" is in no manifest partition that grants
access — the executor cannot obey what it cannot open`), an empty `proofs` list, and a
`task.statement` that is not one sentence (`Statement holds <n> sentences — a compound
statement is two briefs`). It WARNS on the runnable-but-suspicious: duplicate outcome ranks,
an open gap without its paired assumption, and an optional outcome ranked above every
required one.

The grant check reads `read`, `edit`, and `locked` — all three OPEN a file, and read-only is
exactly what obeying one requires. It subsumes the narrower question of an authority sitting
in `forbidden`, because the four partitions are disjoint, and it also catches the case a
forbidden-only check cannot see: an authority the manifest never mentions at all, where the
brief simply never says the executor may open what it must obey.

Both path checks compare EXACT strings and never expand a glob. `read: 'guides/**'` does not
grant `authority: 'guides/brief.md'`, and `forbidden: 'app/**'` does not overlap
`edit: 'app/file.ts'`. Disjointness and grant are properties of the written paths, so state a
grant as the same literal path the authority carries.

### Parsers

| API          | Kind     | Summary                                                                                             |
| ------------ | -------- | --------------------------------------------------------------------------------------------------- |
| `parseBrief` | function | Parse a JSON string into a `Brief`, or `undefined` on invalid JSON or a shape that fails `isBrief`. |

```ts
import { parseBrief } from '@orkestrel/brief'

parseBrief('not json') // undefined
parseBrief(JSON.stringify(pinned))?.hash === pinned.hash // true — briefs round-trip JSON
```

Coerce a bare vocabulary value with `parseEnum` from `@orkestrel/contract` against the
exported tuple; this package ships no rename-wrapper around it.

### Factories

| API                   | Kind     | Builds…                                                                                        |
| --------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `createBriefCompiler` | function | A `BriefCompilerInterface` — the compilation orchestrator, seeded from `BriefCompilerOptions`. |
| `createBriefManager`  | function | A working `BriefManagerInterface`.                                                             |
| `createBriefContract` | function | Compile `briefShape` into a guard / parser / schema / seeded-generator bundle over `Brief`.    |

Every entry here builds something. `assertBrief` constructs nothing — it returns its
argument once the guard passes — so it is a helper, not a factory, and lives beside the
other pure leaves.

```ts
import {
	assertBrief,
	createBriefContract,
	createBriefManager,
	createBriefCompiler,
} from '@orkestrel/brief'

const compiler = createBriefCompiler() // owns a default interpret pipeline and a logical Reason
compiler.destroy()

const briefs = createBriefManager()
briefs.size // 0
briefs.destroy()

createBriefContract().is(pinned) // true
assertBrief(pinned) === pinned // true — narrowed by identity, never rebuilt
```

`createBriefCompiler` wires the two engines when the caller supplies none: a default
`createInterpret()` — empty vocabularies, so the caller's `actions` and `domains` drive
`deriveTask` — and a `createReason({ reasoners: [createLogicalReasoner()] })` dedicated to
the gate. Bring your own through `BriefCompilerOptions.interpret` / `BriefCompilerOptions.reason` to
share instances or observe their emitters; the compiler destroys ONLY the instances it
created.

### Entities

| API             | Kind  | Summary                                                                                                                         |
| --------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------- |
| `BriefCompiler` | class | The compilation orchestrator — runs the four-stage pipeline and owns or borrows the interpret pipeline and the gate's `Reason`. |
| `BriefManager`  | class | The self-owning, versioned and content-hashed brief registry — record ids default to each brief's own content hash.             |

## Methods

The public methods of each behavioral interface — one table per type, keyed by its
backticked name, every call-signature member listed. The `readonly` data members
(`emitter` / `interpret` / `reason` on `BriefCompiler`; `emitter` / `size` on `BriefManager`)
stay in the Surface rows above. Each implementing class exposes exactly its interface's
methods, so this doubles as the per-instance method surface.

#### `BriefCompilerInterface`

`compile` is genuinely SYNCHRONOUS. After `destroy()` every method except the getters and
`destroy` itself throws `BriefError('DESTROYED', …)`; `destroy()` is idempotent, cascades to
the OWNED engines first — never a borrowed one — and tears the emitter down LAST.

| Method    | Returns         | Behavior                                                                                               |
| --------- | --------------- | ------------------------------------------------------------------------------------------------------ |
| `compile` | `Briefing`      | Run the four-stage pipeline over a `BriefInput`, returning a complete or visible-incomplete result.    |
| `gate`    | `LogicalResult` | Evaluate ONE brief's readiness through the reasons gate — `briefToSubject` against `gateDefinition()`. |
| `destroy` | `void`          | Idempotent teardown — owned engines first, emits `destroy`, then destroys the emitter LAST.            |

```ts
import { BriefCompiler, brief, createBriefCompiler, outcome, proof, task } from '@orkestrel/brief'

const audit = brief(task('audit', 'code', 'Audit the barrel for undocumented exports.'), {
	outcomes: [outcome(1, 'every export appears in the guide')],
	proofs: [proof('parity passes', 'npm run test:guides')],
})

const engine = createBriefCompiler()
const verdict = engine.gate(audit)
verdict.conclusion // true — no blocking gaps, outcomes and proofs present, manifest disjoint
verdict.trace // the step-by-step readiness account, straight from the LogicalReasoner

const briefing = engine.compile({
	task: audit.task,
	outcomes: audit.outcomes,
	proofs: audit.proofs,
})
briefing.brief !== undefined // true
briefing.brief?.hash // pinned
briefing.stages.map((record) => record.stage) // ['draft', 'gate', 'pin'] — no text, no interpret
engine.destroy()

new BriefCompiler().destroy() // the class is public; the factory is the ordinary entry point
```

#### `BriefManagerInterface`

The self-owning, ordered registry over briefs. `add` derives each record's `hash` from the
brief's CONTENT and bumps `version` only when that hash changes; an absent id defaults to
the content hash itself, so minting is deterministic with no randomness. The array overload
of `remove` is declared FIRST so an id list resolves to the batch form, and it returns
`true` only when every listed id was present. A call after `destroy()` throws
`BriefError('DESTROYED', …)`.

| Method    | Returns                    | Behavior                                                                                      |
| --------- | -------------------------- | --------------------------------------------------------------------------------------------- |
| `has`     | `boolean`                  | Whether a brief with the given id is registered.                                              |
| `brief`   | `BriefRecord \| undefined` | Look up ONE registered brief record by id.                                                    |
| `briefs`  | `readonly BriefRecord[]`   | List ALL registered brief records.                                                            |
| `add`     | `BriefRecord`              | Register (or re-register) one brief from its data; emits `add`.                               |
| `remove`  | `boolean` (or `void`)      | Remove LISTED briefs by id, ONE brief by id, or ALL briefs; emits `remove` per removed id.    |
| `destroy` | `void`                     | Idempotent teardown — clears the collection, emits `destroy`, then destroys the emitter LAST. |

```ts
import { BriefManager, brief, createBriefManager, task } from '@orkestrel/brief'

const registry = createBriefManager()
const record = registry.add(brief(task('document', 'writing', 'Write the brief guide.')))
record.id === record.hash // true — id minted from content, deterministic
record.version // 1
registry.has(record.id) // true
registry.brief(record.id) // the BriefRecord, or undefined
registry.briefs() // every registered record
registry.remove([record.id]) // true — the batch form, declared first
registry.destroy()

new BriefManager().destroy() // the class is public; the factory is the ordinary entry point
```

## Contract

These invariants hold across `src/core` and this guide:

1. **DOC and SOURCE bijection.** Every `function` / `class` / `const` / `interface` / `type`
   row in the `## Surface` tables is a real export of the brief source tree, and every export
   appears as a Surface row — exhaustive, both directions. Adding, renaming, or removing an
   export breaks the parity gate until the doc is reconciled.
2. **Deterministic, synchronous, immutable.** This module adds no nondeterminism: no clocks,
   no randomness, no I/O, nothing async. The same `BriefInput` therefore produces the same
   `Briefing` for as long as the engines do — which is unconditional for the engines the
   compiler wires itself, and inherited for a BORROWED `interpret` or `reason`. A stateful
   supplied engine that answers differently on a LATER CALL makes `compile` answer differently
   too, and that is the engine's determinism, not this module's.

   Within ONE call the answer cannot drift, because how many times a foreign object is read is
   this module's decision rather than the engine's: every value an engine returns is owned at
   arrival — copied where the value permits it, sealed in place where it does not — and read
   exactly once thereafter. A verdict whose members answer differently on a second read
   produces the same `Briefing` as one returning those first answers as plain data. The
   earlier wording said "on its second call" while the module was in fact reading one returned
   object twice, which made a sentence about the engine's determinism cover a defect in this
   module's.
   `pinBrief`'s `trace` and `hash` derive from CONTENT alone — the hash is the canonical
   structural digest interprets `digestValue` computes — and the `BriefManager` mints record
   ids from that hash, so re-adding unchanged content is a version no-op. No input is ever
   mutated. A builder ADOPTS the collections it is handed, so a draft still aliases the
   caller's arrays; `snapshotBrief` is the boundary that ends that, and `pinBrief` and
   `BriefManager.add` both cross it. Past that point the brief is a deeply frozen
   null-prototype record sharing no reference with its source, which is what lets a hash keep
   describing its brief for as long as the brief exists.

   The digest is EIGHT hex digits — 32 bits — so it is an identity for a working set, not a
   cryptographic one. Read that as a birthday bound rather than a threshold: collisions become
   likely in the TENS OF THOUSANDS of distinct briefs, around a 50% chance near 77,000, and
   two independent searches over this package's own builders hit their first pair at roughly
   42,000 and 53,000. Those are two draws from one distribution, not a limit — quoting either
   as the safe size is the mistake, and an earlier revision of this paragraph quoted a single
   measured index that overstated the safe scale by more than an order of magnitude.

   `BriefManager` therefore compares `briefToContent` before calling a re-add unchanged, and
   REFUSES a collision with `BriefError('INVALID', …)` rather than silently replacing the
   record already stored. A registry expecting more than a few thousand distinct briefs should
   name its own ids through `ManagerAddOptions.id` instead of letting the digest mint them.

3. **Fail closed at the gate, and the gate is not delegable.** Readiness is decided by
   `findUnmetRules` — in code, from the brief's own measures — BEFORE any verdict is consulted.
   `gateDefinition()` states the same six rules as data so a reasoner can narrate them, and
   a narration is not a decision: `BriefCompilerOptions.reason` lets a caller supply the engine,
   and a supplied engine can add detail to a refusal but can never turn one into a pass. The
   two are held together by a test that drives both over one value set.

   A non-empty `findBlockingGaps` yields an ABSENT `brief`, the questions
   on `Briefing.questions`, and a `BriefStageFailure` coded `BLOCKED` — never a throw, never a
   half-specified brief. That holds even when the gate itself throws and leaves no verdict to
   name rules from: the `BLOCKED` marker is keyed on the blocking gaps, not on the verdict's
   presence. Alongside the decision, `gateDefinition()` is evaluated against
   `briefToSubject(brief)` by a `LogicalReasoner`, so every verdict carries the reasoner's own
   `trace` on `Briefing.verdict` and readiness is auditable, replayable data — and
   `BriefStageRecord` is discriminated by `stage`, so that replay is readable without a single
   type assertion. The two are conjoined in the refusing direction: a brief must satisfy the
   measures AND the verdict, so a borrowed engine can withhold a pass it cannot grant.

4. **The brief is the source of truth; projections never add.** `briefToMarkdown`,
   `briefToGoal`, and `briefToDispatch` are pure views over the pinned brief: the prompt
   references paths and never inlines file contents, the goal condition is the proofs'
   commands verbatim plus the turn cap, the dispatch's owned set is exactly `manifest.edit`,
   and its `authority` is exactly `brief.authority` in rank order. The dispatch therefore says
   in data every PATH the prompt says in prose, so a machine consumer never parses the
   rendering to decide what it may touch or what wins. Everything else the prompt carries —
   outcomes, the proofs' commands, gaps, risks, the output shape, each path's `note` — stays
   in the prompt, which is written for a model; a consumer wanting those reads the `Brief`.
   The artifacts cannot disagree with the contract or each other, and that
   is enforced in the DATA rather than in the renderer: every brief string is one line
   (`isLine` / `isText`), so no field can carry the line break that would forge a heading or
   a second manifest row. An `Example`'s two sides are the single exception, because they
   carry code — `exampleToLines` fences them, which makes them content rather than structure.
5. **Mechanism, never policy.** The module decides NOTHING about a task: `deriveTask` maps
   intents only through CALLER vocabularies and refuses an inherited key, and the draft stage
   merges caller sections OVER derived ones so the user is never overridden. An open gap is
   meant to proceed on a recorded assumption, and `findUnpairedGaps` measures that as a
   COUNT rather than a relation — a brief carries no link from a gap to the assumption that
   answers it. A count is not a contract, so it advises through `validateBrief` and does not
   gate: one assumption answering two related gaps would otherwise be refused for arithmetic.
   What ships is the closed vocabularies, the exact contract, the gate, the pin, and the
   projections.
6. **Guard totality and two-mechanism parity.** Every validator is a total guard: adversarial
   input returns `false`, never throws. The hand-composed guards and the compiled shape
   contract are independent mechanisms over one vocabulary, held in lockstep by
   [`tests/src/core/shapers.test.ts`](../tests/src/core/shapers.test.ts), which drives both
   over one value set. That test is the guarantee, and it is a real one: adding a property to
   `briefShape` that `Brief` does not have turns three of its assertions red.
   `createBriefContract`'s declared `ContractInterface<Brief>` return type is a weaker
   companion, not a proof of equality — assignability runs one way over `T`'s output
   positions, so it catches a shape that infers too little and would accept one that infers
   too much.
7. **Coded errors.** Every throw out of this module is a `BriefError` with a machine-readable
   code, and `catch` blocks narrow with `isBriefError`, never `as`. The `context` is whatever
   the code can actually supply rather than a fixed pair: `DRAFT_FAILED` carries
   `{ stage, field }`, `GATE_FAILED` adds `reasoning`, `INVALID` carries `{ field }` plus the
   offending value where there is one,
   and `DESTROYED` carries none. Stage failures inside `compile` are CONTAINED as
   `BriefStageFailure` entries on the `Briefing`, reserving throws for caller misuse.
8. **Observation is a pure side-channel.** The `BriefCompiler` owns a typed emitter
   (`compile` / `block` / `error` / `destroy`); the `BriefManager` owns its own
   (`add` / `remove` / `destroy`). Every event is emitted directly and synchronously, AFTER
   the outcome it reports. A complete briefing emits `compile` and an incomplete one emits
   `block` instead — exactly one of the two, every call. Listener isolation is the emitter's
   own: a throwing listener routes to the `error` OPTION handler, never onto the domain map.
   `destroy()` is idempotent and tears the emitter down LAST.
9. **DOC and SOURCE method bijection.** Every behavioral interface's `## Methods` table lists
   exactly its public methods — exhaustive, both directions — and each implementing class
   exposes the same public methods, no more.
10. **A borrowed engine is the caller's code, not an attacker.** `BriefCompilerOptions.interpret`
    and `.reason` are seams, and what crosses them obeys three rules: OWN AT ARRIVAL — copied
    where the value permits it, sealed in place where it does not; VALIDATE THE OWNED COPY;
    NEVER READ A FOREIGN OBJECT TWICE. How many times a foreign object is read is this module's
    decision, so a briefing never depends on it.

    Bounding that, and equally load-bearing: never narrow past the published contract. `Entity.value`
    is `unknown` and `LogicalResult` is an interface a class instance satisfies, so a value JSON
    cannot express is on-contract and is sealed rather than refused. Every defect this seam
    produced came from narrowing it — an exact guard that failed the gate closed on a valid
    engine, and a JSON clone that turned a correct refusal into an emitted brief.

    Both engines' returns are shape-checked with their packages' published guards: the verdict
    with reasons' `isLogicalResult`, and the `Interpretation` with interprets'
    `isInterpretation` at both of the stage's doors. A supplied interpretation whose snapshot
    copy loses prototype-carried members is sealed live rather than refused, because the
    published contract is wider than the copy mechanism.

Deliberately absent: a relation or graph layer over briefs (a brief's links are one RANKED
list and four DISJOINT partitions — order and set membership, fully served by the guards,
`findManifestOverlaps`, and the gate), asynchronous compilation, brief persistence
(`JSON.stringify` out, `parseBrief` back in), a turn cap on `BriefCompilerOptions` (nothing in the
pipeline renders a goal, so the cap is `briefToGoal`'s argument), glob expansion (both path
checks compare exact strings, and a glob engine is a dependency this package will not take),
a guard or shape for any PROJECTION (`Briefing`, `BriefStageRecord`, `BriefRecord`, and
`Dispatch` have neither, because a guard narrows untrusted inbound data and nothing accepts
those — the published round trip is the `Brief`, through `JSON.stringify` and `parseBrief`,
and a consumer derives its own dispatch locally), URL validation on `Citation.url` (see its
TSDoc: a `pattern` there makes the seeded generator throw for the whole brief, and four
working mechanisms beat one stricter member), and any LLM invocation — the authoring
judgment is the caller's.

`Dispatch` carries TWO axes, and reading it as five partitions is the one way to get it
wrong. PERMISSION is `read` / `edit` / `locked` / `forbidden`, flattened 1:1 from `Manifest`
— they answer "may I touch this file", and they are mutually disjoint in a GATED brief, which
is what `findManifestOverlaps` measures and the `disjoint` rule refuses on. `briefToDispatch`
runs no gate, so projecting an unvetted draft can produce arrays that intersect: gate before
you dispatch. PRECEDENCE is `authority`, in rank order, index 0 winning every conflict.

`authority` therefore OVERLAPS the permission arrays by design, and by requirement: the
executor has to open what it obeys, so a ranked path ALWAYS also sits in `read`, `edit`, or
`locked`, and the `granted` rule refuses a brief where one does not. Read the four to decide
what may be touched and `authority` to decide what wins. Never union all five — that was
already wrong before `authority` existed, since `forbidden` is an exclusion rather than a
grant. It is projected as paths rather than left to `prompt` because a machine consumer must
not have to parse a document written for a model to discover mandatory authority.

## Patterns

### Compiling a rough request

The forward path end to end: text, interpret, draft, gate, pin. The interpret stage
classifies intent and mines entities; `deriveTask` / `deriveGivens` / `deriveGaps` draft the
brief; caller sections merge over the draft; the gate rules; the pin stamps.

Passing `text` means "interpret this". A pipeline that cannot resolve the text raises its
own required ambiguity, which drafts as a BLOCKING gap and stops emission — so the text path
needs an interpret pipeline that can actually match the request:

```ts
import { createBriefCompiler, outcome, output, proof } from '@orkestrel/brief'
import { createInterpret } from '@orkestrel/interpret'
import { quantitativeDefinition } from '@orkestrel/reason'

const migrations = createBriefCompiler({
	interpret: createInterpret({
		extractor: {
			extract: () => ({
				intent: { action: 'migrate', domain: 'code', confidence: 1 },
				numbers: [3],
			}),
		},
		templates: [
			{
				id: 'migration',
				name: 'Migration',
				domain: 'code',
				intents: ['migrate'],
				mappings: [{ entity: 'count', aliases: [], field: 'count' }],
				defaults: [],
				computations: [],
				definition: quantitativeDefinition('migration', 'Migration', []),
			},
		],
	}),
	actions: { migrate: 'migrate' }, // an interprets action to the closed TaskOperation
	domains: { code: 'code' }, // an interprets domain to the closed TaskDomain
})

const migration = migrations.compile({
	text: 'migrate the 3 legacy stores to the new driver seam',
	manifest: {
		read: [{ path: 'guides/stores.md', note: 'the driver seam contract' }],
		edit: [{ path: 'src/core/stores/**', note: 'the three legacy stores' }],
		locked: [],
		forbidden: [{ path: 'app/**', note: 'out of scope' }],
	},
	outcomes: [outcome(1, 'all three stores implement the driver seam')],
	output: output('diff'),
	proofs: [proof('the core test project passes', 'npm run test:src:core')],
})

migration.stages.map((record) => record.stage) // ['interpret', 'draft', 'gate', 'pin']
migration.interpretation?.intent // { action: 'migrate', domain: 'code', confidence: 1 }
migration.brief?.task.operation // 'migrate' — derived through the caller vocabulary
migration.brief?.givens // [{ category: 'extracted', name: 'count', value: '3' }]
migration.verdict?.conclusion // true — the gate's traceable yes
migration.brief !== undefined // true
migrations.destroy()
```

Drop the templates and the same call blocks instead, carrying interprets own question
(`Which domain and action did you mean?`) as a blocking gap. That is the design working, not
a defect: a contract built on a request the language pipeline could not resolve is exactly
what the gate exists to refuse. A caller who does not want interpretation omits `text` and
supplies `task` directly.

### Failing closed — the blocking path

A required, unresolvable decision drafts a BLOCKING gap. The gate stops emission and the
`Briefing` carries the questions; the caller answers, re-compiles, done. No half-specified
brief ever leaves the pipeline.

```ts
import { createBriefCompiler, gap, outcome, proof, task } from '@orkestrel/brief'

const blocked = createBriefCompiler()
const stopped = blocked.compile({
	task: task('refactor', 'code', 'Refactor the session store to the async seam.'),
	outcomes: [outcome(1, 'the store implements the async seam')],
	gaps: [
		gap('output', 'Should the result land as a diff or full files?', {
			blocking: true,
			candidates: ['diff', 'code'],
		}),
	],
	proofs: [proof('checks pass', 'npm run check')],
})

stopped.brief // undefined — the gate failed closed, and that absence is the signal
stopped.brief // undefined — nothing to project, deliberately
stopped.questions // [{ field: 'output', question: 'Should the result land as…', blocking: true, … }]
stopped.failures // [{ stage: 'gate', code: 'BLOCKED', message: '1 blocking gap(s)' }]
stopped.verdict?.rules.filter((entry) => !entry.conclusion) // exactly which rules missed
stopped.verdict?.trace // the reasoner's narration of the rules that DERIVED, not the misses
blocked.destroy()
```

A gate that refuses for a reason OTHER than a blocking gap — no proofs, a compound
statement, an overlapping manifest, an authority no partition opens — reports the unmet
rule ids instead, and the briefing is
incomplete the same way. A brief with no proofs and a two-sentence statement reports
`Gate refused: proven, single`.

An OPEN gap takes the other path: assume narrowly, record the assumption, proceed. It does
not gate. `findUnpairedGaps` counts the open gaps past the assumption count and
`validateBrief` reports the surplus as a WARNING, because the pairing is arithmetic rather
than a link the brief carries — one assumption answering two related gaps is good practice
and a count cannot tell it from a missing one. Read the warning; the gate will not read it
for you.

### Gating through the reason engine

The gate is ordinary reasons machinery, which means you can inspect it, run it standalone, or
build your own beside it. `briefToSubject` projects the brief into a flat measures record,
`gateDefinition()` is a `LogicalDefinition` whose rules read those measures, and the
`LogicalReasoner` narrates the verdict.

```ts
import { briefToSubject, gateDefinition } from '@orkestrel/brief'
import {
	atom,
	compound,
	createLogicalReasoner,
	createReason,
	logicalDefinition,
	rule,
} from '@orkestrel/reason'

const engine = createReason({ reasoners: [createLogicalReasoner()] })
const measures = briefToSubject(pinned)
measures // { operation: 'refactor', blocking: 0, outcomes: 2, required: 2, proofs: 1, edits: 1, … }

const ruling = engine.reason(measures, gateDefinition())
if (ruling.reasoning === 'logical') {
	ruling.conclusion // true — ready to emit
	ruling.rules.filter((entry) => !entry.conclusion) // the rules that MISSED
}
engine.destroy()

// A house gate: this package's readiness UNCHANGED, plus one rule of your own, on your engine.
const house = logicalDefinition('house', 'House readiness', [
	...gateDefinition().rules,
	rule('anchored', [atom('authority', 'above', 0)], atom('anchored', 'equals', true)),
	rule(
		'fit',
		[compound('and', [atom('ready', 'equals', true), atom('anchored', 'equals', true)])],
		atom('fit', 'equals', true),
	),
])
engine.reason(measures, house) // conclusion is `fit` — base readiness AND anchored
```

Keep `gateDefinition().rules` whole. `fit` reads the `ready` FACT, so dropping the rule that
derives it leaves `fit` conjoining something nothing proved, and a base-ready brief concludes
`false`.

**`compile` does not decide readiness with this definition.** `findUnmetRules(brief)` measures
the same six rules in code and refuses before any verdict is read; the definition above is
what a reasoner narrates, so `Briefing.verdict` carries the trace and the rule-level detail.
The two are conjoined in the refusing direction, so a borrowed engine can withhold a pass and
can never grant one. A test drives both over one value set, which is what keeps the data and
the code saying the same thing.

**`gateDefinition()` takes no arguments, and there is no option that reaches it.** That is
the design, not an omission. The reasoner overlays every derived fact into one flat
namespace, so a caller rule named for a readiness fact — `specified`, `proven`, `single` —
overwrites the fact `ready` conjoins, and a brief carrying a blocking gap concludes `true`.
A gate whose whole job is to fail closed cannot take rules from the caller it is gating.

Readiness is this package's contract. A caller who needs different readiness composes their
own `LogicalDefinition` over `briefToSubject` and evaluates it on their own reasoner, as
above; both are exported for exactly that, and neither can reach the definition `compile`
uses. Two independent safeguards back it up: `compile` refuses a blocking gap **before** it
consults the verdict, so no supplied engine can emit a brief that still carries an open
question, and `ready` is always the last rule so forward chaining reports it.

### Projecting the downstream artifacts

One brief, three views — authored zero times each.

```ts
import { briefToDispatch, briefToGoal, briefToMarkdown } from '@orkestrel/brief'

briefToMarkdown(pinned)
// '# Brief: Refactor useForm to native browser form APIs.
//
//  refactor · code
//
//  ## Authority (ranked)
//  1. AGENTS.md — project law; wins every conflict
//  …paths referenced, contents never inlined — the executor retrieves.'

briefToGoal(pinned, 12)
// 'Done when every proof passes: npm run check exits 0. Cap: 12 turns.'

const handoff = briefToDispatch(pinned)
handoff.edit // ['src/browser/composables/useForm.ts'] — the subagent's owned files
handoff.locked // ['src/browser/types.ts'] — read, never write
handoff.forbidden // ['app/**'] — never opened
handoff.authority // ['AGENTS.md'] — precedence, not permission; index 0 wins every conflict
handoff.prompt // the briefToMarkdown rendering, ready to hand off
```

Because `manifest.edit` is what parallel subagents partition on, keep it minimal and
disjoint: two dispatches whose `edit` sets do not intersect can run concurrently under the
same brief without conflict.

### Narrowing an untrusted brief

Briefs round-trip JSON — a stored brief, a tool argument, an agent's emission — through the
parse-then-trust boundary: shape via the compiled guard, semantics via `validateBrief`,
readiness via the gate. Three gates, three questions.

```ts
import { createBriefCompiler, parseBrief, validateBrief } from '@orkestrel/brief'

const incoming = parseBrief(JSON.stringify(pinned)) // Brief | undefined — never throws
if (incoming !== undefined) {
	const validation = validateBrief(incoming) // the semantic pass — returns, never throws
	if (validation.valid) {
		const checker = createBriefCompiler()
		checker.gate(incoming).conclusion // the readiness verdict, traced
		checker.destroy()
	} else {
		validation.errors.length // what no assumption can paper over
		validation.warnings.length // what is runnable but suspicious
	}
}
```

### Serving briefs at a tool boundary

The shape payoff: the same declaration that compiles the guard serves the tool schema and the
test data, so an MCP tool accepting briefs cannot drift from the validator that checks them.

```ts
import { briefToMarkdown, createBriefContract, parseBrief } from '@orkestrel/brief'
import { schemaToParameters, seededRandom } from '@orkestrel/contract'

const boundary = createBriefContract()

const tool = {
	name: 'execute_brief',
	description: 'Execute a compiled brief against this workspace.',
	parameters: schemaToParameters(boundary.schema), // the JSON Schema, no `as` anywhere
}
tool.name // 'execute_brief'

// In the handler: the string boundary is parseBrief; the payload is then trusted typed data.
const handled = parseBrief('{}') === undefined ? 'Rejected: not a valid brief.' : 'accepted'
handled // 'Rejected: not a valid brief.'
briefToMarkdown(boundary.generate(seededRandom(7))) // a reproducible fixture, rendered
```

### Storing briefs by their own identity

```ts
import { brief, createBriefManager, outcome, proof, task } from '@orkestrel/brief'

const store = createBriefManager()
const first = store.add(
	brief(task('plan', 'ops', 'Plan the 0.1 release.'), {
		outcomes: [outcome(1, 'the layer order is written down')],
		proofs: [proof('the catalog regenerates', 'npx @orkestrel/scaffold catalog')],
	}),
)
store.add(first.brief).version // 1 — unchanged content is a version no-op
store.size // 1 — the same content minted the same id
store.destroy()
```

### Practices

- **One task per brief.** `validateBrief` errors on a multi-sentence statement; a compound
  request is two `compile` calls, not one longer statement.
- **Ask only blocking gaps.** Everything else: assume narrowly, record the assumption beside
  its open gap, proceed. Never override the user — the draft stage merges caller sections
  OVER derived ones for the same reason.
- **Reference, never duplicate.** `authority` and `manifest` point at paths; pasting file
  contents into `givens` buries the signal and duplicates what the executor can retrieve. The
  one exception is `examples`: an input-to-output exemplar removes more ambiguity than prose.
- **Let the container say what a path is.** Both sections hold the same `Reference`, so a path
  gets its meaning from where it sits: rank in `authority`, permission in a manifest partition.
  Write `note` for why the path is listed, not for what kind of file it is.
- **List every authority in the manifest too.** Ranking a path says obey it; a partition says
  the executor may open it, and it needs both. Put it in `read`, or in `locked` when it must
  not change. `findUngrantedAuthority` refuses the gap at the gate, so this is not advice.
- **Pin the outcome, not a plan.** Specify `output` and `proofs` and leave the route free; a
  brittle step list in `rules` makes runs diverge. A rule belongs in `rules` only when the
  METHOD is the requirement.
- **Outcomes versus bounds, decided once.** If violating it makes the result wrong, it is a
  rule or an invariant; if achieving it defines "done", it is a required outcome. Never put a
  limit in `outcomes`.
- **Prefer proofs with a clear exit signal.** `npm run check`, a scoped `npm run test:<scope>`,
  a `git diff` confined to the manifest. These become the `/goal` condition verbatim, so vague
  prose here is a vague finish line.
- **Keep the manifest partitions disjoint and `edit` minimal.** `findManifestOverlaps` catches
  the overlap; a lean `edit` set is what makes parallel dispatch safe.
- **Gate untrusted briefs twice.** `parseBrief` for shape at the boundary, `validateBrief` for
  semantics; reserve `assertBrief`'s throw for programmer-error contexts where invalidity is a
  bug.
- **Store `pinBrief` output, not drafts.** The hash is the identity; `JSON.stringify` out,
  `parseBrief` back in, and the `BriefManager` recognizes unchanged content as the same version.
- **Bring your own engines to observe them.** Pass `interpret` and `reason` through
  `BriefCompilerOptions` when you need their emitters or shared registries; the compiler destroys
  only what it created.
- **Destroy when done.** `destroy()` releases the owned engines and the emitter; a destroyed
  instance throws `DESTROYED` on use — narrow with `isBriefError`.

## Tests

- [`tests/guides.test.ts`](../tests/guides.test.ts) — the `## Surface` to `src/core` bijection (value and type exports), the `## Methods` to interface-method bijection, link integrity, fence languages, example presence, and fence-import reality.
- [`tests/src/core/BriefCompiler.test.ts`](../tests/src/core/BriefCompiler.test.ts) — the four-stage pipeline, stage order and records, the interpret-skip path, caller-over-derived merging, fail-closed blocking (questions, the `BLOCKED` failure, the absent brief), `gate` verdict tracing, event sequences (`compile` versus `block`), owned-versus-borrowed engine teardown, idempotent `destroy`, and `DESTROYED` throws.
- [`tests/src/core/BriefManager.test.ts`](../tests/src/core/BriefManager.test.ts) — content-hash id minting, version bump only on content change, the three `remove` forms, per-event emissions, and destroy semantics.
- [`tests/src/core/helpers.test.ts`](../tests/src/core/helpers.test.ts) — every builder's output shape, every projection, the derivations and their off-vocabulary `undefined`, `pinBrief` determinism and idempotence, `gateDefinition`'s rule list against `findUnmetRules` over one value set, `validateBrief` errors and warnings, and the four `find*` leaves.
- [`tests/src/core/validators.test.ts`](../tests/src/core/validators.test.ts) — each guard accepts valid and rejects invalid plus adversarial junk, exact-record semantics, and off-vocabulary rejection.
- [`tests/src/core/shapers.test.ts`](../tests/src/core/shapers.test.ts) — the shape family against the guard family over one value set, JSON Schema essentials, and seeded generate round-trips.
- [`tests/src/core/parsers.test.ts`](../tests/src/core/parsers.test.ts) — `parseBrief` guard soundness in both directions and its JSON round-trip.
- [`tests/src/core/factories.test.ts`](../tests/src/core/factories.test.ts) — `createBriefCompiler` / `createBriefManager` / `createBriefContract`.
- [`tests/src/core/index.test.ts`](../tests/src/core/index.test.ts) — the barrel resolves and re-exports the whole surface.
- [`tests/src/core/integration.test.ts`](../tests/src/core/integration.test.ts) — text to interpret to brief to gate to projections end to end, and a gated brief re-compiled with the answered gap passing.

## See also

- [`reason.md`](reason.md) — the engine beneath the gate: `LogicalDefinition`, `Subject`, the traceable `LogicalResult`, and the capability layer `gateDefinition` extends.
- [`interpret.md`](interpret.md) — the language pipeline the `interpret` stage delegates to: `Interpretation`, `Intent`, `Entity`, `Ambiguity`.
- [`contract.md`](contract.md) — the guards, combinators, shapes, and `createContract` machinery this package composes.
- [`emitter.md`](emitter.md) — the typed emitter behind the compiler's and the manager's observation surfaces.
- [`AGENTS.md`](../AGENTS.md) — the rules this package is written to.
- [`README.md`](README.md) — the guides index.
