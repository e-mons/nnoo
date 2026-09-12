# NNOO Architecture

## Monorepo

Use pnpm workspaces with a task runner selected and pinned during Tranche 1.

```text
apps/
  web/
  mobile/
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
```

## Single web application

`apps/web` is the only Next.js application.

```text
src/app/
  (marketing)/
  (auth)/
  (app)/
  (admin)/
  api/v1/
```

Route groups create clear boundaries without separate applications or duplicated configuration.

## Single mobile application

`apps/mobile` is the only Expo application.

```text
app/
  (auth)/
  (onboarding)/
  (app)/
```

Additional role-aware screens remain inside this app when approved.

## Backend

Supabase provides PostgreSQL, authentication, storage, RLS, Realtime where useful, database functions, and approved Edge Functions.

Routine user-scoped access may be direct through Supabase only when RLS is complete. Privileged operations use trusted server code in `apps/web/src/app/api/v1`, or an approved Supabase Edge Function where it is the better boundary. Inngest is used only for approved durable background work.

Each operation has one canonical implementation.

## Shared packages

- `contracts`: versioned API and event shapes.
- `domain`: calculations and business rules.
- `validation`: runtime schemas.
- `supabase`: generated types and safe client factories.
- `config`: typed configuration.
- `design-tokens`: brand values shared where practical.
- `test-utils`: fixtures and helpers with no production mock leakage.

## Tenant model

A user belongs to businesses through membership records. Business-owned data is isolated by `business_id` and RLS. NNOO admin access is separate from ordinary business membership and is checked server-side.

## Financial model

Completed financial activity is auditable. Corrections use controlled reversal or void behaviour rather than silent deletion.

## API versioning

Server endpoints begin under `/api/v1`. Shared contracts are additive by default. Breaking changes require a new version or a documented compatibility migration.

## Hosting & Production Deployment Topology (Tranche 4 Prompts 8 & 9)

GitHub is the source repository. Vercel hosts the single Next.js web app (`apps/web`) mapped to canonical origin `https://nnoo.app`. EAS builds the single React Native Expo mobile app (`apps/mobile`) for Android (Google Play) and iOS (App Store). Both platforms share the exact same canonical Production Supabase backend.

```text
ANDROID PRODUCTION APP (com.nnoo.mobile) ──┐
                                           │
                                           ├──── NNOO CANONICAL PRODUCTION BACKEND
                                           │     (https://hoorlxgtnamwdxszsbwt.supabase.co)
IOS PRODUCTION APP (com.nnoo.mobile) ──────┤
                                           │
WEB PRODUCTION (https://nnoo.app) ─────────┘
                                           │
                                           ├── SUPABASE AUTH (Site URL: https://nnoo.app)
                                           ├── DATABASE (PostgreSQL with RLS on 60 tables)
                                           ├── SERVER AI (Google Gemini - gemini-2.5-flash)
                                           ├── PAYSTACK SERVER (HMAC-SHA512 Webhooks)
                                           ├── JOBS (Inngest Serverless @ /api/inngest)
                                           ├── PUSH SERVER (Expo Push / APNs / FCM)
                                           └── WHATSAPP SERVER (Meta Cloud API Webhooks)
```



## AI & Intelligence Architecture (Tranche 3)

NNOO employs a centralized, server-only intelligence foundation powered by the Google Gemini API (`@google/genai`).

```text
AUTHENTICATED USER
        │
        ▼
BUSINESS / MEMBERSHIP / RBAC (Server-Resolved)
        │
        ▼
AI APPLICATION SERVICE (Feature Policy & Kill Switch)
        │
        ▼
TRUSTED BUSINESS DATA ACCESS (Permission-Checked)
        │
        ▼
SAFE DATA PROJECTION & MINIMIZATION (PII Stripped)
        │
        ▼
DETERMINISTIC FACTS ENVELOPE (VerifiedFactEnvelope<T>)
        │
        ▼
PROMPT REGISTRY & INJECTION DEFENSE (Source-Controlled Prompts)
        │
        ▼
GEMINI SERVER CLIENT (@google/genai / Structured Output)
        │
        ▼
RUNTIME ZOD SCHEMA VALIDATION (Strict Schema Check)
        │
        ▼
OBSERVABILITY & AUDIT RECORDING (public.ai_invocations)
        │
        ▼
SAFE APPLICATION RESPONSE
```

