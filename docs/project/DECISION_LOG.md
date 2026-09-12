# Architecture and Product Decision Log

## ADR-001 — One combined web application

Date: 4 August 2026  
Status: Accepted

Use one Next.js application for marketing, authentication, business application, NNOO administration, and versioned server APIs. This reduces duplicated configuration, deployment, authentication, UI, and contract drift while preserving route and authorization boundaries.

## ADR-002 — One mobile application

Date: 4 August 2026  
Status: Accepted

Use one React Native Expo application. Do not create separate customer or admin mobile projects unless a later approved requirement proves the need.

## ADR-003 — Shared Supabase backend

Date: 4 August 2026  
Status: Accepted

Web and mobile use the same Supabase environment, records, authentication, storage, and shared contracts. Live development changes use the connected MCP Server and remain represented by repository migrations.

## ADR-004 — Tranche and one-feature delivery

Date: 4 August 2026  
Status: Accepted

Build one approved feature at a time inside the active tranche. Close each feature and tranche through test and documentation gates.

## ADR-005 — Inngest is conditional

Date: 4 August 2026  
Status: Accepted

Do not include Inngest by default. Add it only for an approved durable background or scheduled workflow.

## ADR-006 — Server-only Google Gemini AI Foundation & Non-Authoritative Principle

Date: 17 August 2026  
Status: Accepted

1. **Server-Only Integration:** Google Gemini API (`@google/genai`) and `GEMINI_API_KEY` live strictly on the server (`apps/web/src/server/ai/`). Client browsers and Expo mobile bundles must never receive provider credentials or call Gemini directly.
2. **NNOO Computes, Gemini Explains:** Deterministic database ledgers and domain services calculate authoritative financial figures, sales, inventory, and balances. Gemini provides explanations, summaries, and suggestions only.
3. **Structured Outputs & Runtime Validation:** Machine responses require strict schema validation via Zod before consumption by application logic.
4. **Tool Safety & Read-Only Default:** AI tool allowlist defaults to read-only with independent server authorization. Financial mutation tools and arbitrary SQL execution are prohibited.
5. **Observability:** Invocations write diagnostic metadata to `public.ai_invocations` without storing full raw prompts or private business responses by default.

## ADR-007 — AI Bookkeeper Suggestion-Only Architecture & Candidate Keys

Date: 17 August 2026  
Status: Accepted

1. **AI Bookkeeper Suggestion ≠ Accounting Transaction:** AI Bookkeeper classification produces structured suggestions in `public.ai_bookkeeping_classifications` with `requiresHumanReview: true`. Under no circumstances does the AI classifier create, post, or mutate Sales, Expenses, Stock Receipts, Invoices, Payments, Refunds, Inventory Movements, or Journal Entries.
2. **Opaque Candidate Keys (Anti-Hallucination):** The server pre-fetches same-business candidate expense categories, suppliers, customers, and recent duplicate transactions, presenting them to Gemini as opaque keys (`category_1`, `supplier_1`, etc.). Gemini selects only from provided candidate keys; the server translates them back to database UUIDs. Unknown or forged candidate keys are rejected and nulled by server post-validation.
3. **No Financial Authority:** Gemini cannot modify canonical Money amounts, dates, or currency codes.
4. **Deterministic Policy Post-Checks:** Direction contradictions (e.g., MONEY_IN with Operating Expense) are downgraded to `UNKNOWN` with `DIRECTION_CONFLICT` warnings.
5. **Reclassification Workflow:** Reclassifying a transaction marks the previous suggestion `superseded` (`superseded_at = now()`) and creates a new classification linked to the same business without altering historical records.

## ADR-008 — Intelligence Jobs, Serverless Inngest Orchestration & Deterministic Attention Conditions

Date: 18 August 2026  
Status: Accepted

