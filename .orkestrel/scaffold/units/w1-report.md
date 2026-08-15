# W1 — returned report (verbatim)

Unit W1 complete. All five owned files written; nothing else touched.

## Per-file changes

**`.agents\skills\orkestrel-human-journey\SKILL.md`** — 22 line-level fixes:

- copied laws replaced with pointers: **5** — the browser-setup-module and helper-reuse law and the `integration.test.ts` scope law and the internal-state assertion law all now point at `.claude/rules/tests.md`; the mock ban points at `AGENTS.md`; "run by someone who did not write the journeys" points at `.agents/orchestration.md`.
- aphorisms and slogan headings removed: **4** — the standalone opener at `:8`, `## The doctrine` (now `## Apply the journey laws`), "A refusal is a proof." plus its explainer, "A test that accepts either voice proves neither."
- explainer clauses cut or recast as refusals: **9** — synthetic-event why, "so keyboard reachability is proven", polling race, destructive-focus dialog paragraph, "so a reader sees it is not a journey", "so every screenshot shows a state a person can actually get to", "not a harness problem", platform-computes-roles restatement, "This skill only generates it."
- non-directive statements recast as directives: **4** — journey laws 4, 5, 6 leads and the `captures.md` reference framing.

**`.agents\skills\orkestrel-human-journey\references\layer.md`** — 17 fixes:

- aphorism removed: **1** ("The layer is the only door a journey has.").
- explainer clauses cut or subordinated: **12**.
- duplicate rules deleted (each has a home in `SKILL.md`): **2** — typing-vs-filling choice, "A journey asserts the one it means."
- non-directive framing recast: **3** — the signatures paragraph, the Role-vocabulary lead, the capture-hook lead.
- event-factory boundary stated explicitly: **1** (see below).

**`.agents\skills\orkestrel-human-journey\references\captures.md`** — 11 fixes: non-directive opener recast (1), explainer clauses cut or recast as refusals (8), definitions recast as directives (2: the variant definition, the transient-state lead).

**`.claude\skills\orkestrel-human-journey\SKILL.md`** — 2 fixes: `description` now byte-identical to the canonical frontmatter (`cmp` of line 3, exit 0, 655 bytes each); body aligned to the falsify bridge — `diff` of both bridges with line 3 removed and the skill name normalized returns **exit 0**, so the bridge is byte-identical modulo name and description.

**`.agents\skills\orkestrel-human-journey\agents\openai.yaml`** — created. Key structure diffed against `orkestrel-falsify/agents/openai.yaml` with all quoted values normalized: exit 0. LF endings, no tabs, values contain no apostrophe or colon, so the single-quoted scalars are plain. No YAML parser is installed in this checkout (`node_modules/.bin` has none), so parse conformance is structural, not executed.

## Judgment calls on the flagged restatements

1. **`SKILL.md:49` layer placement.** Kept: the journey layer *is* browser test infrastructure, it lives in the browser setup module, a journey helper is added only where `@orkestrel/test` publishes none, and never declare a resolver inside a test file. Pointed: the shared-infrastructure law itself (export-everything, no local fixture factories).
2. **`SKILL.md:32` internal state.** Kept: a state read may only corroborate a perception assertion, never replace it — that permission is journey-specific and `tests.md:217` does not grant it. Pointed: which state a test may read at all.
3. **`SKILL.md:65` placement.** Kept: journeys go in the browser environment's `integration.test.ts`. Pointed: the reserved-filename and directory-scope law.
4. **`SKILL.md:103` mock law.** Kept: the three store behaviours a transport family configures (stalls a read, fails a fixed number of reads, fails a write) as an inert configurable implementation of the published interface. Pointed: the ban itself.
5. **`SKILL.md:129`.** Nothing journey-specific remained, so it became a pointer with no residue.
6. **`SKILL.md:8`** was deleted rather than recast: journey law 1 already carries it, and recasting would have created a second home for one rule.
7. **`layer.md` typing-vs-filling bullet** deleted as a duplicate of `SKILL.md`'s; the verb table still fixes both contracts.
8. **Rationale deliberately retained, subordinate,** in five places where it decides a judgment call: `layer.md` tab/panel name collision, node replacement between resolution and focus arrival, clip-based hiding leaving text in `innerText`; `captures.md` why a count is not set equality, why a split variant selector can name an unrendered combination.

## The `tests.md:214` question — composed, not a conflict

The two laws compose. `layer.md` → *What it drives* now reads:

> Never dispatch a constructed event from the layer or from a journey. The centralized event factories `.claude/rules/tests.md` prescribes serve unit tests whose subject is the handler; a journey drives input through the provider verbs only.

`SKILL.md` carries the short form and points here.

## Intended but never stated (reported, not written in)

1. **`captures.md` names "the capture flag" and "one variant value" but never says who defines them.** No env var name, no CLI shape, no owner. An implementer must invent both. The reference reads as if a name was cut.
2. **`SKILL.md` never says where the transport family's declared block lives.** "Their own declared block, never inside a journey" fixes the separation but not the file; whether it shares the browser `integration.test.ts` is left open.
3. **`captures.md` never states who repeats the run once per variant** — a script, a gate, or the operator. The registry-times-variants proof depends on that repetition happening, and nothing prescribes it.

## Two facts that differed from the brief

- **Baseline.** `HEAD` was `bba41aa` ("Merge branch 'main'"), not `37210f3`; `37210f3` is its parent and an ancestor. Tree was clean at start. The merge carried only `.orkestrel/supervisor/REDESIGN.md` (+288/-4), another session's artifact.
- **Out of scope, observed:** `.claude/skills/orkestrel-polish-surface/SKILL.md`'s `description` had the same drift from its canonical that this unit fixed for human-journey. Not touched by W1; synced by the Orchestrator at `623e254`.

## Diffstat

```
 .agents/skills/orkestrel-human-journey/SKILL.md    | 90 ++++++++++------------
 .../orkestrel-human-journey/references/captures.md | 51 ++++++------
 .../orkestrel-human-journey/references/layer.md    | 83 ++++++++++----------
 .claude/skills/orkestrel-human-journey/SKILL.md    |  8 +-
 4 files changed, 109 insertions(+), 123 deletions(-)
```

Plus the created `agents/openai.yaml` (4 lines).

Landed in scaffold as `e21da11`.
