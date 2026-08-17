# ROADMAP

The sequenced plan of record for hardening every borrowed-engine seam this package and its
siblings share. Each chunk reaches green before the next begins. The reason seam is closed and is
the template: reason 0.0.6 published its result guards, and `e44b957` is the consumer-side swap
every later adoption copies.

## 1. `@orkestrel/contract` — publish the open-record combinator

`recordOf` is exact and plain-record-only, which is correct for owned records and wrong for every
value a foreign interface returns. No open counterpart exists, so reason hand-rolled eleven
near-identical `whereOf(isObject, …)` bodies and brief carried two before deleting them.
Interpret, qualifier, rater, and program will each rebuild the same scaffolding until contract
owns it once.

- Publish a combinator that checks declared members, admits unknown members, admits prototypes
  and class instances, refuses arrays, and stays total under hostile input — cycles, null
  prototypes, throwing getters, revoked proxies.
- Prove it with the control set in chunk 2's checklist, plus one executed control showing it
  admits what `recordOf` refuses.
- Later chunks do not block on this one: an engine package may ship bespoke open guards in
  reason's shape now and migrate to the combinator with no surface change.

## 2. `@orkestrel/interpret` — publish the result-guard closure

`InterpretInterface` is borrowable (`BriefCompilerOptions.interpret`), and interpret publishes
guards only for its input types. `interpret(text)` returns `Interpretation`, and no consumer can
narrow it. Publish:

- `isInterpretation`, checking every published member: `text`, `normalized`, `prompt`, `digest`
  strings; `intent` via an `isIntent` arm guard; `entities`, `mappings`, `ambiguities`, `stages`,
  `failures` arrays of their member guards; `subject` and `definition` absent-or-conforming;
  `complete` boolean; `confidence` checked as `number` — not as finite, not as a range.
- The nested result-side guards that closure requires: `isIntent`, `isEntity`, `isFieldMapping`,
  `isAmbiguity`, `isStageRecord`, `isStageFailure` — each exported and tested, not hidden inside
  `isInterpretation`.
- Do not reuse an exact input guard for a result-side member. Interpret's existing `isDefinition`
  is an input guard; if `Interpretation.definition` needs checking, give it a result-side check in
  the open posture. Reason shipped exactly this defect (`isFact` inside `isInferentialResult`)
  and paid a fix round for it.
- `describe` and `narrate` return `string` and need no guard. `narrate(result: ReasonResult)`
  makes interpret a consumer of reason's union: where interpret narrows it, import
  `isReasonResult` and its arms from reason rather than writing a local guard.
- Publishing guards moves the published surface: bump and publish interpret, then re-pin
  downstream in layer order.

## 3. `@orkestrel/brief` — guard the interpret seam

Blocked on chunk 2. Brief's interpret stage has two foreign doors, both currently unguarded:

- `#read` owns and `attempt`-wraps the borrowed engine's return, then dereferences `intent`,
  `text`, `entities`, `ambiguities` with no shape check. A malformed return today produces a raw
  `TypeError` where the contract promises `INTERPRET_FAILED`.
- `input.interpretation` is caller-supplied and reaches the draft directly — a second door the
  same guard must cover.

Adopt `isInterpretation` at both doors exactly as `e44b957` adopted `isLogicalResult` at the two
gate checks: import, check the owned copy, map failure to the stage's contract error, delete
nothing locally because nothing local exists, and record any deliberate widening interpret
documents. Re-run the full gate chain; the compiler tests gain one malformed-interpretation
control per door.

## 4. `@orkestrel/qualifier`, `rater`, `program` — audit before consumption

Run this audit on each package before any consumer borrows its engines, and file the findings in
the consuming campaign's record:

1. Enumerate every interface a caller can supply or implement, including through options.
2. For each, list every method's return type — secondary methods included; reason missed
   `validate` on its first pass.
3. Every returned type, union arm, and nested result member type gets a published open guard.
   The set closes over what the interfaces return, not over what one consumer reads today.
4. Consumers already hand-rolling a guard for the package's types are the proof the package owes
   it; the consumer deletes its copy when the package publishes, per the ecosystem-reuse law.

## What to look out for, in any package

The four defect classes this fleet has actually shipped, each found by an audit round:

- **Exact guard over a foreign interface.** Refuses a conforming richer value; fails the gate
  closed on a valid engine. A wrong refusal is worse than a loud crash.
- **Plain-record check over a foreign interface.** Refuses a class instance; an interface is
  satisfied by one as readily as by a literal.
- **Member narrowing past the published type.** Finite where the type says `number`, non-empty
  where it says `string`, integer where it says `number`. Reason's empty-`id` acceptance is the
  standing example: the widening is correct and must be documented so consumers decide their own
  boundary knowingly.
- **Input guard reused for a result-side member.** The input guard is exact by design, so one
  nested reuse silently reintroduces all three defects above inside an otherwise open guard.

And the proof obligations any new guard carries:

- Per guard: an extra-member positive, a real `class`-instance positive, per-member negatives,
  an adversarial totality sweep, and one real-engine round trip — the package's own engine's
  return accepted by its own guard, which is the control that catches return-shape drift.
- A behavioral claim is settled by a run, not a reading: the audit that closed the reason seam
  broke two read-confirmed claims with executed counterexamples.
- Guards are runtime API. Publishing them bumps the package; consumers re-pin, adopt, delete
  local copies, and republish in dependency-layer order.
