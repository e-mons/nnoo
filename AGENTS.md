# NNOO Project Operating Rules

Owner and software developer: **David Bako**  
Project: **NNOO**  
Status: **Authoritative workspace instruction file**  
Governance version: **1.0.0**

## 1. Mission

Build the agreed NNOO production system safely, one tranche and one approved feature at a time.

The system consists of:

- One combined Next.js web application containing public marketing pages, authentication, the complete business application, the NNOO administration area, and versioned server API routes.
- One React Native Expo mobile application.
- One shared Supabase backend, database, authentication system, storage system, and business record source per environment.
- Shared TypeScript contracts, validation, business rules, and generated database types.
- Paystack, Gemini API, and Inngest only through controlled server-side integrations.

## 2. Read before editing

Before planning or changing code, read:

1. `docs/project/PROJECT_STATE.md`
2. `docs/project/TRANCHE_PLAN.md`
3. `docs/project/FEATURE_LEDGER.md`
4. `docs/project/ARCHITECTURE.md`
5. `docs/project/STACK_AND_VERSIONS.md`
6. `docs/project/DEFINITION_OF_DONE.md`
7. Relevant `.agents/rules/` files
8. The approved feature specification and relevant decisions

Repository documents are the durable source of truth. Do not rely on chat history alone.

## 3. One-feature rule

- Work on one feature only.
- Do not start the next feature automatically.
- Do not combine unrelated features.
- Do not perform a broad refactor unless required for the approved feature and stated in the plan.
- Record newly discovered work in the ledger instead of silently building it.
- Stop after the current feature passes or is honestly reported as blocked.

## 4. Tranche control

- Work only inside the active tranche in `PROJECT_STATE.md`.
- Do not build a later-tranche feature without explicit approval.
- A tranche cannot close while a critical acceptance test fails.
- Every later change must prove completed earlier behaviour still works.

## 5. Repository shape

```text
apps/
  web/       # The only Next.js app
  mobile/    # The only Expo app
packages/
  contracts/
  domain/
  validation/
  supabase/
  config/
  design-tokens/
  test-utils/
supabase/
  migrations/
  functions/
  tests/
docs/
  project/
  features/
.agents/
  rules/
  skills/
  workflows/
```

Do not create another web app, admin app, mobile app, database, or duplicate backend.

## 6. Web boundaries

Inside `apps/web`, use clear route groups:

```text
src/app/
  (marketing)/
  (auth)/
  (app)/
  (admin)/
  api/v1/
```

- Marketing routes are public.
- Business routes require a valid active business membership.
- Admin routes require an authorised NNOO admin role.
- UI hiding is not authorization. Server checks and RLS must also pass.
- Keep private data and server-only modules out of client bundles.

## 7. Mobile boundaries

Inside `apps/mobile`, use one Expo Router application:

```text
app/
  (auth)/
  (onboarding)/
  (app)/
```

- Use the same Supabase project and API contracts as the web app.
- Store sessions in approved secure native storage.
- Never ship server secrets in the mobile bundle.
- Use honest loading, offline, retry, and error states. Never fake success.

## 8. Shared backend and business logic

- Supabase is the system of record.
- Business-owned rows use the approved tenant key, normally `business_id`.
- RLS is mandatory on every exposed business table.
- Do not trust a client-supplied business ID without validating membership.
- Put calculations in shared domain code, database functions, or one canonical server service.
- Do not copy profit, stock, invoice, score, subscription, or payment rules separately into web and mobile.
- Refresh shared generated database types after schema changes.
- Breaking contract changes need a compatibility plan and decision record.

## 9. Supabase MCP and migrations

Use the configured Supabase MCP Server for live development database, authentication, storage, policy, and function work. The canonical project reference is `hoorlxgtnamwdxszsbwt` (NNOO Bus Project) under organization `ggxbxqtzlevaceudwnri`. Under no circumstances should any other Supabase project or credentials be used for this project.

For every database change:

1. Inspect the current development schema through MCP.
2. Write a versioned migration in `supabase/migrations/`.
3. Review data and compatibility impact.
4. Apply through MCP to development.
5. Add or update RLS policies.
6. Add database and tenant-isolation tests.
7. Regenerate shared types.
8. Run web, mobile, API, and regression checks.
9. Record the change in project documentation.

