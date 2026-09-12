---
name: incident-repair
description: Diagnoses and repairs one NNOO bug or production incident with minimal scope, evidence, regression tests, and no unrelated changes.
---

# Incident Repair

1. Capture symptom, environment, time, user role, business context, and reproduction steps.
2. Protect sensitive information.
3. Inspect logs and recent changes.
4. Reproduce before editing where possible.
5. Identify root cause.
6. Write a failing regression test.
7. Apply the smallest safe fix.
8. Run targeted and related regression tests.
9. Document impact and rollback.
10. Update project records.

Do not use a hotfix to redesign architecture, upgrade major dependencies, or add features.
