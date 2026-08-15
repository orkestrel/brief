# W4 — Fix round: the audit's retained findings, one coherent pass

## Role and engine

`implementer`, Claude Opus 5. Sole writer in the checkout for this unit. Sol audits your diff
afterward, so your report claims only what the diff shows.

## Objective

Close every retained finding from audit round A1 in one pass: the `frontend-design.md` voice
sweep, four pointer/dedup repairs, the gate's derivable flag, the apostrophe expressiveness fix,
and the documentation of the yaml canon shape.

## Context

Repository: `C:\Users\mikes\WebstormProjects\scaffold`. Windows host, Git Bash. Baseline
`f9a70eb`, tree clean — confirm with `git status` before editing.

The voice law: `AGENTS.md` **Writing** and **Instruction files**. Every line a directive; no
aphorism, metaphor, personification, persuasion, or human-explainer clause; evaluative words
replaced by the concrete condition that closes them. Preserve every design instruction, threshold,
and steering decision — the sweep compresses prose around the content, never the content.

## Findings to close

### F1 — `references/frontend-design.md`: full voice pass

The file is still pre-campaign voice and `SKILL.md` routes readers into it first. Recast the
whole file, keeping all design guidance. The audit's named instances (sweep the file whole; these
are anchors, not the full list):

- `:19` "Structure is information." — aphorism heading a directive paragraph.
- `:23` "Elegance is executing the chosen vision well." — aphorism.
- `:33` "Just like a hired human designer, there's a careful balance between doing what you're
  good at and taking each project as a chance to experiment and learn." — analogy explainer;
  recast as the directive it steers toward (balance proven choices against experimenting where
  the brief invites it).
- `:41` "only show ideas to the user when you have higher confidence they'll delight" — replace
  "delight" with the concrete condition (the direction satisfies the brief and the quality floor).
