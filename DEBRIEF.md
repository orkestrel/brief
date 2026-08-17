# DEBRIEF — the result-guard wave, 2026-08-17

What changed across the Orkestrel packages, for any session planning against them. Every release
below is published and every consumer named re-pinned; read the registry, not this table, before
sequencing new work on top.

## The doctrine, in one paragraph

A value returned by an interface another package publishes is foreign data: guard it open —
unknown members admitted, class instances admitted, arrays refused, each member checked exactly
as its published type declares — and never reuse an exact input guard for a result-side member.
`.claude/rules/patterns.md` (**Foreign contracts**, vendored fleet-wide by scaffold) owns the
law; `@orkestrel/contract@0.0.12`'s `objectOf` owns the mechanism. Every engine package now
publishes the guard closure for everything its borrowable interfaces return, so a consumer never
hand-writes the narrowing again — it imports, and deletes any local copy per the ecosystem-reuse
law.

## Per-package

| Package                | Release               | What was done                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@orkestrel/contract`  | 0.0.12                | Published `objectOf`, the open counterpart to `recordOf`: same three-overload API, members read via `Reflect.get` so a prototype accessor satisfies a member, unknown keys never enumerated, member-carrying callables admitted (the `instanceOf` correction applied), total under hostile input. Shared construction extracted as `readGuardShape`.                                                                                                                                            |
| `@orkestrel/reason`    | 0.0.6                 | Published eleven open result guards: `isReasonResult` and its four arms, the nested `isRuleResult`/`isCheckResult`/`isFactorResult`/`isGroupResult`/`isProofNode`/`isResultFact`, and `isReasonValidationResult`. One deliberate widening documented: `RuleResult.id` is `string`, so an empty id is accepted — a consumer wanting non-empty asserts it at its own boundary.                                                                                                                    |
| `@orkestrel/interpret` | 0.0.9                 | Published `isInterpretation` plus `isProvenance`/`isIntent`/`isEntity`/`isFieldMapping`/`isAmbiguity`/`isStageRecord`/`isStageFailure`, all on `objectOf`. The three literal unions moved to one `constants.ts` home each (`PROVENANCE_CATEGORIES`, `INTERPRET_STAGES`, `INTERPRET_ERROR_CODES`). `unknown`-typed members are unchecked and an absent one also passes — recorded on each guard.                                                                                                 |
| `@orkestrel/brief`     | 0.0.2                 | Adopted reason's `isLogicalResult` at both gate checks, deleting its local `isLogicalVerdict`/`isRuleVerdict`/`isObject`. Adopted interpret's `isInterpretation` at the interpret stage's two doors (borrowed engine return and caller-supplied interpretation), with a seal-live fallback where the input snapshot's clone drops prototype-carried members of a conforming value.                                                                                                              |
| `@orkestrel/qualifier` | 0.0.9                 | Published `isQualificationResult` (+ `isFinding`/`isPremise`/`isDerivation`/`isEligibilityRecord`) and `isQualificationValidationResult` — the latter by delegation to reason's guard, because the type is reasons' alias, so the alias tracks upstream with no drift channel. Pre-existing exact `isRuling`/`isQualificationPass` were posture-determined and left alone: neither type appears in a result.                                                                                    |
| `@orkestrel/rater`     | 0.0.10                | Published `isRatingResult` (+ `isLineResult`/`isWorksheet`/`isWorksheetGroup`/`isWorksheetFactor`/`isStep`/`isEvidence`), importing reason's `isAggregation`/`isFieldPath` rather than re-declaring the unions. Adversarial sweeps run on `@orkestrel/test`'s `createHostileValues()`.                                                                                                                                                                                                          |
| `@orkestrel/program`   | 0.0.8                 | Both halves: published `isProgramResult`/`isAggregateResult`/`isProgramValidationResult` (+ `isDetermination`/`isAggregateGroup`/`isTally`/`isTallies`/`isProgramSums`), with `isProgramResult` composing qualifier's and rater's published closures; and adopted the L3 guards at its own four borrowed-engine doors (`qualify`, `rate`, both `reason` sites), routing failure into the existing `ProgramError('MISMATCH')` containment — the doors' pre-guard failures were raw `TypeError`s. |
| `@orkestrel/scaffold`  | 0.0.38 (pre-existing) | Every repo above re-pinned and ran the `repair` its pin owed; the vendored policy suite's skill-family gate is green fleet-wide.                                                                                                                                                                                                                                                                                                                                                                |

## Standing facts a plan should account for

- **The `Kind` column is load-bearing.** Guides parity distinguishes `function` from `const`
  exports; a guard defined by delegation is a `const` and its guide row must say so.
- **Source TSDoc may backtick only its own package's exports** — a foreign guard named in TSDoc
  prose stays unbackticked or the TD parity check fails.
- **Dictionary leaves certify own members only.** `Object.getOwnPropertyNames`-based checks
  (`scopes`, `sums`, symbolic `solutions`) accept a value carrying members on a prototype
  unchecked; each guide discloses it.
- **Two open successors, both program-package work:** read-once ownership at program's guarded
  doors (the guard proves an instant; the class re-reads the foreign object afterward, so a
  per-read getter defeats containment — the fix is one ownership ladder, clone → guard → seal
  live → refuse, and it also exists as a recorded follow-up at brief's gate/interpret engine
  doors); and program's three raw `validate`-path dereferences in `helpers.ts`, whose guards
  (`isQualificationValidationResult`, `isReasonValidationResult`) are published and waiting.
- **`Premise` publishes every member optional**, so `isPremise` accepts `{}` — faithful to the
  published type; whether `met` or `field` should be required is an open qualifier `types.ts`
  design question, deliberately not decided in this wave.