Never leave a live MCP change without a matching repository migration. Never change production schema or data without explicit approval, backup, and a written rollout and rollback plan.

## 10. Security

Never expose:

- Supabase secret or service-role credentials.
- Paystack secret keys.
- Gemini API keys.
- Inngest signing or event keys.
- Private admin credentials.
- Sensitive unredacted data in logs.

Use least privilege, server-side authorization, RLS, validation, rate limits, controlled uploads, audit logs, and tenant isolation. Important financial and admin actions require an auditable actor, time, target, and result.

## 11. Paystack

- Initialize payments on the server.
- Verify payments on the server.
- Validate webhook signatures before processing.
- Match reference, amount, currency, business, plan, and expected state.
- Make webhook and fulfilment handling idempotent.
- Never trust redirects, client callbacks, or a client-side success flag.
- Never deliver value twice.

## 12. Gemini AI

- Call Gemini from trusted server code only.
- Keep the selected model in environment configuration.
- Validate structured output before use.
- Database and domain code calculate financial totals and scores. Gemini may explain verified results; it must not invent authoritative figures.
- AI-suggested financial entries require user confirmation when information is inferred or uncertain.
- Record prompt/model version, status, and user correction without leaking secrets or unnecessary private data.
- AI failure must not corrupt a financial record.

## 13. Inngest

Do not add Inngest automatically. Add it only after a written decision proves a durable background job, schedule, retryable multi-step process, or long-running AI task is required.

Every Inngest function must have validated events, idempotency, retry behaviour, concurrency controls where needed, failure visibility, safe replay, and tests.

## 14. Dependency policy

- Use the latest stable compatible versions at initial scaffold time.
- Pin exact resolved versions in the lockfile and package-manager field.
- Do not use beta, canary, RC, or experimental packages in production paths without approval.
- Do not perform automatic major upgrades during a feature.
- Use the dedicated safe-upgrade workflow.
- Keep a rollback point.

## 15. Coding standards

- Strict TypeScript. Avoid `any`; justify rare exceptions.
- Validate every external input and AI/provider output.
- Keep domain logic independent of UI.
- Prefer small, named, testable functions.
- Use accessible interfaces and keyboard-safe web interactions.
- Provide real loading, empty, error, and retry states.
- Do not leave production mock data, placeholders, inactive buttons, fake payment success, simulated AI results, silent catches, or commented-out required logic.
- Reuse existing components and utilities before creating duplicates.

## 16. Git safety

Before editing:

- Check the current branch and `git status`.
- Do not overwrite uncommitted user work.
- Do not use destructive reset, force push, history rewrite, or broad deletion.
- Use a focused feature branch.
- Do not deploy from a dirty or failing tree.

## 17. Required quality gates

A feature is not complete until all applicable checks pass:

- Formatting.
- Linting.
- Strict TypeScript checking.
- Unit tests.
- Database and RLS tests.
- Integration tests.
- Web production build.
- Mobile tests and Expo Doctor.
- Relevant end-to-end journeys.
- Security checks.
- Cross-platform consistency.
- Regression checks for completed features.
- Documentation sync.

If a required command does not yet exist, create it during Tranche 1 or report the missing gate. Do not claim success without evidence.

## 18. Required documentation update

After every completed feature, update:

- `PROJECT_STATE.md`
- `FEATURE_LEDGER.md`
- `TEST_MATRIX.md`
- `CHANGELOG.md`
- `PROMPT_LOG.md`
- Feature specification and acceptance report
- `DECISION_LOG.md` when architecture or scope changes
- `STACK_AND_VERSIONS.md` when dependencies change
- `SECURITY_BASELINE.md` when controls change
- `SKILLS_REGISTRY.md` when skills change

Documentation is part of completion.

## 19. Stop conditions

Stop and ask David Bako for a decision when:

- Requirements conflict.
- A completed contract would break.
- A destructive migration is required.
- Production access is required.
- A new paid service is required.
- A major upgrade is required.
- External credentials or approvals are missing.
- Security cannot be proven.
- Required tests cannot pass.
- The request belongs to a later tranche.
- The request is too large for one safe feature.

## 20. Final report

At the end of a task, report:

1. Scope completed.
2. Files changed.
3. Migrations and policies changed.
4. Tests and builds run with real results.
5. Manual checks completed.
6. Remaining limitations or blockers.
7. Documentation updated.
8. Exact next recommended feature, without starting it.
