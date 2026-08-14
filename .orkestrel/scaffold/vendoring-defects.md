# `@orkestrel/scaffold` — four defects in the vendored host inventory

Raised by the `@orkestrel/brief` hardening campaign, commits `1abfc6d`..`8d2739b`.
Every claim below was checked against `node_modules/@orkestrel/scaffold/dist/host/` at
`@orkestrel/scaffold` 0.0.33 and against `npx scaffold audit` in the `brief` checkout.

## 1. `.claude/settings.json` is vendored byte-for-byte, so a target cannot keep its own permissions

`dist/host/claude/settings.json` ships:

```json
"defaultMode": "auto",
"allow": ["Bash(codex --version)", "Bash(codex login *)"]
```

`defaultMode` and `allow` are per-machine, per-operator choices. `defaultMode` in particular
decides whether a session runs with bypassed permissions, which is the operator's decision and
cannot be a fleet default.

Observed: the `brief` operator set `"defaultMode": "bypassPermissions"` and accumulated ~70
allow entries over one campaign. `npx scaffold audit` then reported

```
.claude/settings.json  orchestration  stale
1 of 109 planned paths drifted from the plan.
```

and the next `repair` would revert all of it without warning. The campaign hit this only
because it happened to run an audit; nothing warns at `repair` time.

**Proposal.** Vendor `.claude/settings.json` for EXISTENCE rather than bytes, or vendor only
the keys that are genuinely fleet-uniform (`$schema`, `enableAllProjectMcpServers`, `deny`) and
leave `defaultMode` and `allow` to the target. The audit already supports an existence-only
comparison — it reports "compared bytes at 99, existence at 4, and nothing at 6".

## 2. `.gitignore` is vendored and does not ignore `.claude/settings.local.json`

`.claude/settings.local.json` is the supported home for a target's own permissions: Claude Code
reads it, and it is NOT in the vendored plan, so `repair` leaves it alone. It is therefore the
correct answer to defect 1 — and the vendored `.gitignore` does not ignore it, so a per-operator
permission file becomes an untracked file in every target forever, or worse, gets committed.

The existing `*.local` pattern does not match `settings.local.json`.

**Proposal.** Add `.claude/settings.local.json` to the vendored `.gitignore`.

## 3. The vendored deny rule makes `settings.local.json` unwritable, so defect 2's answer cannot be applied by an agent

`dist/host/claude/settings.json` denies `Read(settings.local.json)` and
`Read(**/settings.local.json)`. Sensible as secrets hygiene — but the deny also blocks WRITING
the file. Attempting to create `.claude/settings.local.json` from inside a session fails with

```
File is covered by a Read deny rule in your permission settings and cannot be written.
```

So the one supported, repair-proof home for a target's permissions can only be created by the
operator by hand, and an agent cannot migrate a target onto it. Defects 1, 2 and 3 compound: the
vendored file is the only writable home, editing it is reverted, and the correct home is sealed.

**Proposal.** Narrow the deny to reads that could exfiltrate a secret while leaving the path
writable, or exempt `.claude/settings.local.json` specifically. It holds permission grants, not
credentials — the credential paths beside it in the deny list (`.env`, `.npmrc`, `auth.json`,
`*.pem`) are the ones that need sealing.

## 4. `orkestrel-falsify` is the only skill with no `agents/openai.yaml`

`dist/host/agents/skills/` ships seven skills. Six carry an `agents/openai.yaml`;
`orkestrel-falsify` does not. `.claude/rules/documentation.md` requires every skill to validate
"every referenced resource and `agents/openai.yaml`".

The gap is in the vendored surface, so it has propagated to every target. The skill family does
not read as one system to a Codex-side reader, because one member has no Codex-side entry — and
it is the member that owns adversarial audit rounds, which is the skill this campaign leaned on
hardest.

**Proposal.** Add `agents/openai.yaml` to `orkestrel-falsify`, matching its six siblings.

## Why this file is here

All four defects live in files `scaffold` vendors. Editing them in a target propagates nothing —
`repair` reverts the edit and `audit` reports it as drift, which is defect 1 recurring. They have
to be fixed in the `scaffold` repository's host inventory.

## Status

Defects 2, 3 and 4 are **LANDED** in `scaffold` at `ad2136a`: the deny rule no longer seals
`.claude/settings.local.json`, the vendored `.gitignore` ignores it, and `orkestrel-falsify` has
its `agents/openai.yaml`. `.agents/orchestration.md` now names `settings.local.json` as the
destination for a target's own permissions.

Defect 1 is **open by decision.** `.claude/settings.json` is still vendored byte-for-byte;
narrowing it to existence-only, or to the fleet-uniform keys, changes what every target inherits
and belongs to the fleet owner rather than to this debrief.

All four reach this checkout only on the next `@orkestrel/scaffold` release plus `repair`.

## The drift standing in this checkout

`.claude/settings.json` here still carries `bypassPermissions` and ~70 allow entries, so
`npx scaffold audit` reports 1 of 109 drifted. That is deliberate: reverting it before the
operator's permissions have somewhere else to live would silently strip grants they set.

The migration, once this checkout re-pins a `scaffold` release carrying `ad2136a`: create
`.claude/settings.local.json` with a `permissions` object holding the `defaultMode` and `allow`
list currently in `.claude/settings.json`, then restore `.claude/settings.json` from
`node_modules/@orkestrel/scaffold/dist/host/claude/settings.json`. Claude Code reads
`settings.local.json` as a settings source, `repair` does not touch it, and the vendored
`.gitignore` now keeps it out of the tree.
