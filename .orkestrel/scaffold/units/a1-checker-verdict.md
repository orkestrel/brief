# A1 — mechanical lane verdict (checker, verbatim)

## Per-claim verdicts

**1. Nothing lost — CONFIRMED**
Swept baselines against HEAD across `SKILL.md` (both skills), `layer.md`, `captures.md`, `frontend-design.md`. Every step/check/threshold in the baselines survives at HEAD, verbatim-recast in place or relocated to the owning reference: enterprise-bootstrap's baseline "Design principles"/"Writing" is already fully present in `references/frontend-design.md:13-25,47-59` pre-campaign and was simply de-duplicated out of `SKILL.md`; the removed "Component cheat sheet" content lives in `references/components.md:978`; the trimmed "States & feedback"/"Views & navigation" detail lives in `references/bootstrap-reference.md:521-552` and `references/components.md:1003`. The baseline's "Key takeaways" has no surviving line and none needed. Note: `components.md`, `utilities.md`, `bootstrap-reference.md` were spot-checked for relocation targets, not diffed hunk-by-hunk.

**2. Voice conformance — BROKEN**
`.agents/skills/enterprise-bootstrap/references/frontend-design.md:33` still reads: "Just like a hired human designer, there's a careful balance between doing what you're good at and taking each project as a chance to experiment and learn." Human-explainer/analogy clause under `AGENTS.md` **Writing**. Identical in the baseline — untouched by the campaign's four-aphorism recast, so missed rather than introduced. Re-dispatchable instruction: recast `frontend-design.md:33` as a directive.

**3. One home per rule — CONFIRMED**
Sampled recasts route to the owning file instead of restating (`orkestrel-human-journey/SKILL.md:96` vs baseline `:104`). No changed line in the sampled files states a law belonging to `AGENTS.md`/`.claude/rules/`/`.agents/orchestration.md` without a pointer.

**4. Bridge parity — CONFIRMED** — both bridge descriptions byte-identical to canonical; bodies share the shape modulo skill name.

**5. Family metadata — CONFIRMED** — `openai.yaml:1-4`: one root `interface` mapping, non-empty fields, literal `$orkestrel-human-journey` token.

**6. Gate correctness — CONFIRMED**
`tests/setupPolicy.ts:52,773-780` discovers from `.agents/skills` (`readSkillFamily`), no hardcoded roster. `:839-892` (`inspectSkill`) enforces exact-case files, the 4-line schema plus non-empty fields (`parseSkillPrompt:803-814`), the `$name` token, one-level reference resolution. `:1228-1234` (`SKILL_POLICY_EXCLUSION`) targets `.claude/skills/bridge/SKILL.md`, outside the membership rule. Imports exactly `node:fs`, `node:os`, `node:path`, `typescript`. Red proof shows exactly one failing test naming the yaml path, 54 passed.

**7. Gate soundness — CONFIRMED** — 55 green at steps 1 and 3; zero references loops zero times; no length assertion anywhere.

**8. Orchestrator edits hold — CONFIRMED** — description sync byte-for-byte; the four recasts preserve every steering instruction and introduce no new voice defect.

**9. Scope honesty — UNRESOLVED**
`full-stat.txt` matches the enumerated set; `status.txt` empty as expected; `commits.txt:6` places the merge in range — but no supplied evidence isolates `REDESIGN.md` to that commit. Decider: `git show bba41aa --stat`, which this read-only lane cannot run.

## Findings outside the claims

1. `frontend-design.md:33` — the sole outstanding defect for a fix round.

VERDICT: 7 CONFIRMED, 1 BROKEN, 1 UNRESOLVED, 0 NOT-EVIDENCED

---

_Orchestrator note: claim 9 settled CONFIRMED post-return — `git show bba41aa --stat` isolates `.orkestrel/supervisor/REDESIGN.md` (+288/−4) entirely to the merge, whose second parent is the other session's supervisor campaign._
