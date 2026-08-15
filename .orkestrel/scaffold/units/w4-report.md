# W4 — returned report (verbatim, trimmed of file-path footer)

W4 complete. All six findings closed; six owned files modified, nothing else touched.

## Per-finding

**F1 — `frontend-design.md` full voice pass: CLOSED.** Recast whole file, paragraph-for-paragraph
(section and paragraph boundaries preserved so content mapping is auditable). Every anchor closed;
`grep` for all nine phrases plus "less is more" and "delivery vehicle" returns exit 1.

**F2 — `SKILL.md`: CLOSED (all five).** Margin metaphor gone ("the stock fills sit at the 4.5:1
bar with nothing to spare. Re-measure a solid variant whenever anything layers over it"); rendered
proof and mechanical proof now point at `.agents/orchestration.md` and `.claude/rules/quality.md`
with skill-specific content kept verbatim; anti-patterns section deleted after verifying both
bullets fully owned (`bootstrap-reference.md` hand-roll ladder + `components.md` Choosing table;
`frontend-design.md` restraint + `SKILL.md:66`); persona labels "Design lead"/"Bootstrap engineer"
→ "Design direction"/"Bootstrap execution".

**F3 — `captures.md` Hygiene: CLOSED.** Hygiene bullet ends at "Keep the portfolio out of version
control"; the matrix bullet absorbed "from the journeys".

**F4 — `tests/setupPolicy.ts`: CLOSED (both).** `PolicyControl.family` deleted, verified derivable
first; branch on `control.rule === 'skill'`. Value patterns now `'((?:[^']|'')+)'`; `'a''` (odd
quote) still fails.

**F5 — `.claude/rules/documentation.md`: CLOSED.** Three bullets under the validation clause: the
root `interface:` mapping with the three keys in order and two-space indent; non-empty
single-quoted scalars with `''` for an apostrophe; the `$<directory>` token in `default_prompt`.

## Additional `frontend-design.md` recasts beyond the anchors

Nine further recasts recorded (hero-thesis, typography "delivery vehicle", "less is more",
frame-definitional, screenshot rationale, word-earns-place opener, "More on" heading, copy-yourself
directive), plus prose hard-wrapped at 100 columns.

## `test:policy` counts

| Stage                                               | Result                                                       |
| --------------------------------------------------- | ------------------------------------------------------------ |
| Baseline `f9a70eb`                                  | 55 passed (55)                                               |
| After `family` removal only                         | 55 passed (55)                                               |
| **Failing proof** — new control, patterns unchanged | **1 failed \| 55 passed (56)** at `tests/policy.test.ts:319` |
| After the pattern fix                               | 56 passed (56)                                               |
| Final (all six files)                               | **56 passed (56)**                                           |

Malformed-YAML control still reports exactly one violation. `npx tsc --noEmit` clean. oxfmt:
"All matched files use the correct format." (6 files.) Diff: 6 files, +157/−72.

## Ancillary calls (recorded)

1. **Pre-existing `format:check` breakage fixed.** `tests/setupPolicy.ts` failed `oxfmt --check`
   at baseline `f9a70eb` — proved against `git show HEAD:` in a scratchpad. The file was owned
   this round, so oxfmt's exact output was applied. No behavior change.
2. **`parseSkillPrompt` does not decode `''`.** The returned scalar carries the escape; harmless
   for the only consumer (token containment; a directory name cannot contain an apostrophe).
   Flagged for a ruling. _Orchestrator ruling: leave as-is; recorded._
3. New exports `SKILL_APOSTROPHE_METADATA`, `SKILL_POLICY_APOSTROPHE` beside their siblings.

## Observations outside scope (for the next change)

- **Portability of the two new pointers**: `enterprise-bootstrap` claims portability ("Assume no
  stack") and now names `.agents/orchestration.md` and `.claude/rules/quality.md`, which do not
  exist in a foreign install. Each sentence carries its own trigger and action so the directive
  stands where the path does not resolve.
- **`SKILL.md` ↔ `frontend-design.md`** still duplicate the subject-grounding and three-look
  calibration nearly clause for clause (`SKILL.md:64,66`).
- **`PolicyControl` TSDoc** says "One physical negative control" while the type has carried
  positive controls since before this unit.

Landed in scaffold as `d454292`.
