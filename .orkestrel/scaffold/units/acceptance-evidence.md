# Acceptance evidence — scaffold skill-propagation campaign

Verifier run at scaffold `8f1cd49`; final tree `8e5145f` (merge of the supervisor session's
`2250f84` plus a formatting-only normalization of its `REDESIGN.md`), pushed.

## The authoritative chain

| Gate                                          | Exit  | Result                                                                                                                                                                          |
| --------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run format:check`                        | 1 → 0 | FAIL on `.orkestrel/supervisor/REDESIGN.md` only — the other session's artifact arrived unformatted through merges; formatting-only fix at `8e5145f`; re-run green on 200 files |
| `npm run lint:check`                          | 0     | PASS                                                                                                                                                                            |
| `npm run check`                               | 0     | PASS — core/server/bin tsc clean                                                                                                                                                |
| `npm run build`                               | 0     | PASS — `build-host: staged 106 file(s) into dist/host`                                                                                                                          |
| `npm test`                                    | 0     | PASS — core 293, server 352 (+4 skipped), bin 167, **policy 57**, config 10, guides 7                                                                                           |
| `npm run test:distribution -- --mode release` | 0     | PASS — 3/3, 48.56s                                                                                                                                                              |

## Propagation proof

- `dist/host/agents/skills/orkestrel-human-journey/` carries `SKILL.md`, `references/`, and
  `agents/openai.yaml` — the file whose absence started the gate work.
- `dist/host/agents/skills/enterprise-bootstrap/` carries the rewritten skill complete.
- All eight vendored skills carry `agents/openai.yaml`.
- `node dist/bin/main.js audit`: 1 of 124 planned paths drifted — `configs/src/vite.server.config.ts`,
  expected in the scaffold source repository, which audits its own template against its own
  generated config. Not a propagation defect. (124 planned paths, up from 111 pre-campaign.)

## Anomalies recorded

- `npx scaffold audit` resolves a stale global npx cache and fails `MODULE_NOT_FOUND`; the working
  invocation in the scaffold source repo is `node dist/bin/main.js audit`.
- The bin suite prints "0 of 1 planned path drifted" from within a passing test — informational.

## Exit criterion

Every capability the campaign opened is closed:

1. **Two skills propagate in the next scaffold version** — in `dist/host`, proven above.
2. **The incoming copy's canon reversion** — 15 files restored from HEAD before checkpoint;
   nothing of 0.0.35's canon lost.
3. **Voice/structure conformance of both skills** — W1/W2 rewrites + W4/W5 fix rounds, audited by
   three lanes (A1) then two (A2); the enterprise-bootstrap voice seam consumed its three-round
   repair budget and is closed with two recorded retention rulings (spend vocabulary; routing
   derivation).
4. **The missing-metadata class is gated** — policy 57 with family discovery, canon-shape
   validation, token-boundary matching, seven+ fixture controls, three red-then-green proofs, and
   the shape documented in `documentation.md`.
5. **Publishing findings recorded** — `publishing-findings.md`, raised for the contract.

Not done, deliberately: the scaffold version bump and publish — the user's decision and the
user's credential. The 11-row ungated-orders survey (U2 Part 2 minus the row this campaign
closed) stays recorded for a future campaign.
