# W2 — Bring `enterprise-bootstrap` to instruction-file conformance

## Role and engine

`implementer`, Claude Opus 5. Subjective lane: voice, structure, documentation shape. Sole writer
in the checkout for the duration of this unit.

## Objective

Rewrite the `enterprise-bootstrap` skill so every line satisfies the instruction-file law and
`SKILL.md` returns to the concise workflow shape, without losing any design rule, measured value,
or check the skill carries.

## Context

Repository: `C:\Users\mikes\WebstormProjects\scaffold`. Windows host, Git Bash. Baseline is the
tree as W1 left it, committed and clean — confirm with `git status` before editing.

This skill was updated in another session and checkpointed as delivered at `37210f3`. It vendors
to every package in the fleet through `dist/host`.

Read before editing, in this order:

1. `AGENTS.md` — **Writing** and **Instruction files** are the law you are enforcing.
2. `.claude/rules/documentation.md` — **Workflow skills**: "Keep `SKILL.md` concise and route
   conditional detail to one-level `references/`."
3. `.agents/skills/orkestrel-harden-package/SKILL.md` — the reference shape: 68 lines.
4. The five owned files, completely. `SKILL.md` is 304 lines; the references are long and may
   stay long — the length law binds `SKILL.md`, not the references.

The voice: every line is a directive an LLM agent executes mid-task. No persuasion, no
reassurance, no aphorism, no metaphor, no slogan heading, no record of how a finding was found.
Keep every measured value that changes a judgment (a contrast figure, a ratio, a breakpoint) —
state it as the rule's condition, not as the story of its measurement.

## Findings to fix

From an independent conformance sweep of the checkpointed files. Fix the class, not only the
quoted instance — the sweep capped its list and named these residuals it dropped: checklist rows
restating other findings, five-states/feedback restatements already in `bootstrap-reference.md`,
"Portability" and "Design principles" slogans, "Writing (interface copy)" restating
`references/frontend-design.md:59`.

In `SKILL.md`:

- `:17` "General-purpose guide for **intentional visual design** … distinctive where it matters,
  disciplined everywhere else…" — marketing register; recast the opening as directives.
- `:64` "Critique again — remove one accessory (Chanel)." — aphorism; state the check itself.
- `:137` "which is what makes them the safe choice" — persuasion; cut.
- `:137` "but the stock danger fill clears the bar by hundredths" — probe history; keep the
  resulting rule, cut the story.
- `:235-239` anti-pattern entries that negate rules already stated at `:137`, `:146-147` — an
  anti-pattern entry survives only when it names a failure shape the rule alone does not make
  checkable; otherwise fold it into the rule's own line.
- `:298` "## Key takeaways" — a summary section is a second copy of the rules above it; delete
  the section, folding anything unique back to its owning rule.

In `references/bootstrap-reference.md`:

- `:354` "a card header and footer are a 3% tint of the body color over the card's own
  background… a reader that stops at the first painted ancestor and drops its alpha treats that
  tint as full-strength paint." — keep the mechanism as the rule's condition; cut the discovery
  narrative around it.
- `:354` "Confident wrong verdicts are worse than no reader, because the run comes back green." —
  explainer; cut, keep the directive it decorates.
- `:361` "A measurement that runs once is a rehearsal; the same reader wired into the suite is
  what keeps the answer true." — aphorism; state it as: wire the reader into the suite.

In `references/components.md`:

- `:115`, `:1007` restate `SKILL.md` fill/tone rules; `:191` "a contrast decision, not a taste
  one" is persuasion. Between `SKILL.md` and a reference, the REFERENCE owns component-specific
  detail; `SKILL.md` owns the always-applicable rule stated once. Deduplicate in that direction.

In `references/utilities.md`:

- `:304` restates the `SKILL.md` decoration-tier rule — same direction: the reference keeps the
  per-utility specifics, `SKILL.md` the one rule.

Structural:

- `SKILL.md` must end materially shorter, holding: frontmatter, the workflow, the rules that
  apply to every unit, and pointers into the four references for everything conditional. Move
  displaced detail into the reference that owns its subject rather than deleting it.

## Unknowns

- Whether a flagged restatement hides a nuance the dedup would lose. You judge: where the second
  copy adds something, keep exactly the addition in the owning file. Record each call.
- Whether `references/frontend-design.md` (not modified by the incoming session) duplicates any
  rule you consolidate. Read it; report overlaps; edit it only where a consolidation you make
  would otherwise leave a contradiction between it and the file that now owns the rule.

## Scope

Owned files:

- `.agents/skills/enterprise-bootstrap/SKILL.md`
- `.agents/skills/enterprise-bootstrap/references/bootstrap-reference.md`
- `.agents/skills/enterprise-bootstrap/references/components.md`
- `.agents/skills/enterprise-bootstrap/references/utilities.md`
- `.agents/skills/enterprise-bootstrap/references/frontend-design.md` (contradiction repair only)

Read anything. Write nothing else. Off-limits for writing: everything else, including
`orkestrel-human-journey` (a sibling unit owned it), `.claude/rules/`, and
`.claude/skills/enterprise-bootstrap/SKILL.md` unless its description must match a frontmatter
description you change — if so, that one-line sync is yours.

Validation: read-only, scoped to owned files. No `format`, no `lint --fix`, no `build`, no
tree-wide command.

## Execution

Perform this assignment directly. Spawn nothing.

## Constraints

- Lose no design rule, threshold, or check. This skill's value is its specifics; the rewrite
  compresses the prose around them, never the specifics themselves.
- One home per rule. `SKILL.md` for always-applicable rules, the subject's reference for detail.
- Frontmatter stays exactly `name` and `description`.
- Reference depth stays one level. Create no new files.

## Output

1. Per-file: defect classes fixed, with counts, and the line-count delta.
2. Every judgment call from Unknowns: what was kept where, what was folded.
3. Anything the original stated twice with DIFFERENT values — report the conflict and which value
   you kept, with the reason.
4. The exact `git diff --stat` of your changes.

## Deviation contract

Stop and report if a fix would change what the skill instructs rather than how it says it, or if
two copies of a rule conflict and neither side is evidently correct. Ancillary calls — headings,
ordering, which reference owns a moved block — are yours: decide, record, continue.

## Acceptance criteria

- Zero aphorisms, slogan headings, persuasion clauses, probe-history narration, or summary
  sections in the five owned files, by `AGENTS.md` **Writing** definitions.
- Every rule has one home; a second occurrence is a pointer, not a restatement.
- `SKILL.md` holds the workflow and always-applicable rules only, and is materially shorter than
  304 lines.
- Every numeric threshold present before the rewrite is present after it, in the file that owns
  its subject.

## Review evidence

Your report plus the actual diff. The audit round reads the diff directly.
