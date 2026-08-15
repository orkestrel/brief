# Part 1 — the skill-family gate

## Invariant

For every exact-case immediate directory under `.agents/skills`, the policy test asserts that `SKILL.md` and `agents/openai.yaml` exist as exact-case files, every local resource named by `SKILL.md` resolves to an existing file one level beneath `references/`, and `agents/openai.yaml` has the canonical interface fields and invokes `$<skill-directory-name>`.

The family must be discovered from the directory. The test must not hardcode eight skills or name `orkestrel-human-journey`.

## Placement

Place the assertion in `tests/policy.test.ts`, with reusable traversal and validation in `tests/setupPolicy.ts`. It belongs to the existing `policy` project. No new project is needed.

`vite.config.ts:121-127` maps that project directly to `tests/policy.test.ts`. `package.json:74,78` puts it in the normal `test` gate.

This placement follows the vendoring boundary:

- `.agents/skills` is vendored by `HOST_PATHS` at `src/core/constants.ts:128`.
- `tests/setupPolicy.ts` and `tests/policy.test.ts` are vendored at `src/core/constants.ts:142-143`.
- A target therefore receives both the subject and its gate through `repair`.
- `tests/guides.test.ts` is not vendored and is optional in generated workspaces, so placing the gate there would not close the fleet-wide class.
- `tests/config.test.ts` is vendored, but its subject is generated configuration rather than repository policy.

The current policy helper must gain a separate skill-family population. Its existing populations are limited to `src`, `app`, and their mirrored tests at `tests/setupPolicy.ts:140-149,624,702-705`.

## The `openai.yaml` invariant

All seven present files have this structural shape:

```yaml
interface:
  display_name: '<non-empty value>'
  short_description: '<non-empty value>'
  default_prompt: '<non-empty value containing $<skill-directory-name>>'
```

What does not vary:

- One root `interface` mapping.
- The fields `display_name`, `short_description`, and `default_prompt`.
- Non-empty scalar values.
- `default_prompt` names the owning skill with its exact `$<directory>` token.

What varies:

- All three user-facing values.
- Their length and wording.

Therefore existence alone is insufficient. The minimum local schema validates those three fields and the skill token. The seven files do not establish the complete external OpenAI schema or prove that additional provider-valid fields must be rejected.

## The assertion set

| Assertion | What it catches | Concrete defect that passes today |
|---|---|---|
| Discover every immediate `.agents/skills/*` directory and require exact-case `SKILL.md`. Require a non-empty family. | Empty skill directories, case errors, or a directory presented as a skill without its workflow. It also prevents a vacuous pass. | Add `.agents/skills/sample/agents/openai.yaml` without `.agents/skills/sample/SKILL.md`. |
| Require exact-case `agents/openai.yaml` for every discovered member. | The recurring missing-metadata class. | The current `.agents/skills/orkestrel-human-journey` defect. |
| Validate the local `openai.yaml` schema above. | Empty, misspelled, or missing interface fields and a prompt wired to the wrong skill. | Rename `default_prompt` to `prompt`, or copy another skill’s prompt without changing its `$skill` token. |
| Parse `SKILL.md` through the declared Markdown implementation and collect both links and code spans naming `references/*.md`; resolve each against the skill directory and require an exact-case regular file directly beneath `references/`. | Dangling references, case drift, traversal, and references nested deeper than the one-level rule permits. Using the Markdown AST avoids introducing a second Markdown parser. | Rename `orkestrel-human-journey/references/layer.md` while leaving `SKILL.md` unchanged. |
| Give each assertion an in-population failing control and assert the discovered member names rather than a count. | A validator that silently stops discovering skills or never reaches the intended file. | A glob that returns no skill directories and passes because every loop has zero iterations. |

All three current scoped projects are green while `orkestrel-human-journey` lacks the file: policy 46 passed, config 10 passed, and guides 7 passed. That executed result proves the current gates do not close this defect.

## Negative control

Use `.claude/skills/control/SKILL.md` without `agents/openai.yaml` as the outside-population control.

The new inspection must report no skill-family violation for it because membership is exactly the immediate children of `.agents/skills`. The same shape under `.agents/skills/control` must report the missing file.

Coverage: the gate covers canonical workflow packages under `.agents/skills`. It does not validate `.claude/skills` provider bridges, agent role files, root harness bridges, or plugin-owned skills outside this family. Those are separate rows in Part 2.

## Cost

A legitimate canonical skill that omits `agents/openai.yaml`, uses a dangling resource, or omits a required field will make `test:policy` fail in this repository and every repaired target.

