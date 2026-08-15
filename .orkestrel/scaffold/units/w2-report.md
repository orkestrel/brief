# W2 — returned report (verbatim)

Unit complete. Four owned files modified; `frontend-design.md` untouched (see deviation note).

## 1. Per-file: defect classes fixed, counts, line delta

**`.agents/skills/enterprise-bootstrap/SKILL.md` — 303 → 236 lines (−67, −22%)**

| Class | Count | Instances |
| --- | --- | --- |
| Marketing/persuasion register recast as directives | 5 | `:17` opening; `:29` reference-routing line; `:68` Rendered proof; `:117` rung-4 rationale; `:137` "which is what makes them the safe choice" |
| Aphorism removed | 3 | `:64` "(Chanel)"; `:144` "decoration beside an encoding"; `:157` "the tell of per-element shrinking" |
| Probe-history narration cut, rule kept | 1 | `:137` "the stock danger fill clears the bar by hundredths" → "Solid variants … carry no margin: re-measure whenever anything layers over one" |
| Slogan sections deleted, content routed to owner | 2 | `## Design principles` (8 bullets → `frontend-design.md`); `### Writing (interface copy)` (8 bullets → `frontend-design.md` §More on writing in design) |
| Summary section deleted | 1 | `## Key takeaways` (4 bullets, all second copies) |
| Anti-pattern entries folded into the rule that makes them checkable | 22 → 2 | Deleted 20; kept "decoration with no subject reason" and "faux widget / hand-rolled complex widget" |
| Sections deduplicated against the reference that owns them | 5 | `Portability` prose; `States & feedback` (7→3); `Views & navigation` (deleted, 5 bullets to their owners); `Forms` (7→4); `Density, layout, responsive` (11→5); `Component cheat sheet` table (14 lines → one routing sentence) |
| Checklist rows restating other rows | 21 → 19 rows | Dropped "Remove one unnecessary accessory" (Process step 5) and merged the portability/keyboard rows |

**`references/bootstrap-reference.md` — 618 → 618 lines (+22/−22):** discovery narrative cut with the 3%-tint mechanism retained as the rule's condition; "Confident wrong verdicts…" explainer cut; "rehearsal" aphorism → "Wire the reader into the suite once it has settled a question"; five further unflagged aphorisms in the same class removed (`:93`, `:518`, `:525`, `:552`, `:582`); persuasion heading at `:554` → **Neutralize a disabled destructive control.**; three duplications removed toward one home; two details absorbed from SKILL.md's dedup.

**`references/components.md` (+3/−3):** three restatements converted to pointers (`:115`, `:191`, `:1007`); component-specific detail retained.

**`references/utilities.md` (+1/−1):** `:304` dropped the restated 4.5:1 claim, kept the per-utility tier mapping plus a pointer.

## 2. Judgment calls from Unknowns

- **`frontend-design.md` overlaps.** It fully owns every rule in SKILL.md's deleted `Design principles` and `Writing (interface copy)` sections. Deleted both from SKILL.md; no contradiction created, so no edit to `frontend-design.md` was required.
- **Kept in SKILL.md:** the one Bootstrap-specific motion clause ("reach for Bootstrap's own transitions before writing custom animation") moved to operating principle 5 with the `prefers-reduced-motion` obligation.
- **Contrast bars kept in SKILL.md, procedure kept in the reference.**
- **A11y baseline kept in SKILL.md** (strict superset); the reference keeps only Bootstrap-specific class names plus a pointer.
- **Component-specific detail left in the reference** (`.badge:empty` mechanism, skin-fill trap).
- **Density-toggle rule:** reference-to-reference overlap between `bootstrap-reference.md:474` and `utilities.md:310` reported, not changed — the granted dedup direction governs SKILL.md-vs-reference only.

## 3. Same rule, different values

One conflict, resolved: **large-text contrast.** `bootstrap-reference.md:344` allowed WCAG's 3:1 for large text; `SKILL.md:143` required 4.5:1 for anything information-bearing. Kept the stricter bar as the single rule; the allowance is recorded as one this package declines. Threshold sweep: every numeric token in the pre-rewrite `SKILL.md` (`#F4F1EA`, `01/02/03`, `2.2`, `3:1`, `4.5:1`, `4–6`, `24×24px`, `5.3`, `5.3.8`, `~1s`, `~10s`) is present in the post-rewrite package.

## 4. Validation

`npx oxfmt --check` on the skill directory: "All matched files use the correct format." `git status --short`: exactly the four owned files.

```
 .agents/skills/enterprise-bootstrap/SKILL.md       | 317 ++++++++-------------
 .../references/bootstrap-reference.md              |  44 ++-
 .../enterprise-bootstrap/references/components.md  |   6 +-
 .../enterprise-bootstrap/references/utilities.md   |   2 +-
 4 files changed, 150 insertions(+), 219 deletions(-)
```

## Deviation — recorded, work not stopped

Acceptance criterion 1 (zero aphorisms in all five owned files) conflicted with the twice-stated scope restriction on `frontend-design.md` (contradiction repair only). The file carries four pre-existing aphorisms (`:7` studio persona, `:45` "picture is worth 1000 tokens", `:45` Chanel anecdote, `:45` "Not taking a risk can be a risk itself!"). W2 obeyed the narrower scope and left them.

**Orchestrator's ruling:** the four spots were recast as directives by the Orchestrator at `8ebb4f7`, preserving every steering instruction. W2's work landed as `aa412d2`.
