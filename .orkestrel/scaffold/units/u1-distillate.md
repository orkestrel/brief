Canon conflict recorded in **Structural findings**: the brief names `orkestrel-falsify` and `orkestrel-harden-package` as conforming voice, yet those files contain aphorisms `AGENTS.md` forbids (e.g. `.agents/skills/orkestrel-falsify/SKILL.md:8` `Green gates prove a suite ran.`). Followed `AGENTS.md` as canon.

## 1. Conformance table

| Path                                                                    | Verdict | Defects |
| ----------------------------------------------------------------------- | ------- | ------- |
| `.agents/skills/orkestrel-human-journey/SKILL.md`                       | DEFECTS | 10      |
| `.agents/skills/orkestrel-human-journey/references/captures.md`         | DEFECTS | 1       |
| `.agents/skills/orkestrel-human-journey/references/layer.md`            | DEFECTS | 2       |
| `.claude/skills/orkestrel-human-journey/SKILL.md`                       | DEFECTS | 1       |
| `.agents/skills/enterprise-bootstrap/SKILL.md`                          | DEFECTS | 9       |
| `.agents/skills/enterprise-bootstrap/references/bootstrap-reference.md` | DEFECTS | 3       |
| `.agents/skills/enterprise-bootstrap/references/components.md`          | DEFECTS | 3       |
| `.agents/skills/enterprise-bootstrap/references/utilities.md`           | DEFECTS | 1       |
| `.agents/skills/orkestrel-build-application/references/application.md`  | DEFECTS | 1       |
| `.claude/rules/application.md`                                          | DEFECTS | 1       |

## 2. Defects

1. `.agents/skills/orkestrel-human-journey/SKILL.md:8` — `A journey drives the application through the interface a person has, and through nothing else.` — `Write every line as a directive: what to do, what to check, or what to refuse. Delete a line that does none of the three.` — `voice-human`

2. `.agents/skills/orkestrel-human-journey/SKILL.md:25` — `## The doctrine` — `Do not write aphorisms, metaphors, or rhetorical flourish.` — `aphorism` (nearest: the brief names a slogan heading; the class list has no `heading` class)

3. `.agents/skills/orkestrel-human-journey/SKILL.md:34` — `A refusal is a proof.` — `Do not write aphorisms, metaphors, or rhetorical flourish. An aphorism is a memory device for a person; it carries no instruction an agent can act on.` — `aphorism`

4. `.agents/skills/orkestrel-human-journey/SKILL.md:34` — `What the interface withholds is as much of its contract as what it offers.` — `Cut any clause written to persuade, reassure, or explain the rule to a person.` — `voice-human`

5. `.agents/skills/orkestrel-human-journey/SKILL.md:49` — `Put the layer in the workspace's browser test setup module and export every helper from there.` — `Give a rule one home. Restating it elsewhere creates two copies that drift` — `duplicate-rule` — other home: `.claude/rules/tests.md:162` `tests/setupBrowser.ts`: DOM/Vue/browser helpers and setup CSS.`

6. `.agents/skills/orkestrel-human-journey/SKILL.md:56` — `A dispatched synthetic event reaches handlers a person's input would never reach, and it cannot observe focus.` — `Cut any clause written to persuade, reassure, or explain the rule to a person.` — `voice-human`

7. `.agents/skills/orkestrel-human-journey/SKILL.md:65` — `Place them in the browser environment's integration.test.ts, whose scope is the directory it sits in.` — `Skills prescribe reusable process; they do not copy naming, placement, syntax, lifecycle, or test laws from AGENTS.md and rules.` — `duplicate-rule` — other home: `.claude/rules/tests.md:66-67` ``integration.test.ts` is a reserved filename at any level.` / `its scope is the directory it sits in.`

8. `.agents/skills/orkestrel-human-journey/SKILL.md:32` — `Internal state may corroborate a perception assertion; it never replaces one.` — `Give a rule one home.` — `duplicate-rule` — other home: `.claude/rules/tests.md:217` `Do not assert private state, internal timers, or framework scheduler internals.`

9. `.agents/skills/orkestrel-human-journey/SKILL.md:100` — `Name the block for what it proves — persistence, restart, storage failure — so a reader sees it is not a journey.` — `Cut any clause written to persuade, reassure, or explain the rule to a person.` — `voice-human`

