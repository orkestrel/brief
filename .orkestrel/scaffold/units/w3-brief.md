# W3 — The skill-family gate: no skill ships missing its files, here or in any target

## Role and engine

`sol`, GPT-5.6 Sol. Objective implementation lane: constraint-heavy, mechanical-precision unit.
Sole writer in the checkout for the duration of this unit.

## Objective

Extend the vendored policy instrument so `test:policy` fails whenever any skill under
`.agents/skills` lacks its required files or its metadata breaks the family invariant, prove it
red-then-green against the real defect it was designed from, and leave every gate green.

## Context

Repository: `C:\Users\mikes\WebstormProjects\scaffold`. Windows host, Git Bash. Node >= 22.12.
Baseline: the tree as W2 left it, committed and clean — confirm with `git status` before editing.

The defect class: `orkestrel-falsify` shipped without `agents/openai.yaml`; that was fixed by
adding the file; the next skill (`orkestrel-human-journey`) shipped without it again. The rule
exists (`.claude/rules/documentation.md:68` "Validate every referenced resource and
`agents/openai.yaml`") and nothing enforces it. By the time you run, a prior unit (W1) has added
the missing yaml, so the tree you start from should be conforming — the gate you build must prove
it WOULD have caught it.

Design inputs, already settled by an analysis round (accept them; do not re-derive):

- **Placement.** The assertion lives in `tests/policy.test.ts` with reusable traversal and
  validation in `tests/setupPolicy.ts`, under the existing `policy` project
  (`vite.config.ts:121-127`). No new project. Both files are vendored (`src/core/constants.ts:142-143`),
  so the gate travels with the subject (`.agents/skills`, `:128`) into every repaired target —
  which is the property that closes the class fleet-wide. `tests/guides.test.ts` is NOT vendored
  and must not carry it.
- **Family membership.** Exactly the immediate directories of `.agents/skills`, discovered from
  the tree, never hardcoded.
- **The invariant per member.** Exact-case `SKILL.md` exists; exact-case `agents/openai.yaml`
  exists; the yaml carries one root `interface` mapping with non-empty `display_name`,
  `short_description`, and `default_prompt`, and `default_prompt` contains the literal token
  `$<directory-name>`; every `references/<name>.md` named in `SKILL.md` resolves to an existing
  exact-case regular file directly beneath that skill's `references/`; zero references is valid.
- **Executed proof the current gates are blind** (taken before W1 repaired the tree): policy 46,
  config 10, guides 7, all green while the yaml was missing.

Rulings the Orchestrator has already made on the two open design points — these bind:

1. **No new parser, no new import.** `tests/setupPolicy.ts` imports exactly `node:fs`, `node:os`,
   `node:path`, and `typescript`, and it is vendored into targets whose dependency sets you do
   not control — so those four imports are the whole universe. No YAML library, no Markdown AST,
   no `@orkestrel/guide` (that package serves the non-vendored guides test only). The yaml check
   is line-structural: the seven existing files share one exact 4-line shape and that shape IS
   the canon schema — a file that deviates structurally fails, even if a YAML parser would accept
   it, and that strictness is intended. The reference check extracts `references/<name>.md`
   tokens from the raw `SKILL.md` text; state the instrument's coverage in a comment beside it
   (it matches the token anywhere in the text, including fences — over-matching errs toward
   requiring existence, which is the safe direction).
2. **Discovery is proven, the roster is not frozen.** Do not assert the exact member list — the
   directory is the roster's one home, and a hardcoded list is a second copy that drifts. Prove
   discovery two ways instead: the family is non-empty, and it contains a stable known member
   (`orkestrel-falsify`). Fixture controls do the rest.

Read before editing: `AGENTS.md`; `.claude/rules/tests.md` (the red-proof law: a revert reddens
exactly the test that names the defect, with the import and collection graph kept valid);
`.claude/rules/quality.md` (instrument laws: in-population failing control, negative control from
outside the membership rule, coverage stated beside the result); `tests/setupPolicy.ts` and
`tests/policy.test.ts` completely, and match their existing idiom — exported helpers, fixture
patterns, naming.

## Unknowns

- Whether the existing setupPolicy fixture helpers (temp-dir builders) fit skill-tree fixtures or
  you need a new exported helper. Your call; follow the file's own pattern and report it.

## Scope

Owned files:

- `tests/setupPolicy.ts`
- `tests/policy.test.ts`

Read anything. Write nothing else. Off-limits for writing: everything else — including
`.agents/skills/**` except for the temporary red-proof revert below, `vite.config.ts`,
`package.json`, and `src/`.

Temporary-revert exception: the red proof requires deleting
`.agents/skills/orkestrel-human-journey/agents/openai.yaml`, observing the failure, and restoring
it byte-identically. Restore it from git (`git checkout -- <path>`) so the restoration is exact.
The unit ends with `git status` showing only the two owned files modified.

Validation: scoped only — `npm run test:policy` is yours to run as often as needed. Do not run
`format`, `lint --fix`, `build`, or tree-wide suites.

## Execution

Perform this assignment directly. Spawn nothing.

Windows constraint for every shell command: no heredocs, no `node -e`, no `node -p`, no `&&`
chaining, no `${...}` in arguments. Multi-step operations go into a script file invoked as one
plain command, or through your file tools.

## Constraints

- Non-negotiables bind: no `any`, no `as`, no `!`, no suppressions. Helpers exported from
  `tests/setupPolicy.ts` follow its existing export-and-document style.
- Controls run against temp-dir fixtures (the existing setupPolicy pattern), never by mutating
  the real tree: one in-population failing control per assertion class (missing yaml, malformed
  yaml, wrong `$token`, dangling reference), and one negative control from OUTSIDE the membership
  rule — a `.claude/skills/<name>` bridge directory without `agents/openai.yaml` must not trip
  the gate.
- Test names say what they prove, in the file's existing voice. Never name a test for this
  brief's labels (W3, U2, "defect 4").

## The red-then-green proof

Record in your report, in order, each with its exact command and the relevant output lines:

1. `npm run test:policy` on the conforming tree — green, with the new assertions collected.
2. Delete `.agents/skills/orkestrel-human-journey/agents/openai.yaml`. `npm run test:policy` —
   red, and the failure is exactly the new test naming that path. Nothing else red.
3. `git checkout -- .agents/skills/orkestrel-human-journey/agents/openai.yaml`. `npm run
   test:policy` — green, same counts as step 1.

## Output

1. What was added where: new exports in `setupPolicy.ts`, new tests in `policy.test.ts`, with the
   final policy test count.
2. The three-step red-proof transcript.
3. The fixture-control matrix: each control, in- or out-of-population, expected and observed
   result.
4. The Unknowns call you made.
5. The exact `git diff --stat`.

## Deviation contract

Stop and report if: a binding ruling above collides with something in the files (say which and
show it); the red proof reddens anything beyond the named test; or `test:policy` was already red
before your first edit. Ancillary calls — helper naming, fixture shape, test ordering — are
yours: decide, record, continue.

## Acceptance criteria

- `npm run test:policy` green on the final tree, count strictly greater than 46.
- The red proof in the Output shows exactly one failing test at step 2, naming the yaml path.
- `git status` shows exactly the two owned files modified.
- No new import in either owned file beyond the four already present.
- Every assertion has its fixture control and the negative control is from outside the membership
  rule.

## Review evidence

Your report plus the actual diff and the actual `test:policy` output. The audit round re-runs the
commands.
