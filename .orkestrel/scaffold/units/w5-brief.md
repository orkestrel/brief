# W5 — Final fix round: A2's reconciled residuals, enumerated and closed

## Role and engine

`implementer`, Claude Opus 5. Sole writer. This is the third and final repair round on this
surface: close exactly this list, nothing besides.

## Context

Repository: `C:\Users\mikes\WebstormProjects\scaffold`. Baseline `d454292`, tree clean — confirm
before editing. Voice law: `AGENTS.md` **Writing**. Two rulings already taken, binding on you:
the spend/budget vocabulary ("spend the boldness", "spend that freedom", "spend the aesthetic
risk") is load-bearing mechanism and stays; the skill-rule routing derivation in
`tests/setupPolicy.ts` is intended and stays.

## The list

In `.agents/skills/enterprise-bootstrap/references/frontend-design.md`:

1. `:35` "Check that a device earns its place before adding it." → plain: check that the device
   encodes something the reader needs before adding it (or equivalent non-personified form).
2. `:103` "Make every word earn its place by making the design easier to understand" → plain
   directive without the idiom.
3. `:63` "Each is legitimate for some brief, but each is a default rather than a choice, and each
   appears regardless of subject." → the baseline's plain plural: all three are legitimate for
   some briefs; they are defaults rather than choices; they appear regardless of subject.
4. `:52` "which taxes every user on every visit" → the concrete cost: it adds scan time for every
   user on every visit.
5. Hero paragraph (`:22-25`): restore the deleted term of art in imperative voice — open the hero
   with the subject's claim; `SKILL.md:52` ("thesis-hero") and `:60` ("hero and thesis") still
   route readers here for that definition, so the word `thesis` must reappear in this paragraph.
6. Restraint paragraph (`:91-99`): carry the four deleted anti-pattern specimens as a named list —
   decorative emoji as UI, pill soup, glow effects, gradient-on-everything — as instances of
   decoration with no subject reason.

In `.agents/skills/enterprise-bootstrap/SKILL.md`:

7. `:72-75` and `:77-78`: keep the pointers but make each sentence steer standalone, because the
   package promises portability ("the paths are tooling-specific, the content is not") and the
   named files do not exist in a foreign install. Shape: state the rule in one clause, then cite
   the law as its owner — "Settle every claim about a screen from a capture, never from source
   alone; `.agents/orchestration.md` owns this law where it is present." Same shape for the
   instrument pointer to `.claude/rules/quality.md`.
8. `:70` "Brainstorm privately; show only the higher-confidence directions." → align with the
   concrete gate the recast installed: show a direction only once it satisfies the brief and the
   quality floor (point or restate in one clause; `frontend-design.md:86-87` is the owner).
9. Add one routing clause to `bootstrap-reference.md`'s hand-roll ladder (the "When Not to
   Hand-Roll" section) — the operate layer currently has no route to it. One sentence where
   component choice is discussed.

In `.claude/rules/documentation.md`:

10. `:68`: the clause "and `agents/openai.yaml`" now vaguely duplicates the three exact bullets
    beneath it. Trim `:68` to the referenced-resource rule it uniquely owns; the bullets carry
    the yaml contract.

In `tests/setupPolicy.ts` (+ `tests/policy.test.ts` as the control requires):

11. `:876` `prompt.includes('$' + name)` is a substring match: for skill `sample`, the prompt
    `'Use $samplex for this fixture.'` passes while omitting the `$sample` token. Require a
    complete token: the name followed by end-of-string or a character that cannot continue a
    skill directory name (directory names use lowercase letters and hyphens). Add one
    in-population control with a prefix-extended token that must report exactly one violation.
    Red proof: run the new control against the OLD match first (it wrongly passes → the control's
    test fails), then apply the fix and show it green. Record both runs.

## Scope

Owned: the four files above. Read anything; write nothing else. Validation:
`npm run test:policy`, `npx tsc --noEmit --project tsconfig.json`, and
`npx oxfmt --config .oxfmtrc.json --check` on the owned files. No tree-wide mutations.

## Execution

Directly; spawn nothing. Windows: no heredocs, `node -e`, `node -p`, `&&`, or `${...}` in shell
arguments; use file tools and single plain commands.

## Output

1. Per-item: closed, with the decisive line.
2. The red-then-green transcript for item 11.
3. Final `test:policy` count, tsc, oxfmt results.
4. `git diff --stat`.

## Deviation contract

An item that cannot close without changing what a file instructs: stop and report. Ancillary
wording calls are yours. Do not fix anything not on the list; report anything you notice instead.

## Acceptance criteria

- All eleven items closed as specified; `git status` shows exactly the four owned files.
- `test:policy` green with the new control; tsc clean; oxfmt clean.
- The spend vocabulary and the routing derivation are untouched.