10. `.agents/skills/orkestrel-human-journey/SKILL.md:103` — `never a mock of owned behavior.` — `Skills prescribe reusable process; they do not copy naming, placement, syntax, lifecycle, or test laws from AGENTS.md and rules.` — `duplicate-rule` — other homes: `AGENTS.md:49` `NEVER use mocks, behavioral fakes, module replacement, framework spies, or fake clocks to simulate project-owned behavior.` and `.claude/rules/tests.md:25` `Never use mocks, behavioral fakes, module replacement, or framework spies for project-owned or integrated behavior.`

11. `.agents/skills/orkestrel-human-journey/SKILL.md:129` — `the repository gates green, run by someone who did not write the journeys.` — `Give a rule one home.` — `duplicate-rule` — other homes: `.agents/orchestration.md:46` `The Orchestrator reconciles. No engine reconciles itself or accepts its own work.` and `.agents/skills/orkestrel-polish-surface/SKILL.md:79` `a fixer's own report never establishes green.`

12. `.agents/skills/orkestrel-human-journey/references/layer.md:3` — `The layer is the only door a journey has.` — `Do not write aphorisms, metaphors, or rhetorical flourish.` — `aphorism`

13. `.agents/skills/orkestrel-human-journey/references/layer.md:18` — `so a suite built on it passes while the interface is unusable.` — `Cut any clause written to persuade, reassure, or explain the rule to a person.` — `voice-human`

14. `.agents/skills/orkestrel-human-journey/references/captures.md:72` — `It is evidence for a review round, regenerated from the journeys whenever the surface changes.` — `Write every line as a directive: what to do, what to check, or what to refuse. Delete a line that does none of the three.` — `voice-human`

15. `.claude/skills/orkestrel-human-journey/SKILL.md:3` — `Use when accepting a UI build, proving an application end to end, proving keyboard-only reachability, proving what a screen refuses as well as what it does, auditing whether the interface speaks the user's vocabulary, or producing the screenshots a design review judges.` — `Keep provider bridges minimal: they load one canonical workflow and add no competing instructions.` — `bridge-bloat` (nearest: the bridge does not add process steps; it ships a different trigger list than `.agents/skills/orkestrel-human-journey/SKILL.md:3`, which also contains `or whenever the only evidence a screen works is a test that drove it through JavaScript instead of through the interface.`)

16. `.agents/skills/enterprise-bootstrap/SKILL.md:17` — `General-purpose guide for **intentional visual design** executed with **Bootstrap 5.3**: distinctive where it matters, disciplined everywhere else, utilities-first, accessible, and responsive.` — `Write every line as a directive: what to do, what to check, or what to refuse.` — `voice-human`

17. `.agents/skills/enterprise-bootstrap/SKILL.md:64` — `Critique again — remove one accessory (Chanel).` — `Do not write aphorisms, metaphors, or rhetorical flourish.` — `aphorism`

18. `.agents/skills/enterprise-bootstrap/SKILL.md:137` — `which is what makes them the safe choice` — `Cut any clause written to persuade, reassure, or explain the rule to a person.` — `voice-human`

19. `.agents/skills/enterprise-bootstrap/SKILL.md:137` — `but the stock danger fill clears the bar by hundredths` — `State the finding as the rule. Never record how it was found, which session found it, what was tried first, or what a probe proved. That history belongs in the commit message.` — `voice-history`

20. `.agents/skills/enterprise-bootstrap/SKILL.md:235` — `An outline button carrying a real action — it borrows the surface, so it reads on a plain light panel and fails in dark and on tinted surfaces` — `Give a rule one home.` — `duplicate-rule` — other home: `.agents/skills/enterprise-bootstrap/SKILL.md:137` `An action that carries information or consequence takes the solid variant.`

21. `.agents/skills/enterprise-bootstrap/SKILL.md:236` — `A tone class inside a primary fill — the fill supplies the contrast color and the class overrides it with a worse one` — `Give a rule one home.` — `duplicate-rule` — other home: `.agents/skills/enterprise-bootstrap/SKILL.md:147` `Carry no tone class inside such a fill`

22. `.agents/skills/enterprise-bootstrap/SKILL.md:239` — `A contrast reading taken from the first painted ancestor — a 3% tint read as full paint passes unreadable pairs and fails readable ones` — `Give a rule one home.` — `duplicate-rule` — other home: `.agents/skills/enterprise-bootstrap/references/bootstrap-reference.md:354` `a reader that stops at the first painted ancestor and drops its alpha treats that tint as full-strength paint.` Also `voice-history` on the `3% tint` probe figure.

