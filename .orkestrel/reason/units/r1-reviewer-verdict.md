# R1 — subjective lane verdict (reviewer, verbatim, condensed to substance)

**1. Three properties — BROKEN.** Nine of ten hold. `isInferentialResult` (`validators.ts:1078`)
validates `derived` through `arrayOf(isFact)`, and `isFact` (`:608-613`) is exact `recordOf` with
`confidence: isFiniteNumber` where `Fact` publishes `confidence?: number` (`types.ts:429`). All
three properties fail on one member: refuses extra keys (round-2), refuses class instances
(round-3), narrows number to finite (the count-as-integer mistake). Every sibling arm avoids
this; `isProofNode` was hand-written open rather than reusing an exact guard — the codebase
demonstrates the alternative it declined. The TSDoc and guide disclose it, but "cannot round-trip
as inferential input" is a different predicate from the one the signature asserts: `value is
InferentialResult` must answer the type, not round-trip fitness. A borrowed engine that decorates
its derived facts returns a valid `InferentialResult` and the consumer's gate closes on it — the
exact failure mode the proposal exists to end.

**2. Open combinator — CONFIRMED.** There is no open record combinator; openness is achieved by
NOT using one: `whereOf(isObject, <predicate>)` (`validators.ts:803,830,859,885,978,1007,1036,1073`),
neither of which enumerates keys. `recordOf` is exact and plain-record-only
(`contract index.js:5733,5735-5738`) — the confusion brief names.

**3. Both directions — BROKEN** (first direction fails at `derived`; input side intact — the diff
is purely additive plus import hunks).

**4. Union — CONFIRMED.** Four-way `||`; each arm pins its `reasoning` literal first; the four
literals are the whole disjoint discriminant set.

**5. Totality — NOT-EVIDENCED** (no shell); suite structure recorded for the objective lane.

**6. Tests — BROKEN.** Controls present and well named for nine guards, but
`validators.test.ts:997-999` asserts the NEGATION of the dispatched property — the extra-keyed
derived fact must return `false` — and the test name states the defect as intent. No
class-instance derived-fact positive exists anywhere, because one would fail. A fence around the
wrong behavior is worse than no fence.

**7. Guide — CONFIRMED.** All ten exports in the table; barrel re-exports wholesale; the doctrine
sentence and both exception rows disclose the shipped behavior plainly — which is why claim 1 is
a code defect, not a documentation one.

**8. Scope — CONFIRMED.** Each of the ten survives the proposal's own test: the union and four
arms from `reason()`'s published return; `isCheckResult` independently via `EvaluatorInterface`;
the nested four as required internal predicates the export-and-test law surfaces. Ten is the
closure of the argument over the actual published surface, not creep.

**9. Compatibility — BROKEN.** Acceptance direction holds by construction; refusal direction does
not: `isRuleVerdict` requires `isNonEmptyString(id)`, `isRuleResult` only `isString`. The
loosening is correct under the doctrine — non-empty is itself a narrowing — but nothing tells the
successor, so brief deletes a guard, imports a laxer one, and its gates stay green while an
empty-id rule result now passes.

**10. Scope/hygiene — BROKEN.** Unit = 4 files; carryover = 10, six of them confirmed vendored
destinations in the installed 0.0.33 manifest. Worst: `.claude/settings.json` flips `defaultMode`
to `bypassPermissions` and adds ~70 allow entries, committed in a published package's tree — a
posture change no one reviewing a guards PR would expect to approve, and the law puts operator
grants in `settings.local.json` precisely so `repair` cannot silently revert them. The brief's
premise that 0.0.36 supersedes the carryover does not hold here: `package.json` pins `^0.0.33`.

**Outside the claims:** (1) `ReasonerInterface.validate` returns `ReasonValidationResult` from
caller-supplied reasoners — the unit's own argument earns an eleventh guard not published. (2)
Ten near-identical `whereOf(isObject, …)` bodies are an open counterpart to `recordOf` that
contract does not publish; route upstream. (3) `validators.ts:63-64` and `guides/reason.md:206`
say "composed from the contracts combinators" — loose for the result guards. (4) The prototype
controls use `Object.create`, never a real `class`; the round-3 defect was literally a class
instance. (5) `isProofNode`'s depth bound: disclosed, justified, recorded so a later round does
not re-litigate it.

VERDICT: 4 CONFIRMED, 5 BROKEN, 0 UNRESOLVED, 1 NOT-EVIDENCED
