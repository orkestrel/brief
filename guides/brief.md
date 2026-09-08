# Brief

> The specification compiler: a synchronous, deterministic pipeline that resolves a rough
> request into a `Brief` — a closed, content-hashed execution contract another agent can run
> with no interpretation left to do — gated by a traceable reasoner and projected into every
> downstream artifact.

You cannot make a model's sampling deterministic from a prompt, but you can make the task
deterministic: resolve every implicit decision ahead of time and pin the result with
mechanical proofs, so any correct execution is equivalent under the contract. The `Brief`
is that resolution as plain data, and the module is deliberately mechanism, never policy.
The judgment calls — which files, which outcomes, which proofs — belong to the caller,
whether a human or an agent. This module supplies the closed vocabularies, the exact-record
validation, the fail-closed gate, the deterministic pinning, and the lossless projections.
Separating the _what_ from the _how_ is the whole design: `outcomes` and `proofs` pin the
result's shape and its transcript-provable evidence, while the method stays free unless the
method itself is the requirement.

The forward path: raw text runs through an injected `@orkestrel/interpret` pipeline, its
`Interpretation` is drafted into brief sections (intent to `task`, entities to `givens`,
ambiguities to `gaps`), caller-supplied sections merge over the draft, the fail-closed gate is
evaluated as a reasons `LogicalDefinition` — a traceable verdict, never an ad-hoc `if` — and a
passing brief is pinned, with `trace` and `hash` derived rather than authored. The reverse
path: `briefToMarkdown`, `briefToGoal`, and `briefToDispatch` project the pinned brief into
its downstream views, each derived from the one contract rather than written beside it.

Nothing here is an LLM, provider, or agent: the markdown a projection renders is for an
external model, never consumed internally. A brief with blocking gaps yields a visible
incomplete `Briefing` carrying the questions, because a half-specified brief is worse than a
question.

Every discriminant names its axis, never `kind` or `type`: `stage` splits the pipeline
phases, `severity` splits risks, and `code` splits coded errors. A record whose container
already fixes what it is, like a referenced path, or whose candidate vocabulary was neither
closed nor disjoint, like a cited source, carries no discriminant at all.

Source: [`src/core`](../src/core). Surfaced through the `@src/core` barrel.

## Surface

### Compile and project a brief

Compile a request into a `Briefing`, then project the brief it carries:

```ts
import {
	briefToGoal,
	briefToMarkdown,
	buildOutcome,
	buildProof,
	buildTask,
	createBriefCompiler,
} from '@orkestrel/brief'

const compiler = createBriefCompiler()

const briefing = compiler.compile({
	task: buildTask('refactor', 'code', 'Refactor useForm to native browser form APIs.'),
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
	outcomes: [buildOutcome(1, 'useForm uses native FormData with no behavior change')],
	proofs: [buildProof('type-check and lint pass', 'npm run check')],
})

briefing.brief !== undefined // true — the brief is present exactly when the gate passed
if (briefing.brief !== undefined) {
	briefToMarkdown(briefing.brief) // the copy-ready agent prompt
	briefToGoal(briefing.brief) // the /goal completion condition
}

compiler.emitter.on('block', (questions) => questions.length)
compiler.destroy()
```

`compile()` is genuinely synchronous and runs the fixed pipeline
`[interpret, draft, gate, pin]`. Blocking gaps, a refused gate, and a thrown stage all
yield a visible incomplete `Briefing` — `brief` absent and the cause recorded on `failures` —
rather than a throw. `questions` carries the gaps when a blocking gap is the cause and is
empty otherwise, so `brief !== undefined` is the completeness test rather than
`questions.length`. The `interpret` stage is skipped entirely when the input carries no `text`,
so a fully caller-authored `BriefInput` drafts, gates, and pins without touching the language
pipeline at all.

### Types

A `Shape` cell holds an interface's data members as bare names in braces, `?` marking an optional member and `plus` introducing its call-signature members, and a type alias's own type literal with a union's arms escaped as `\|`.

| Type                     | Kind      | Shape                                                                                                                                                                     | Summary                                                                                             |
| ------------------------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `TaskOperation`          | type      | `'create' \| 'refactor' \| 'debug' \| 'extract' \| 'migrate' \| 'explain' \| 'review' \| 'optimize' \| 'audit' \| 'test' \| 'document' \| 'plan'`                         | Names the closed vocabulary of what a brief asks for.                                               |
| `TaskDomain`             | type      | `'code' \| 'writing' \| 'research' \| 'analysis' \| 'design' \| 'data' \| 'ops' \| 'other'`                                                                               | Names the closed vocabulary of the subject matter a brief operates on.                              |
| `OutputFormat`           | type      | `'markdown' \| 'json' \| 'code' \| 'diff' \| 'prose'`                                                                                                                     | Names the closed vocabulary of deliverable shapes.                                                  |
| `RiskSeverity`           | type      | `'low' \| 'medium' \| 'high'`                                                                                                                                             | Names the closed vocabulary of risk severities.                                                     |
| `BriefStage`             | type      | `'interpret' \| 'draft' \| 'gate' \| 'pin'`                                                                                                                               | Names the fixed compilation phases, in pipeline order.                                              |
| `BriefErrorCode`         | type      | `'INTERPRET_FAILED' \| 'DRAFT_FAILED' \| 'GATE_FAILED' \| 'PIN_FAILED' \| 'BLOCKED' \| 'INVALID' \| 'DESTROYED'`                                                          | Names the machine-readable reasons a `BriefError` carries.                                          |
| `Task`                   | interface | `{ operation, domain, statement }`                                                                                                                                        | States what the brief asks for, in one imperative sentence.                                         |
| `Reference`              | interface | `{ path, note }`                                                                                                                                                          | Represents one referenced path and why it is listed.                                                |
| `Manifest`               | interface | `{ read, edit, locked, forbidden }`                                                                                                                                       | Represents the disjoint file partitions of a brief.                                                 |
| `Outcome`                | interface | `{ rank, text, required }`                                                                                                                                                | Represents one ranked outcome — a result, never a step.                                             |
| `Given`                  | interface | `{ category, name, value }`                                                                                                                                               | Represents one context fact handed to the executor — a convention, a version, a constraint value.   |
| `Example`                | interface | `{ input, output, note? }`                                                                                                                                                | Represents one input to output exemplar — the ambiguity remover that leaves the least to interpret. |
| `Citation`               | interface | `{ name, url, note }`                                                                                                                                                     | Represents one external source — what it is called, where it lives, and why it is cited.            |
| `Gap`                    | interface | `{ field, question, blocking, candidates? }`                                                                                                                              | Represents one unknown the brief has not resolved.                                                  |
| `Risk`                   | interface | `{ severity, text, mitigation }`                                                                                                                                          | Represents one pre-empted risk and the mitigation that answers it.                                  |
| `Output`                 | interface | `{ format, sections?, include?, exclude? }`                                                                                                                               | Represents the closed shape of the deliverable.                                                     |
| `Proof`                  | interface | `{ text, command }`                                                                                                                                                       | Represents one mechanical, transcript-provable check.                                               |
| `Brief`                  | interface | `{ task, authority, manifest, outcomes, rules, invariants, givens, examples, assumptions, citations, gaps, risks, output, proofs, trace?, hash? }`                        | Represents the closed execution contract — a rough request with every implicit decision resolved.   |
| `BriefInput`             | interface | `{ text?, interpretation?, task?, authority?, manifest?, outcomes?, rules?, invariants?, givens?, examples?, assumptions?, citations?, gaps?, risks?, output?, proofs? }` | Represents one `compile()` input.                                                                   |
| `Briefing`               | interface | `{ interpretation?, brief?, questions, verdict?, stages, failures, digest }`                                                                                              | Represents the full, replayable outcome of one `compile()` call.                                    |
| `Dispatch`               | interface | `{ prompt, authority, read, edit, locked, forbidden }`                                                                                                                    | Represents the subagent projection of a brief.                                                      |
| `InterpretStageRecord`   | interface | `{ stage, input, output?, error? }`                                                                                                                                       | Records the `interpret` phase snapshot — raw text in, an `Interpretation` out.                      |
| `DraftStageRecord`       | interface | `{ stage, input, output?, error? }`                                                                                                                                       | Records the `draft` phase snapshot — the caller's input in, an unpinned `Brief` out.                |
| `GateStageRecord`        | interface | `{ stage, input, output?, error? }`                                                                                                                                       | Records the `gate` phase snapshot — the readiness `Subject` in, the reasoner's verdict out.         |
| `PinStageRecord`         | interface | `{ stage, input, output?, error? }`                                                                                                                                       | Records the `pin` phase snapshot — the drafted `Brief` in, the pinned `Brief` out.                  |
| `BriefStageRecord`       | type      | `InterpretStageRecord \| DraftStageRecord \| GateStageRecord \| PinStageRecord`                                                                                           | Represents one pipeline phase, discriminated by `stage`.                                            |
| `BriefStageFailure`      | interface | `{ stage, code, message }`                                                                                                                                                | Represents a visible marker for a phase that failed.                                                |
| `BriefRecord`            | interface | `{ id, brief, version, hash }`                                                                                                                                            | Represents a versioned, content-hashed `Brief` inside a `BriefManagerInterface`.                    |
| `BriefCompilerEventMap`  | type      | `{ compile, block, error, destroy }`                                                                                                                                      | Declares the `BriefCompiler`'s push observation surface.                                            |
| `BriefCompilerOptions`   | interface | `{ interpret?, reason?, actions?, domains?, on?, error? }`                                                                                                                | Represents the input to `createBriefCompiler`.                                                      |
| `BriefCompilerInterface` | interface | `{ emitter, interpret, reason } plus compile, gate, destroy`                                                                                                              | Declares the compilation orchestrator contract.                                                     |
| `BriefManagerEventMap`   | type      | `{ add, remove, destroy }`                                                                                                                                                | Declares the `BriefManager`'s push observation surface.                                             |
| `BriefManagerOptions`    | interface | `{ briefs?, on?, error? }`                                                                                                                                                | Represents the input to `createBriefManager`.                                                       |
| `BriefManagerInterface`  | interface | `{ emitter, count } plus has, brief, briefs, add, remove, destroy`                                                                                                        | Declares the brief registry contract.                                                               |