1. **"WHEN, NOT WHO/WHAT IS AUTHORITATIVE" Principle:** Background execution only controls *when* canonical tasks execute. Authoritative calculations, period resolutions, and scores remain exclusively within canonical domain services and database functions.
2. **Serverless Orchestration via Inngest:** Background tasks run as serverless handlers via `@/app/api/inngest` and `inngest@4.18.1` with explicit per-business concurrency limits (`concurrency: [{ key: 'event.data.businessId', limit: 1 }]`), exponential retries, and strict idempotency keys (`public.intelligence_job_runs`). Continuous in-memory `setInterval` loops and long-polling worker processes on Next.js/Vercel are prohibited.
3. **Zero Financial Mutations:** Automated background jobs NEVER create sales, expenses, payments, refunds, stock movements, invoices, receipts, or journal entries.
4. **No Autonomous Bookkeeper Auto-Posting:** High-confidence AI bookkeeper classifications are NEVER auto-posted in the background; human confirmation remains mandatory.
5. **No Credit Passport Auto-Generation:** Stale credit passports emit attention events, but are NEVER automatically generated or published.
6. **Zero Notification Dispatch (Scope Isolation):** Prompt 8 records internal stateful/occurrence attention conditions in `public.business_attention_events` with automatic condition resolution; user notification delivery (email, push, WhatsApp) is strictly reserved for Prompt 9.
7. **Business Timezone Scheduling:** Schedules resolve execution windows and comparison periods in the canonical business timezone (`Africa/Lagos`).
8. **Deduplication & Zero-Gemini Reuse:** Scheduled AI summaries verify SHA-256 source fingerprints before calling Gemini (0 calls when facts unchanged). Scheduled health score refreshes execute deterministically in pure TypeScript with 0 Gemini calls.

## ADR-009 — Capability-Aware Notification Architecture & Decoupled Attention State

Date: 18 August 2026  
Status: Accepted

1. **Strict In-App Channel Boundary (Prompt 9 Scope):** In Prompt 9, all notifications are strictly delivered via the `IN_APP` channel (`public.business_notifications`). WhatsApp messaging is reserved for Prompt 10; native push notifications are reserved for Prompt 12.
2. **Zero Gemini Provider Invocations:** Notification generation, recipient resolution, templating, and preference management call Gemini ZERO times.
3. **Capability-Aware Recipient Resolution:** Notifications are never broadcast to all staff. Active business members are resolved against required RBAC capabilities (`FeatureModule` allowlists) and per-user personal preferences. Sales staff are strictly excluded from sensitive inventory, financial, health, and credit passport notifications.
4. **Current-Permissions-Win at Retrieval:** Stored notifications record `required_capabilities`. On feed retrieval and unread badge count calculation, the user's *current* active business membership role is checked. If a user was downgraded (e.g. `owner` -> `sales_staff`), any unauthorized notification is dynamically omitted from the feed and unread badge count without mutating historical records.
5. **Decoupled Attention vs Personal Read State:** `public.business_attention_events` represents real-time operational business conditions (Prompt 8); `public.business_notifications` represents recipient-specific inbox records (Prompt 9). Marking a notification read updates `read_at` and decrements personal unread badge count; it does NOT resolve the underlying business attention condition. Resolving a business condition clears it from `Needs Attention` while preserving historical notifications.
6. **Notification Policy Registry v1:** Source-controlled deterministic registry defines allowed categories, types, severity, required capabilities, message templates, and primary action routes across 8 notification types.
7. **Deduplication Key Standard:** Notifications enforce deterministic deduplication via `${source_event_id}:${recipient_user_id}:${notification_type}` backed by a unique database constraint `(business_id, recipient_user_id, dedupe_key)`.
## ADR-010 — WhatsApp Business Integration Architecture & Channel Boundaries

Date: 18 August 2026  
Status: Accepted

