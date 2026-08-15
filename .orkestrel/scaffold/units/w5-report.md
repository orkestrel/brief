# W5 — returned report (verbatim, condensed to substance)

All eleven items closed. Four files touched; `tests/policy.test.ts` needed no change (the
`SKILL_POLICY_CONTROLS` parameterized loop drives the new control).

## Per-item

1. `frontend-design.md:35` → "Before adding a device, check that it encodes something the reader
   needs."
2. `:104` → "Keep a word only where it makes the design easier to understand, and therefore
   easier to use."
3. `:63` → "All three are legitimate for some briefs; they are defaults rather than choices, and
   they appear regardless of subject."
4. `:52` → "…never spend the aesthetic risk on the table itself, which adds scan time for every
   user on every visit." (spend clause untouched)
5. Hero `:22` → "Open a web design's hero with the subject's thesis — the one claim the page
   makes — carried by the most characteristic thing in the subject's world…" `thesis` is back in
   the paragraph `SKILL.md` routes to.
6. Restraint `:93` → "…cut any decoration that does not serve the brief — decorative emoji as UI,
   pill soup, glow effects, and gradient-on-everything are the usual instances of decoration with
   no reason in the subject."
7. `SKILL.md:75` → "Settle every claim about a screen from a capture, never from source alone;
   `.agents/orchestration.md` owns this law where it is present." `:81` same shape for the
   instrument law and `.claude/rules/quality.md`. Both steer standalone in a foreign install.
8. `:72` → "Brainstorm privately; show a direction only once it satisfies the brief and the
   quality floor (frontend-design.md → Process)."
9. `:23-27` → routing clause added to the hand-roll ladder in `bootstrap-reference.md` → "When
   not to hand-roll".
10. `documentation.md:68` → "Validate every referenced resource; do not leave template TODOs or
    auxiliary README/changelog files." The three yaml bullets beneath carry the contract.
11. New exported `matchesSkillToken(prompt, name)`: the `$name` match must end at end-of-string
    or at a character outside `[a-z-]`. `inspectSkill` uses it; new in-population control writes
    `createSkillMetadata('samplex')` into skill `sample`.

## Red-then-green for item 11

Control added, old substring match in place: `1 failed | 56 passed (57)` — "expected [] to have a
length of 1 but got +0". Fix applied: `57 passed (57)`.

## Validation

`test:policy` 57 green (real-workspace assertions stay green under the stricter token rule);
`tsc --noEmit` clean; oxfmt clean on the four owned files; oxlint no diagnostics. Diff: 4 files,
+75/−35. Exactly the four owned files modified. Spend vocabulary and routing derivation untouched.

## Ancillary calls

(a) The specimens are an inline named enumeration in the restraint sentence, keeping the
section's prose shape. (b) Four edited paragraphs rewrapped to the ~100-column convention.

## Noticed, not fixed

`SKILL.md:78` names the `orkestrel-polish-surface` skill — already ruled non-defect in A2: a
skill name resolves through the harness's skill mechanism; it was bare file paths that broke the
portability promise.

Landed in scaffold as `8f1cd49`.
