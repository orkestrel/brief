# R2 — Fix round: close R1's retained findings F1–F6 in one pass

## Role and engine

GPT-5.6 Sol, implementer. Sole writer in the checkout. An Opus reviewer audits your diff
afterward, so your report claims only what the diff and the runs show.

## Objective

Repair the ten result guards' one defective arm, strengthen the guard the guide over-promises
for, publish the earned eleventh guard, rebind the tests to the right properties, and true up
the guide and the campaign record — every fix proven red-then-green where a behavior changes.

## Context

Repository: `C:\Users\mikes\WebstormProjects\reason`. Windows host, Git Bash. Baseline
`16864f7`, tree clean — confirm with `git status` before editing. Scaffold 0.0.38 and
`@orkestrel/test` 0.0.5 are installed; `scaffold audit` reports 0 of 117 drifted; do not touch
any vendored file (`tests/setupPolicy.ts`, `tests/policy.test.ts`, everything under
`.agents/`, `.claude/`).

R1 (two blind lanes, reconciled) confirmed: the union guard's structure, totality under hostile
input for all ten guards, the open-by-construction `whereOf(isObject, …)` posture, and the
ten-guard scope. Its retained findings are the whole of this brief. The review evidence lives in
`tmp/audit/` — Sol's executed probes are `tmp/audit/r1-objective-probe.test.ts` and
`tmp/audit/r1-type-probe.ts`; reuse their vectors rather than re-deriving them.

The three properties every result guard must hold, paid for by the consumer campaign this work
serves: open on unknown keys; accepts a class instance (a prototype is not a defect); follows
published member types exactly (no finite check on a `number`, no non-empty check on a
`string`).

Read before editing: `AGENTS.md`, `.claude/rules/patterns.md` (Foreign contracts),
`.claude/rules/tests.md` (the red-proof law: a revert reddens exactly the test that names the
defect), `src/core/types.ts`, `src/core/validators.ts`, `tests/src/core/validators.test.ts`,
`guides/reason.md`.

## The findings, each with its fix

### F1 — `isInferentialResult` validates `derived` with the exact input guard

`validators.ts:1078` checks `derived` elements with `isFact` (`:608-613`), which is exact
`recordOf` with `confidence: isFiniteNumber`, where `Fact` publishes `confidence?: number`
(`types.ts:429`). All three properties break at once: a conforming fact carrying an extra key is
refused, a class-instance fact is refused, and `number` is narrowed to finite.

Fix: check `derived` elements with an open result-side check in the same posture as the sibling
arms — `id` string, `predicate` string, `terms` array, `confidence` absent-or-`isNumber` —
accepting unknown members and prototypes. It is a required internal predicate, so export and
test it under a name that says what it is (a result-side fact check, distinct from the input
guard `isFact`, which stays exact and untouched). Update the TSDoc at `:1054-1059` — the
round-trip rationale describes a different predicate than the signature asserts, so it goes.

Red proof: `tests/src/core/validators.test.ts:997-999` currently asserts `false` for an
extra-membered derived fact — the suite fences the defect in, and its test name states the
defect as intent. Flip the expectation and rename the test for what it now proves; run the suite
before the code fix (that test red), after (green). Add a class-instance derived-fact positive
and an `Infinity` confidence positive beside it.

### F2 — `isSymbolicResult` certifies less than it claims

`validators.ts:1042` reads only enumerable solution values, so a non-enumerable string member
passes (proven at `tmp/audit/r1-objective-probe.test.ts:157`), while `guides/reason.md:244`
says solution values are numbers.

Fix: enumerate own property names (`Object.getOwnPropertyNames`), not only enumerable values, so
the guard checks every own member it can see. Keep it open on unknown keys — the openness is
about accepting extra members whose VALUES conform, never about skipping checks. Red proof:
promote the probe's non-enumerable-string vector into the suite; red before, green after.

### F3 — the prototype controls do not prove the class-instance property

The suite's prototype controls are `Object.create({...})`, never a real `class` instance
(`validators.test.ts:600` et al.), and `isReasonResult` has no class control at all
(`:1005` region). The round-3 defect this property encodes was literally a class instance.