1. **WhatsApp Is a Channel, Not an Authoritative Store:** WhatsApp acts strictly as an alerting and conversational query channel. Authoritative data and accounting ledgers reside solely in the Supabase PostgreSQL database. WhatsApp interactions NEVER create, modify, or void sales, expenses, payments, refunds, stock movements, invoices, receipts, customers, suppliers, staff, credit passports, or journal entries.
2. **Official Meta Cloud API Provider Adapter:** Integration uses the official Meta WhatsApp Business Platform Cloud API (`v20.0`). Zero unofficial automation libraries, scraping, QR hack servers, or browser emulators are permitted.
3. **Cryptographic One-Time Linking:** Linking proves control of both the authenticated NNOO account and the sender's WhatsApp number. The web app generates a short-lived (10-minute TTL), single-use, high-entropy 6-character code (`NNOO-XXXXXX`) stored as a SHA-256 token hash with 5-attempt rate-limiting protection.
4. **Deterministic Fast Command Router (0 Gemini Calls):** Commands (`HELP`, `STOP` / `UNSUBSCRIBE`, `START` / `RESUME`, `BUSINESS`, `BUSINESS <n>`) and unlinked sender messages are processed deterministically with **0 Gemini API calls**. Mutation attempts are intercepted with safety guidance and **0 side effects**.
5. **Canonical Ask NNOO Pipeline Reuse:** Inbound business queries reuse the exact T3-P05 `AskNnooAssistantService` pipeline (same tool executor, verified facts, numeric guards, injection defenses, and RBAC). No separate or competing AI logic is created.
6. **Role-Based Downgrade Safety:** User permissions are re-evaluated dynamically on every outbound delivery and inbound message. Downgrading a member immediately strips access to sensitive metrics (e.g., sales staff cannot query profitability).
7. **Deduplication & Retry Idempotency:** Webhook receipts (`public.whatsapp_webhook_receipts`) deduplicate provider message IDs. If provider message dispatch fails after successful AI answer generation, delivery retry sends the stored response without re-invoking Gemini.

## ADR-011 — AI, Intelligence & Score Admin Oversight Architecture & Invariants

Date: 18 August 2026  
Status: Accepted

1. **Observation & Diagnostics vs Business Truth Separation:** Platform Admin is strictly an observability, operational diagnostic, and feature control layer (`/admin/intelligence`). Platform Admin CANNOT create, modify, or delete business ledger entities (sales, expenses, invoices, payments, refunds, inventory items/movements, journal entries, AR, AP, or profitability).
2. **Zero Health Score & Credit Passport Overrides:** Business Health Scores are strictly calculated deterministically via `business-health-score-v1`. Credit Passports remain immutable, verified artifacts. Platform Admins cannot set, edit, or override health scores, dimension weights, or credit passport snapshots.
3. **No Autonomous or Admin Bookkeeper Approvals:** AI Bookkeeper suggestions remain unapplied until verified by authorized business staff. Platform Admins cannot accept or apply suggestions on behalf of businesses.
4. **Zero Gemini Provider Calls on Dashboard:** Operational metrics, token metrics, registries, and health overviews execute purely against PostgreSQL telemetry with **0 Gemini API calls**.
5. **Platform Feature Controls & Mandatory Audit Logging:** Runtime operational switches (`public.platform_feature_controls`) permit authorized platform admins (`super_admin`, `finance_admin`) to toggle sub-features (emergency kill switches). Every toggle requires an explicit audit reason and is recorded in `public.platform_audit_events`.
6. **Safe Job & WhatsApp Retries:** Background job retries re-check current business status and automation configuration. WhatsApp delivery retries re-check active business membership and unconditionally enforce user opt-out (`STOP`) consent.
7. **Accurate Cost Labeling:** AI token costs are labeled clearly as `Estimated from configured pricing (USD)` based on official pricing without inventing provider invoices.

## ADR-012 — Mobile AI & Native Push Architecture

Date: 18 August 2026  
Status: Accepted

1. **Zero Mobile AI Provider Credentials:** Expo mobile bundle contains 0 `@google/genai` imports and zero API secrets. All AI generation is server-authoritative via Next.js REST API routes.
2. **Zero Mobile Accounting Calculations:** All business metrics (Sales, Profit, Health Scores, Passports) are computed server-side via PostgreSQL RPCs.
3. **Lock-Screen Privacy:** Push payloads must be sanitized on the server before dispatch; phones and emails are masked and zero supplier/customer PII is sent.
4. **Push Is Not Authorization:** Tapping a push notification routes to the screen where the destination re-verifies active session and server-side RBAC.

## ADR-013 — Full Tranche 3 Adversarial Integration QA & Security Verification

Date: 18 August 2026  
Status: Accepted