The `Briefing` deliberately carries cross-package payloads by their originating types:
`interpretation` is an `@orkestrel/interpret` `Interpretation`, `verdict` is an
`@orkestrel/reason` `LogicalResult`, and `BriefManagerInterface.add` takes interprets
`RecordOptions`. Each is imported at the consumer site from the package that owns it,
never re-exported here. The verdict is the gate's own traceable account: every readiness
check, met or missed, narrated by the reasoner.

### Constants

A `Shape` cell holds the constant's declared type.

| API                      | Kind  | Shape                               | Summary                                                                         |
| ------------------------ | ----- | ----------------------------------- | ------------------------------------------------------------------------------- |
| `TASK_OPERATIONS`        | const | `readonly TaskOperation[]`          | Lists the `TaskOperation` values, frozen.                                       |
| `TASK_DOMAINS`           | const | `readonly TaskDomain[]`             | Lists the `TaskDomain` values, frozen.                                          |
| `OUTPUT_FORMATS`         | const | `readonly OutputFormat[]`           | Lists the `OutputFormat` values, frozen.                                        |
| `RISK_SEVERITIES`        | const | `readonly RiskSeverity[]`           | Lists the `RiskSeverity` values, frozen.                                        |
| `INTERPRETATION_MEMBERS` | const | `readonly (keyof Interpretation)[]` | Lists every published `Interpretation` member name, frozen.                     |
| `DEFAULT_BRIEF_TURNS`    | const | `number`                            | Holds `16` — the default turn cap `briefToGoal` renders.                        |
| `GATE_ID`                | const | `string`                            | Holds `'gate'` — the id of the `buildGateDefinition()` logical definition.      |
| `LINE_BREAK_PATTERN`     | const | `RegExp`                            | Matches every line terminator a brief field refuses.                            |
| `SINGLE_LINE_PATTERN`    | const | `RegExp`                            | Holds the positive form of `LINE_BREAK_PATTERN`, for a `stringShape` `pattern`. |
| `BLANK_PATTERN`          | const | `RegExp`                            | Matches a string of one or more spaces and nothing else.                        |

An interpretation the compiler reads is foreign data, and a class instance carries its contract
on the prototype, so `BriefCompiler` materializes the members `INTERPRETATION_MEMBERS` names into
a frozen view of its own. The list is pinned to `keyof Interpretation`: a name
`@orkestrel/interpret` does not publish fails the compile, and a member it adds fails the equality
assertion in [`BriefCompiler.test.ts`](../tests/src/core/BriefCompiler.test.ts).

```ts
import {
	DEFAULT_BRIEF_TURNS,
	GATE_ID,
	INTERPRETATION_MEMBERS,
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
INTERPRETATION_MEMBERS.includes('subject') // true — the optional members are captured too
```

A closed-set field that does not fit a listed value is a signal the request is mis-scoped,
not licence to invent a value: the validators reject an off-vocabulary literal and the
shapers compile the same tuples into the JSON Schema `enum`s, so the vocabulary cannot
drift between the guard and the schema.

### Errors

| API            | Kind     | Summary                                             |
| -------------- | -------- | --------------------------------------------------- |
| `BriefError`   | class    | Represents the one error class this package throws. |
| `isBriefError` | function | Narrows a caught value to a `BriefError`.           |

`BriefError` extends `Error` with a readonly `code` on the `BriefErrorCode` vocabulary and an
optional readonly `context` record.

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
are not an error — the gate fails closed into an incomplete `Briefing` whose `failures` carry
a `BLOCKED` marker, mirroring interprets `NO_TEMPLATE` visible-incomplete outcome.

Each code carries the `context` it can actually supply, and they are not uniform: `DRAFT_FAILED`
carries `{ stage, field }`, `GATE_FAILED` carries `{ stage, field, reasoning }`, `INVALID`
carries `{ field }` plus the offending value where the code has one — the hash on a
content-hash collision — and `DESTROYED` carries none.

### Validators

Total guards composed from the `@orkestrel/contract` combinators. Adversarial input — junk,
cycles, hostile prototypes — returns `false`, never throws. Every record guard is exact: an
extra key fails, which is why the following builders omit absent optional keys. A key that is
present but holds `undefined` also fails, matching this workspace's
`exactOptionalPropertyTypes` contract.

