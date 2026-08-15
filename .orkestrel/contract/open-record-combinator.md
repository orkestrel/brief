# `@orkestrel/contract` — no open-record combinator exists

Raised by the `@orkestrel/reason` result-guards review (R1), 2026-08-15. Second occurrence of
the same hand-roll.

## The gap

`recordOf` is exact and plain-record-only: it gates on `isRecord` and rejects any own key
outside the declared vocabulary (`dist/src/core/index.js:5732-5738` at 0.0.11). That is correct
for records a package owns. No combinator exists for the other posture — validate declared
members, accept unknown members, accept a prototype — which is the posture the Foreign-contracts
law requires over any value a foreign interface returns.

## The cost, twice now

- `brief` hand-rolled it as `isLogicalVerdict`/`isRuleVerdict` after two defective attempts
  (exact-record, then plain-record) each survived an audit round.
- `reason` hand-rolled it as ten result guards, each `whereOf(isObject, <predicate>)` plus
  per-member `Reflect.get` — proven open by execution in R1 — and its one guard that reused an
  exact input guard for a nested member (`isInferentialResult` via `isFact`) reproduced brief's
  defect exactly.

The pattern: openness is only achievable today by AVOIDING the record combinator, and every
package that needs it rebuilds the same scaffolding — ten near-identical bodies in reason alone.

## Proposal

Publish an open-record combinator beside `recordOf` (member checks over declared keys, unknown
keys admitted, prototypes admitted, arrays refused, total under hostile input), named per
contract's own conventions. Migrate reason's ten bespoke bodies and brief's successor guards to
it when it exists.

## Status

Raised, not implemented. A change to `contract`, outside both campaigns' scope.
