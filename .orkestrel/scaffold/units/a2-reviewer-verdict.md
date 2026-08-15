# A2 — subjective lane verdict (reviewer, verbatim, condensed to substance)

**Claim 1 — Voice closed. BROKEN.** The sweep is a large net win (nine A1 instances gone). But
"zero" is falsified, and the recast introduced two instances: `frontend-design.md:35` and `:103`
"earns its place" (personification, both newly introduced, reading as a house idiom); `:63` a
three-fold "each…each…each" anaphora built from the baseline's plain plural; `:52` "taxes every
user on every visit" (metaphor; the concrete cost — scan time on every visit — was available).
Struck on test rather than sweep: "Spend the boldness" (`:91`), "spend that freedom" (`:65`),
"spend the aesthetic risk" (`:52`) — the spend/budget vocabulary is load-bearing and consistent
across the package; it encodes that there is one unit of risk to allocate. Mechanism, not
decoration. Retaining it is right.

**Claim 2 — Nothing lost. BROKEN.** Every threshold and steering decision traced survives — except
"the hero is a thesis": the word `thesis` no longer appears in `frontend-design.md`, while
`SKILL.md:52` still steers with "thesis-hero" and `SKILL.md:60` indexes "hero and thesis" as
content that "lives in frontend-design.md". A term of art with two live call sites and no
definition. Fix: restore the concept in imperative voice, or strike both call sites. Do not leave
one half.

**Claim 3 — Pointers sound. CONFIRMED.** Both land on real law; skill-specific content stayed; the
deleted rationale was rationale. Cost recorded as F1.

**Claim 4 — Anti-pattern deletion covered. BROKEN.** The faux-widget bullet is fully owned
(`bootstrap-reference.md:574-581` + `components.md:990`). The decoration bullet's rule survives
but its four specimens do not: package-wide search finds no `emoji`, no `pill soup`, `glow` only
as `placeholder-glow`, `gradient` only as Bootstrap classes. "A general 'cut decoration that does
not serve the brief' is rationalizable; 'no emoji' is not, which is the whole reason the specimen
list existed." Secondary: `SKILL.md` now has no route to the hand-roll ladder.

**Claim 5 — Gate edits. NOT-EVIDENCED** (no shell). Source-readable parts read correct: `family`
gone everywhere, derivation from `rule` is the right shape and closes a drift channel.

**Claim 6 — Documented = enforced. CONFIRMED.** Walked both directions; three bullets match
enforcement including order, indent, non-emptiness, escape, and token. (Superseded by Sol's
`$samplex` counterexample on the token half — substring, not token, match.)

**Claim 7 — Scope. CONFIRMED.**

**F1** — the two law pointers are bare repo-root paths in a package whose own text promises "the
paths are tooling-specific, the content is not"; every other cross-file pointer is a relative
link. Fix shape: state the rule in one clause, cite the law as its owner, so the sentence steers
where the file is absent. **F2** — `SKILL.md:70` still carries "higher-confidence directions", the
stale copy of the criterion the recast replaced with a concrete gate. **F3** —
`documentation.md:68`'s yaml half now restates the three exact bullets imprecisely; trim to the
referenced-resource rule it uniquely owns.

VERDICT: 3 CONFIRMED, 3 BROKEN, 0 UNRESOLVED, 1 NOT-EVIDENCED