Exactness stops at this package's own records. The gate checks a borrowed engine's return with
`@orkestrel/reason`'s published result guards — open on unknown keys, class instances accepted —
imported rather than reimplemented here. reason deliberately accepts an empty rule id, because
`RuleResult.id` is `string` and a non-empty check would narrow past the published contract; a
consumer wanting that stricter reading asserts it at its own boundary. The interpret stage
guards the same way with `@orkestrel/interpret`'s published `isInterpretation`, at both of its
doors: the borrowed engine's return and a caller-supplied `interpretation`. A malformed value at
either door records `INTERPRET_FAILED` instead of throwing out of `compile`.

In a guard table a `Shape` cell holds the type the guard narrows to.

| API               | Kind  | Shape           | Summary                                                                                          |
| ----------------- | ----- | --------------- | ------------------------------------------------------------------------------------------------ |
| `isText`          | const | `string`        | Checks whether the value is a string holding no line terminator, empty included.                 |
| `isLine`          | const | `string`        | Checks whether the value is a non-empty string holding no line terminator.                       |
| `isTaskOperation` | const | `TaskOperation` | Checks whether the value is one of the `TaskOperation` literals.                                 |
| `isTaskDomain`    | const | `TaskDomain`    | Checks whether the value is one of the `TaskDomain` literals.                                    |
| `isOutputFormat`  | const | `OutputFormat`  | Checks whether the value is one of the `OutputFormat` literals.                                  |
| `isRiskSeverity`  | const | `RiskSeverity`  | Checks whether the value is one of the `RiskSeverity` literals.                                  |
| `isTask`          | const | `Task`          | Checks whether the value is a well-formed `Task` — both vocabularies closed, statement one line. |
| `isReference`     | const | `Reference`     | Checks whether the value is a well-formed `Reference` — both members required, both single-line. |
| `isManifest`      | const | `Manifest`      | Checks whether the value is a well-formed `Manifest`.                                            |
| `isOutcome`       | const | `Outcome`       | Checks whether the value is a well-formed `Outcome` — `rank` a positive integer.                 |
| `isGiven`         | const | `Given`         | Checks whether the value is a well-formed `Given` — its `value` may be empty but stays one line. |
| `isExample`       | const | `Example`       | Checks whether the value is a well-formed `Example`.                                             |
| `isCitation`      | const | `Citation`      | Checks whether the value is a well-formed `Citation` — every member single-line.                 |
| `isGap`           | const | `Gap`           | Checks whether the value is a well-formed `Gap`.                                                 |
| `isRisk`          | const | `Risk`          | Checks whether the value is a well-formed `Risk` — `severity` on the closed vocabulary.          |
| `isOutput`        | const | `Output`        | Checks whether the value is a well-formed `Output` — `format` on the closed vocabulary.          |
| `isProof`         | const | `Proof`         | Checks whether the value is a well-formed `Proof`.                                               |
| `isBrief`         | const | `Brief`         | Checks whether the value satisfies the whole exact-record `Brief` contract.                      |

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
buys what a guard cannot: the JSON Schema a tool boundary needs, a seeded generator
for test data, and per-field diagnostics through `explain`. Each shaper is a plain shape
value; `briefShape` composes the section shapes, and `createBriefContract()` compiles it.

The guard family and the shape family are independent mechanisms over one vocabulary.
That is deliberate: a single source could not disagree with itself, so it could never catch
a mistake. [`tests/src/core/shapers.test.ts`](../tests/src/core/shapers.test.ts) drives both
over the same values and fails the moment they diverge, and `createBriefContract`'s declared
`ContractInterface<Brief>` return type makes the compiler prove `Infer<typeof briefShape>`
is exactly `Brief`.

A `Shape` cell holds the constant's declared type.

| API              | Kind  | Shape                                                                                                                                                           | Summary                                                                                            |
| ---------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `textShape`      | const | `StringShape`                                                                                                                                                   | Describes a single-line string of any length, including empty — the shape mirror of `isText`.      |
| `lineShape`      | const | `StringShape`                                                                                                                                                   | Describes a non-empty single-line string — the shape mirror of `isLine`.                           |
| `taskShape`      | const | `ObjectShape<{ operation, domain, statement }>`                                                                                                                 | Describes the `Task` shape — closed operation and domain vocabularies plus a non-empty statement.  |
| `referenceShape` | const | `ObjectShape<{ path, note }>`                                                                                                                                   | Describes the `Reference` shape — a path and the note that justifies listing it.                   |
| `manifestShape`  | const | `ObjectShape<{ read, edit, locked, forbidden }>`                                                                                                                | Describes the `Manifest` shape — disjoint reference partitions.                                    |
| `outcomeShape`   | const | `ObjectShape<{ rank, text, required }>`                                                                                                                         | Describes the `Outcome` shape — a one-based rank, the result text, and whether it gates done.      |
| `givenShape`     | const | `ObjectShape<{ category, name, value }>`                                                                                                                        | Describes the `Given` shape — one categorized context fact.                                        |
| `exampleShape`   | const | `ObjectShape<{ input, output, note? }>`                                                                                                                         | Describes the `Example` shape — one input to output exemplar.                                      |
| `citationShape`  | const | `ObjectShape<{ name, url, note }>`                                                                                                                              | Describes the `Citation` shape — a name, a locator, and why the source is cited.                   |
| `gapShape`       | const | `ObjectShape<{ field, question, blocking, candidates? }>`                                                                                                       | Describes the `Gap` shape — an unknown, whether it blocks, and the candidates that would close it. |
| `riskShape`      | const | `ObjectShape<{ severity, text, mitigation }>`                                                                                                                   | Describes the `Risk` shape — a closed severity, the risk, and its mitigation.                      |
| `outputShape`    | const | `ObjectShape<{ format, sections?, include?, exclude? }>`                                                                                                        | Describes the `Output` shape — a closed format plus its optional refinements.                      |
| `proofShape`     | const | `ObjectShape<{ text, command }>`                                                                                                                                | Describes the `Proof` shape — the claim and the command that settles it.                           |
| `briefShape`     | const | `ObjectShape<{ task, authority, manifest, outcomes, rules, invariants, givens, examples, assumptions, citations, gaps, risks, output, proofs, trace?, hash? }>` | Describes the whole `Brief` shape, section shapes composed.                                        |

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
briefShape.category // 'object'
referenceShape.category // 'object'
manifestShape.category // 'object'
outcomeShape.category // 'object'
givenShape.category // 'object'
exampleShape.category // 'object'
citationShape.category // 'object'
gapShape.category // 'object'
riskShape.category // 'object'
outputShape.category // 'object'
proofShape.category // 'object'
```

### Builders

Value builders — every builder returns a fresh object and omits absent optional keys entirely,
so its shape round-trips the exact-record validators named earlier.

Builders are structural, not validating: they adopt whatever they are handed. `buildReference('a',
'')` and `buildCitation('MDN', 'https://x', 'a\nb')` both return a typed value the matching guard
rejects, because the single-line and non-empty contracts bind where a guard runs rather than
where a value is built. That is deliberate and uniform across every builder — validation lives
at the boundaries the data actually crosses: `parseBrief` on the way in, `snapshotBrief` inside
every projection, and the gate before emission. Pass on-contract arguments, or check the
result.

| API                   | Kind     | Summary                                                                                      |
| --------------------- | -------- | -------------------------------------------------------------------------------------------- |
| `buildTask`           | function | Assembles a `Task` from an operation, a domain, and a statement.                             |
| `buildReference`      | function | Assembles a `Reference` from a path and the note that justifies listing it.                  |
| `buildManifest`       | function | Assembles a `Manifest`, defaulting every absent partition to an empty list.                  |
| `buildOutcome`        | function | Assembles an `Outcome` from a rank and its result text.                                      |
| `buildGiven`          | function | Assembles a `Given` from a category, a name, and a value.                                    |
| `buildExample`        | function | Assembles an `Example` from an exemplar input and its expected output.                       |
| `buildCitation`       | function | Assembles a `Citation` from a name, a URL, and the note that justifies citing it.            |
| `buildGap`            | function | Assembles a `Gap` from the section it belongs to and the question that would close it.       |
| `buildRisk`           | function | Assembles a `Risk` from a severity, what could go wrong, and the mitigation that answers it. |
| `buildOutput`         | function | Assembles an `Output` from a format plus its optional refinements.                           |
| `buildProof`          | function | Assembles a `Proof` from what the check settles and the command that settles it.             |
| `buildBrief`          | function | Assembles a `Brief` from a `Task` plus section overrides.                                    |
| `buildGateDefinition` | function | Assembles the fail-closed readiness gate as a reasons `LogicalDefinition`.                   |

```ts
import {
	buildBrief,
	buildCitation,
	buildExample,
	buildGap,
	buildGateDefinition,
	buildGiven,
	buildManifest,
	buildOutcome,
	buildOutput,
	buildProof,
	buildReference,
	buildRisk,
	buildTask,
} from '@orkestrel/brief'

