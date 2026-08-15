# U1 — Distill the incoming skill files against the canon they are about to vendor

## Role and engine

`grok`, Cursor Grok. Read-only. You return evidence, never decisions.

## Objective

Produce one conformance distillate for the files listed under **Scope**, each finding carrying a
`file:line` pointer, so the Orchestrator can rule on what must change before these files vendor to
every package in the fleet.

## Context

Repository: `C:\Users\mikes\WebstormProjects\scaffold`. Windows host, Git Bash.

`@orkestrel/scaffold` vendors its own `.claude/`, `.agents/`, and `AGENTS.md` into `dist/host`.
Every target package receives them through `scaffold repair`. A defect in these files therefore
propagates to the whole fleet on the next release, and a target cannot fix it locally — `repair`
reverts the edit and `audit` reports it as drift.

The files in scope were written in a different session and copied into this repository. They have
not been reviewed against this repository's canon.

Read before judging, in this order:

1. `AGENTS.md` — the root law. Its **Writing** and **Instruction files** sections are the voice
   contract these files must satisfy.
2. `.claude/rules/documentation.md` — its **Workflow skills** section states the skill contract.
3. `.agents/skills/orkestrel-falsify/SKILL.md` and `.agents/skills/orkestrel-harden-package/SKILL.md`
   — two skills already conforming to the canon. Use them as the reference shape and voice.

The voice contract, stated so you do not have to infer it: these files are executed by an LLM agent
mid-task, not read by a person. Every line is a directive — what to do, what to check, or what to
refuse. A clause written to persuade, reassure, explain the rule to a human, or record how a finding
was discovered is a defect. So is an aphorism, a metaphor, and a heading that is a slogan rather
than a subject.

## Unknowns

- Whether `orkestrel-human-journey` duplicates process already owned by an existing skill or by
  `.agents/orchestration.md`. Report the overlap with both pointers; do not rule on it.
- Whether `.claude/rules/application.md` and `orkestrel-build-application/references/application.md`
  changed to support the new skill or for an unrelated reason. Report what the change does.

## Scope

Read-only over the whole repository. Report on exactly these files:

- `.agents/skills/orkestrel-human-journey/SKILL.md`
- `.agents/skills/orkestrel-human-journey/references/captures.md`
- `.agents/skills/orkestrel-human-journey/references/layer.md`
- `.claude/skills/orkestrel-human-journey/SKILL.md`
- `.agents/skills/enterprise-bootstrap/SKILL.md`
- `.agents/skills/enterprise-bootstrap/references/bootstrap-reference.md`
- `.agents/skills/enterprise-bootstrap/references/components.md`
- `.agents/skills/enterprise-bootstrap/references/utilities.md`
- `.agents/skills/orkestrel-build-application/references/application.md`
- `.claude/rules/application.md`

The last six are modified rather than new. `git diff HEAD -- <path>` shows what changed; judge the
changed lines first, then the file as a whole.

Allowed tools: Read, Grep, Glob, and read-only Bash (`git diff`, `git show`, `git log`). Write
nothing. Edit nothing.

## Execution

Perform this assignment directly. Spawn nothing.

## Output

Markdown. No process diary, no restatement of this brief.

1. **Conformance table** — one row per file: path, verdict `CONFORMS` / `DEFECTS`, defect count.
2. **Defects** — numbered in one sequence across all files. Each: `file:line`, the offending text
   quoted verbatim and trimmed to one line, which canon clause it breaks (quote the clause), and
   the class from this list: `voice-human` (written for a person), `voice-history` (records how a
   finding was found), `aphorism`, `duplicate-rule` (a rule with another home — give both pointers),
   `frontmatter` (anything beyond `name` and a trigger-focused `description`), `reference-depth`
   (references nested deeper than one level), `broken-reference` (a referenced resource that does
   not exist), `model-routing` (model names or version catalogs inside a skill), `template-todo`,
   `bridge-bloat` (a `.claude/skills/` bridge adding instructions rather than loading the canonical
   skill).
3. **Structural findings** — anything true of the set rather than one file: a missing sibling file,
   an inconsistency between the two harnesses, a skill whose references are not reachable from its
   `SKILL.md`.
4. **Overlap report** — the two Unknowns above, with pointers, no ruling.

Cap the defect list at the 40 highest-value entries. If you truncate, say what you dropped.

## Deviation contract

A file that does not exist, or a `git diff` that returns nothing where this brief says a file is
modified: stop and report expected, found, and one short hypothesis. Do not investigate further.

Where this brief's reading order conflicts with what you find, follow the repository and record the
conflict. Where a defect class does not fit, use the nearest and say so.

## Acceptance criteria

- Every file under **Scope** appears in the conformance table with a verdict.
- Every defect carries a `file:line`, a verbatim quote, and a quoted canon clause.
- Every claim about a file's content is a quote, not a description.
- The overlap report answers both Unknowns or states that it could not.

## Review evidence

Quote the bytes. A description of a line is not the line.
