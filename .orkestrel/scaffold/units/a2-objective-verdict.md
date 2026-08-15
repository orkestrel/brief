1. **BROKEN — Voice closed.** Financial metaphors remain: “spend the aesthetic risk” and “taxes every user” at `.agents/skills/enterprise-bootstrap/references/frontend-design.md:51`, plus “spend that freedom” at `:65` and “Spend the boldness” at `:91`. Recast these as direct design rules.

2. **CONFIRMED — Nothing lost in the recast.** Subject grounding, design principles, process thresholds, restraint, and copy rules survive at `frontend-design.md:13`, `:22`, `:59`, `:69`, `:91`, and `:103`. The removed glyph-consistency instruction remains with its owner at `.agents/skills/enterprise-bootstrap/SKILL.md:82`.

3. **CONFIRMED — The two pointers are sound.** Rendered proof retains its viewport, theme, accessibility, and source-corroboration requirements at `SKILL.md:72`; the owning law is at `.agents/orchestration.md:419` and `:750`. Mechanical proof retains all three instruments at `SKILL.md:77`, while `.claude/rules/quality.md:59` owns their control requirements.

4. **CONFIRMED — The anti-pattern deletion is covered.** Unjustified decoration is prohibited at `frontend-design.md:91` and generic defaults are challenged at `SKILL.md:66`. Native/library/hand-roll ordering and faux-widget cases appear at `bootstrap-reference.md:574` and `components.md:978`.

5. **BROKEN — The gate edits are not behavior-preserving for every former `rule === 'skill'` input.** The old optional `family` field and branch are visible at `tmp/audit/a2-diff.patch:282` and `:355`. A formerly valid control with `rule: 'skill'` and no `family` routed through `inspectPolicyWorkspace`; it now routes through `inspectSkillFamily` at `tests/setupPolicy.ts:942`. The apostrophe patterns themselves passed direct attacks, the new control is in-population at `tests/setupPolicy.ts:1233`, and `npm run test:policy` passed 56/56. Narrow the compatibility claim to the migrated controls or explicitly document the routing change.

6. **BROKEN — The documented shape exceeds enforcement.** Documentation requires the skill’s own `$<directory>` token at `.claude/rules/documentation.md:71`, but enforcement uses substring matching at `tests/setupPolicy.ts:876`. For skill `sample`, `default_prompt: 'Use $samplex for this fixture.'` passes while omitting the `$sample` token. Require a complete invocation token rather than a prefix match.

7. **CONFIRMED — Scope.** `tmp/audit/a2-stat.txt:1` through `:6` list exactly six files; `git diff --name-only f9a70eb..d454292` also returned six. `tmp/audit/a2-status.txt` is zero bytes.

VERDICT: 4 CONFIRMED, 3 BROKEN, 0 UNRESOLVED, 0 NOT-EVIDENCED