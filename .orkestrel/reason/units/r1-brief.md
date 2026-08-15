# R1 — Review: the reason session's result-guard publication, `origin/main..main`

## Your lane

Named by your dispatch. Objective (Sol): correctness, constraints, executed falsification.
Subjective (reviewer): API shape, naming, scope discipline, guide honesty. Blind to the other
lane.

## Subject

Repository `C:\Users\mikes\WebstormProjects\reason`, the four unpushed commits listed in
`tmp/audit/r1-commits.txt`. Another session implemented the proposal in `tmp/audit/r1-proposal.md`:
publish result-type guards so consumers stop hand-writing the union narrowing that cost the brief
campaign two audit rounds. The session published ten: `isCheckResult`, `isFactorResult`,
`isGroupResult`, `isRuleResult`, `isProofNode`, `isQuantitativeResult`, `isLogicalResult`,
`isSymbolicResult`, `isInferentialResult`, `isReasonResult`.

History the proposal encodes, and the review must hold the work to: brief's first guard was
exact-record and refused a conforming richer result (failed CLOSED on a valid engine); its second
was plain-record and refused a class instance; the working third checks every published member,
accepts unknown keys, accepts a prototype, rejects arrays, and follows published member types
exactly — `count` is `number`, so an integer check is a narrowing past the contract.

## Evidence under `tmp/audit/`

`r1-diff.patch` (full diff), `r1-stat.txt`, `r1-commits.txt`, `r1-status.txt` (expected empty),
`r1-proposal.md` (the accepted proposal), `r1-brief-validators.ts` (brief's proven working guards
`isLogicalVerdict`/`isRuleVerdict`, the compatibility reference). Current files on disk are HEAD.
Governing law: `AGENTS.md`, `.claude/rules/patterns.md` (Foreign contracts), `typescript.md`,
`architecture.md`, `tests.md`, `documentation.md`, `guides/reason.md`, `*/types.ts`.

## Claims

Verdicts CONFIRMED / BROKEN / UNRESOLVED / NOT-EVIDENCED with `file:line` evidence. The objective
lane executes its attacks; a lane without a shell rules NOT-EVIDENCED where only a run decides.

1. **The three properties hold for every result guard.** Each of the ten: passes a conforming
   value carrying extra members; passes a conforming class instance (own prototype); checks each
   member exactly as `types.ts` publishes it, with no narrowing past the contract anywhere (no
   integer check on a `number`, no pattern on a plain `string`, no array refusal where the type
   admits one).
2. **The open combinator is actually open.** The guide claims composition "from the contracts
   combinators" with result records "open to extra members" — but `@orkestrel/contract`'s
   `recordOf` is exact (this exact confusion caused brief's round-2 defect). Identify the
   combinator each result guard uses, read its installed implementation in
   `node_modules/@orkestrel/contract`, and prove openness by execution, not by name.
3. **Exactness doctrine holds in both directions.** No result guard is exact; no owned-input
   guard was accidentally opened by this change (the diff's input-guard hunks, if any, preserve
   prior semantics).
4. **The union guard is sound and complete.** `isReasonResult` accepts a value iff some arm
   accepts it; every arm is reachable; no discriminant collision between arms admits a value
   through the wrong arm.
5. **Adversarial inputs return `false`, never throw** — executed: `null`, `undefined`,
   primitives, arrays, cyclic objects, null-prototype objects, hostile getters/`Proxy` if the
   package's guard doctrine covers them, deep junk in nested members.
6. **The tests bind the properties.** Per guard: an extra-members positive control, a
   class-instance positive control, per-member negative controls, and names that say what they
   prove. The suite and typecheck run green (objective lane: run the scoped commands and read the
   counts).
7. **Guide parity is honest.** Every new export documented; the doctrine sentence matches the
   code; the parity gates pass; no behavioral sentence in `guides/reason.md` claims what a fence
   or test does not prove.
8. **The API scope is earned.** Ten guards against the proposal's two-to-four: for each, either a
   consumer receiving that type from the published interface must narrow it (the proposal's
   argument), or it is speculative surface `AGENTS.md`'s minimal-public-API law rejects. Judge
   each, name any that fail.
9. **Drop-in compatibility for brief.** `isLogicalResult`/`isRuleResult` accept everything
   brief's `isLogicalVerdict`/`isRuleVerdict` accept and refuse what they refuse (modulo
   deliberate, named differences). Objective lane: falsify by construction against
   `r1-brief-validators.ts`.
10. **Scope and hygiene.** The four commits also carry hand-copied skill files
    (`enterprise-bootstrap`, `orkestrel-human-journey`, bridges, `settings.json`, `codex.md`) —
    vendored surface a `repair` will overwrite. Enumerate exactly which changed files are the
    unit (guards + tests + guide + campaign record) and which are carryover the scaffold 0.0.36
    re-pin supersedes; name any carryover file whose content diverges from what scaffold 0.0.36
    vendors.

## Execution

Directly; spawn nothing; edit nothing. Objective lane may run scoped commands (`npm run
check`, the scoped vitest projects, node probes under `tmp/audit/` only if the sandbox permits
writing there — otherwise present the exact probe source and rule NOT-EVIDENCED). Windows: no
heredocs, `node -e`, `node -p`, `&&`, or `${...}` in shell arguments.

## Output

Per-claim verdicts with evidence; at most five findings outside the claims with `file:line`; one
terminal line: `VERDICT: <n> CONFIRMED, <n> BROKEN, <n> UNRESOLVED, <n> NOT-EVIDENCED`.
