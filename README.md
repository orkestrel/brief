# @orkestrel/brief

A synchronous, deterministic specification compiler. A rough request compiles into a
`Brief` — a closed, JSON-serializable execution contract another agent can run with no
interpretation left to do — and every downstream artifact (the prompt a model reads, a
completion condition, a subagent dispatch) is projected from that one source of truth.

A brief with blocking gaps never emits. The readiness gate is a `@orkestrel/reason`
`LogicalDefinition`, so every verdict carries a traceable account of which check missed.

```sh
npm install @orkestrel/brief
```

```ts
import {
	createCompiler,
	briefToGoal,
	briefToMarkdown,
	outcome,
	proof,
	task,
} from '@orkestrel/brief'

const compiler = createCompiler()
const briefing = compiler.compile({
	task: task('refactor', 'code', 'Refactor useForm to native browser form APIs.'),
	outcomes: [outcome(1, 'useForm uses native FormData with no behavior change')],
	proofs: [proof('type-check and lint pass', 'npm run check')],
})

if (briefing.brief !== undefined) {
	briefToMarkdown(briefing.brief) // the copy-ready agent prompt
	briefToGoal(briefing.brief) // the completion condition
}
compiler.destroy()
```

Full documentation: [`guides/brief.md`](guides/brief.md). The guides index lives at
[`guides/README.md`](guides/README.md).

## Development

```sh
npm install
npm test
```