### Non-Negotiable AI Architectural Principles
1. **NNOO COMPUTES, GEMINI EXPLAINS:** Deterministic domain logic and database ledgers own all financial numbers, sales, inventory valuations, COGS, and balances. Gemini never fabricates authoritative financial values.
2. **Server-Only Boundary:** The Gemini SDK (`@google/genai`) and API key (`GEMINI_API_KEY`) live exclusively in server code (`apps/web/src/server/ai/`). They never enter Expo mobile or browser bundles.
3. **No Direct Mutation or SQL:** Gemini cannot execute arbitrary SQL, has zero financial mutation tools, and cannot alter database state directly.
4. **Tenant Isolation & RBAC Preflight:** AI requests verify business membership and user permissions *before* retrieving context or calling provider APIs.
5. **Data Minimization:** Context builders strip PII (phone numbers, emails, authentication secrets) from context payloads.
6. **Defense in Depth:** Prompt injection delimiters isolate untrusted user queries and stored business notes.
7. **Observability:** Invocations record diagnostic metadata (model, tokens, latency, status, error code, request fingerprint) into `public.ai_invocations` without storing full raw prompts or private responses.

## Notification & Attention Center Architecture (Tranche 3 Prompt 9)

```text
BUSINESS ATTENTION CONDITIONS (Prompt 8) / BACKGROUND JOBS (Prompt 8)
                           │
                           ▼
              NOTIFICATION SERVICE FAN-OUT
                           │
                           ▼
          CAPABILITY-AWARE RECIPIENT RESOLVER
             ├── Active Membership Check
             ├── RBAC Feature Permission Filter (No Sales Staff Leaks)
             └── User Personal Preference Check (Opt-out Check)
                           │
                           ▼
             NOTIFICATION POLICY REGISTRY v1
             (Deterministic Templates & Action Links)
                           │
                           ▼
             DEDUPLICATED PERSISTENCE (RLS)
           (public.business_notifications)
                           │
                           ▼
           CURRENT-PERMISSION-WIN RETRIEVAL
      (Role Downgrades Dynamically Hide Sensitive Data)
             ├── Header Bell Icon & Dropdown Preview
             ├── Personal Notification Feed (Read State: read_at)
             └── Live Attention Center (Operational State: business_attention_events)
```

1. **Separation of Operational Condition vs Personal Communication:** Active conditions in `public.business_attention_events` reflect ongoing business reality; `public.business_notifications` records recipient personal communications. Reading a notification does not resolve the condition; resolving a condition removes it from Attention Center while preserving notification history.
2. **Current-Permissions-Win:** Stored notifications declare `required_capabilities`. Access and unread counts re-evaluate the user's *current* active business role on retrieval, protecting downgraded roles from seeing sensitive financial/health/passport data.
3. **Strict In-App Boundary:** Notifications in Prompt 9 are strictly `IN_APP`. WhatsApp (Prompt 10) and native Push (Prompt 12) integrate into this foundation without breaking boundaries.
4. **Zero Gemini & Zero Financial Mutations:** Generating and querying notifications and managing preferences calls Gemini 0 times and causes 0 financial mutations.

## WhatsApp Business Integration Architecture (Tranche 3 Prompt 10)

```text
                  INBOUND META WEBHOOK (POST /api/v1/webhooks/whatsapp)
                                           │
                        [Signature Verification: HMAC-SHA256]
                                           │
                         [Webhook Deduplication Receipt]
                                           │
                             [Phone Privacy Lookup Key]
                                           │
               ┌───────────────────────────┴───────────────────────────┐
               ▼                                                       ▼
        UNLINKED SENDER                                        LINKED ACTIVE USER
               │                                                       │
  [Setup Guidance Reply]                                    [Command Router (0 Gemini)]
   (0 Gemini Provider Calls)                                           ├── HELP
                                                                       ├── STOP / START
                                                                       ├── BUSINESS [n]
                                                                       ├── MUTATION BLOCKER
                                                                       └── ASK NNOO QUERY
                                                                               │
                                                                   [Canonical Ask NNOO Engine]
                                                                   (T3-P05 Pipeline, Tools, RBAC)
                                                                               │
                                                                   [WhatsApp Text Formatter]
                                                                               │
                                                                   [Meta Cloud API Dispatch]

                   OUTBOUND ALERT FAN-OUT (Prompt 9 Extension)
                                           │
                     [Capability-Aware Recipient Resolver]
                                           │
                      [Active WhatsApp Connection Check]
                                           │
                      [Category Channel Preference Check]
                                           │
                     [Lock-Screen Safe Template Dispatch]
```

