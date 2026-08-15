# U2 — Which orders over the vendored surface have no gate, and what closes the skill-family class

## Role and engine

`analyst`, GPT-5.6 Sol. Read-only, objective lane. You return analysis and evidence. You do not
implement, reconcile, or accept.

## Objective

Answer two questions with executed evidence:

1. **The specific one.** What is the minimum gate that makes it impossible for a skill to be added
   to this repository without the files the canon requires it to carry?
2. **The general one.** Which other orders in this repository's own canon govern the vendored host
   surface, are stated as requirements, and have no gate behind them?

## Context

Repository: `C:\Users\mikes\WebstormProjects\scaffold`. Windows host, Git Bash. Node >= 22.12.

`@orkestrel/scaffold` vendors its own `.claude/`, `.agents/`, `AGENTS.md`, and several root
dotfiles into `dist/host`. `HOST_PATHS` in `src/core/constants.ts:123` is the candidate set;
`.agents/skills` and `.claude/skills` are directory entries, and a directory entry vendors
everything beneath it. Every target package receives these files through `scaffold repair`.

**The trigger, stated as fact.** `.claude/rules/documentation.md`, under **Workflow skills**,
orders: "Validate every referenced resource and `agents/openai.yaml`". The repository ships eight
skills under `.agents/skills/` and seven `agents/openai.yaml` files:

```
$ ls .agents/skills/
enterprise-bootstrap  orkestrel-align-packages  orkestrel-build-application  orkestrel-debrief
orkestrel-falsify  orkestrel-harden-package  orkestrel-human-journey  orkestrel-polish-surface

$ ls .agents/skills/*/agents/openai.yaml
.agents/skills/enterprise-bootstrap/agents/openai.yaml
.agents/skills/orkestrel-align-packages/agents/openai.yaml
.agents/skills/orkestrel-build-application/agents/openai.yaml
.agents/skills/orkestrel-debrief/agents/openai.yaml
.agents/skills/orkestrel-falsify/agents/openai.yaml
.agents/skills/orkestrel-harden-package/agents/openai.yaml
.agents/skills/orkestrel-polish-surface/agents/openai.yaml
```

`orkestrel-human-journey` is missing one. This is the second occurrence: `orkestrel-falsify` was
missing one, that was found by an audit of a downstream package, and it was fixed by adding the one
file at commit `ad2136a`. The next skill added to the repository shipped without it. Adding the
file again closes an instance; the question is what closes the class.

`.claude/rules/quality.md` states the governing law: an ordered behaviour with no gate is not a
gate.

Read before answering: `AGENTS.md`, `.claude/rules/documentation.md`, `.claude/rules/tests.md`,
`.claude/rules/quality.md`, `.claude/rules/architecture.md`, `src/core/constants.ts`, and the four
existing test files `tests/config.test.ts`, `tests/policy.test.ts`, `tests/guides.test.ts`,
`tests/distribution.test.ts`.

## Unknowns

- Which existing test project a skill-family gate belongs to, and whether it needs a new one. The
  test projects are declared in `vite.config.ts`; read it rather than assuming.
- Whether `tests/policy.test.ts` and `tests/setupPolicy.ts` are themselves vendored (they are in
  `HOST_PATHS`), and therefore whether a gate placed there runs in every target as well as here.
  This changes the answer: a gate that runs in a target must not assert on files only this
  repository has. Determine which, and let it constrain your recommendation.
- Whether `agents/openai.yaml` has a required schema, or only has to exist. Read the seven and say
  what is actually invariant across them.

## Scope

Read-only over the whole repository. Run commands freely: `npm run test:*`, `node`, `git`, `ls`,
and any read-only inspection. Write nothing. Edit nothing. Do not create a probe file — you have no
write tool, and this brief does not ask you to.

Where you need executed evidence that requires writing, name the exact command and the exact file
contents you would need, and the Orchestrator will run it and hand back the output.

Off-limits: `.git/`, `node_modules/`, `dist/`, and every credential path in the permission floor.

## Execution

Perform this assignment directly. Spawn nothing.

## Output

Markdown. No process diary.

### Part 1 — the skill-family gate

- **Invariant.** State it as one sentence, in the form a test asserts.
- **Placement.** Which test file and which test project, with the reason drawn from your Unknowns
  finding about vendoring. If it must be a new project, say what `vite.config.ts` needs.
- **The assertion set.** Enumerate what the gate checks. For each: what it catches, and one
  concrete example of a defect that passes today and would fail after.
- **The negative control.** Name a defect in this class the gate would NOT catch, drawn from
  outside the gate's own membership rule. State the gate's coverage beside its result.
- **Cost.** What breaks if a legitimate skill is added that the gate rejects. Name the escape hatch
  or state that there must not be one.

### Part 2 — the ungated orders survey

A table: the order quoted verbatim, its `file:line`, whether a gate exists (`GATED` with the
asserting file:line, or `UNGATED`), and for each `UNGATED` row a severity — `HIGH` if a violation
propagates to every target through `repair`, `LOW` otherwise.

Bound the survey to orders that govern the vendored host surface. Say where you stopped and why.
Do not survey the coding rules that govern `src/`.

### Part 3 — what you could not settle

Anything you could not answer by running something, stated as open rather than answered by a weaker
instrument.

## Deviation contract

If a command in this brief fails or a path does not exist, stop and report expected, found, the
exact output, and at most one hypothesis. Do not work around it.

If your reading contradicts a factual claim in **Context**, say so with the command and output that
contradicts it. The claims here were measured on this host; trust your own measurement over mine
and say which one you took.

## Acceptance criteria

- Part 1 names an invariant, a file, and a project, and every claim about the test projects cites
  `vite.config.ts`.
- The vendoring Unknown is answered by reading `HOST_PATHS`, and the answer constrains the
  placement recommendation.
- The `openai.yaml` invariant is derived from reading all seven files, and states what varies as
  well as what does not.
- Part 1 includes a negative control drawn from outside the gate's membership rule.
- Every `GATED` row in Part 2 cites the asserting line. Every `UNGATED` row states its severity.
- No claim rests on a text search where the question is about structure, without saying so.

## Review evidence

Paste the command and its output for every factual claim. A description of a result is not the
result.