23. `.agents/skills/enterprise-bootstrap/SKILL.md:298` — `## Key takeaways` — `Write every line as a directive: what to do, what to check, or what to refuse.` — `voice-human`

24. `.agents/skills/enterprise-bootstrap/references/bootstrap-reference.md:354` — `a card header and footer are a 3% tint of the body color over the card's own background` — `Never record how it was found … or what a probe proved.` — `voice-history`

25. `.agents/skills/enterprise-bootstrap/references/bootstrap-reference.md:354` — `Confident wrong verdicts are worse than no reader, because the run comes back green.` — `Cut any clause written to persuade, reassure, or explain the rule to a person.` — `voice-human`

26. `.agents/skills/enterprise-bootstrap/references/bootstrap-reference.md:361` — `A measurement that runs once is a rehearsal; the same reader wired into the suite is what keeps the answer true.` — `Do not write aphorisms, metaphors, or rhetorical flourish.` — `aphorism`

27. `.agents/skills/enterprise-bootstrap/references/components.md:115` — `An alert is a subtle fill, and a subtle fill degrades everything inside it one contrast notch` — `Give a rule one home.` — `duplicate-rule` — other home: `.agents/skills/enterprise-bootstrap/SKILL.md:146` `A subtle fill degrades everything inside it one notch.`

28. `.agents/skills/enterprise-bootstrap/references/components.md:191` — `Which variant an action takes is a contrast decision, not a taste one` — `Cut any clause written to persuade, reassure, or explain the rule to a person.` — `voice-human`

29. `.agents/skills/enterprise-bootstrap/references/components.md:1007` — `Carry no tone class inside the fill: the fill's own contrast color is the one measured against it, and every tone class laid over it lands lower` — `Give a rule one home.` — `duplicate-rule` — other home: `.agents/skills/enterprise-bootstrap/SKILL.md:147` `Carry no tone class inside such a fill`

30. `.agents/skills/enterprise-bootstrap/references/utilities.md:304` — `The plain text-success / text-danger / text-warning colors and text-body-tertiary are the decoration tier — none of them holds 4.5:1 across both themes` — `Give a rule one home.` — `duplicate-rule` — other home: `.agents/skills/enterprise-bootstrap/SKILL.md:143` `Plain text-success and text-danger miss the bar across the dark theme` and `.agents/skills/enterprise-bootstrap/SKILL.md:145` `text-body-tertiary carries no information anywhere: it measures under 4.5:1`

31. `.agents/skills/orkestrel-build-application/references/application.md:37` — `startApplicationServer in factories.ts` — `Skills prescribe reusable process; they do not copy naming, placement, syntax, lifecycle, or test laws from AGENTS.md and rules.` — `duplicate-rule` — other home: `.claude/rules/application.md:52` `The startApplicationServer convenience factory belongs in factories.ts.` Changed line also conflicts with `.claude/rules/architecture.md:66` `Every exported function in factories.ts is named create*.` (`startApplicationServer` is not `create*`). Nearest class: `duplicate-rule`.

32. `.claude/rules/application.md:52` — `The startApplicationServer convenience factory belongs in factories.ts.` — `Give a rule one home.` — `duplicate-rule` (nearest: the two homes now disagree on naming) — other home: `.claude/rules/architecture.md:66` `Every exported function in factories.ts is named create*.`

Dropped below this cap: checklist rows that restate defects 20–22; five-states / feedback restatements already in `bootstrap-reference.md`; `Portability` and `Design principles` slogans that were not in the diff; `Writing (interface copy)` restating `references/frontend-design.md:59`; `captures.md:74` `A round judged against a mixed portfolio, part old and part new, decides nothing.` (finding-as-rule, left unflagged).

## 3. Structural findings

- **Missing sibling.** Every other skill under `.agents/skills/` ships `agents/openai.yaml` (seven files, including `enterprise-bootstrap` and `orkestrel-polish-surface`). `.agents/skills/orkestrel-human-journey/` has none. `.claude/rules/documentation.md:68`: `Validate every referenced resource and agents/openai.yaml`.

- **Harness trigger mismatch.** `.claude/skills/orkestrel-human-journey/SKILL.md:3` omits the canonical trigger `or whenever the only evidence a screen works is a test that drove it through JavaScript instead of through the interface.` The body also says `Follow that canonical package before acting.` (`.claude/skills/orkestrel-human-journey/SKILL.md:9`); the conforming bridges say `Follow that canonical workflow before acting.` (`.claude/skills/orkestrel-falsify/SKILL.md:8`, `.claude/skills/orkestrel-harden-package/SKILL.md:8`).