There must be no per-skill allowlist. A provider schema expansion must change the canon, the validator, and affected skills together. A skill that needs no references remains valid; zero references is not a failure.

# Part 2 — the ungated orders survey

## Bound

The survey covers objective repository-tree and build-graph requirements whose subjects are paths named by, or nested beneath, `HOST_PATHS`. It includes the two staging rules that define the membership boundary.

I stopped before:

- coding and placement laws over `src/` and `app/`;
- subjective prose judgments such as whether a skill is “concise”;
- runtime dispatch, publishing, authentication, and operator conduct;
- target-local state after vendoring;
- scaffold behavior unrelated to membership or canonical host-file validity.

A structural reading of the test populations was used. Text searches were used only to locate candidate assertions. The three executed project results independently show that the present missing YAML is not gated.

| Order quoted verbatim | `file:line` | Gate | Severity |
|---|---|---|---|
| “A missing vendored path is refused rather than staged around, and the refusal names every missing path at once.” | `guides/scaffold.md:868-870` | **GATED** — `tests/src/server/helpers.test.ts:1151-1164`, collected by `vite.config.ts:76-77` and `package.json:74,76` | — |
| “A vendored directory is one planned path that expands into the files the data root stores beneath it.” | `guides/scaffold.md:906-907` | **GATED** — file expansion at `tests/src/server/helpers.test.ts:1082-1093`; nested directory expansion at `tests/src/server/helpers.test.ts:1117-1129` | — |
| “`.agents/orchestration.md` governs agent operation only and cannot weaken this coding contract. `CLAUDE.md`, `.codex/config.toml`, and `.cursor/rules/` are harness bridges to it and carry no independent coding policy.” Also: “Each points here and adds only what its harness needs. None of them restates this file.” | `AGENTS.md:11`; `.agents/orchestration.md:16-17` | **UNGATED** | **HIGH** |
| “A vendored dependency guide is a mirror… Refresh a mirror rather than rewriting it.” | `.claude/rules/documentation.md:35` | **UNGATED** — `tests/guides.test.ts:38-42` explicitly excludes dependency mirrors from its inspected manifest | **HIGH** |
| “Keep `SKILL.md` concise and route conditional detail to one-level `references/`.” The objective one-level requirement is the surveyed order. | `.claude/rules/documentation.md:65` | **UNGATED** | **HIGH** |
| “Frontmatter contains only `name` and a trigger-focused `description`.” | `.claude/rules/documentation.md:66` | **UNGATED** | **HIGH** |
| “Do not put model routing or package version catalogs in a skill.” | `.claude/rules/documentation.md:67` | **UNGATED** | **HIGH** |
| “Validate every referenced resource and `agents/openai.yaml`” | `.claude/rules/documentation.md:68` | **UNGATED** — this is the class Part 1 closes | **HIGH** |
| “do not leave template TODOs or auxiliary README/changelog files.” | `.claude/rules/documentation.md:68` | **UNGATED** | **HIGH** |
| “Keep provider bridges minimal: they load one canonical workflow and add no competing instructions.” | `.claude/rules/documentation.md:69` | **UNGATED** | **HIGH** |
| “Keep `configs/helpers.ts` free of any dependency a core-only workspace does not declare… an import there must resolve in all of them.” | `.claude/rules/workspace.md:66-69` | **UNGATED** as stated. `tests/distribution.test.ts:470,548` proves one generated `core`+`server` shape, not every workspace shape. | **HIGH** |
| “Give every role a file on both sides. The role file is where engine, effort, tools, permissions, and charter are pinned” | `.agents/orchestration.md:154-156`, with the required mapping at `:136-150` | **UNGATED** | **HIGH** |
| “Every role honours this floor. No dispatch may widen it.” In particular: “Read-only roles carry no `Edit` and no `Write`” and “`verifier` has no edit or write tools.” | `.agents/orchestration.md:171,175-178` | **UNGATED** | **HIGH** |

Every ungated row is `HIGH` because its owning file or directory is in `HOST_PATHS`; a violating canonical byte is copied into `dist/host` and then into every target through `repair`.

The existing staging gates prove that declared top-level paths exist and that directory members are copied. They do not validate what files a directory member must contain or whether the copied instruction files satisfy their own structural contracts.

# Part 3 — what could not be settled

The full external schema for `agents/openai.yaml` remains open. The seven local files establish the repository’s three-field invariant, but they cannot prove whether the provider permits or requires additional fields. No weaker inference was used to claim the complete provider schema.

