---
name: feature-delivery
description: Plans and implements one approved NNOO feature inside the active tranche, with cross-platform checks, tests, and documentation.
---

# Feature Delivery

1. Read root `AGENTS.md` and project state.
2. Confirm the feature exists in the active tranche.
3. Inspect relevant code before proposing edits.
4. Create `docs/features/<feature-id>-<slug>.md` from the feature template.
5. Define exact in-scope and out-of-scope behaviour.
6. Map web, mobile, admin, API, database, security, payment, AI, and background-job impact.
7. Obtain approval before implementation when the specification is new or materially changed.
8. Implement the smallest complete vertical slice.
9. Use shared contracts and domain logic.
10. Run all applicable quality gates.
11. Create an acceptance report.
12. Run the project documentation sync skill.
13. Stop.

Hard rules: one feature only, no unrelated refactor, no fake data or simulated success, no silent schema change, and no completion claim without evidence.
