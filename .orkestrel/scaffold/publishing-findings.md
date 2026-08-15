# `@orkestrel/scaffold` — three publishing findings from the `@orkestrel/brief` 0.0.1 release

Raised by the first publish of `@orkestrel/brief` (0.0.1) and the `@orkestrel/scaffold` 0.0.35
release that preceded it, 2026-08-14/15. All three belong in `.agents/orchestration.md` under
**Publishing the fleet**, because each one either blocks the documented flow or produces a false
failure reading the contract does not warn about.

## 1. `script(1)` does not exist on Windows Git Bash, so the documented publish flow cannot run there

The contract requires: "Run the login and every publish under `script -qfc '<command>' <log>`.
npm offers the approval only when it sees a TTY; without one it fails `EOTP` with no way to
answer."

Observed: Git Bash on Windows ships no `script` binary. Every in-session `npm publish` attempt
failed `EOTP` exactly as the contract predicts for a TTY-less run — including the operator's own
attempt through the session's `!` prefix, which runs in the same TTY-less shell. The publish
succeeded only from an external terminal the operator opened themselves.

This is the same class as the `setsid` gap: the contract names a POSIX tool the host does not
have, and the flow that depends on it is unreachable rather than degraded.

The fifo half of the flow is NOT implicated. Holding stdin open with a fifo and a long `sleep`
worked for `npm login` on this host and remains required — EOF still drops npm to the legacy
prompt.

**Proposal.** State the platform boundary in the contract: on a Windows Git Bash host the upload
step is operator-driven. The Orchestrator prepares the layer, proves the gates, surfaces the exact
`npm publish` command, and the operator runs it in a real terminal. Everything before and after
the upload (bumping, re-pinning, gates, registry reads) stays with the Orchestrator.

## 2. A first publish propagates slower than a bump, and 404 during the lag is not failure

The contract says: "Re-read the registry before telling the user a package failed." It sets no
waiting period and does not distinguish the case where the wait matters most.

Observed: `@orkestrel/scaffold@0.0.35` (a version bump on an existing packument) was readable
seconds after upload. `@orkestrel/brief@0.0.1` (a first publish, which creates the packument)
returned 404 across three reads over roughly a minute, including one straight at
`registry.npmjs.org` — and had in fact succeeded. The Orchestrator reported a publish failure
that had not happened, and the operator corrected it.

**Proposal.** Add to the registry-read law: a first publish creates the packument and can serve
404 for minutes after success. For a package with no prior version, treat 404 as pending rather
than failed; re-read on an interval before reporting either way. A bump serving the OLD version
is CDN lag, same rule.

## 3. `npm publish` rewrites an invalid `bin` and warns as if it dropped it

Observed on the `@orkestrel/scaffold` 0.0.35 upload: npm warned that it "removed" / corrected the
`bin` entry during packing. The warning reads as the CLI shipping without its executable. The
registry copy showed the corrected `bin` intact, and the published CLI worked; the warning was
cosmetic normalization of a `./`-prefixed path. Only a registry read could distinguish the two,
and the warning text points the wrong way.

Fixed at source in scaffold `6ea7230` (the path normalized so npm has nothing to correct). The
finding that generalizes: a publish-time warning about manifest rewriting is settled by reading
the registry's copy of the manifest, never by reading the warning.

**Proposal.** One line beside "Read the result from the registry, not from an exit code": read
warnings the same way — a pack-time normalization warning is ruled on by fetching the published
manifest, not by its own text.

## Status

**Raised, not landed.** All three are edits to `.agents/orchestration.md` in the `scaffold`
repository's host inventory. They reach this checkout on the next `@orkestrel/scaffold` release
plus `repair`.
