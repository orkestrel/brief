## Per-finding report

- F1 — Closed. Added open `isResultFact` and routed inferential `derived` members through it at [validators.ts](C:/Users/mikes/WebstormProjects/reason/src/core/validators.ts:809) and [validators.ts](C:/Users/mikes/WebstormProjects/reason/src/core/validators.ts:1109). Tests cover extra members, class instances, and infinite confidence at [validators.test.ts](C:/Users/mikes/WebstormProjects/reason/tests/src/core/validators.test.ts:1063).

  Red → green, same command:

  ```text
  .\node_modules\.bin\vitest.cmd run --config vite.config.ts --no-cache --reporter=dot --project src:core -t "accepts open derived facts, class instances, and every numeric confidence"

  RED:   1 failed, 1020 skipped
  GREEN: 1 passed, 1037 skipped
  ```

- F2 — Closed. `isSymbolicResult` now checks every own string-named solution member with `Object.getOwnPropertyNames` at [validators.ts](C:/Users/mikes/WebstormProjects/reason/src/core/validators.ts:1069). The non-enumerable negative is at [validators.test.ts](C:/Users/mikes/WebstormProjects/reason/tests/src/core/validators.test.ts:1020).

  Red → green, same command:

  ```text
  .\node_modules\.bin\vitest.cmd run --config vite.config.ts --no-cache --reporter=dot --project src:core -t "rejects a non-enumerable non-number solution member"

  RED:   1 failed, 1020 skipped
  GREEN: 1 passed, 1037 skipped
  ```

- F3 — Closed. Added named real-class positives for all ten result guards, beginning at [validators.test.ts](C:/Users/mikes/WebstormProjects/reason/tests/src/core/validators.test.ts:629), including `isReasonResult` at [validators.test.ts](C:/Users/mikes/WebstormProjects/reason/tests/src/core/validators.test.ts:1090).

- F4 — Closed. Scoped input-combinator versus bespoke result-guard wording, corrected symbolic and inferential rows, and repaired invariant 5 at [reason.md](C:/Users/mikes/WebstormProjects/reason/guides/reason.md:206) and [reason.md](C:/Users/mikes/WebstormProjects/reason/guides/reason.md:555). The source comment now makes the same distinction.

- F5 — Closed. Empty `RuleResult.id` acceptance is pinned at [validators.test.ts](C:/Users/mikes/WebstormProjects/reason/tests/src/core/validators.test.ts:735). The campaign status and consumer-side narrowing decision are corrected at [missing-result-guards.md](C:/Users/mikes/WebstormProjects/reason/.orkestrel/reason/missing-result-guards.md:71).

- F6 — Closed. Published open, total `isReasonValidationResult` at [validators.ts](C:/Users/mikes/WebstormProjects/reason/src/core/validators.ts:1155), with extra-member, class, member-negative, and adversarial controls at [validators.test.ts](C:/Users/mikes/WebstormProjects/reason/tests/src/core/validators.test.ts:1195). Guide parity is at [reason.md](C:/Users/mikes/WebstormProjects/reason/guides/reason.md:248).

The retained R1 probe passed 10/10. Expectations flipped at [r1-objective-probe.test.ts](C:/Users/mikes/WebstormProjects/reason/tmp/audit/r1-objective-probe.test.ts:152): lines 154, 155, and 161 changed `false → true`; line 167 changed `true → false`.

## Unknowns calls

- `ReasonValidationResult` contains only flat `valid`, `errors`, and `warnings` members. All receive the open foreign-result treatment; there is no nested owned record.
- Chose `isResultFact` to distinguish the open result-side fact guard from exact input-side `isFact`.
- No `types.ts` or vendored-file change was required.

## Final counts

- Validators suite: 14 files, 1,038 tests passed.
- Scoped check: both `npm run check` TypeScript passes succeeded.
- Guides parity: 1 file, 83 tests passed.
- R1 objective probe: 1 file, 10 tests passed.

Tracked status contains exactly the four owned modified files. The pre-existing untracked `.claude/settings.local.json` remains untouched.

## Exact `git diff --stat`

```text
 .orkestrel/reason/missing-result-guards.md |  11 ++-
 guides/reason.md                           |  90 ++++++++---------
 src/core/validators.ts                     |  78 ++++++++++++---
 tests/src/core/validators.test.ts          | 153 ++++++++++++++++++++++++++---
 4 files changed, 262 insertions(+), 70 deletions(-)
```