const draft = buildBrief(
	buildTask('refactor', 'code', 'Refactor useForm to native browser form APIs.'),
	{
		authority: [buildReference('AGENTS.md', 'project law; wins every conflict')],
		manifest: buildManifest({
			read: [
				// Ranked authority must also be granted here — the `granted` rule refuses a brief
				// that tells the executor to obey a file no partition lets it open.
				buildReference('AGENTS.md', 'project law; wins every conflict'),
				buildReference('guides/browser.md', 'the composable contract'),
			],
			edit: [
				buildReference('src/browser/composables/useForm.ts', 'the composable being refactored'),
			],
			locked: [buildReference('src/browser/types.ts', 'the published contract')],
			forbidden: [buildReference('app/**', 'out of scope')],
		}),
		outcomes: [
			buildOutcome(1, 'useForm uses native FormData with no behavior change'),
			buildOutcome(2, 'tests cover the changed code paths'),
		],
		rules: ['Add no dependencies.'],
		invariants: ['useForm public method names and signatures in types.ts.'],
		givens: [buildGiven('convention', 'indentation', 'tabs')],
		examples: [buildExample('<input required>', 'validity read from el.validity')],
		assumptions: ['Validation message wording is preserved.'],
		citations: [
			buildCitation(
				'MDN Constraint Validation',
				'https://developer.mozilla.org/',
				'the native validity behavior being adopted',
			),
		],
		gaps: [buildGap('rules', 'Does validation message wording need to change?')],
		risks: [
			buildRisk('medium', 'native validation differs subtly', 'assert message and state in tests'),
		],
		output: buildOutput('diff', { include: ['updated useForm.ts'] }),
		proofs: [buildProof('type-check and lint pass', 'npm run check')],
	},
)
draft.output.format // 'diff'
draft.trace // undefined — the pin fills it, never the author
buildGateDefinition().rules.length // 7 — the readiness rules plus the conjunction
```

### Helpers

Pure, exported utility functions — the referentially-transparent leaves behind the
`BriefCompiler` and the projection surface. Projections use the `{noun}To{Noun}` idiom: each
consumes a whole and returns a derived view of it.

| API                      | Kind     | Summary                                                                                |
| ------------------------ | -------- | -------------------------------------------------------------------------------------- |
| `briefToMarkdown`        | function | Projects a brief into the copy-ready agent prompt.                                     |
| `briefToGoal`            | function | Projects a brief into a `/goal` completion condition.                                  |
| `briefToDispatch`        | function | Projects a brief into a subagent `Dispatch`.                                           |
| `briefToSubject`         | function | Projects a brief into the reasons `Subject` of readiness measures the gate reads.      |
| `briefToHash`            | function | Computes the canonical structural digest of a brief's content.                         |
| `briefToTrace`           | function | Renders the one-line census `pinBrief` stamps onto a brief.                            |
| `briefToContent`         | function | Renders the canonical text of exactly what a brief's hash describes.                   |
| `findUnmetRules`         | function | Lists the readiness rules a brief fails, computed directly from its own measures.      |
| `pinBrief`               | function | Returns a fresh brief with `trace` and `hash` derived from its own content.            |
| `snapshotBrief`          | function | Returns a deeply owned, deeply frozen copy of a brief, refusing anything off-contract. |
| `captureValue`           | function | Captures one stable, frozen view of a foreign contract value.                          |
| `assertBrief`            | function | Narrows unknown data to a `Brief`, throwing when it is off-contract.                   |
| `exampleToLines`         | function | Renders one exemplar as markdown lines.                                                |
| `validateBrief`          | function | Runs the semantic pass over an already-shape-valid brief.                              |
| `countSentences`         | function | Counts the sentences a statement holds.                                                |
| `findBlockingGaps`       | function | Lists the gaps that block emission.                                                    |
| `findManifestOverlaps`   | function | Lists the paths appearing in more than one manifest partition.                         |
| `findUngrantedAuthority` | function | Lists the authority paths the manifest never grants access to.                         |
| `findUnpairedGaps`       | function | Lists the open gaps with no assumption to stand on.                                    |
| `deriveStatement`        | function | Derives one imperative statement from free text.                                       |
| `deriveTask`             | function | Derives a `Task` from an interprets `Intent` through the caller's vocabularies.        |
| `deriveGivens`           | function | Derives `Given[]` from an interprets `Entity[]`.                                       |
| `deriveGaps`             | function | Derives `Gap[]` from an interprets `Ambiguity[]`.                                      |
| `errorToMessage`         | function | Renders a value thrown by a stage into a message.                                      |
| `freezeDeep`             | function | Freezes a value and everything reachable from it.                                      |
| `freezeBranch`           | function | Freezes one branch of a value graph, skipping what the visited set already holds.      |

```ts
import {
	briefToDispatch,
	briefToGoal,
	briefToHash,
	briefToTrace,
	briefToMarkdown,
	briefToSubject,
	captureValue,
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
findManifestOverlaps(pinned) // [] — the partitions are disjoint
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

const leaf = () => 'ready'
const captured = captureValue({ leaf }, ['leaf'])
Object.isFrozen(captured) // true — the view a Briefing replays
Reflect.get(Object(captured), 'leaf') === leaf // true — an uncloneable leaf keeps its identity
```

`validateBrief` errors on the structural violations no assumption can paper over — a
manifest overlap (`Path "<path>" appears in more than one manifest partition`), an authority
no partition grants access to (`Authority "<path>" is in no manifest partition that grants
access — the executor cannot obey what it cannot open`), an empty `proofs` list, and a
`task.statement` that is not one sentence (`Statement holds <n> sentences — a compound
statement is two briefs`). It warns on the runnable-but-suspicious: duplicate outcome ranks,
an open gap without its paired assumption, and an optional outcome ranked above every
required one.

The grant check reads `read`, `edit`, and `locked` — all of them open a file, and read-only is
exactly what obeying one requires. It subsumes the narrower question of an authority sitting
in `forbidden`, because the partitions are disjoint, and it also catches the case a
forbidden-only check cannot see: an authority the manifest never mentions at all, where the
brief never says the executor may open what it must obey.

Both path checks compare exact strings and never expand a glob. `read: 'guides/**'` does not
grant `authority: 'guides/brief.md'`, and `forbidden: 'app/**'` does not overlap
`edit: 'app/file.ts'`. Disjointness and grant are properties of the written paths, so state a
grant as the same literal path the authority carries.

### Parsers

| API          | Kind     | Summary                              |
| ------------ | -------- | ------------------------------------ |
| `parseBrief` | function | Parses a JSON string into a `Brief`. |

```ts
import { parseBrief } from '@orkestrel/brief'

parseBrief('not json') // undefined
parseBrief(JSON.stringify(pinned))?.hash === pinned.hash // true — briefs round-trip JSON
```

Coerce a bare vocabulary value with `parseEnum` from `@orkestrel/contract` against the
exported tuple; this package ships no rename-wrapper around it.

`parseBrief` is the intake half that is owned by construction: its argument is text, so the
value it returns is a graph built inside the call, carrying no caller identity, no accessor,
and no alias back to anything the caller holds. `assertBrief` is the other half, and it narrows
by identity without taking ownership — the value that comes back is the caller's own object,
whose accessors can still answer a later reader differently. Pass `assertBrief` a value you
already own, and cross `snapshotBrief` when you want intake to own it for you.

### Factories

| API                   | Kind     | Summary                                                                               |
| --------------------- | -------- | ------------------------------------------------------------------------------------- |
| `createBriefCompiler` | function | Creates a compilation orchestrator.                                                   |
| `createBriefManager`  | function | Creates a brief registry.                                                             |
| `createBriefContract` | function | Compiles `briefShape` into a guard, parser, JSON Schema, and seeded generator bundle. |

Every entry here builds something. `assertBrief` constructs nothing — it returns its
argument after the guard passes — so it is a helper, not a factory, and lives beside
the other pure leaves.

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
briefs.count // 0
briefs.destroy()

createBriefContract().is(pinned) // true
assertBrief(pinned) === pinned // true — narrowed by identity, never rebuilt
```

`createBriefCompiler` wires its engines when the caller supplies none: a default
`createInterpret()` — empty vocabularies, so the caller's `actions` and `domains` drive
`deriveTask` — and a `createReason({ reasoners: [createLogicalReasoner()] })` dedicated to
the gate. Bring your own through `BriefCompilerOptions.interpret` / `BriefCompilerOptions.reason` to
share instances or observe their emitters; the compiler destroys only the instances it
created.

### Classes

| API             | Kind  | Summary                                                                                 |
| --------------- | ----- | --------------------------------------------------------------------------------------- |
| `BriefCompiler` | class | Implements the compilation orchestrator — the `[interpret, draft, gate, pin]` pipeline. |
| `BriefManager`  | class | Implements the self-owning, versioned and content-hashed brief registry.                |

## Methods

The public methods of each behavioral interface — one table per type, keyed by its
backticked name, every call-signature member listed. The `readonly` data members
(`emitter` / `interpret` / `reason` on `BriefCompiler`; `emitter` / `count` on `BriefManager`)
stay in the earlier Surface rows. Each implementing class exposes exactly its interface's
methods, so this doubles as the per-instance method surface.

#### `BriefCompilerInterface`

`compile` is genuinely synchronous. After `destroy()` every method except the getters and
`destroy` itself throws `BriefError('DESTROYED', …)`; `destroy()` is idempotent, cascades to
the owned engines first — never a borrowed one — and tears the emitter down last.

| Method    | Returns         | Summary                                                                                                                          |
| --------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `compile` | `Briefing`      | Runs the `interpret` → `draft` → `gate` → `pin` pipeline over a `BriefInput`, returning a complete or visible-incomplete result. |
| `gate`    | `LogicalResult` | Evaluates one brief's readiness through the reasons gate — `briefToSubject` against `buildGateDefinition()`.                     |
| `destroy` | `void`          | Tears the orchestrator down idempotently — owned engines first, the emitter last.                                                |

```ts
import {
	BriefCompiler,
	buildBrief,
	buildOutcome,
	buildProof,
	buildTask,
	createBriefCompiler,
} from '@orkestrel/brief'

const audit = buildBrief(buildTask('audit', 'code', 'Audit the barrel for undocumented exports.'), {
	outcomes: [buildOutcome(1, 'every export appears in the guide')],
	proofs: [buildProof('parity passes', 'npm run test:guides')],
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
brief's content and bumps `version` only when that hash changes; an absent id defaults to
the content hash itself, so minting is deterministic with no randomness. The array overload
of `remove` is declared first so an id list resolves to the batch form, and it returns
`true` only when every listed id was present. A call after `destroy()` throws
`BriefError('DESTROYED', …)`.

| Method    | Returns                    | Summary                                                                                     |
| --------- | -------------------------- | ------------------------------------------------------------------------------------------- |
| `has`     | `boolean`                  | Reports whether a brief with the given id is registered.                                    |
| `brief`   | `BriefRecord \| undefined` | Looks up one registered brief record by id.                                                 |
| `briefs`  | `readonly BriefRecord[]`   | Lists every registered brief record.                                                        |
| `add`     | `BriefRecord`              | Registers one brief from its data, minting the id from its content hash when none is given. |
| `remove`  | `boolean` (or `void`)      | Removes the listed briefs by id, one brief by id, or every brief.                           |
| `destroy` | `void`                     | Tears the registry down idempotently — the collection first, the emitter last.              |

```ts
import { BriefManager, buildBrief, buildTask, createBriefManager } from '@orkestrel/brief'

const registry = createBriefManager()
const record = registry.add(buildBrief(buildTask('document', 'writing', 'Write the brief guide.')))
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

1. **Doc and source bijection.** Every `function` / `class` / `const` / `interface` / `type`
   row in the `## Surface` tables is a real export of the brief source tree, and every export
   appears as a Surface row — exhaustive, both directions. Adding, renaming, or removing an
   export breaks the parity gate until the doc is reconciled.
2. **Deterministic, synchronous, immutable.** This module adds no nondeterminism: no clocks,
   no randomness, no I/O, nothing async. The same `BriefInput` therefore produces the same
   `Briefing` for as long as the engines do — which is unconditional for the engines the
   compiler wires itself, and inherited for a borrowed `interpret` or `reason`. A stateful
   supplied engine that answers differently on a later call makes `compile` answer differently
   too, and that is the engine's determinism, not this module's.

   Within one call the answer cannot drift, because how many times a foreign object is read is
   this module's decision rather than the engine's: every value an engine returns is owned at
   arrival — copied where a structured clone can carry it, captured into a frozen plain view
   where it cannot — and every later read is of that copy or that view, never of the engine's
   object. A verdict whose members answer differently on a second read produces the same
   `Briefing` as one returning those first answers as plain data. The
   earlier wording said "on its second call" while the module was in fact reading one returned
   object twice, which made a sentence about the engine's determinism cover a defect in this
   module's.
   `pinBrief`'s `trace` and `hash` derive from content alone — the hash is the canonical
   structural digest interprets `digestValue` computes — and the `BriefManager` mints record
   ids from that hash, so re-adding unchanged content is a version no-op. No input is ever
   mutated. A builder adopts the collections it is handed, so a draft still aliases the
   caller's arrays; `snapshotBrief` is the boundary that ends that, and `pinBrief` and
   `BriefManager.add` both cross it. Past that point the brief is a deeply frozen
   null-prototype record sharing no reference with its source, which is what lets a hash keep
   describing its brief for as long as the brief exists.

   The digest is eight hex digits — 32 bits — so it is an identity for a working set, not a
   cryptographic one. Read that as a birthday bound rather than a threshold: collisions become
   likely in the tens of thousands of distinct briefs, around a 50% chance near 77,000, and
   independent searches over this package's own builders hit their first pair at roughly
   42,000 and 53,000. Those are draws from one distribution, not a limit — quoting either
   as the safe size is the mistake, and an earlier revision of this paragraph quoted a single
   measured index that overstated the safe scale by more than an order of magnitude.

   `BriefManager` therefore compares `briefToContent` before calling a re-add unchanged, and
   refuses a collision with `BriefError('INVALID', …)` rather than silently replacing the
   record already stored. Give a registry expecting more than a few thousand distinct briefs
   its own ids through `RecordOptions.id` rather than letting the digest mint them.

3. **Fail closed at the gate, and the gate is not delegable.** Readiness is decided by
   `findUnmetRules` — in code, from the brief's own measures — before any verdict is consulted.
   `buildGateDefinition()` states the same readiness rules as data so a reasoner can narrate them, and
   a narration is not a decision: `BriefCompilerOptions.reason` lets a caller supply the engine,
   and a supplied engine can add detail to a refusal but can never turn one into a pass. A
   test drives the data and the code over one value set, which is what holds them together.

   A non-empty `findBlockingGaps` yields an absent `brief`, the questions
   on `Briefing.questions`, and a `BriefStageFailure` coded `BLOCKED` — never a throw, never a
   half-specified brief. That holds even when the gate itself throws and leaves no verdict to
   name rules from: the `BLOCKED` marker is keyed on the blocking gaps, not on the verdict's
   presence. Alongside the decision, `buildGateDefinition()` is evaluated against
   `briefToSubject(brief)` by a `LogicalReasoner`, so every verdict carries the reasoner's own
   `trace` on `Briefing.verdict` and readiness is auditable, replayable data — and
   `BriefStageRecord` is discriminated by `stage`, so that replay is readable without a single
   type assertion. The measures and the verdict are conjoined in the refusing direction: a
   brief must satisfy each, so a borrowed engine can withhold a pass it cannot grant.

4. **The brief is the source of truth; projections never add.** `briefToMarkdown`,
   `briefToGoal`, and `briefToDispatch` are pure views over the pinned brief: the prompt
   references paths and never inlines file contents, the goal condition is the proofs'
   commands verbatim plus the turn cap, the dispatch's owned set is exactly `manifest.edit`,
   and its `authority` is exactly `brief.authority` in rank order. The dispatch therefore says
   in data every path the prompt says in prose, so a machine consumer never parses the
   rendering to decide what it may touch or what wins. Everything else the prompt carries —
   outcomes, the proofs' commands, gaps, risks, the output shape, each path's `note` — stays
   in the prompt, which is written for a model; a consumer wanting those reads the `Brief`.
   The artifacts cannot disagree with the contract or each other, and that
   is enforced in the data rather than in the renderer: every brief string is one line
   (`isLine` / `isText`), so no field can carry the line break that would forge a heading or
   a second manifest row. An `Example`'s two sides are the single exception, because they
   carry code — `exampleToLines` fences them, which makes them content rather than structure.
5. **Mechanism, never policy.** The module decides nothing about a task: `deriveTask` maps
   intents only through caller vocabularies and refuses an inherited key, and the draft stage
   merges caller sections over derived ones so the user is never overridden. An open gap is
   meant to proceed on a recorded assumption, and `findUnpairedGaps` measures that as a
   count rather than a relation — a brief carries no link from a gap to the assumption that
   answers it. A count is not a contract, so it advises through `validateBrief` and does not
   gate: one assumption answering two related gaps would otherwise be refused for arithmetic.
   What ships is the closed vocabularies, the exact contract, the gate, the pin, and the
   projections.
6. **Guard totality and mechanism parity.** Every validator is a total guard: adversarial
   input returns `false`, never throws. The hand-composed guards and the compiled shape
   contract are independent mechanisms over one vocabulary, held in lockstep by
   [`tests/src/core/shapers.test.ts`](../tests/src/core/shapers.test.ts), which drives both
   over one value set. That test is the guarantee, and it is a real one: adding a property to
   `briefShape` that `Brief` does not have turns its assertions red.
   `createBriefContract`'s declared `ContractInterface<Brief>` return type is a weaker
   companion, not a proof of equality — assignability runs one way over `T`'s output
   positions, so it catches a shape that infers too little and would accept one that infers
   too much.
7. **Coded errors.** Every throw out of this module is a `BriefError` with a machine-readable
   code, and `catch` blocks narrow with `isBriefError`, never `as`. The `context` is whatever
   the code can actually supply rather than a fixed pair: `DRAFT_FAILED` carries
   `{ stage, field }`, `GATE_FAILED` adds `reasoning`, `INVALID` carries `{ field }` plus the
   offending value where there is one,
   and `DESTROYED` carries none. Stage failures inside `compile` are contained as
   `BriefStageFailure` entries on the `Briefing`, reserving throws for caller misuse.
8. **Observation is a pure side-channel.** The `BriefCompiler` owns a typed emitter
   (`compile` / `block` / `error` / `destroy`); the `BriefManager` owns its own
   (`add` / `remove` / `destroy`). Every event is emitted directly and synchronously, after
   the outcome it reports. A complete briefing emits `compile` and an incomplete one emits
   `block` instead — exactly one of the two, every call. Listener isolation is the emitter's
   own: a throwing listener routes to the `error` option handler, never onto the domain map.
   `destroy()` is idempotent and tears the emitter down last.
9. **Doc and source method bijection.** Every behavioral interface's `## Methods` table lists
   exactly its public methods — exhaustive, both directions — and each implementing class
   exposes the same public methods, no more.
10. **A borrowed engine is the caller's code, not an attacker.** `BriefCompilerOptions.interpret`
    and `.reason` are seams, and what crosses them is owned, validated, and read once: own at
    arrival — copied where a structured clone can carry the value, captured into a frozen plain
    view where it cannot; validate the owned view; never read a foreign object twice. How many
    times a foreign object is read is this module's decision, so a briefing never depends on it.

    `captureValue` is the capture arm, and what it produces is what the `Briefing` replays. It
    rebuilds the root and every reachable plain container from own enumerable members, keeps
    unknown own members, materializes each published member absent from that own set by reading
    it once, and keeps an uncloneable leaf — a function, for one — by identity. A member the
    caller's prototype carries and the published contract does not name drops out of the capture,
    and it never survived a structured clone either, so the arms agree on what a `Briefing`
    carries.

    The law reaches values this module pulls across a seam it called, and stops there.
    `assertBrief` and `parseBrief` are intake narrowing, outside it: `assertBrief` returns the
    caller's own object by identity and takes no ownership of it, and `parseBrief` is owned by
    construction because its argument is text. `snapshotBrief` is the ownership door on that
    side, and a caller who wants intake to own its value takes it.

    Bounding the law the other way, and equally load-bearing: never narrow past the published
    contract. `Entity.value` is `unknown` and `LogicalResult` is an interface a class instance
    satisfies, so a value JSON cannot express is on-contract and is captured rather than refused.
    Every defect this seam produced came from narrowing it — an exact guard that failed the gate
    closed on a valid engine, and a JSON clone that turned a correct refusal into an emitted
    brief.

    Both engines' returns are shape-checked with their packages' published guards: the verdict
    with reasons' `isLogicalResult`, and the `Interpretation` with interprets'
    `isInterpretation` at both of the stage's doors. A supplied interpretation whose snapshot
    copy loses prototype-carried members is captured rather than refused, because the published
    contract is wider than the copy mechanism.

Deliberately absent: a relation or graph layer over briefs (a brief's links are one ranked
list and the disjoint partitions — order and set membership, fully served by the guards,
`findManifestOverlaps`, and the gate), asynchronous compilation, brief persistence
(`JSON.stringify` out, `parseBrief` back in), a turn cap on `BriefCompilerOptions` (nothing in the
pipeline renders a goal, so the cap is `briefToGoal`'s argument), glob expansion (both path
checks compare exact strings, and a glob engine is a dependency this package will not take),
a guard or shape for any projection (`Briefing`, `BriefStageRecord`, `BriefRecord`, and
`Dispatch` have neither, because a guard narrows untrusted inbound data and nothing accepts
those — the published round trip is the `Brief`, through `JSON.stringify` and `parseBrief`,
and a consumer derives its own dispatch locally), URL validation on `Citation.url` (see its
TSDoc: a `pattern` there makes the seeded generator throw for the whole brief, and the
working mechanisms beat one stricter member), and any LLM invocation — the authoring
judgment is the caller's.

`Dispatch` carries the authority and permission axes, and reading it as one flat set of
partitions is the one way to get it wrong. Permission is `read` / `edit` / `locked` / `forbidden`, flattened 1:1 from `Manifest`
— they answer "may I touch this file", and they are mutually disjoint in a gated brief, which
is what `findManifestOverlaps` measures and the `disjoint` rule refuses on. `briefToDispatch`
runs no gate, so projecting an unvetted draft can produce arrays that intersect: gate before
you dispatch. Precedence is `authority`, in rank order, index 0 winning every conflict.

`authority` therefore overlaps the permission arrays by design, and by requirement: the
executor has to open what it obeys, so a ranked path always also sits in `read`, `edit`, or
`locked`, and the `granted` rule refuses a brief where one does not. Read the partitions to
decide what may be touched and `authority` to decide what wins. Never union the partitions
with `authority` — that was already wrong before `authority` existed, since `forbidden` is an exclusion rather than a
grant. It is projected as paths rather than left to `prompt` because a machine consumer must
not have to parse a document written for a model to discover mandatory authority.

## Patterns

### Compiling a rough request

The forward path end to end: text, interpret, draft, gate, pin. The interpret stage
classifies intent and mines entities; `deriveTask` / `deriveGivens` / `deriveGaps` draft the
brief; caller sections merge over the draft; the gate rules; the pin stamps.

Passing `text` means "interpret this". A pipeline that cannot resolve the text raises its
own required ambiguity, which drafts as a blocking gap and stops emission — so the text path
needs an interpret pipeline that can actually match the request:

```ts
import { buildOutcome, buildOutput, buildProof, createBriefCompiler } from '@orkestrel/brief'
import { createInterpret } from '@orkestrel/interpret'
import { createQuantitativeDefinition } from '@orkestrel/reason'

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
				definition: createQuantitativeDefinition('migration', 'Migration', []),
			},
		],
	}),
	actions: { migrate: 'migrate' }, // an interprets action to the closed TaskOperation
	domains: { code: 'code' }, // an interprets domain to the closed TaskDomain
})

const migration = migrations.compile({
	text: 'migrate the 3 legacy stores to the replacement driver seam',
	manifest: {
		read: [{ path: 'guides/stores.md', note: 'the driver seam contract' }],
		edit: [{ path: 'src/core/stores/**', note: 'the three legacy stores' }],
		locked: [],
		forbidden: [{ path: 'app/**', note: 'out of scope' }],
	},
	outcomes: [buildOutcome(1, 'all three stores implement the driver seam')],
	output: buildOutput('diff'),
	proofs: [buildProof('the core test project passes', 'npm run test:src:core')],
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

A required, unresolvable decision drafts a blocking gap. The gate stops emission and the
`Briefing` carries the questions; the caller answers, re-compiles, done. No half-specified
brief ever leaves the pipeline.

```ts
import {
	buildGap,
	buildOutcome,
	buildProof,
	buildTask,
	createBriefCompiler,
} from '@orkestrel/brief'

const blocked = createBriefCompiler()
const stopped = blocked.compile({
	task: buildTask('refactor', 'code', 'Refactor the session store to the async seam.'),
	outcomes: [buildOutcome(1, 'the store implements the async seam')],
	gaps: [
		buildGap('output', 'Does the result need to land as a diff or as full files?', {
			blocking: true,
			candidates: ['diff', 'code'],
		}),
	],
	proofs: [buildProof('checks pass', 'npm run check')],
})

stopped.brief // undefined — the gate failed closed, and that absence is the signal
stopped.questions // [{ field: 'output', question: 'Does the result need…', blocking: true, … }]
stopped.questions.length // 1 — one question to answer, then re-compile
stopped.failures // [{ stage: 'gate', code: 'BLOCKED', message: '1 blocking gap(s)' }]
stopped.verdict?.rules.filter((entry) => !entry.applied) // exactly which rules missed
stopped.verdict?.trace // the reasoner's narration of the rules that derived, not the misses
blocked.destroy()
```

A gate that refuses for a reason other than a blocking gap — no proofs, a compound
statement, an overlapping manifest, an authority no partition opens — reports the unmet
rule ids instead, and the briefing is
incomplete the same way. A brief with no proofs and a two-sentence statement reports
`Gate refused: proven, single`.

An open gap takes the other path: assume narrowly, record the assumption, proceed. It does
not gate. `findUnpairedGaps` counts the open gaps past the assumption count and
`validateBrief` reports the surplus as a warning, because the pairing is arithmetic rather
than a link the brief carries — one assumption answering two related gaps is good practice
and a count cannot tell it from a missing one. Read the warning; the gate will not read it
for you.

### Gating through the reason engine

The gate is ordinary reasons machinery, which means you can inspect it, run it standalone, or
build your own beside it. `briefToSubject` projects the brief into a flat measures record,
`buildGateDefinition()` is a `LogicalDefinition` whose rules read those measures, and the
`LogicalReasoner` narrates the verdict.

```ts
import { briefToSubject, buildGateDefinition } from '@orkestrel/brief'
import {
	createAtom,
	createCompound,
	createLogicalDefinition,
	createLogicalReasoner,
	createReason,
	createRule,
} from '@orkestrel/reason'

const engine = createReason({ reasoners: [createLogicalReasoner()] })
const measures = briefToSubject(pinned)
measures // { operation: 'refactor', blocking: 0, outcomes: 2, required: 2, proofs: 1, edits: 1, … }

const ruling = engine.reason(measures, buildGateDefinition())
if (ruling.reasoning === 'logical') {
	ruling.conclusion // true — ready to emit
	ruling.rules.filter((entry) => !entry.applied) // the rules that missed
}
engine.destroy()

// A house gate: this package's readiness unchanged, plus one rule of your own, on your engine.
const house = createLogicalDefinition('house', 'House readiness', [
	...buildGateDefinition().rules,
	createRule(
		'anchored',
		[createAtom('authority', 'above', 0)],
		createAtom('anchored', 'equals', true),
	),
	createRule(
		'fit',
		[
			createCompound('and', [
				createAtom('ready', 'equals', true),
				createAtom('anchored', 'equals', true),
			]),
		],
		createAtom('fit', 'equals', true),
	),
])
engine.reason(measures, house) // conclusion is `fit` — base readiness AND anchored
```

Keep `buildGateDefinition().rules` whole. `fit` reads the `ready` fact, so dropping the rule that
derives it leaves `fit` conjoining something nothing proved, and a base-ready brief concludes
`false`.

**`compile` does not decide readiness with this definition.** `findUnmetRules(brief)` measures
the same readiness rules in code and refuses before any verdict is read; the preceding definition is
what a reasoner narrates, so `Briefing.verdict` carries the trace and the rule-level detail.
The code and the data are conjoined in the refusing direction, so a borrowed engine can
withhold a pass and can never grant one. A test drives each over one value set, which is what
keeps them saying the same thing.

**`buildGateDefinition()` takes no arguments, and there is no option that reaches it.** That is
the design, not an omission. The reasoner overlays every derived fact into one flat
namespace, so a caller rule named for a readiness fact — `specified`, `proven`, `single` —
overwrites the fact `ready` conjoins, and a brief carrying a blocking gap concludes `true`.
A gate whose whole job is to fail closed cannot take rules from the caller it is gating.

Readiness is this package's contract. A caller who needs different readiness composes their
own `LogicalDefinition` over `briefToSubject` and evaluates it on their own reasoner, as
in the preceding example; both are exported for exactly that, and neither can reach the definition `compile`
uses. Independent safeguards back it up: `compile` refuses a blocking gap **before** it
consults the verdict, so no supplied engine can emit a brief that still carries an open
question, and `ready` is always the last rule so forward chaining reports it.

### Projecting the downstream artifacts

One brief, projected views — authored zero times each.

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
parse-then-trust boundary: shape through the compiled guard, semantics through
`validateBrief`, readiness through the gate. Each check answers its own question.

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

A record's id is its brief's own content hash, so re-adding identical content mints no second
record and moves no version:

```ts
import {
	buildBrief,
	buildOutcome,
	buildProof,
	buildTask,
	createBriefManager,
} from '@orkestrel/brief'

const store = createBriefManager()
const first = store.add(
	buildBrief(buildTask('plan', 'ops', 'Plan the 0.1 release.'), {
		outcomes: [buildOutcome(1, 'the layer order is written down')],
		proofs: [buildProof('the catalog regenerates', 'npx @orkestrel/scaffold catalog')],
	}),
)
store.add(first.brief).version // 1 — unchanged content is a version no-op
store.count // 1 — the same content minted the same id
store.destroy()
```

### Practices

- **One task per brief.** `validateBrief` errors on a multi-sentence statement; a compound
  request is two `compile` calls, not one longer statement.
- **Ask only blocking gaps.** Everything else: assume narrowly, record the assumption beside
  its open gap, proceed. Never override the user — the draft stage merges caller sections
  over derived ones for the same reason.
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
  method is the requirement.
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

- [`tests/guides.test.ts`](../tests/guides.test.ts) — the `## Surface` to `src/core` bijection (value and type exports), the `## Methods` to interface-method bijection, link integrity, fence languages, example presence, fence-import reality, options-member liveness, TSDoc identifier resolution, and the equality gate: every `Summary` cell against its declaration's description paragraph, the titled `Compile and project a brief` fence against the `@example` of that title (pinned so the titled pair cannot be retired silently), and the README pitch against this guide's tagline. It also runs the flagship fences — the `## Surface` compile and the `### Builders` draft — and asserts the values their `// value` comments claim.
- [`tests/src/core/BriefCompiler.test.ts`](../tests/src/core/BriefCompiler.test.ts) — the `interpret` → `draft` → `gate` → `pin` pipeline, stage order and records, the interpret-skip path, caller-over-derived merging, fail-closed blocking (questions, the `BLOCKED` failure, the absent brief), `gate` verdict tracing, event sequences (`compile` versus `block`), owned-versus-borrowed engine teardown, idempotent `destroy`, and `DESTROYED` throws.
- [`tests/src/core/BriefManager.test.ts`](../tests/src/core/BriefManager.test.ts) — content-hash id minting, version bump only on content change, the `remove` forms, per-event emissions, and destroy semantics.
- [`tests/src/core/helpers.test.ts`](../tests/src/core/helpers.test.ts) — every builder's output shape, every projection, the derivations and their off-vocabulary `undefined`, `pinBrief` determinism and idempotence, `buildGateDefinition`'s rule list against `findUnmetRules` over one value set, `validateBrief` errors and warnings, and the `find*` leaves.
- [`tests/src/core/validators.test.ts`](../tests/src/core/validators.test.ts) — each guard accepts valid and rejects invalid plus adversarial junk, exact-record semantics, and off-vocabulary rejection.
- [`tests/src/core/shapers.test.ts`](../tests/src/core/shapers.test.ts) — the shape family against the guard family over one value set, JSON Schema essentials, and seeded generate round-trips.
- [`tests/src/core/parsers.test.ts`](../tests/src/core/parsers.test.ts) — `parseBrief` guard soundness in both directions, its JSON round-trip, and the intake contrast: `assertBrief` returning its argument by identity where `parseBrief` returns a graph sharing no reference with the source.
- [`tests/src/core/cloners.test.ts`](../tests/src/core/cloners.test.ts) — `captureValue` over a source carrying a prototype accessor, an unknown own accessor, an uncloneable leaf, a cycle, and a shared branch, plus the source whose own members cannot be read at all.
- [`tests/src/core/factories.test.ts`](../tests/src/core/factories.test.ts) — `createBriefCompiler` / `createBriefManager` / `createBriefContract`.
- [`tests/src/core/index.test.ts`](../tests/src/core/index.test.ts) — the barrel resolves and re-exports the whole surface.
- [`tests/src/core/integration.test.ts`](../tests/src/core/integration.test.ts) — text to interpret to brief to gate to projections end to end, and a gated brief re-compiled with the answered gap passing.

## See also

- [`reason.md`](reason.md) — the engine beneath the gate: `LogicalDefinition`, `Subject`, the traceable `LogicalResult`, and the capability layer `buildGateDefinition` extends.
- [`interpret.md`](interpret.md) — the language pipeline the `interpret` stage delegates to: `Interpretation`, `Intent`, `Entity`, `Ambiguity`.
- [`contract.md`](contract.md) — the guards, combinators, shapes, and `createContract` machinery this package composes.
- [`emitter.md`](emitter.md) — the typed emitter behind the compiler's and the manager's observation surfaces.
- [`AGENTS.md`](../AGENTS.md) — the rules this package is written to.
- [`README.md`](README.md) — the guides index.
