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

That default is too narrow to run a campaign under, so every target diverges from it — and
because the file is vendored byte-for-byte, every divergence is reverted without warning.

Observed: the `brief` operator set `"defaultMode": "bypassPermissions"` and accumulated ~70
allow entries over one campaign. `npx scaffold audit` then reported

```
.claude/settings.json  orchestration  stale
1 of 109 planned paths drifted from the plan.
```

and the next `repair` would revert all of it without warning. The campaign hit this only
because it happened to run an audit; nothing warns at `repair` time.

**Two ways to fix it, and the fleet owner took the second.**

_Rejected:_ vendor `.claude/settings.json` for existence rather than bytes, or vendor only the
fleet-uniform keys and leave `defaultMode` and `allow` to the target. This preserves the vendored
default and lets targets diverge.

_Taken:_ make the vendored default good enough that no target needs to diverge. The settings that
had accumulated in `brief` and `reason` — `bypassPermissions` plus a ~90-entry allow list covering
the whole gate chain, the bench probes, and the read-only IDE queries — are now the canonical
vendored copy, byte-for-byte, and `repair` overwrites a target with them deliberately.

That inverts the defect: a target diverging from the vendored settings is now the anomaly rather
than the norm, and the drift this file was raised about disappears once each target re-pins.

**The consequence, stated because it is a posture change, not a convenience.** `defaultMode` is a
FLEET default now, so every workspace scaffold generates or repairs runs with permission checks
bypassed. That is right for a fleet whose repositories are all operator-owned. It is not right for
a repository an untrusted contributor clones and opens in an agent harness, and any such
repository must override `defaultMode` in its own `.claude/settings.local.json`.

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

**All four LANDED** in `scaffold`: defects 2, 3 and 4 at `ad2136a`, defect 1 at `91632b3`.

Defect 3's fix is kept alongside defect 1's: the vendored copy carries the full allow list AND
omits the three `settings.local.json` deny lines, so an agent can still write that file where a
target genuinely needs to override the fleet default.

All four reach this checkout only on the next `@orkestrel/scaffold` release plus `repair`.

## The drift standing in this checkout

`npx scaffold audit` still reports `.claude/settings.json` drifted here, and no hand migration is
needed any more: this checkout's copy is now what scaffold vendors, minus the three deny lines
scaffold dropped and the allow entries scaffold added. Re-pinning a release carrying those commits
and running `repair` closes the drift by overwriting this file with the canonical one.