Fix: one real `class`-constructed positive control per result guard, including
`isReasonResult`, alongside the existing controls. No red proof owed — these strengthen
passing behavior — but state each control's membership in its name per the suite's convention.

### F4 — the guide's two false sentences

- `guides/reason.md:244` (solution values) becomes true once F2 lands; reword to state what the
  guard now enforces.
- `:206` and `validators.ts:63-64` say guards are "composed from the contracts combinators" —
  true of input guards, false of the ten result guards, whose member checks are bespoke. One
  scoping clause distinguishing the two families, in each place.
- The `isInferentialResult` exception row (`:245`) and invariant 5 describe the defect F1
  removes; update both to the repaired contract. No false universal, no stale exception.

### F5 — the silent `id` widening

`isRuleResult` accepts `id: ''` where the consumer's `isRuleVerdict` refuses it (proven by
construction at `tmp/audit/r1-objective-probe.test.ts:286`). The widening is correct — `id` is
`string`, non-empty is a narrowing — and undocumented.

Fix: one test asserting the empty-id acceptance by name (it is contract, not accident), and one
sentence in `.orkestrel/reason/missing-result-guards.md`'s successor obligation naming the
difference and its direction, so the consumer decides deliberately whether it still wants a
non-empty assertion at its own boundary. Also correct that file's Status paragraph: it claims
all ten guards were open and the tests failing-first, which R1 falsified for the inferential
arm; state what was actually true and that this fix round closed it.

### F6 — the earned eleventh guard

`ReasonerInterface.validate` returns `ReasonValidationResult` (`types.ts:778, 861`) from
caller-supplied reasoners — the proposal's argument verbatim, with no guard. Publish
`isReasonValidationResult` in the same posture as the ten: open, prototype-accepting, member
types followed exactly, total under hostile input. Full control set in the suite (extra-member
positive, class positive, per-member negatives, adversarial vectors), guide row beside its
siblings.

## Unknowns

- Whether `ReasonValidationResult`'s members admit the same open treatment throughout or carry a
  nested owned record needing different handling. Read `types.ts` and decide; record the call.
- Whether the result-side fact check's name best follows the existing naming grammar. Your call;
  single-word-per-concept, `is{Type}` where a type exists, and say what you chose.

## Scope

Owned files:

- `src/core/validators.ts`
- `tests/src/core/validators.test.ts`
- `guides/reason.md`
- `.orkestrel/reason/missing-result-guards.md`

Read anything. Write nothing else — `src/core/types.ts` is expected to need no change; if a fix
genuinely requires a type change, stop and report per the deviation contract. Do not touch
vendored files. Probes only under `tmp/audit/`.

Validation, scoped: the validators suite project, `npm run check` (or the narrowest scoped
check), and the guides parity project. No tree-wide format/lint mutations.

## Execution

Perform this assignment directly. Spawn nothing.

Windows constraint for every shell command: no heredocs, no `node -e`, no `node -p`, no `&&`
chaining, no `${...}` in arguments. Multi-step shell work goes into a script file under
`tmp/audit/` invoked as one plain command.

## Output

1. Per-finding: closed, with the decisive lines and the red-then-green transcript where owed
   (F1, F2).
2. The Unknowns calls.
3. Final counts: validators suite, scoped check, guides parity — all green.
4. The exact `git diff --stat`.

## Deviation contract

Stop and report if: a fix requires editing `types.ts` or any vendored file; a red proof reddens
more than the named test; or a finding cannot close without changing what the published API
means beyond the fixes stated here. Ancillary calls — names, test placement, wording — are
yours: decide, record, continue.

## Acceptance criteria

- All ten-plus-one result guards hold the three properties, including the inferential arm's
  `derived` elements — provable by re-running `tmp/audit/r1-objective-probe.test.ts`, whose
  claim-1 failures must now pass (adjust the probe's expectations to the repaired contract and
  say which lines flipped).
- The suite carries no test that asserts a violation of the three properties as intended
  behavior.
- Guide and campaign record contain no sentence R1 proved false.
- `git status` shows exactly the four owned files modified.
