# @orkestrel/brief

> The specification compiler: a synchronous, deterministic pipeline that resolves a rough
> request into a `Brief` — a closed, content-hashed execution contract another agent can run
> with no interpretation left to do — gated by a traceable reasoner and projected into every
> downstream artifact.

Compile a request with the `createBriefCompiler` factory, read the `Briefing` it returns, and
project the brief it carries into the prompt a model reads, a completion condition, or a
subagent dispatch. A brief with blocking gaps never emits: the readiness gate is a
`@orkestrel/reason` `LogicalDefinition`, so every verdict carries a traceable account of which
check missed. Part of the `@orkestrel` line.

## Install

```sh
npm install @orkestrel/brief
```

## Requirements

- Node.js >= 22.12.0, matching the `engines` field in `package.json`
- ESM and CommonJS entry points, selected by the `exports` field in `package.json`

## Usage

```ts
import {
	createBriefCompiler,
	briefToGoal,
	briefToMarkdown,
	buildOutcome,
	buildProof,
	buildTask,
} from '@orkestrel/brief'

const compiler = createBriefCompiler()
const briefing = compiler.compile({
	task: buildTask('refactor', 'code', 'Refactor useForm to native browser form APIs.'),
	outcomes: [buildOutcome(1, 'useForm uses native FormData with no behavior change')],
	proofs: [buildProof('type-check and lint pass', 'npm run check')],
})

if (briefing.brief !== undefined) {
	briefToMarkdown(briefing.brief) // the copy-ready agent prompt
	briefToGoal(briefing.brief) // the completion condition
}
compiler.destroy()
```

## Guide

Full documentation: [`guides/brief.md`](guides/brief.md). The guides index lives at
[`guides/README.md`](guides/README.md).

## Development

```sh
npm install
npm test
```