1. **Zero Unresolved Critical/High Defect Rule:** Tranche 3 cannot be approved or closed while any Critical or High security, financial integrity, multi-tenant isolation, or AI accuracy defect remains open.
2. **Deterministic Financial Authority:** Canonical business records in PostgreSQL and deterministic domain code are the sole authority for financial totals. Gemini never computes authoritative accounting metrics.
3. **Current Active Role Precedence:** RBAC capabilities are evaluated dynamically on every request and feed query. Downgraded roles immediately lose access to protected financial facts before they enter AI context.
4. **Provider Resilience & Graceful Degradation:** External provider outages (Gemini, Push, WhatsApp, Inngest) must not break core business accounting operations (Sales, Expenses, Invoices, deterministic Health, deterministic Passports).

## ADR-014 — Tranche 3 Formal Acceptance & Baseline Freeze

Date: 18 August 2026  
Status: Accepted

1. **Formal Acceptance & Baseline Protection:** Tranche 3 (Smart Business Tools & Communication) has fulfilled all acceptance gates across T3-P01 through T3-P13 with zero open Critical/High defects and 100% financial reconciliation ($\Delta 0$). The implementation is frozen as a protected baseline.
2. **Acceptance vs Production Deployment Boundary:** Formal Tranche 3 acceptance verifies development completion, contracts, security, and tests. It does not perform automated deployment to production Vercel, EAS mobile app stores, or Meta live business numbers.
## ADR-015 — Tranche 4 Production Readiness Strategy & Release Scope Freeze

Date: 19 August 2026  
Status: Accepted

1. **Tranche 4 Mission:** Tranche 4 is strictly for production completion, security hardening, reliability/recovery engineering, testing, provider configuration, deployment, and project handover. It is NOT for broad new feature expansion.
2. **Protected Baselines:** Tranches 1, 2, and 3 are formally accepted protected baselines and must not undergo casual redesign.
3. **Thirteen-Prompt Structure:** Tranche 4 is organized into 13 discrete, evidence-based prompts (T4-P01 through T4-P13).
4. **Release Scope Freeze:** Prompt 1 establishes an evidence-based system audit and freezes release scope in `docs/project/TRANCHE_4_RELEASE_SCOPE.md`. Feature creep (such as direct lending, tax filing, payroll, voice AI) is strictly barred unless explicitly approved in a new contract.
5. **Separation of External Dependencies:** External provider configuration (Meta WhatsApp live verification, Apple/Google push keys, Paystack live mode, production Vercel/Supabase provisioning) is tracked separately from code defect remediation.
6. **No Prompt 1 Product Changes:** Prompt 1 performs audits and scope freezing with $\Delta 0$ product/financial mutations.

## ADR-016 — Platform Admin Authority & Operational Boundaries

Date: 19 August 2026  
Status: Accepted

1. **Non-Authoritative Financial Boundary:** NNOO Platform Admin is strictly an operational governance, diagnostic, and tenancy management layer. Platform Admins have zero capability to create, edit, or reverse business financial transactions (sales, expenses, payments, refunds, invoices, journal entries, inventory movements).
2. **Deterministic Health & Credit Passport Preservation:** Platform Admins cannot set, override, or edit Business Health Scores or Credit Passport snapshots.
3. **AI Bookkeeper Confirmation:** Human confirmation remains solely a business-user action. Platform Admins cannot approve or apply suggestions on a business's behalf.
4. **Communication Consent Invariant:** Platform Admin retries cannot override user WhatsApp opt-out (`STOP`) or personal notification preferences.
5. **No Arbitrary Broadcasts:** The Platform Admin surface does not provide arbitrary notification, SMS, push, or WhatsApp mass broadcast facilities.
6. **Zero Gemini Invocations on Dashboard:** Platform overview and operational management pages execute purely against PostgreSQL with zero Gemini API calls.

## ADR-017 — Production Security Baseline, Headers & Invariant Governance

Date: 19 August 2026  
Status: Accepted

