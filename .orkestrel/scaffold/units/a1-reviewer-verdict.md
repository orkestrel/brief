# A1 — subjective lane verdict (reviewer, verbatim)

## Per-claim verdicts

**1. Nothing lost — CONFIRMED.**
Swept both baselines against HEAD. Every deleted step, check, refusal, and threshold has a surviving home: Design principles → `frontend-design.md:13-25`; Writing → `frontend-design.md:51-59` (one-word-label/`aria-label`, one-glyph-one-meaning also at `SKILL.md:83`); Views & navigation → `components.md:984,1010,1016,150`; cheat sheet → `components.md:978-994`; the four at-risk bullets (paste-blocking, command palette, Clear filters, errors-never-toast) all land in `bootstrap-reference.md`/`components.md`; density/layout bullets → `utilities.md:302-312`; `.badge:empty` → `components.md:144,146`. Every introduced pointer resolves. Human-journey's three law-pointers land on actual law (`tests.md:66-67,214,217`; `AGENTS.md:49`; `orchestration.md:299,738`). One degradation, adequately owned: the cheat sheet's Feedback row has no single successor. One deliberate threshold change, named: `bootstrap-reference.md:467` now refuses WCAG's 3:1 large-text allowance, resolving a contradiction.

**2. Voice conformance — BROKEN.**
`frontend-design.md`, swept whole at HEAD, is still pre-campaign voice, and `SKILL.md:60-62` routes the reader into it first. Instances: `:23` "Elegance is executing the chosen vision well."; `:51` "Being specific is always better than being clever."; `:53` signposting metaphor; `:55` "Errors don't apologize… An empty screen is an invitation to act."; `:59` "a glyph is a word"; `:33` hired-designer analogy; `:41` "delight" and `:49` "design material, not decoration" — evaluative, not testable. The campaign also introduced one metaphor on a changed line: `SKILL.md:130` "carry no margin" collides with Bootstrap's literal `margin` utility vocabulary.

**3. One home per rule — CONFIRMED.**
The four baseline restatements are now pointers, each verified to land on real law. `enterprise-bootstrap/SKILL.md:39` defers to project code law. Closest call: `orkestrel-human-journey/SKILL.md:46-48` tracks `tests.md:150` but is scoped to the journey layer beside the citation, which the claim permits.

**4. Bridge parity — CONFIRMED.** Byte-identical descriptions both skills; body matches falsify modulo name.

**5. Family metadata — CONFIRMED.** The prompt names both halves of the skill, matching `SKILL.md:3`.

**6. Gate correctness — BROKEN.**
Four of five sub-clauses hold (genuine discovery, exact-case enforcement, out-of-membership control, exact imports, one-failure red proof). Broken: the validation enforces a canonical serialization, not claim 5's invariant — `setupPolicy.ts:803-816` requires exactly four lines, fixed key order, two-space indent, single quotes. The code names the real rule honestly at `:849`, but nothing an author reads states the four-line shape: an undocumented byte-shape promoted to fleet law. What right looks like: state the shape in `.claude/rules/documentation.md` beside `:68`, or relax the parser to the named invariant.

**7. Gate soundness — CONFIRMED on its stated scope.** 55 green on the real tree; zero references safe; unbounded description safe.

**8. Orchestrator edits hold — CONFIRMED.** Every trigger in the polish-surface description survives, plus the round-versus-campaign selection rule. The four recasts each preserve their steering and make it testable. No new aphorism in the recast passages.

**9. Scope honesty — CONFIRMED.** Exactly fourteen files. Merge attribution is inference; `git log -- .orkestrel/supervisor/REDESIGN.md` would settle it (no shell).

## Findings outside the claims

1. `tests/setupPolicy.ts:48,930` — `PolicyControl.family?: boolean` derivable from `rule === 'skill'`; breaks Derive state. Right shape: branch on the rule, delete the field.
2. `captures.md:70-73` — regeneration rule stated twice in adjacent bullets; the rewrite promoted a rationale clause into a second directive. One home.
3. `enterprise-bootstrap/SKILL.md:186-189` — both surviving anti-pattern bullets restate rules with homes elsewhere. Delete or keep only the unowned.
4. Analyst referral — `([^']+)` cannot match YAML's escaped apostrophe; the four-line check rejects reordered keys, double quotes, comments, block scalars; vendored fleet-wide. Also `extractSkillReferences` scans fenced code (comment concedes the over-match).
5. Analyst referral — `policy.test.ts:299-303` asserts the family contains `orkestrel-falsify` in a vendored test; can a target select a subset omitting `.agents/skills`?

VERDICT: 7 CONFIRMED, 2 BROKEN, 0 UNRESOLVED, 0 NOT-EVIDENCED
