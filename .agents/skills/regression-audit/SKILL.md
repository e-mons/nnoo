---
name: regression-audit
description: Independently checks a completed NNOO feature for correctness, security, cross-platform consistency, and regressions before acceptance.
---

# Regression Audit

Compare implementation with the approved specification, acceptance criteria, architecture, security baseline, tranche scope, and completed earlier features.

Test happy path, validation failures, permission failures, wrong-business access, network/API failure, duplicate submission, mobile/web consistency, admin restrictions, provider failures, and related regressions.

Create an acceptance report with scope, commands, automated results, manual results, security findings, defects fixed, blockers, and one final result: `PASS`, `PASS WITH NON-BLOCKING NOTES`, or `FAIL`.

Never use PASS when a critical criterion is untested.
