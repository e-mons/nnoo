# NNOO Antigravity Governance Pack

Prepared for **David Bako**  
Project: **NNOO — Africa's AI Business Operating System**  
Pack version: **1.0.0**  
Prepared: **4 August 2026**

## Purpose

This pack gives Google Antigravity a stable working system for building NNOO one tranche and one feature at a time. It keeps the single web application, single mobile application, shared Supabase backend, API contracts, payments, AI functions, tests, documentation, and releases aligned.

No instruction file can make software literally impossible to break. This pack reduces that risk by forcing small approved changes, migrations, shared contracts, tests, documentation updates, and clear stop conditions.

## Install

1. Copy this whole folder, including the hidden `.agents` folder, into the NNOO Git repository root.
2. Keep `AGENTS.md` at the repository root.
3. Open the repository as one Antigravity workspace.
4. Confirm workspace skills and workflows are detected.
5. In Antigravity Customizations, mark `.agents/rules/*` as **Always On** where an activation choice is requested.
6. Confirm the existing Supabase MCP Server connection is available before any database or authentication work.
7. Begin with the repository skeleton only. Do not begin product features before the Tranche 1 foundation passes.

## Normal feature cycle

1. Run `/start-feature`.
2. Review and approve the feature specification.
3. Implement that feature only.
4. Run `/finish-feature`.
5. Review the acceptance report.
6. Move to another feature only after the current feature is green.

At the end of a tranche, run `/close-tranche`.

## Permanent application shape

- **One Next.js application** in `apps/web` for marketing, authentication, business users, NNOO administrators, and versioned APIs.
- **One React Native Expo application** in `apps/mobile`.
- **One shared Supabase backend per environment**.
- **Shared TypeScript contracts, validation, database types, and business rules**.

The administration area is not a separate Next.js app. The mobile product is not split into separate apps.

## Files updated after every completed feature

- `docs/project/PROJECT_STATE.md`
- `docs/project/FEATURE_LEDGER.md`
- `docs/project/TEST_MATRIX.md`
- `docs/project/CHANGELOG.md`
- `docs/project/PROMPT_LOG.md`
- The feature specification and acceptance report
- Decision, version, security, contract, and skill records when affected

## Human approval

David Bako remains the final approver for scope, destructive database changes, architecture changes, new paid services, major upgrades, production deployment, and tranche closure.