No further repository command is needed for the conclusions above. The proposed regression test cannot be executed until it exists; this assignment is read-only.

# Review evidence

## Host membership

Command:

```powershell
$n=0; Get-Content src/core/constants.ts | ForEach-Object { $n += 1; if ($n -ge 112 -and $n -le 155) { Write-Output (([string]$n) + ':' + $_) } }
```

Output:

```text
112: * @remarks
113: * These are the files the fleet shares verbatim: the root instruction
114: * documents, the licence, the canonical orchestration contract every harness
115: * bridge points at, the four harness directories, the session hook scripts,
116: * the shared policy register, the byte-identical root dotfiles, and the two
117: * guide mirrors a generated workspace starts from. A directory entry vendors
118: * everything beneath it.
123:export const HOST_PATHS: readonly string[] = Object.freeze([
124:	'AGENTS.md',
125:	'CLAUDE.md',
127:	'.agents/orchestration.md',
128:	'.agents/skills',
129:	'.claude/agents',
130:	'.claude/rules',
131:	'.claude/skills',
132:	'.claude/settings.json',
133:	'.codex/agents',
134:	'.codex/config.toml',
136:	'.cursor/rules',
142:	'tests/setupPolicy.ts',
143:	'tests/policy.test.ts',
144:	'tests/config.test.ts',
145:	'configs/helpers.ts',
153:	'guides/guide.md',
154:	'guides/scaffold.md',
155:])
```

## Skill membership and missing file

Command:

```powershell
Get-ChildItem .agents/skills -Directory | Sort-Object Name | ForEach-Object {
  $yaml = Join-Path $_.FullName 'agents/openai.yaml'
  $refs = Get-ChildItem (Join-Path $_.FullName 'references') -File -ErrorAction SilentlyContinue
  Write-Output ($_.Name + '|openai=' + (Test-Path $yaml) + '|references=' + ($refs | Measure-Object).Count)
}
```

Output:

```text
enterprise-bootstrap|openai=True|references=4
orkestrel-align-packages|openai=True|references=2
orkestrel-build-application|openai=True|references=1
orkestrel-debrief|openai=True|references=2
orkestrel-falsify|openai=True|references=2
orkestrel-harden-package|openai=True|references=4
orkestrel-human-journey|openai=False|references=2
orkestrel-polish-surface|openai=True|references=1
```

## YAML structure

Command:

```powershell
Get-ChildItem .agents/skills -Directory | Sort-Object Name | ForEach-Object {
  $yaml = Join-Path $_.FullName 'agents/openai.yaml'
  if (Test-Path $yaml) {
    $lines = Get-Content $yaml
    $token = '$' + $_.Name
    Write-Output ($_.Name + '|lines=' + $lines.Count + '|keys=' +
      (($lines | ForEach-Object { ($_ -split ':',2)[0].Trim() }) -join ',') +
      '|prompt-token=' + (($lines[3]).Contains($token)))
  }
}
```

Output:

```text
enterprise-bootstrap|lines=4|keys=interface,display_name,short_description,default_prompt|prompt-token=True
orkestrel-align-packages|lines=4|keys=interface,display_name,short_description,default_prompt|prompt-token=True
orkestrel-build-application|lines=4|keys=interface,display_name,short_description,default_prompt|prompt-token=True
orkestrel-debrief|lines=4|keys=interface,display_name,short_description,default_prompt|prompt-token=True
orkestrel-falsify|lines=4|keys=interface,display_name,short_description,default_prompt|prompt-token=True
orkestrel-harden-package|lines=4|keys=interface,display_name,short_description,default_prompt|prompt-token=True
orkestrel-polish-surface|lines=4|keys=interface,display_name,short_description,default_prompt|prompt-token=True
```

The complete file contents were also read. Each value is a non-empty single-quoted scalar; the three values vary across files.

## Referenced-resource resolution

Command:

```powershell
Get-ChildItem .agents/skills -Directory | Sort-Object Name | ForEach-Object {
  $skill = Join-Path $_.FullName 'SKILL.md'
  $matches = [regex]::Matches((Get-Content -Raw $skill), 'references/[A-Za-z0-9._/-]+\.md')
  $paths = $matches.Value | Sort-Object -Unique
  if (($paths | Measure-Object).Count -eq 0) {
    Write-Output ($_.Name + '|references-in-SKILL=0')
  } else {
    $paths | ForEach-Object {
      Write-Output ($skill.Substring((Get-Location).Path.Length + 1).Replace('\','/') +
        '|' + $_ + '|exists=' + (Test-Path (Join-Path (Split-Path $skill) $_)))
    }
  }
}
```

