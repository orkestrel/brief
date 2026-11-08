Each item is a chunk that reaches green before the next. An item keeps its number for life: a closed
item leaves this file and its number is never reused, so a commit message citing an item by number
stays true.

- **1.** After the shared standing-proof observation mechanism lands in `@orkestrel/test`, adopt it for `BRIEF_CONTRACT_CASES` in `tests/setup.ts` and `tests/src/core/shapers.test.ts`. Keep owned snapshot restoration, ready-state, gap, and parser behavior local.
- **2.** At the next package visit, adopt `createHostileValues` from `@orkestrel/test` for overlapping exceptional objects in `buildAdversarialValues` in `tests/setup.ts` and its mirrored proofs. Keep scalar refusal data and the own `__proto__` control local; replace construction only where acceptance and identity expectations match.
