# `@orkestrel/scaffold` — canon delta from the `@orkestrel/brief` hardening campaign

Fifteen refinements to the vendored instruction set, reconciled from two blind audit lanes
(Opus 5 subjective, GPT-5.6 Sol objective) run on one identical brief. Convergent findings are
marked; divergences carry the ruling and its reason.

Every target file below is vendored by `scaffold`, so none of this can land in a consumer
checkout. Apply in `scaffold`'s host inventory, then propagate.

Campaign record: `brief` commits `1abfc6d`..`8d2739b`. Three adversarial rounds, 62 findings
reported, 41 confirmed after independent refutation.

---

## A. Contradictions — two laws, one subject

### A1. `.agents/orchestration.md` gives opposite orders about brief and report files

**Both lanes, independently.** `:369-370` says "Treat brief and report files as unit evidence,
not deliverables. Never commit them, and sweep them when the campaign that produced them is
accepted." `:577-580` says "The **brief**, the returned **distillate**, the **audit verdict**,
and the **acceptance evidence** are not streams. Commit each one as its unit is dispatched and
as it returns, because each encodes knowledge that costs real money to re-derive."

The campaign obeyed `:369`. The consequence landed on this debrief: `orkestrel-debrief`
requires "The campaign record is the primary source… Quote verbatim — a paraphrase cannot be
re-verified later", and the originals were gone. Both lanes reported independently that no
unit brief/report pair survives anywhere in the tree, so no unit can be re-run from its own
recorded brief. The debrief had to be handed a prose summary of its own subject.

**Edit.** Give the rule one owner. Reduce `:369` to a pointer at the **Bench laws** retention
rule, and make that rule read:

> Treat the `tmp/` brief and report pair as ephemeral launch copies. Never commit a journal or
> a stream. Before sweeping, copy each unit's brief, its returned distillate, every audit
> verdict, and the acceptance evidence into `.orkestrel/<package>/` and commit them. A debrief
> has no primary source otherwise.

### A2. `orkestrel-falsify` makes lanes read-only and assigns them probe writes

**Objective lane.** `SKILL.md:90` "Read-only lenses still write probes" contradicts `:100`
"Auditors are read-only" and `.agents/orchestration.md:465` "A read-only role cannot write a
report file, cannot write a probe".