Output:

```text
.agents/skills/enterprise-bootstrap/SKILL.md|references/bootstrap-reference.md|exists=True
.agents/skills/enterprise-bootstrap/SKILL.md|references/components.md|exists=True
.agents/skills/enterprise-bootstrap/SKILL.md|references/frontend-design.md|exists=True
.agents/skills/enterprise-bootstrap/SKILL.md|references/utilities.md|exists=True
.agents/skills/orkestrel-align-packages/SKILL.md|references/fleet.md|exists=True
.agents/skills/orkestrel-align-packages/SKILL.md|references/integration.md|exists=True
orkestrel-build-application|references-in-SKILL=0
.agents/skills/orkestrel-debrief/SKILL.md|references/field-testing.md|exists=True
.agents/skills/orkestrel-debrief/SKILL.md|references/instruction-audit.md|exists=True
.agents/skills/orkestrel-falsify/SKILL.md|references/brief.md|exists=True
.agents/skills/orkestrel-falsify/SKILL.md|references/reconcile.md|exists=True
.agents/skills/orkestrel-harden-package/SKILL.md|references/centralization.md|exists=True
.agents/skills/orkestrel-harden-package/SKILL.md|references/contract.md|exists=True
.agents/skills/orkestrel-harden-package/SKILL.md|references/hardening.md|exists=True
.agents/skills/orkestrel-harden-package/SKILL.md|references/research.md|exists=True
.agents/skills/orkestrel-human-journey/SKILL.md|references/captures.md|exists=True
.agents/skills/orkestrel-human-journey/SKILL.md|references/layer.md|exists=True
.agents/skills/orkestrel-polish-surface/SKILL.md|references/capture-harness.md|exists=True
```

This command measured current paths. The proposed test must use the declared Markdown AST rather than this discovery regex.

## Project placement and gate reachability

Command:

```powershell
rg -n "export const (policy|config|guides|distribution)|name: \{ label: '(policy|config|guides|distribution)'|include: \['tests/(policy|config|guides|distribution)\.test\.ts'|projects:" vite.config.ts
rg -n '"test"|"test:policy"|"test:config"|"test:guides"|"prepublishOnly"' package.json
```

Output:

```text
vite.config.ts:121:export const policy = (options?: UserConfig): UserConfig =>
vite.config.ts:126:				name: { label: 'policy', color: 'white' },
vite.config.ts:127:				include: ['tests/policy.test.ts'],
vite.config.ts:136:export const config = (options?: UserConfig): UserConfig =>
vite.config.ts:141:				name: { label: 'config', color: 'yellow' },
vite.config.ts:142:				include: ['tests/config.test.ts'],
vite.config.ts:151:export const guides = (options?: UserConfig): UserConfig =>
vite.config.ts:156:				name: { label: 'guides', color: 'green' },
vite.config.ts:157:				include: ['tests/guides.test.ts'],
vite.config.ts:167:export const distribution = (options?: UserConfig): UserConfig =>
vite.config.ts:172:				name: { label: 'distribution', color: 'cyan' },
vite.config.ts:173:				include: ['tests/distribution.test.ts'],
vite.config.ts:203:		projects: [srcCore, srcServer, srcBin, policy, config, guides, distribution, probe],
package.json:74:		"test": "npm run test:src:core && npm run test:src:server && npm run test:src:bin && npm run test:policy && npm run test:config && npm run test:guides",
package.json:78:		"test:policy": "vitest run --config vite.config.ts --no-cache --reporter=dot --project policy",
package.json:79:		"test:config": "vitest run --config vite.config.ts --no-cache --reporter=dot --project config",
package.json:80:		"test:guides": "vitest run --config vite.config.ts --no-cache --reporter=dot --project guides",
package.json:89:		"prepublishOnly": "npm run format:check && npm run lint:check && npm run check && npm run build && npm test && npm run test:distribution -- --mode release"
```

## Existing policy population

Command:

```powershell
rg -n "POLICY_(SOURCE|TEST|MODULE|TESTS_MODULE)_GLOB" tests/setupPolicy.ts
```

Output:

```text
tests/setupPolicy.ts:140:export const POLICY_SOURCE_GLOB = `{app,src}/**/*.{${POLICY_SOURCE_EXTENSIONS.join(',')}}`
tests/setupPolicy.ts:143:export const POLICY_MODULE_GLOB = `{app,src}/**/*.{${POLICY_MODULE_EXTENSIONS.join(',')}}`
tests/setupPolicy.ts:146:export const POLICY_TESTS_MODULE_GLOB = `tests/**/${POLICY_TESTS_MODULE_PREFIX}*.ts`
tests/setupPolicy.ts:149:export const POLICY_TEST_GLOB = 'tests/{app,src}/**/*.test.ts'
tests/setupPolicy.ts:624:	return globSync(POLICY_SOURCE_GLOB, { cwd: root })
tests/setupPolicy.ts:702:	const tests = globSync(POLICY_TEST_GLOB, { cwd: root }).sort().map(normalizePolicyPath)
tests/setupPolicy.ts:704:		...globSync(POLICY_MODULE_GLOB, { cwd: root }).sort().map(normalizePolicyPath),
tests/setupPolicy.ts:705:		...globSync(POLICY_TESTS_MODULE_GLOB, { cwd: root }).sort().map(normalizePolicyPath),
```

## Existing test files do not address the family

Command:

```powershell
$files = @(
  'tests/config.test.ts',
  'tests/policy.test.ts',
  'tests/guides.test.ts',
  'tests/distribution.test.ts'
)
foreach ($file in $files) {
  $matches = Select-String -Path $file -Pattern '.agents/skills','agents/openai.yaml','SKILL.md' -SimpleMatch
  Write-Output ($file + '|skill-family-path-matches=' + ($matches | Measure-Object).Count)
}
```

Output:

```text
tests/config.test.ts|skill-family-path-matches=0
tests/policy.test.ts|skill-family-path-matches=0
tests/guides.test.ts|skill-family-path-matches=0
tests/distribution.test.ts|skill-family-path-matches=0
```

This search was only corroboration. The gate ruling comes from reading all four files, their project populations, and the executed results below.

## Executed scoped projects supplied by the Orchestrator

Command:

```powershell
Get-Content -Raw tmp/codex/u2-evidence-output.txt
```

Output:

```text
=== npm run test:policy ===
npm notice run @orkestrel/scaffold@0.0.35 test:policy
npm notice run vitest run --config vite.config.ts --no-cache --reporter=dot --project policy

 RUN  v4.1.10 C:/Users/mikes/WebstormProjects/scaffold

 Test Files  1 passed (1)
      Tests  46 passed (46)
   Duration  1.27s

exit=0

=== npm run test:config ===
npm notice run @orkestrel/scaffold@0.0.35 test:config
npm notice run vitest run --config vite.config.ts --no-cache --reporter=dot --project config

 RUN  v4.1.10 C:/Users/mikes/WebstormProjects/scaffold

 Test Files  1 passed (1)
      Tests  10 passed (10)
   Duration  1.10s

exit=0

=== npm run test:guides ===
npm notice run @orkestrel/scaffold@0.0.35 test:guides
npm notice run vitest run --config vite.config.ts --no-cache --reporter=dot --project guides

 RUN  v4.1.10 C:/Users/mikes/WebstormProjects/scaffold

 Test Files  1 passed (1)
      Tests  7 passed (7)
   Duration  1.37s

exit=0
```

## Existing staging boundary gates

Command:

```powershell
$n=0; Get-Content tests/src/server/helpers.test.ts | ForEach-Object {
  $n += 1
  if (($n -ge 1082 -and $n -le 1129) -or ($n -ge 1151 -and $n -le 1164)) {
    Write-Output (([string]$n) + ':' + $_)
  }
}
```

Output:

```text
1082:	it('stores exactly the files its manifest declares, and nothing else', () => {
1087:			const entries = stageHost(checkout, host)
1088:			expect(listFiles(host)).toEqual(
1089:				[...entries.map((entry) => entry.storage), 'manifest.json'].sort(),
1090:			)
1117:	it('declares every directory nested beneath a vendored directory as a root', () => {
1121:			workspace.ensure('checkout/.claude/skills/orkestrel-falsify/references')
1124:			expect(readHostManifest(host)?.roots).toEqual(
1125:				expect.arrayContaining([
1126:					'.claude/skills',
1127:					'.claude/skills/orkestrel-falsify',
1128:					'.claude/skills/orkestrel-falsify/references',
1151:	it('refuses a checkout missing a vendored path, names every one, and creates nothing', () => {
1156:			workspace.remove('checkout/LICENSE')
1157:			workspace.remove('checkout/.cursor/rules')
1158:			expect(readErrorCode(() => stageHost(checkout, host))).toBe('TARGET')
1159:			expect(isPhysicalDirectory(host)).toBe(false)
1164:			expect(stageHost(checkout, host).length).toBeGreaterThan(0)
```