- `:49` "They are design material, not decoration." — keep the directive ("Bring the same
  intentionality to copy as to spacing and color"), cut the slogan.
- `:51` "Being specific is always better than being clever." — aphorism; the directive is
  "Describe what something does in plain terms; choose the specific word over the clever one."
- `:53` "The vocabulary of an interface is the signposting… how people learn their way around." —
  metaphor plus persuasion; the directive is the consistency rule already stated beside it.
- `:55` "Errors don't apologize… An empty screen is an invitation to act." — personification;
  recast: errors state what failed and how to fix it, without apology or vagueness; an empty
  screen names the action that fills it.
- `:59` "a glyph is a word, and a word means one thing" — metaphor; the rule is one-glyph-one-
  meaning, already stated; cut or fold.

### F2 — `SKILL.md` repairs (enterprise-bootstrap)

- `:130` "Solid variants … carry no margin: re-measure whenever anything layers over one" — in a
  Bootstrap skill `margin` is a literal utility, so the metaphor collides with the package
  vocabulary. Recast plainly: re-measure a solid variant whenever anything layers over it; the
  stock fills sit at the 4.5:1 bar with no headroom.
- `:72` (Rendered proof) — the core sentence restates the rendered-surface evidence law owned by
  `.agents/orchestration.md`. Point at it; keep the skill-specific capture set (both viewports,
  both themes, accessibility snapshot) and the `orkestrel-polish-surface` routing. Cut the
  explainer "— source-reading review passes a component that renders nothing".
- `:78` (Mechanical proof) — "Give each one a negative control — an input it must report as
  failing — and void any run whose control passes" restates the instrument law owned by
  `.claude/rules/quality.md`. Point at it; keep the three instruments and their specific controls.
- `:186-189` (Anti-patterns) — both surviving bullets have homes (`SKILL.md:66` +
  `frontend-design.md`; `bootstrap-reference.md:574` + `components.md:990`). Delete the section;
  fold anything genuinely unowned into its owner first.
- `:49` — the audit reports a persona clause retained here. Read it; if it carries the studio
  persona or any human-explainer register, recast to the directive.

### F3 — `orkestrel-human-journey/references/captures.md:70-73`

The regeneration rule is stated twice in adjacent bullets. One home: keep the matrix-wide bullet,
end the hygiene bullet at "Keep the portfolio out of version control."

### F4 — `tests/setupPolicy.ts`: two mechanical repairs

- `PolicyControl.family?: boolean` (`:48`, consumed near `:930`) is derivable: every family
  control carries `rule: 'skill'` and no other control does. Delete the field and branch on
  `control.rule === 'skill'`. Breaks Derive state otherwise.
- The scalar pattern `([^']+)` (`:807-811` region) makes an apostrophe inexpressible in any
  metadata value. Extend the three value patterns to accept YAML's escaped apostrophe (`''`)
  inside single-quoted scalars — `(?:[^']|'')+` — leaving everything else exact. Add one
  in-population fixture control proving a value containing `''` passes, alongside the existing
  malformed-YAML control which must still fail. Update `tests/policy.test.ts` only as the new
  control requires.

### F5 — `.claude/rules/documentation.md`: state the shape the gate enforces

The gate enforces a canonical four-line serialization that no rule states — an undocumented
byte-shape promoted to fleet law. Beside the "Validate every referenced resource and
`agents/openai.yaml`" clause, state the canonical shape in two or three lines: one root
`interface` mapping; `display_name`, `short_description`, `default_prompt` in that order,
two-space indent, single-quoted non-empty scalars (`''` for an apostrophe); `default_prompt`
names its skill's `$<directory>` token. Match the file's existing voice: terse directives, no
rationale.

## Unknowns

- Whether `frontend-design.md` carries voice defects beyond the anchors. Sweep and fix; list each
  additional recast in your report.
- Whether the anti-pattern bullets carry anything unowned. Your call; record it.

## Scope

Owned files:

- `.agents/skills/enterprise-bootstrap/references/frontend-design.md`
- `.agents/skills/enterprise-bootstrap/SKILL.md`
- `.agents/skills/orkestrel-human-journey/references/captures.md`
- `tests/setupPolicy.ts`
- `tests/policy.test.ts`
- `.claude/rules/documentation.md`

Read anything. Write nothing else. Validation: `npm run test:policy` is yours; also run
`npx oxfmt --config .oxfmtrc.json --check <owned markdown paths>` at the end. No `format`,
no `lint --fix`, no `build`, no tree-wide suite.

## Execution

Perform this assignment directly. Spawn nothing.

Windows constraint for every shell command: no heredocs, no `node -e`, no `node -p`, no `&&`
chaining, no `${...}` in arguments. Multi-step shell work goes into a script file invoked as one
plain command; prefer your file tools.

## Constraints

- Non-negotiables bind. No content loss: every threshold, check, and steering decision present at
  `f9a70eb` survives your pass.
- One home per rule; a second statement becomes a pointer.
- The `test:policy` count may grow (new control) and must end green. If your F4 edit changes any
  count, record before and after.

## Output

1. Per-finding: closed or not, with the decisive lines.
2. The additional `frontend-design.md` recasts beyond the anchors.
3. `test:policy` counts before and after, green.
4. The oxfmt check result.
5. The exact `git diff --stat`.

## Deviation contract

Stop and report if closing a finding would change what any file instructs rather than how it says
it, or if F4's pattern change breaks a control in a way the brief did not predict. Ancillary
calls are yours: decide, record, continue.

## Acceptance criteria

- Zero aphorisms, metaphors, personification, persuasion, or explainer clauses in
  `frontend-design.md` at HEAD, by `AGENTS.md` **Writing** definitions, with all design content
  preserved.
- The four F2 repairs and F3 landed as specified.
- `PolicyControl.family` gone; `test:policy` green; the `''` control passes in-population.
- `documentation.md` states the shape in its own voice.
- `git status` shows exactly the six owned files modified.

## Review evidence

Your report plus the diff. Sol audits the diff; the verifier runs the tree-wide gates after.