This is the campaign's most-repeated dispatch defect: it fired in round 1 (an analyst brief
told a read-only sandbox to write a probe file) and again in the debrief itself (a `reviewer`
whose allowlist is `Read, Grep, Glob` was told to run `git log` and `git show`, and reported
the resulting blind spot as a dispatch defect against the contract's own pre-dispatch check).
A law stated once in the contract and contradicted in the skill is a law nobody follows.

**Edit.** Replace `SKILL.md:78`:

> Give every behavioural lane executed evidence. When a lane is read-only, the Orchestrator
> owns each probe file and command, records its control and its output, and supplies that
> record to the lane. Never assign a probe path, a write step, or a command to a lane whose
> allowlist cannot run it.

---

## B. Laws the campaign proved and the canon does not carry

### B1. Never narrow past a foreign contract — `.claude/rules/patterns.md`

**Objective lane. The campaign's central lesson, and the only finding that is a CODE rule.**

Three consecutive rounds found defects at one seam, and every one was the same mistake in a new
place: treating a caller-supplied engine as an attacker and validating or transforming its
values more narrowly than its published contract allows.

- An exact-record guard over `LogicalResult` refused a conforming richer result and failed the
  gate closed on a valid engine.
- A plain-record check refused a conforming class instance.
- A JSON clone applied to `Entity.value` — declared `unknown` — turned a correct refusal into
  an emitted contract. That one was a FAIL-OPEN: the package emitted a brief for a request it
  had correctly determined was under-specified.

**Edit.** Add one law to `patterns.md`, in **Validation and contracts**:

> When you validate or take ownership of a value from a foreign interface, enforce only its
> published contract. Accept unknown members, accept any implementation the interface admits
> including a class instance, and follow the published member types exactly. An exact guard or
> a narrowing transform over a foreign contract refuses values that contract permits, and it
> fails closed on a valid implementation — a wrong refusal in place of a loud crash, which is
> worse.

### B2. A type-invalid vector refutes the vector, not the finding — `.claude/rules/quality.md`

**Both lanes.** Two audit findings named reproduction vectors that do not compile under
`exactOptionalPropertyTypes`. The defects were real; the stated reproductions were not.
`quality.md` covers a weaker vector and a wrong cause behind a real symptom, and covers neither
this case nor the reverse risk — `orkestrel-falsify/references/reconcile.md` lists "the finding
evaporates" with no guard against evaporating a true finding on an invalid vector.

**Edit.** Insert after the weaker-vector law:

> A reported vector the compiler rejects refutes the VECTOR, never the finding. Where a claim
> asserts reachability through a typed API, compile the exact vector under the project's own
> settings; re-derive one the types admit before dropping the finding, and record which vector
> was actually tested.

### B3. Name the rival reading an instrument must exclude — `.claude/rules/quality.md`

**Both lanes.** An instrument used one shared counter to measure per-member read counts, so it
measured read ORDER instead. It passed while measuring the wrong variable, and it satisfied
every existing instrument law: it could fail, and it looked matched to the question.

**Edit.** Insert after "Match the instrument to the question":

> Name the rival reading the instrument must exclude, and show it reports differently under
> that reading. Give independent measurements independent state — one counter shared across
> members reports read order and per-member read count identically, so a result consistent with
> both measured neither.

### B4. A red proof must redden exactly the test that names the defect — `.claude/rules/tests.md`

**Both lanes.** The existing law requires a failing count before and a passing count after. A
red-proof script reverted code to reference an import the same change had removed, producing 36
false failures that briefly read as a signal. A count cannot distinguish that from a real red.

The campaign's own closing standard is the correct one and is in no rule.

**Edit.** Append to the regression-test law:

> The revert that proves a repair reddens exactly the test that names the defect. Keep the
> import and collection graph valid while reverting, and confirm the named test was collected.
> A revert that reddens anything beyond that test broke the harness, and its count is not
> evidence.

### B5. Windows Git Bash: the approval classifier — `.agents/orchestration.md`

**Both lanes.** The Orchestrator repeatedly tripped the Windows approval classifier with
heredocs, `node -e`, `node -p`, and `&&` chaining, costing the operator manual approvals across
the whole campaign. Both lanes swept the instruction set and found no clause anywhere. It was
eventually written into the operator's private per-project memory, which propagates to nothing.

The contract already has the right law — "Write a multi-step chain to a script file and run the
file" — with no trigger attached, so nothing tells a mid-task agent when it fires.

**Edit.** Append to that law:

> On a Windows host this is mandatory for every multi-step or program-carrying command.
> Heredocs, `node -e`, `node -p`, and `&&` chaining trip the Git Bash approval classifier, which
> turns an unattended run into a manual approval prompt for the operator.

### B6. The seam round count needs a home — `.claude/rules/quality.md`

**Subjective lane.** "Write the round count down when the seam opens, so it is a fact rather
than a feeling" names no file. The count survived this campaign only because it was written
into a commit message after the ruling — a record of the outcome, not a running count that
could have fired earlier.

**Edit.** Amend to: "Write the round count down in the capability/defect matrix row that owns
the seam, when the seam opens, so it is a fact rather than a feeling."

### B7. The parity gate must execute guide fences — `.claude/rules/tests.md` and `documentation.md`

**Subjective lane. Ruled against the objective lane, which held that
`documentation.md` already covers it.**

`documentation.md` does order the behaviour — "run the example and read what it returns" — but
names no location and no gate, so nothing reads it. `tests.md` fixes `tests/guides.test.ts` at
"documented-name-to-real-export", which is exactly the narrowing that let the defect ship:
strengthening a gate rule broke the guide's own headline example — the first code any consumer
copies — and every parity assertion stayed green.

The ruling favours the subjective lane because the campaign produced the counter-example: an
ordered behaviour with no home is not a gate. `brief` closed it in `b4e054a` by transcribing
the flagship fences into `tests/src/core/integration.test.ts`; the canon should name a home so
the next package does not rediscover this.

**Edit.** Widen the `tests/guides.test.ts` row to "Every documented API exists, every public API
is documented, and every executable guide fence returns what the guide says it returns", drop
the "documented-name-to-real-export" narrowing, and end the `documentation.md` clause with the
location that owns the proof.

---

## C. Roles

### C1. Name the Sol implementation bridge

**Both lanes.** `.agents/orchestration.md` admits the gap itself: "the Sol implementer is still
`codex` route `implementer`". So `codex.md` carries two jobs — the shared transport contract AND
the implementer route — while its sibling job (`analyst`) is reachable by name through a thin
reference-binding charter that pins only route and sandbox.

The contract's own law is "Reach every role by its own name. Do not rely on a remembered route."

**Edit.** Split the transport contract out; add a named Sol implementation bridge binding it by
reference exactly as `analyst.md` does, pinning only its route and its `workspace-write`
sandbox; replace the roster cell; delete the recorded gap. Mirror into `.codex/agents/` in the
same round.

### C2. A bridge cannot size a cap — strike it from the charters

**Subjective lane. Ruled against the objective lane, which held the existing law sufficient.**

"Size the cap from the observed high mark of comparable commands" is restated in three bridge
charters. A bridge driver starts with a clean context and holds no record of prior runs, so it
cannot read an observed high mark — it can only guess.

Observed: a bridge proposed 900s; the Orchestrator re-sized it to 1800s against a comparable run
that had taken ~897s end to end. 900s would have been a coin flip on a timeout, and a cap-killed
exec is indistinguishable from a real failure.

The ruling favours the subjective lane because the obligation was placed on the one party
structurally unable to satisfy it.

**Edit.** Strike the cap clause from all three bridge charters, leaving them to return the brief
path, the resolved command, and the journal path. Amend the contract's cap law to: "Size the cap
yourself from this campaign's observed high mark for comparable commands, plus an independently
budgeted gate allowance, plus explicit slack. A bridge has no record of prior runs and never owns
the cap."

### C3. Launch ownership has four homes

**Subjective lane.** The launch rule is stated in the contract and restated in three bridge
charters. `AGENTS.md` forbids exactly this: "Give a rule one home. Restating it elsewhere
creates two copies that drift, and an agent reading the stale one is following this file."

The drift landed: a bridge correctly declined to launch, and the Orchestrator had briefed it as
though it would. The role obeyed four copies; the brief writer obeyed none.

**Edit.** Reduce the launch clause in each bridge charter to one sentence pointing at the
contract's **Long-running commands → Launching** section, and keep the returned-items list in
one place only.

---

## D. Skills

### D1. The refuter is the campaign's highest-yield practice and appears in no skill

**Both lanes.** Each finder was paired with an independent refuter briefed to break that
finder's findings rather than the subject. It killed 21 of 62 findings before any of them cost
a fix unit. `orkestrel-falsify` knows only the two-lane blind pass; a grep for `refute` across
`.agents/` finds it only in `orkestrel-polish-surface`, describing a self-check.

**Edit.** One law in `orkestrel-falsify/SKILL.md` under **Run the round**:

> Where a round fans out over more than two slices, pair each finder with an independent refuter
> on the same slice, briefed to break the finder's findings rather than the subject. The refuter
> returns its own immutable verdict; the Orchestrator reconciles the pair. An unrefuted finding
> is a hypothesis.

### D2. Two lanes is the floor, not the shape

**Divergence, ruled.** The objective lane wanted `orkestrel-falsify`'s two-lane restatement
replaced by a pointer at the contract, which owns identical briefs, blindness, and
reconciliation. The subjective lane wanted the skill widened to sanction the fan-out the
campaign actually ran (7 seams, then 5 lenses).

**Ruling: both, in different files.** Shrink the restatement in the skill to a pointer — the
contract owns the pass. Put the fan-out clause in the contract beside its existing
frame-breaking law, which already sanctions "fan out independent lenses over disjoint slices in
one pass":

> Two lanes is the floor, not the shape. When a subject has more seams than two lanes can
> attack, fan out one lens per seam over disjoint slices, keep every lens blind and
> clean-contexted, and number every slice's claims in one shared sequence so the round stays
> comparable to its successor.

### D3. `ROADMAP.md` has four different statuses, and the debrief skill holds the strictest

**Subjective lane.** `orkestrel-debrief/SKILL.md` requires reading `ROADMAP.md` unqualified.
`AGENTS.md` and three sibling skills say "when present". `.agents/orchestration.md` says "Use
`ROADMAP.md` only where the repository already keeps one." `.claude/rules/documentation.md`
states it unconditionally as "the sequenced plan of record".

No `ROADMAP.md` exists in `brief`. This debrief was instructed to read a file that is not there,
and had nowhere sanctioned to route deferred work.

**Edit.** `orkestrel-debrief/SKILL.md` gains "when present"; `documentation.md` becomes "Where
the repository keeps one, `ROADMAP.md` is the sequenced plan of record."

---

## E. Prose — the instruction files break the writing law they publish

**Subjective lane.** `AGENTS.md` says: "Cut any clause written to persuade, reassure, or
explain the rule to a person"; "State the finding as the rule. Never record how it was found,
which session found it, what was tried first, or what a probe proved"; "Do not write
aphorisms".

Violations quoted verbatim by the lane, in the files the campaign loaded most:

- `.claude/rules/quality.md` — "This is a habit for your own work first, and a rule about
  disagreements second. Most unverified beliefs are never challenged by anyone — they are simply
  built on."
- `.claude/rules/quality.md` — the heading "Run it, don't argue it" is an aphorism.
- `orkestrel-falsify/references/brief.md` — "Every weak audit this process has produced was a
  weak brief read faithfully…"; "That last one is the highest-yield idea in this process."
- `orkestrel-falsify/references/reconcile.md` — "Every campaign that has run this process has
  produced at least one finding that was the instrument failing."; "Two shapes have already cost
  a round each", with its two historical bullets.

The lane measured the cost rather than asserting it: one audit lane's mandatory load exceeds
1,800 lines before it reaches the subject, and both of this campaign's process misses were
against laws already written — one of them written in four places.

**Edit.** Strike each quoted clause, keep the directive sentence beside it, retitle the
aphorism. This enforces an existing law rather than adding one.

---

## What both lanes looked for and did not find

Recorded so the next round knows what has been attacked.

- **No mechanically duplicate role.** Equal-frontmatter groups (`application`/`builder`,
  `analyst`/`codex`, `checker`/`scout`/`orkestrel`, `planner`/`reviewer`, `grok`/`verifier`)
  stay distinct through context binding.
- **No provider mirror hole.** `.claude/agents/` and `.codex/agents/` mirror cleanly; the only
  roster holes are C1 and D1.
- **No missing task-agent lane.** Every campaign work class had a named role with a pinned
  engine; none was absorbed by the Orchestrator for want of one.
- **No charter promising verification it has no tool for**, beyond C2, which is an input gap
  rather than a tool gap.
- **No shipped gap wrongly accepted as untestable.** The campaign's four documented limits
  (exact-path glob comparison, unvalidated `Citation.url`, default-engine `INTERPRET_FAILED`
  reachability, abbreviation handling) were each tested or bounded deliberately.
- **`spawn nothing` duplication is deliberate**, mandated by the contract because an executor
  deep in a task does not re-read it. Struck as a finding.