1. **Defense-in-Depth & Non-Authority Principle:** Knowing a resource ID, URL, phone number, push payload, callback reference, or possessing an active login session never grants access without valid, server-verified real-time business authorization.
2. **Server-Side Security Enforcement:** Client-only authorization, hidden UI elements, or client-supplied `businessId` parameters are never treated as authoritative. All mutations and sensitive queries require server-side RBAC validation and Supabase RLS.
3. **Strict Production Security Headers:** Next.js serves CSP with `frame-ancestors 'none'`, HSTS with 2-year max-age and preload, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and restricted `Permissions-Policy`.
4. **Secret Protection Invariant:** Service-role credentials, Gemini API keys, Paystack secret keys, Meta access tokens, and push server keys are strictly server-only and must never appear in web or mobile client bundles.
5. **Provider Integrity:** Paystack webhooks require HMAC-SHA512 validation and are idempotent; WhatsApp webhooks require HMAC-SHA256 signature verification; callback redirects are non-authoritative.

## ADR-018 — Data Protection, Backup, Restore & Disaster Recovery Architecture

Date: 19 August 2026  
Status: Accepted

1. **System of Record Hierarchy:** Canonical financial records (`journal_entries`, `sales`, `expenses`, `invoices`, `inventory_movements`) and tenant identities in PostgreSQL are the highest-priority data assets. Derived AI outputs and aggregate dashboards are not backups and cannot replace canonical ledgers.
2. **Demonstrable Restore Requirement:** A backup strategy is unproven until demonstrated through an actual isolated restore rehearsal. Live production databases are never used for experimental restore testing.
3. **Storage Recovery via Deterministic Rendering:** Credit Passport PDFs are deterministically generated from immutable database snapshots matching SHA-256 artifact hashes.
4. **Exact Financial Parity ($\Delta 0$):** Return-to-service post-restore requires 100% mathematical parity across all financial metrics and balancing double-entry debits/credits.
## ADR-019 — Reliability, Fail-Open Observability & Incident Response Model

Date: 19 August 2026  
Status: Accepted

1. **Fail-Open Telemetry Invariant:** Operational observability, structured logging, and metrics gathering must never become a failure point for canonical business transactions. A telemetry or logging crash must fail open, allowing legitimate sales, expenses, payments, and invoices to execute with zero interruption.
2. **Universal Secret Redaction:** All structured log emissions and telemetry events must pass through automated secret scrubbing (`redactSecrets`) to ensure API keys, Supabase tokens, Paystack credentials, Meta tokens, JWTs, and passwords are never persisted to disk or sent to log drains.
3. **Normalized Error Taxonomy:** Server errors are mapped to 17 standard `NNOOErrorCode` values with user-safe error messages. Internal database connection strings, SQL error messages, and internal stack traces are strictly stripped from client HTTP responses.
4. **End-to-End Correlation Context:** Every multi-step workflow across Web, API, Database, Billing, AI, and Jobs propagates a collision-resistant `correlationId` (`nnoo_corr_<hex>`) enabling rapid incident diagnosis.
5. **Zero-Cost Component Health Monitoring:** Platform health evaluation relies on passive observation of recent telemetry and lightweight status endpoints. Health evaluations make 0 paid Gemini API calls, dispatch 0 WhatsApp messages, and send 0 Push alerts.
6. **Provider Outage Isolation:** Complete outages of external services (Google Gemini, Meta WhatsApp, Expo Push, Inngest Jobs) must degrade non-critical intelligence features safely without halting core double-entry accounting or mobile offline access.
7. **Zero Financial Mutation on Incident Triage ($\Delta 0$):** Incident diagnosis, log queries, runbook triage, and alert handling must cause exactly zero unauthorized side effects on business accounting data.

## ADR-020 — Performance, Scalability & Resource Optimization Architecture

Date: 19 August 2026  
Status: Accepted