1. **Meta Cloud API Adapter:** Official WhatsApp Business Cloud API (`v20.0`) integration with raw byte signature verification, phone normalization, phone privacy hashing, and structured template dispatches.
2. **Cryptographic 10-Minute Linking:** Cryptographic one-time codes (`NNOO-XXXXXX`) hashed at rest with SHA-256 and rate-limited to 5 attempts prove mutual control of the NNOO account and the sender's WhatsApp number.
3. **Fast Command Router (0 Gemini Calls):** Fast deterministic execution of `HELP`, `STOP`, `START`, and `BUSINESS` context switching. Intercepts any financial mutation attempts with clear safety guidance and zero side effects.
4. **Canonical Ask NNOO Reuse:** General business questions route through the canonical `AskNnooAssistantService` (T3-P05) pipeline with full RBAC, verified facts, and numeric guards.
5. **Role Downgrade Protection & Retry Safety:** Dynamic permissions re-check on every inbound/outbound interaction. Provider failures after successful AI answer generation retry sending without re-invoking Gemini.

## Data Protection, Backup, Restore & Disaster Recovery Architecture (Tranche 4 Prompt 4)

```text
                                  CANONICAL NNOO ASSETS
                                            │
               ┌────────────────────────────┼────────────────────────────┐
               ▼                            ▼                            ▼
      POSTGRESQL DATABASE           OBJECT STORAGE BUCKETS       GIT REPO & MIGRATIONS
      (60 Tables, 100% RLS)        (Passport PDFs, Documents)    (pnpm-lock.yaml, SQL)
               │                            │                            │
               ├────────────────────────────┴────────────────────────────┤
               ▼                                                         ▼
    CONTINUOUS WAL / PITR                                      ISOLATED RECOVERY TARGET
               │                                                         │
               └────────────────────────────┬────────────────────────────┘
                                            ▼
                                   RECOVERY PIPELINE
                                            │
               ┌────────────────────────────┼────────────────────────────┐
               ▼                            ▼                            ▼
      SCHEMA RECONCILIATION         FINANCIAL PARITY             PROVIDER RECONCILIATION
    (Restored DB = Migrations)       (Exact Match Δ 0)         (Paystack/WhatsApp Opt-Out)
               │                            │                            │
               └────────────────────────────┼────────────────────────────┘
                                            ▼
                                RETURN-TO-SERVICE GATES
                                            │
                                            ▼
                                       SAFE GO-LIVE
```

## Observability, Reliability & Incident Response Architecture (Tranche 4 Prompt 5)

```text
                                INCOMING APPLICATION TRAFFIC
                                              │
                              [Correlation Context Manager]
                             (nnoo_corr_<hex16>, req_<hex8>)
                                              │
                      ┌───────────────────────┼───────────────────────┐
                      ▼                       ▼                       ▼
               CORE SERVICES           DATABASE / RLS          EXTERNAL PROVIDERS
             (Web, API, Auth)      (PostgreSQL Pooler)       (Paystack, Gemini, Meta)
                      │                       │                       │
                      └───────────────────────┼───────────────────────┘
                                              ▼
                                   [Normalized Error System]
                                     (17 Safe Error Codes)
                                              │
                      ┌───────────────────────┼───────────────────────┐
                      ▼                       ▼                       ▼
              STRUCTURED LOGGER       COMPONENT HEALTH        INCIDENT RUNBOOKS
             (Secret Redaction,     (Deterministic Status,   (Runbooks 09–17, Postmortem
              Fail-Open Events)      Stale Telemetry Check)   0 Financial Side-Effects)
```

1. **Fail-Open Telemetry Invariant:** Observability and logging failures never crash, block, or duplicate canonical financial mutations.
2. **Universal Secret Scrubbing (`redactSecrets`):** Masks Supabase tokens, Gemini API keys, Paystack secret keys, Meta WhatsApp tokens, Inngest signing keys, JWTs, and passwords.
3. **Normalized Error Codes & Safe Masking:** Maps all exceptions to 17 standard codes with user-friendly descriptions, completely stripping internal SQL details and connection strings.
4. **End-to-End Correlation Context:** Binds HTTP request headers, domain service execution, database RPCs, and outbound provider adapters with a traceable `correlationId`.
5. **Zero-Cost Component Health Semantics:** Computes `HEALTHY`, `DEGRADED`, `UNAVAILABLE`, `CONFIGURED`, `NOT_CONFIGURED`, and `UNKNOWN` (stale) statuses passively with 0 paid Gemini calls, 0 WhatsApp messages, and 0 Push alerts.
6. **Provider Outage Isolation:** Upstream outages of Gemini, WhatsApp, Push, or Inngest allow the core accounting platform to operate with zero interruption.

