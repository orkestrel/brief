# R2 — closure record: fix round, audit, gates, push

Reason `main` pushed at `10c39e5`: the reason session's four commits, the origin reconciliation
(scaffold 0.0.38 adoption merged, carryover resolved canonical, `repair` catching two auto-kept
files, audit 0 of 117), Sol's fix round `3a2f65a`, and the closing pass `10c39e5`.

## Sol's fix round (session `01a00fcf`, journal `tmp/codex/r2-fix.jsonl`)

All six findings closed, four owned files, +262/−70:

- **F1** `isResultFact` published and routed under the inferential arm's `derived`; red→green on
  the flipped fence test (`1 failed` → `1 passed`, same command). `isFact` untouched and exact.
- **F2** `isSymbolicResult` reads own property names; red→green on the non-enumerable vector.
- **F3** real class positives for every result guard.
- **F4** guide scoped (input combinators vs bespoke result checks), both falsified sentences
  gone, invariant 5 repaired.
- **F5** empty-id acceptance pinned as contract; the successor obligation names the widening and
  its direction; the record's falsified Status corrected to "nine open throughout, all ten
  total, the inferential arm fenced-in" with R2 as the closer.
- **F6** `isReasonValidationResult` published in the eleven-guard posture, full control set.
- **R1's own falsifying probe re-run: 10 of 10 passing**, expectations flipped at exactly the
  repaired lines (154, 155, 161 false→true; 167 true→false).

## Opus audit of Sol's diff (cross-engine)

**6 CONFIRMED, 0 BROKEN.** Three residuals, each closed at `10c39e5` on the auditor's own
prescription: a real-engine `validate` control for the eleventh guard; the own-members decision
recorded in `isSymbolicResult`'s TSDoc; the module header reflowed. Its run-level referrals were
settled from Sol's report (the two red→green transcripts, the probe re-run) and the verifier
chain below.

The lint gate independently caught `ResultGuardFixture` as constructor-only; the fix gives it an
initialized own member, making every class control a dual vector (class instance + extra member).

## Acceptance gates

`prepublishOnly` exit 0 at `10c39e5`: format:check, lint:check `--deny-warnings`, check, build,
core **1,039**, policy **57**, config 10, guides **83**.

## Standing consequences

- **For brief (runtime dependency):** when reason publishes (0.0.6), brief re-pins, imports
  `isLogicalResult`/`isRuleResult`, deletes `isLogicalVerdict`/`isRuleVerdict`, and decides at
  its own boundary whether it still wants a non-empty `id` assertion — reason's guard is
  deliberately wider (`id: ''` accepted, `RuleResult.id` is `string`). Then brief republishes.
- **For contract:** the open-record combinator gap stands (two packages have hand-rolled the
  same open-check scaffolding); its record was pruned from this tree with the fleet backlog
  named as its destination, but no backlog carrying it has been found — recoverable at
  `0cd95f9`.
- **Publishing reason is the user's decision.** The tree is release-ready; nothing here bumps or
  publishes.
