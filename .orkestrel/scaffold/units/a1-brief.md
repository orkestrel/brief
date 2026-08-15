# A1 — Audit round: the skill-propagation campaign, `37210f3..f9a70eb`

## Your lane

The dispatch that carries this brief names your lane. Subjective (`reviewer`, Opus 5): design
fit, voice, vocabulary, structure, what the rewrites did to the skills' usability as executed
instructions. Objective (`analyst`, GPT-5.6 Sol): correctness, constraints, what the code and
contracts actually permit. Mechanical (`checker`): letter-of-the-law conformance and scope
honesty. Argue your lane; do not impersonate the others. You are blind to the other lanes.

## Subject

Repository `C:\Users\mikes\WebstormProjects\scaffold`, commits `37210f3..f9a70eb` (HEAD). The
campaign rewrote two skills for instruction-file conformance, added a missing `agents/openai.yaml`,
synced two provider bridges, recast four aphorisms in `frontend-design.md`, and added a
skill-family gate to the vendored policy suite. All of it vendors to every fleet target through
`dist/host` on the next release.

## Evidence supplied (read-only lanes cannot run git; use these files)

Under `tmp/audit/`:

- `campaign.patch` — the full diff over `.agents/skills`, `.claude/skills`, `tests`.
- `full-stat.txt` — the whole-tree diffstat for the range, including non-campaign carriage.
- `commits.txt` — the commit sequence.
- `status.txt` — `git status --short` at HEAD (expected: empty).
- `baseline/` — complete pre-campaign copies of every skill file the campaign touched.
- `w3-red-proof-output.txt` — the executed three-step red proof of the new gate.

The current files are on disk; read them directly. The governing law: `AGENTS.md` (**Writing**,
**Instruction files**), `.claude/rules/documentation.md` (**Workflow skills**),
`.claude/rules/tests.md`, `.claude/rules/quality.md`.

## Claims — return a per-claim verdict with evidence

Verdicts: CONFIRMED (claim holds, show why), BROKEN (claim fails, show the exact line or run),
UNRESOLVED (evidence conflicts), NOT-EVIDENCED (nothing supplied or on disk can decide it). Quote
`file:line` for every citation. A claim about the diff cites the patch; a claim about the result
cites the file at HEAD.

1. **Nothing lost.** Every step, check, refusal, and numeric threshold present in the baseline
   copies of the two skills survives at HEAD — verbatim, recast, relocated to the reference that
   owns its subject, or replaced by a pointer to the rule file that owns the law. Sweep the
   baselines against HEAD; name anything that vanished without a surviving home.
2. **Voice conformance.** The changed instruction files at HEAD contain zero aphorisms, slogan
   headings, persuasion or reassurance clauses, human-explainer clauses, and probe-history
   narration, by the definitions in `AGENTS.md` **Writing**. Sweep the files at HEAD, not only
   the diff hunks.
3. **One home per rule.** No changed line states a law whose home is `AGENTS.md`, a
   `.claude/rules/` file, or `.agents/orchestration.md`; where such a law is needed it is a
   pointer. A retained skill-specific addition beside a pointer is conforming.
4. **Bridge parity.** `.claude/skills/orkestrel-human-journey/SKILL.md` and
   `.claude/skills/orkestrel-polish-surface/SKILL.md` each carry a frontmatter `description`
   byte-identical to their canonical skill's, and the human-journey bridge body matches the
   falsify bridge shape modulo skill name.
5. **Family metadata.** `.agents/skills/orkestrel-human-journey/agents/openai.yaml` satisfies the
   family invariant: one root `interface` mapping; non-empty `display_name`,
   `short_description`, `default_prompt`; the literal token `$orkestrel-human-journey` in the
   prompt.
6. **Gate correctness.** In `tests/setupPolicy.ts` and `tests/policy.test.ts` at HEAD: the family
   is discovered from `.agents/skills`, never hardcoded as a roster; the validation enforces
   exactly the invariant in claim 5 plus exact-case `SKILL.md` and one-level reference
   resolution; the negative control lies outside the membership rule; no import beyond `node:fs`,
   `node:os`, `node:path`, `typescript`; `tmp/audit/w3-red-proof-output.txt` shows exactly one
   failing test at step 2, naming the yaml path, with 54 others green.
7. **Gate soundness.** No conforming state fails: the proof shows 55 green on the real tree at
   steps 1 and 3, and no assertion in the new code can reject a legitimate skill that has zero
   references or a long description.
8. **Orchestrator edits hold.** The polish-surface description sync and the four
   `frontend-design.md` recasts (see `campaign.patch`) preserve every steering instruction their
   originals carried and introduce no new voice defects.
9. **Scope honesty.** The range's whole-tree footprint (`full-stat.txt`) contains only: the two
   skills, the two bridges, the two test files, and `.orkestrel/supervisor/REDESIGN.md` — the
   last carried by a merge of another session's push, not campaign work. Nothing else moved.

## Execution

Perform this audit directly. Spawn nothing. Read-only: you edit nothing, and lanes without a
shell run nothing — where a claim would need a command you cannot run, rule NOT-EVIDENCED and say
what command would decide it.

## Output

Per-claim: number, verdict, evidence. Then at most five findings outside the claims, each with
`file:line` and the law it breaks — a finding you cannot anchor to a line is not a finding. End
with exactly one line: `VERDICT: <n> CONFIRMED, <n> BROKEN, <n> UNRESOLVED, <n> NOT-EVIDENCED`.
No process diary.
