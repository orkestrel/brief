# A2 — Fix-round audit: W4, `f9a70eb..d454292`

## Your lane

Named by your dispatch. Objective (Sol): correctness and constraints. Subjective (reviewer):
voice, structure, whether the recasts still steer. Blind to the other lane.

## Subject

W4 closed audit round A1's retained findings: a whole-file voice recast of
`.agents/skills/enterprise-bootstrap/references/frontend-design.md`; four repairs in
`.agents/skills/enterprise-bootstrap/SKILL.md` (margin metaphor, two law pointers, anti-pattern
section deletion, persona labels); one dedup in
`.agents/skills/orkestrel-human-journey/references/captures.md`; in `tests/setupPolicy.ts` the
`family` flag deleted as derivable and the three metadata value patterns extended to accept
YAML's `''` escape with a new control in `tests/policy.test.ts`; the canonical four-line
`openai.yaml` shape stated in `.claude/rules/documentation.md`.

Evidence under `tmp/audit/`: `a2-diff.patch` (the W4 diff), `a2-stat.txt`, `a2-status.txt`
(expected empty). The A1 baseline copies of the skills are still under `tmp/audit/baseline/`.
Current files on disk are HEAD.

## Claims

Verdicts: CONFIRMED / BROKEN / UNRESOLVED / NOT-EVIDENCED, evidence with `file:line`.

1. **Voice closed.** `frontend-design.md` at HEAD contains zero aphorisms, metaphors,
   personification, persuasion, or human-explainer clauses per `AGENTS.md` **Writing** — swept
   whole, not by diff hunk.
2. **Nothing lost in the recast.** Every design instruction, threshold, and steering decision in
   the A1-era `frontend-design.md` (see the diff's removed lines) survives at HEAD recast or has
   its stated owner.
3. **The two pointers are sound.** `SKILL.md`'s rendered-proof and mechanical-proof sections
   point at the owning laws, keep their skill-specific content, and lost nothing.
4. **The anti-pattern deletion is covered.** Both deleted bullets are fully stated by their
   claimed owners (`bootstrap-reference.md` hand-roll ladder; `frontend-design.md` restraint +
   `SKILL.md` defaults critique; `components.md` Choosing table).
5. **The gate edits are correct.** `family` is gone and behavior is unchanged where
   `rule === 'skill'`; the pattern `'((?:[^']|'')+)'` accepts escaped apostrophes and still
   rejects the malformed-YAML control and an odd-quote value; the new control is in-population
   and was proven red against the old patterns; `test:policy` is 56 green at HEAD.
6. **The documented shape matches the enforced shape.** `.claude/rules/documentation.md`'s new
   bullets state exactly what `tests/setupPolicy.ts` enforces — no more, no less. Name any
   enforced condition the rule omits or any documented condition the gate does not check.
7. **Scope.** The diff touches exactly six files; `a2-status.txt` is empty.

## Execution

Directly, spawn nothing, edit nothing. The objective lane may run scoped read-only commands and
`npm run test:policy`. A lane without a shell rules NOT-EVIDENCED where only a run decides.

## Output

Per-claim verdicts; at most three findings outside the claims with `file:line`; one terminal
line: `VERDICT: <n> CONFIRMED, <n> BROKEN, <n> UNRESOLVED, <n> NOT-EVIDENCED`.