## Performance, Scalability & Production Optimization Architecture (Tranche 4 Prompt 6)

```text
                               HIGH-VOLUME QUERY REQUEST
                                           │
                               [Bounded Limit Clamping]
                              (1 <= limit <= 100, def: 50)
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    ▼                      ▼                      ▼
             INDEX SCAN (No Sort)    PRIVATE CACHE ISOLATION    PROVIDER CALL ECONOMY
             (14 Composite & FK     (biz:${bizId}:... key      (0 Gemini Calls Health,
              Database Indexes)      Dynamic Role Downgrade)    6-Msg Context Bounding)
                    │                      │                      │
                    └──────────────────────┼──────────────────────┘
                                           ▼
                             EXACT INTEGER FINANCIAL MATH
                                (Minor Units, Δ0 Drift)
```

1. **Evidence-Based Indexing:** 14 composite/FK indexes (`20260901000000_performance_index_optimization.sql`) eliminate full-table `Seq Scan` on `journal_lines` joins and in-memory `Sort` on paginated `invoices`.
2. **Server-Enforced Bounded Pagination:** All collection queries clamp `limit` between 1 and 100, preventing unbounded memory consumption.
3. **Tenant & Role-Sensitive Server Cache:** Cache keys enforce tenant namespace separation (`biz:${businessId}:...`); privileged cached data is dynamically masked upon role downgrade.
4. **AI Provider-Call Economy:** SHA-256 fingerprint reuse eliminates redundant Gemini summary calls; Health scores compute deterministically with 0 Gemini calls; Ask NNOO message history is strictly bounded to 6 messages.
5. **Bulkhead Concurrency & Fanout Security:** Worker concurrency throttling prevents thundering-herd provider stampedes; Push and WhatsApp fanouts preserve absolute recipient isolation.
6. **Exact Integer Arithmetic Invariant ($\Delta 0$):** All monetary operations strictly use integer minor units with 0 floating-point currency representation and zero financial drift.

## Production External Provider Integration Architecture (Tranche 4 Prompt 10)

```text
                         NNOO PRODUCTION
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
      PAYSTACK             GEMINI            INNGEST
   (HMAC-SHA512)     (Server API Key)    (Signing Key)
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
                     CANONICAL NNOO SERVER
                   (Verify → Idempotent → Audit)
                              │
                 ┌────────────┴────────────┐
                 ▼                         ▼
           WHATSAPP                      PUSH
        (HMAC-SHA256)            (Expo Push Gateway)
        (Link Code Auth)         (APNs / FCM)
                 │                         │
                 ▼                         ▼
            META CLOUD                DEVICE RECEIPT
           API v20.0              (Tap → Reauthorize)
```

1. **Server-Only Provider Trust Boundary:** All privileged provider credentials (Paystack secret, Gemini API key, Inngest signing key, WhatsApp access token, Expo access token) remain strictly server-side. Zero credentials enter client bundles or telemetry logs.
2. **Paystack Billing Flow:** Server initializes → Paystack Live processes → Server verifies (`/transaction/verify/:ref`) → HMAC-SHA512 webhook confirms → Idempotent single subscription activation. Browser callback is non-authoritative.
3. **Gemini AI Flow:** Server assembles tenant-scoped context → Server-only API key authenticates → `gemini-2.5-flash` returns structured JSON → Runtime Zod schema validates → Domain engine retains financial authority.
4. **Inngest Job Flow:** Event triggers → Signing key authenticates → Durable function executes with deduplication → Bounded retries → One canonical result per logical event.
5. **WhatsApp Flow:** Meta Cloud API `v20.0` webhook → HMAC-SHA256 signature verification → Link code identity authentication → RBAC enforcement → Read-only Ask NNOO or approved notification dispatch.
6. **Push Flow:** NNOO notification → Recipient RBAC check → Push preference check → Expo Push Gateway → APNs/FCM → Device receipt → Tap reauthorization → Protected route access.
7. **Failure Isolation Invariant:** Any single provider outage leaves all other providers and core double-entry accounting 100% operational with $\Delta 0$ on financial ledgers.
