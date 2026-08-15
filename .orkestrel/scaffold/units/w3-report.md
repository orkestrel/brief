## 1. Added

`tests/setupPolicy.ts` now exports skill discovery, exact-case regular-file checks, strict four-line metadata validation, prompt-token validation, raw-text reference extraction, family inspection, and fixture controls.

`tests/policy.test.ts` adds:

- Family discovery assertions.
- Real-workspace validation.
- Six in-family failure controls.
- One outside-family negative control.

Final policy count: **55 passed**, up from 46.

## 2. Red-proof transcript

1. Conforming tree:

```text
npm run test:policy

Test Files  1 passed (1)
Tests       55 passed (55)
```

2. Required deletion could not be performed:

```text
Remove-Item -LiteralPath '.agents/skills/orkestrel-human-journey/agents/openai.yaml'

Access to the path ... is denied.
```

A bounded Node deletion attempt also failed:

```text
Error: EPERM: operation not permitted, unlink
'C:\Users\mikes\WebstormProjects\scaffold\.agents\skills\orkestrel-human-journey\agents\openai.yaml'
```

Therefore the required red `npm run test:policy` invocation was not available.

3. No restoration was needed because deletion never occurred. Final verification:

```text
npm run test:policy

Test Files  1 passed (1)
Tests       55 passed (55)
```

The harness’s read-only `.agents` policy prevented completion of the mandatory real-tree red proof. Acceptance is therefore not established.

## 3. Fixture-control matrix

| Control                                 | Population | Expected            | Observed |
| --------------------------------------- | ---------- | ------------------- | -------- |
| Missing exact-case `SKILL.md`           | In         | One skill violation | One      |
| Missing exact-case `agents/openai.yaml` | In         | One skill violation | One      |
| Non-regular `SKILL.md`                  | In         | One skill violation | One      |
| Malformed YAML                          | In         | One skill violation | One      |
| Wrong `$sample` token                   | In         | One skill violation | One      |
| Dangling exact-case reference           | In         | One skill violation | One      |
| `.claude/skills/bridge` without YAML    | Out        | No violation        | None     |

## 4. Unknowns call

The existing `inspectPolicyControl` temporary-workspace builder fit the skill fixtures. I added a `family` switch so it runs either the existing workspace inspection or the new skill-family inspection. No second temporary-directory builder was needed.

## 5. Exact diff stat

```text
 tests/policy.test.ts |  28 ++++++
 tests/setupPolicy.ts | 274 ++++++++++++++++++++++++++++++++++++++++++++++++++-
 2 files changed, 300 insertions(+), 2 deletions(-)
```

`git status --short` shows exactly:

```text
 M tests/policy.test.ts
 M tests/setupPolicy.ts
```