- **References are reachable** from `.agents/skills/orkestrel-human-journey/SKILL.md:19-20` (`references/layer.md`, `references/captures.md`). Both files exist. `layer.md:133` links `captures.md`. No nested `references/` depth. `enterprise-bootstrap` `SKILL.md:24` links `references/frontend-design.md`; that file exists. No `model-routing`, no template TODOs, no extra frontmatter keys.

- **`SKILL.md` length vs skill contract.** `.claude/rules/documentation.md:65`: `Keep SKILL.md concise and route conditional detail to one-level references/`. `.agents/skills/enterprise-bootstrap/SKILL.md` is 304 lines; the named reference shape is `.agents/skills/orkestrel-harden-package/SKILL.md` at 68 lines. Contrast/glyph/dialog rules added in this diff live in `SKILL.md` and are then copied into `components.md` / `utilities.md` / the anti-pattern list.

- **Canon vs named reference-voice.** `.agents/skills/orkestrel-falsify/SKILL.md:8` `Green gates prove a suite ran. They prove nothing about the claim the work makes.` matches the aphorism clause used above. The brief called that file conforming. `AGENTS.md` outranked the brief’s implied voice bar.

## 4. Overlap report

**Unknown 1 — `orkestrel-human-journey` vs existing skills and `.agents/orchestration.md`.** Overlap exists. No ruling.

Capture-portfolio ownership:

- `.agents/skills/orkestrel-human-journey/SKILL.md:40` `The portfolio is generated by the acceptance journeys.`
- `.agents/skills/orkestrel-human-journey/SKILL.md:115` `Reviewing the portfolio is the orkestrel-polish-surface campaign. This skill only generates it.`
- `.agents/skills/orkestrel-human-journey/references/captures.md:3` `Every screenshot comes from an acceptance journey`
- `.agents/skills/orkestrel-polish-surface/SKILL.md:50` `Build the portfolio. Produce the full evidence set with the harness reference`
- `.agents/skills/orkestrel-polish-surface/references/capture-harness.md:3` `The harness produces the only evidence the verdict lanes are allowed to judge.`
- `.agents/orchestration.md:421` `For any claim about a rendered or externally driven surface, the capture portfolio is the review input and source is corroboration.`
- `.agents/skills/orkestrel-falsify/SKILL.md:57` `a rendered or externally driven surface | the capture portfolio as primary, source as corroboration`

Browser-drive / test-placement / real-implementation overlap:

- `.agents/skills/orkestrel-human-journey/SKILL.md:49` setup-module placement vs `.claude/rules/tests.md:162`
- `.agents/skills/orkestrel-human-journey/SKILL.md:65` `integration.test.ts` vs `.claude/rules/tests.md:66-67`
- `.agents/skills/orkestrel-human-journey/SKILL.md:103` `never a mock` vs `AGENTS.md:49` and `.claude/rules/tests.md:25`
- `.agents/skills/orkestrel-human-journey/references/layer.md:18` `Never dispatch a constructed event.` vs `.claude/rules/tests.md:214` `Centralize event factories: createPointerEvent, createDragEvent, typeInput, fireTransitionEnd.`
- `.agents/skills/orkestrel-human-journey/SKILL.md:129` independent gates vs `.agents/orchestration.md:46` and `.agents/skills/orkestrel-polish-surface/SKILL.md:79`

**Unknown 2 — `.claude/rules/application.md` and `orkestrel-build-application/references/application.md`.** The diffs do not mention journeys, captures, the browser test layer, or `orkestrel-human-journey`. Both edits relocate `startApplicationServer` from `handlers.ts` to `factories.ts` and drop the old reason (`factories.ts` admits only `create-prefixed construction`).

Before (skill reference): ``startApplicationServer`in`handlers.ts`, because `factories.ts`admits only`create`-prefixed construction`

After (skill reference, `.agents/skills/orkestrel-build-application/references/application.md:37`): ``startApplicationServer` in `factories.ts``

Before (rule): ``startApplicationServer`belongs in`handlers.ts`beside the other process-lifecycle functions, because`factories.ts`admits only`create`-prefixed construction and this one starts a signal-owning resource.`

After (rule, `.claude/rules/application.md:52`): `The startApplicationServer convenience factory belongs in factories.ts.`

That is a placement-law change. It is unrelated to the new skill on the words in the diff.