1. **Correctness Outranks Speed:** Performance optimizations must never compromise financial accuracy, double-entry ledger balance, or tenant isolation. Floating-point arithmetic for currency is strictly prohibited; all monetary values remain in exact integer minor units (kobo/cents).
2. **Evidence-Based Database Indexing:** Indexes are added based strictly on measured query execution plans (EXPLAIN) and high-frequency access patterns. Composite and foreign-key indexes on `sales`, `expenses`, `invoices`, `inventory_movements`, `journal_lines`, and `journal_entries` eliminate sequential scans and explicit in-memory sort steps.
3. **Server-Enforced Bounded Pagination:** All collection queries across Web and API must enforce bounded pagination ($1 \le limit \le 100$, default 50) and reject unbounded or negative parameters. Client-side full-table filtering is prohibited.
4. **Tenant & Role-Sensitive Cache Isolation:** Server-side caches must strictly incorporate the active `businessId` in cache keys (`biz:${businessId}:...`). Privileged reports (profitability, financial statements) dynamically re-evaluate the current user's role on retrieval; downgraded roles are immediately masked.
5. **AI Provider-Call Economy:** AI efficiency is achieved by context minimization and duplicate suppression, not weaker security. Unchanged summary fingerprints reuse existing summaries with 0 Gemini calls. Health scores compute deterministically with 0 Gemini calls. Ask NNOO message history is bounded to maximum 6 recent messages.
6. **Job Concurrency & Fanout Bulkheads:** Background jobs enforce per-business concurrency limits to prevent thundering-herd collapse during local morning burst schedules. Notification and push fanouts strictly enforce recipient isolation with zero cross-tenant payload mixing.
7. **Zero Financial Mutation on Performance Tests ($\Delta 0$):** Load benchmarks, read optimizations, and query profiling must produce exactly $\Delta 0$ drift on canonical accounting records.

## ADR-021 — Production Environment Separation, Secrets Management & Central Configuration Schema

Date: 19 August 2026  
Status: Accepted

1. **Centralized Typed Schema Validation (`@nnoo/config`):** All runtime configuration across Web, Server Actions, API routes, and Mobile clients is governed by strict Zod-based schemas with safe parsers (`parseStrictBoolean`, `parseStrictInteger`).
2. **Strict Server-Only Boundary:** Server-side configuration access in `apps/web` is isolated behind `import 'server-only'` (`apps/web/src/server/config/index.ts`), preventing privileged secrets (`SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY`, `GEMINI_API_KEY`, `WHATSAPP_ACCESS_TOKEN`, `INNGEST_SIGNING_KEY`, `EXPO_ACCESS_TOKEN`) from ever entering client JavaScript bundles.
3. **Environment & Provider Mode Mismatch Protection:** `assertPaystackEnvironment()` strictly prohibits Paystack test keys (`sk_test_*`) in production environments and prohibits live keys (`sk_live_*`) in development environments. `assertMobileBackendMatches()` strictly prohibits production mobile clients from pointing to localhost backend instances.
4. **Graceful Missing Provider Degradation:** Missing optional provider credentials (e.g. Gemini, WhatsApp, Push) degrade non-critical intelligence features cleanly (`NOT_CONFIGURED` / `DISABLED`) with zero impact on core double-entry accounting. Missing core backend credentials halts startup safely with diagnostic logging.
5. **Secret Redaction in Diagnostics & Logs:** Configuration validation errors and provider readiness status APIs never echo raw secrets or tokens in error messages or platform logs.
6. **Zero-Downtime Secret Rotation:** Secret rotation across all 7 external providers follows the universal 7-step lifecycle defined in `Runbook 18`, staging replacement credentials in platform vaults before revoking previous keys.
7. **Permanent Invariant: Zero Financial Mutation ($\Delta 0$):** Configuration validation, environment preflights, and secret rotation rehearsals must cause exactly $\Delta 0$ financial mutation across sales, expenses, invoices, payments, refunds, inventory movements, and journal entries.

## ADR-022 — Web Production Deployment, Canonical Origin & Release Engineering

Date: 19 August 2026  
Status: Accepted

1. **Exact Release Commit Identification:** Every Web production release is irrevocably tied to an exact Git commit SHA on the approved `main` branch. Ambiguous or dirty local working directory releases are prohibited.
2. **Repository Migrations as Production Authority:** Database schema in production is strictly derived from versioned migrations in `supabase/migrations/`. Dashboard manual SQL modifications are prohibited.
3. **Monorepo Vercel Deployment Model:** Vercel deploys the unified Next.js web application (`apps/web`) via `vercel.json` and Turbopack compiler without creating disparate or duplicate web applications.
4. **Canonical Apex Domain & HTTPS Security:** The canonical application origin is `https://nnoo.app` with Let's Encrypt SSL and HSTS (`max-age=63072000; includeSubDomains; preload`). Secondary domain `www.nnoo.app` performs a 308 permanent redirect to the apex.
## ADR-023 — Mobile Production Build, EAS Profiles & Store Readiness

