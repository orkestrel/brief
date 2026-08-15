# W1 — Bring `orkestrel-human-journey` to instruction-file conformance

## Role and engine

`implementer`, Claude Opus 5. Subjective lane: voice, structure, documentation shape. Sole writer
in the checkout for the duration of this unit.

## Objective

Rewrite the four `orkestrel-human-journey` files so every line satisfies the instruction-file law,
and add the missing `agents/openai.yaml`, without losing any process instruction the skill carries.

## Context

Repository: `C:\Users\mikes\WebstormProjects\scaffold`. Windows host, Git Bash. Baseline commit
`37210f3`, tree clean.

This skill was written in another session and checkpointed as delivered. It vendors to every
package in the fleet through `dist/host`, so its defects propagate on the next release.

Read before editing, in this order:

1. `AGENTS.md` — the **Writing** and **Instruction files** sections are the law you are enforcing.
2. `.claude/rules/documentation.md` — the **Workflow skills** section.
3. `.agents/skills/orkestrel-harden-package/SKILL.md` — the reference shape: 68 lines, workflow
   only, detail routed to references.
4. `.claude/skills/orkestrel-falsify/SKILL.md` — the reference bridge shape.
5. The four owned files, completely.

The voice you are writing: every line is a directive an LLM agent executes mid-task — what to do,
what to check, or what to refuse. No clause exists to persuade, reassure, or explain a rule to a
person. No aphorism, no metaphor, no slogan heading. A definition survives only recast as a
directive. A law that lives in `AGENTS.md` or a rule file is pointed at, never copied.

## Findings to fix

From an independent conformance sweep. Line numbers refer to the checkpointed files. Fix the
class, not only the quoted instance — the sweep capped its list.

In `.agents/skills/orkestrel-human-journey/SKILL.md`:

- `:8` "A journey drives the application through the interface a person has, and through nothing
  else." — recast as a directive.
- `:25` "## The doctrine" — slogan heading; retitle to the subject it governs.
- `:34` "A refusal is a proof." and "What the interface withholds is as much of its contract as
  what it offers." — aphorism plus explainer; recast as one directive about testing refusals.
- `:49` restates `tests.md`'s browser-setup-module law — replace the restatement with a pointer;
  keep only what is new here.
- `:56` "A dispatched synthetic event reaches handlers a person's input would never reach, and it
  cannot observe focus." — explainer; keep the directive it supports, cut or subordinate the why.
- `:65` restates `tests.md`'s `integration.test.ts` placement law — pointer.
- `:32` "Internal state may corroborate a perception assertion; it never replaces one." —
  overlaps `tests.md:217`; keep the journey-specific directive, point at the rule for the rest.
- `:100` "…so a reader sees it is not a journey." — cut the explainer clause, keep the directive.
- `:103` "never a mock of owned behavior." — copies `AGENTS.md`'s mock law; pointer.
- `:129` "run by someone who did not write the journeys." — copies the orchestration acceptance
  law; pointer or cut.

In `references/layer.md`:

- `:3` "The layer is the only door a journey has." — aphorism; recast as a directive.
- `:18` "so a suite built on it passes while the interface is unusable." — explainer; cut or
  subordinate.
- `:18` "Never dispatch a constructed event." — check against `tests.md:214`, which centralizes
  event factories (`createPointerEvent`, …). If the two conflict, do not resolve it: report it
  under Deviations. If the layer law is "journeys never dispatch constructed events, unit tests
  may", state that boundary explicitly so the two laws compose.

In `references/captures.md`:

- `:72` "It is evidence for a review round, regenerated from the journeys whenever the surface
  changes." — recast as a directive.

In `.claude/skills/orkestrel-human-journey/SKILL.md` (the bridge):

- The frontmatter `description` drifted from the canonical skill's: it omits the trigger "or
  whenever the only evidence a screen works is a test that drove it through JavaScript instead of
  through the interface." Make the bridge description byte-identical to the canonical skill's
  frontmatter description.
- `:9` "Follow that canonical package before acting." — the conforming bridges say "Follow that
  canonical workflow before acting." Align the whole bridge body to the shape of
  `.claude/skills/orkestrel-falsify/SKILL.md`, substituting this skill's name.

New file `.agents/skills/orkestrel-human-journey/agents/openai.yaml`, matching its siblings'
shape exactly — this schema, with values for this skill:

```yaml
interface:
  display_name: '<Title Case Name>'
  short_description: '<one line, imperative, what the skill does>'
  default_prompt: 'Use $orkestrel-human-journey to <the same one line in use position>.'
```

Read two sibling files (`orkestrel-polish-surface`, `orkestrel-falsify`) before writing it.

## Unknowns

- Whether every flagged restatement hides a journey-specific nuance the pointer would lose. You
  are the judge of that: where the line adds something the rule does not say, keep exactly the
  addition and point for the rest. Record each such call in your report.

## Scope

Owned files:

- `.agents/skills/orkestrel-human-journey/SKILL.md`
- `.agents/skills/orkestrel-human-journey/references/layer.md`
- `.agents/skills/orkestrel-human-journey/references/captures.md`
- `.agents/skills/orkestrel-human-journey/agents/openai.yaml` (create)
- `.claude/skills/orkestrel-human-journey/SKILL.md`

Read anything. Write nothing else. Off-limits for writing: every other path in the repository,
including `.claude/rules/`, `AGENTS.md`, and the `enterprise-bootstrap` skill — a sibling unit
owns that.

Validation: read-only and scoped to your owned files. Do not run `format`, `lint --fix`, `build`,
or any tree-wide command.

## Execution

Perform this assignment directly. Spawn nothing.

## Constraints

- Lose no process instruction. Every step, check, and refusal the skill currently prescribes
  survives the rewrite unless it is a copy of a law owned elsewhere — then it becomes a pointer.
- Keep the SKILL.md → references structure: workflow in SKILL.md, conditional detail in the two
  references. Move content between them where the law requires it; do not create new files beyond
  the one openai.yaml.
- Frontmatter stays exactly `name` and `description`.
- Reference depth stays one level.
- Match the sentence rhythm of `orkestrel-harden-package/SKILL.md`: short lines, imperative,
  one idea per sentence.

## Output

1. Per-file: what classes of defect were fixed, with a count.
2. Every judgment call from the Unknowns section: the line, what was kept, what was pointed.
3. Any instruction you believe the original intended but never stated — report it, do not invent
   it into the file.
4. The exact `git diff --stat` of your changes.

## Deviation contract

Stop and report if: a fix would change what the skill instructs (not how it says it); the
`tests.md:214` event-factory conflict cannot be composed; or a flagged line turns out to be
correct as written. Ancillary calls — which heading a section takes, where a paragraph sits — are
yours: decide, record, continue.

## Acceptance criteria

- Zero aphorisms, slogan headings, explainer clauses, or probe-history references in the five
  owned files, by the definitions in `AGENTS.md` **Writing**.
- No line copies a law owned by `AGENTS.md`, a rule file, or the orchestration contract; each
  such law is a pointer.
- The bridge is shape-identical to `.claude/skills/orkestrel-falsify/SKILL.md` with this skill's
  name and description.
- `agents/openai.yaml` exists and parses as the sibling schema.
- The canonical `description` frontmatter and the bridge `description` are byte-identical.

## Review evidence

Your report plus the actual diff. The audit round reads `git diff 37210f3` directly.
