# Guides

## By concept

| Concept | Spec                   | Source                    | Tests                                 |
| ------- | ---------------------- | ------------------------- | ------------------------------------- |
| Brief   | [`brief.md`](brief.md) | [`src/core`](../src/core) | [`tests/src/core`](../tests/src/core) |

## By directory

- [`src/core`](../src/core)
  - Guide: [`brief.md`](brief.md)
  - Tests: [`tests/src/core`](../tests/src/core)

## Vendored dependency guides

Mirrors fetched by `npx @orkestrel/scaffold catalog`. Their relative links address the
upstream tree, so they resolve to nothing here and sit outside local-link parity. Refresh a
mirror rather than editing it.

- [`contract.md`](contract.md) — guards, combinators, parsers, shapes, and `createContract`.
- [`emitter.md`](emitter.md) — the typed synchronous emitter.
- [`guide.md`](guide.md) — the guides-parity toolkit `tests/guides.test.ts` is built on.
- [`interpret.md`](interpret.md) — the language pipeline behind the `interpret` stage.
- [`reason.md`](reason.md) — the reasoning engine behind the gate.
- [`scaffold.md`](scaffold.md) — the workspace scaffolder.