Date: 19 August 2026  
Status: Accepted

1. **Shared Production Backend for Web & Mobile:** Android and iOS mobile release candidates communicate with the exact same canonical NNOO Production Supabase backend (`https://hoorlxgtnamwdxszsbwt.supabase.co`) and public Web origin (`https://nnoo.app`). No mobile-specific database is created.
2. **Strict Public Client Configuration Boundary:** Mobile JavaScript bundles and EAS build inputs contain only public configuration (`EXPO_PUBLIC_*`). Zero server-side secrets (`SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY`, `GEMINI_API_KEY`, `WHATSAPP_ACCESS_TOKEN`, `INNGEST_SIGNING_KEY`, `EXPO_ACCESS_TOKEN`) are included in mobile binaries.
3. **Stable Application Identity & Target API 35 Compliance:** Application identifier is pinned to `com.nnoo.mobile` on Android and iOS with version `1.0.0`, Android `versionCode: 1`, iOS `buildNumber: "1"`, and Android Target SDK 35 (Android 15), fully complying with current Google Play submission policies.
4. **EAS Monorepo Build Profiles:** Root `apps/mobile/eas.json` defines isolated `development`, `preview`, and `production` build profiles targeting `app-bundle` distribution with `APP_ENV=production`.
5. **Account Deletion & Data Privacy Compliance:** Store compliance requirements (Apple 5.1.1(v) & Google Play Data Safety) are addressed via in-app deletion initiation (`apps/mobile/app/(app)/settings.tsx`) and a dedicated public web resource (`https://nnoo.app/account-deletion`). Personal credentials, push tokens, and WhatsApp linkages are purged, while statutory business financial records remain immutable ($\Delta 0$). Last-owner accounts are prevented from orphaning business entities.
6. **Store Billing Policy Alignment:** Mobile app surfaces subscription status and feature tiers; subscription upgrades route to secure web billing at `https://nnoo.app/app/[slug]/settings/billing`, aligning with multiplatform enterprise reader/management guidelines.
7. **Permanent Invariant: Zero Financial Mutation ($\Delta 0$):** Mobile build preflight, asset packaging, and store readiness verification produce exactly $\Delta 0$ changes across sales, expenses, invoices, payments, refunds, inventory movements, and journal entries.

## ADR-024 — Production External Integrations & Provider Validation

Date: 19 August 2026  
Status: Accepted

1. **Configured Does Not Equal Verified:** Presence of environment variables does not constitute production verification. A provider is certified only through validated HMAC signatures, runtime schema validation, deduplicated event receipts, and verified retry handling.
2. **Server-Side Verification & Idempotent Fulfillment:** Paystack billing callbacks remain strictly non-authoritative. Subscription value delivery requires server-to-server verification and HMAC-SHA512 webhook signature checks. Replayed events must execute idempotent single fulfillment. Real monetary live transactions require explicit human operator authorization.
3. **AI Determinism & Context Isolation:** Google Gemini (`gemini-2.5-flash`) operates exclusively behind trusted server boundaries with runtime Zod schema parsing. Financial totals and Business Health Scores are calculated exclusively by deterministic domain engines; Gemini provides explanatory narratives only. Cross-tenant context leakage and arbitrary SQL execution are strictly prevented.
4. **Durable Job Execution & Outage Isolation:** Inngest serverless job handlers authenticate via signing keys with deduplication keys. Provider disruptions across Gemini, WhatsApp, Inngest, Push, or Paystack leave core double-entry accounting and tenant operations 100% functional.
5. **WhatsApp & Push Security Model:** WhatsApp phone numbers alone grant zero business data access; accounts require authenticated one-time link codes. Opt-out (`STOP`) commands are unconditionally enforced and cannot be overridden by administrators. Push notification tap events require session and tenant reauthorization.
6. **Permanent Invariant: Zero Financial Mutation ($\Delta 0$):** Provider certifications, failure injections, and security tests produce exactly $\Delta 0$ changes across sales, expenses, invoices, payments, refunds, inventory movements, and journal entries.

## ADR-025 — Full Production UAT, Financial Reconciliation & Go-Live Rehearsal

Date: 20 August 2026  
Status: Accepted

1. **Final Production Acceptance Grounded in End-to-End Journeys:** Isolated unit tests alone do not constitute production acceptance. System acceptance requires full-system multi-tenant journeys across Web, Mobile, Platform Admin, and external providers.
2. **Controlled Production UAT Identities & Reversal-Based Cleanliness:** Production UAT utilizes controlled synthetic business entities and user identities rather than real customer data. UAT accounting data is balanced and cleaned through canonical business operations (refunds, restocks, settlement) rather than destructive manual ledger deletions, preserving the permanent audit log.
3. **Unified Backend Parity & Fresh Authorization:** Web and Mobile interfaces consume the identical canonical backend without maintaining competing business truth. Session authorizations, role downgrades, and business suspensions are evaluated dynamically on every protected request.
4. **Deterministic AI Grounding & Human Confirmation Gate:** AI Bookkeeper operates exclusively as a suggestion engine producing $\Delta 0$ accounting side effects until explicitly reviewed and confirmed by an authorized human actor. Ask NNOO, Smart Insights, Business Health, and Credit Passport are strictly grounded in deterministic database facts.
5. **Resilient Failure Isolation & Operational Rollback Architecture:** Provider disruptions (Gemini, Inngest, WhatsApp, Push, Paystack) isolate cleanly without impacting core double-entry accounting. Web deployment rollback via Vercel immutable releases operates safely alongside forward-compatible additive database migrations.
6. **Release Gate Boundary:** P11 Go-Live Rehearsal passage certifies the release candidate for documentation and handover, but does NOT constitute final Tranche 4 or August project closeout; Prompts 12 and 13 remain mandatory.

## ADR-026 — Documentation, Operations, Knowledge Transfer & Project Handover

Date: 20 August 2026  
Status: Accepted

1. **Durable Source-Controlled Knowledge:** Operational and engineering knowledge lives in version-controlled markdown repositories rather than individual memory. Zero tribal knowledge is permitted to exist only in one developer's mind.
2. **Zero Secrets in Handover Documents:** Handover documents record credential names, providers, owners, and rotation procedures, but **NEVER** contain plaintext passwords, API tokens, private keys, or session tokens.
3. **Provider-Native Account Transfer:** Account transfers must execute via provider-native team management and role delegation mechanisms rather than sharing personal account passwords.
4. **Financial Non-Intervention Principle:** Support operations and platform administrators must never manually patch database general ledgers or dashboard aggregates; all discrepancies are resolved via source reconciliation and canonical compensating entries.
5. **Release Gate Boundary:** Completion of Prompt 12 handover package does **NOT** equal final Tranche 4 or August delivery closeout; Prompt 13 alone performs final acceptance.

## ADR-027 — Formal Tranche 4 & August 2026 Delivery Acceptance and Closeout

Date: 20 August 2026  
Status: Accepted

1. **Formal Acceptance Grounded in Cumulative Evidence:** Tranche 4 and the agreed August 2026 NNOO delivery are accepted based on comprehensive, reproducible evidence across all 4 tranches, 13 Tranche 4 prompts, 375 automated tests, 10 UAT journeys, and exact $\Delta 0$ financial reconciliation.
2. **Protection of Accepted Baselines:** Tranches 1, 2, 3, and 4 are officially frozen as immutable release baselines. Any future modifications require a new explicitly approved scope and governance cycle.
3. **Long-Term Roadmap Scope Distinction:** Acceptance of the August 2026 delivery certifies the agreed commercial foundation, commerce, ledgers, AI, notifications, and platform administration. It does NOT imply implementation of deferred roadmap features (institutional lending, loan marketplace, tax filing, payroll, USSD).
4. **Mobile Store Publication as Post-Acceptance Operator Action:** Production-ready mobile binaries (`com.nnoo.mobile`, v1.0.0, Target SDK 35) are certified; public app store publication remains an administrative action for David Bako.
5. **Post-Acceptance Change Control:** Production repairs must follow the official incident and hotfix workflows (`.agents/workflows/hotfix.md`) rather than direct unversioned production edits.
6. **Project Closeout:** Tranche 4 is complete and closed. No Prompt 14 exists.

Append new decisions using the ADR template. Do not rewrite accepted history without a superseding decision.




