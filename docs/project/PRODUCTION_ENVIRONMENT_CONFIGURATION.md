# NNOO Production Environment, Secrets & Provider Configuration

**Document ID:** `PROD-CONFIG-01`  
**Governance Pack Version:** 1.0.0  
**Status:** **AUTHORITATIVE RELEASE BASELINE**  
**Platform Owner & Lead Engineer:** David Bako  
**Related Documents:** `ENVIRONMENT_AND_SECRETS.md`, `SECURITY_BASELINE.md`, `ARCHITECTURE.md`, `DATA_PROTECTION_AND_RECOVERY.md`, `OBSERVABILITY_AND_INCIDENT_MANAGEMENT.md`, `runbooks/18-secret-rotation.md`  

---

## 1. Executive Overview & Architectural Principles

This document establishes the permanent production environment architecture, secret management boundaries, provider configuration inventory, callback/webhook contracts, and operational ownership for the NNOO platform.

### Inviolable Invariants:
1. **Zero Secret in Client Bundles:** Server-side secrets (Supabase service role, Paystack secret keys, Gemini API keys, Meta access tokens, Inngest signing keys, Push server credentials) must NEVER enter browser or mobile client JS bundles.
2. **Strict Environment Separation:**
   - Development operates against Development Supabase, Paystack Test, Dev Gemini, Dev WhatsApp, Dev Jobs.
   - Production operates against Production Supabase, Paystack Live, Production Gemini, Production WhatsApp, Production Jobs.
   - There is ZERO cross-wire or silent fallback between environments.
3. **Single Canonical Backend for Web & Mobile:** Web Production and Mobile Production share the EXACT SAME canonical NNOO Production Supabase database, authentication system, storage buckets, and business record ledgers.
4. **Fail-Safe Missing Configuration:** Missing optional provider configuration (e.g., Gemini, WhatsApp, Push) degrades non-critical intelligence features cleanly with `NOT_CONFIGURED` status; core double-entry accounting, sales, expenses, invoices, and journal entries continue working 100%. Missing core backend configuration halts startup safely rather than serving fake or corrupted data.
5. **Configured $\ne$ Deployed $\ne$ Real Provider Verified:** Having production environment variables configured in a vault does NOT mean production is deployed (T4-P08) or real live charges/messages are verified (T4-P10).

---

## 2. Environment Architecture Model

```text
DEVELOPMENT ENVIRONMENT
    ├── Web: Local Next.js (http://localhost:3000)
    ├── Mobile: Expo Dev Client (nnoo://)
    ├── Supabase: Development Project (hoorlxgtnamwdxszsbwt)
    ├── Paystack: Test Mode (sk_test_* / pk_test_*)
    ├── Gemini: Dev Key / Default Model
    ├── WhatsApp: Meta Test Sandbox / Dev Verify Token
    └── Inngest: Local Dev Server / Dev App

PRODUCTION ENVIRONMENT
    ├── Web: Production Vercel Deployment (https://nnoo.app or designated domain)
    ├── Mobile: EAS Production Build (App Store & Google Play)
    ├── Supabase: Dedicated Production Project
    ├── Paystack: Live Mode (sk_live_* / pk_live_*)
    ├── Gemini: Production API Key / Rate-Limited Quota
    ├── WhatsApp: Meta Production WABA & Verified Phone Number
    └── Inngest: Inngest Cloud Production Application
```

---

## 3. Production Environment Variable & Secret Inventory

> [!IMPORTANT]
> This inventory records variable names, runtime classifications, management locations, and operational owners. Actual secret values remain exclusively inside encrypted platform secret vaults.

| Variable Name | Provider | Classification | Runtime Scope | Required for Go-Live | Storage Location | Operational Owner | Rotation Runbook |
|---|---|---|---|---|---|---|---|
| `NNOO_ENV` | NNOO | Non-Sensitive | Server / Client | **Yes** | Vercel / EAS | David Bako | N/A |
| `NODE_ENV` | Node.js | Non-Sensitive | Server / Client | **Yes** | Vercel / EAS | David Bako | N/A |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | Public Client | Web Client / Server | **Yes** | Vercel Prod Env | Infrastructure Lead | Section 3.7 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | Public Client (RLS) | Web Client / Server | **Yes** | Vercel Prod Env | Infrastructure Lead | Section 3.7 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | **Critical Server Secret** | Web Server Only | **Yes** | Vercel Prod Env (Encrypted) | Platform Owner | Section 3.1 |
| `NEXT_PUBLIC_SITE_URL` | NNOO | Public Client | Web Client / Server | **Yes** | Vercel Prod Env | Platform Owner | N/A |
| `PAYSTACK_SECRET_KEY` | Paystack | **Critical Server Secret** | Web Server Only | **Yes** | Vercel Prod Env (Encrypted) | Finance / Platform Owner | Section 3.2 |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack | Public Client | Web Client Only | Optional | Vercel Prod Env | Finance Lead | Section 3.2 |
| `PAYSTACK_ENVIRONMENT` | Paystack | Non-Sensitive | Web Server Only | **Yes** (`live`) | Vercel Prod Env | Finance Lead | N/A |
| `GEMINI_API_KEY` | Google | **High Server Secret** | Web Server Only | Optional (AI) | Vercel Prod Env (Encrypted) | AI Lead | Section 3.3 |
| `GEMINI_MODEL_DEFAULT` | Google | Non-Sensitive | Web Server Only | **Yes** | Vercel Prod Env | AI Lead | N/A |
| `AI_ENABLED` | NNOO | Non-Sensitive | Web Server Only | **Yes** (`true`) | Vercel Prod Env | Platform Owner | N/A |
| `AI_TIMEOUT_MS` | NNOO | Non-Sensitive | Web Server Only | **Yes** (`15000`) | Vercel Prod Env | AI Lead | N/A |
| `AI_MAX_RETRIES` | NNOO | Non-Sensitive | Web Server Only | **Yes** (`2`) | Vercel Prod Env | AI Lead | N/A |
| `WHATSAPP_ENABLED` | NNOO | Non-Sensitive | Web Server Only | Optional | Vercel Prod Env | Integrations Lead | N/A |
| `WHATSAPP_PROVIDER` | Meta | Non-Sensitive | Web Server Only | **Yes** | Vercel Prod Env | Integrations Lead | N/A |
| `WHATSAPP_ACCESS_TOKEN` | Meta | **Critical Server Secret** | Web Server Only | Optional (WhatsApp) | Vercel Prod Env (Encrypted) | Integrations Lead | Section 3.4 |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta | Non-Sensitive ID | Web Server Only | Optional (WhatsApp) | Vercel Prod Env | Integrations Lead | N/A |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | Meta | Non-Sensitive ID | Web Server Only | Optional (WhatsApp) | Vercel Prod Env | Integrations Lead | N/A |
| `WHATSAPP_APP_SECRET` | Meta | **Critical Server Secret** | Web Server Only | Optional (WhatsApp) | Vercel Prod Env (Encrypted) | Integrations Lead | Section 3.4 |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Meta | **High Server Secret** | Web Server Only | Optional (WhatsApp) | Vercel Prod Env (Encrypted) | Integrations Lead | Section 3.4 |
| `WHATSAPP_GRAPH_API_VERSION` | Meta | Non-Sensitive | Web Server Only | **Yes** (`v20.0`) | Vercel Prod Env | Integrations Lead | N/A |
| `WHATSAPP_PEPPER` | NNOO | **High Server Secret** | Web Server Only | **Yes** | Vercel Prod Env (Encrypted) | Security Lead | Section 3.4 |
| `INNGEST_EVENT_KEY` | Inngest | **High Server Secret** | Web Server Only | Optional (Jobs) | Vercel Prod Env (Encrypted) | Infrastructure Lead | Section 3.5 |
| `INNGEST_SIGNING_KEY` | Inngest | **Critical Server Secret** | Web Server Only | Optional (Jobs) | Vercel Prod Env (Encrypted) | Infrastructure Lead | Section 3.5 |
| `INNGEST_APP_ID` | Inngest | Non-Sensitive | Web Server Only | **Yes** (`nnoo-web`) | Vercel Prod Env | Infrastructure Lead | N/A |
| `EXPO_ACCESS_TOKEN` | Expo | **High Server Secret** | Web Server Only | Optional (Push) | Vercel Prod Env (Encrypted) | Mobile Lead | Section 3.6 |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase | Public Client | Mobile App Bundle | **Yes** | EAS Secrets / `app.json` | Mobile Lead | Section 3.7 |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase | Public Client (RLS) | Mobile App Bundle | **Yes** | EAS Secrets / `app.json` | Mobile Lead | Section 3.7 |
| `EXPO_PUBLIC_API_URL` | NNOO | Public Client | Mobile App Bundle | Optional | EAS Secrets / `app.json` | Mobile Lead | N/A |

---

## 4. Production Callback & Webhook Matrix

| Provider / Feature | Canonical Production URL / Route | Requires Live Domain? | Provider-Side Configuration Status | Target Milestone |
|---|---|---|---|---|
| **Supabase Auth Site URL** | `https://nnoo.app` | **Yes** | Set Site URL in Supabase Dashboard | T4-P08 |
| **Supabase Auth Email Callback** | `https://nnoo.app/auth/callback` | **Yes** | Add to Allowed Redirect URLs | T4-P08 |
| **Supabase Password Recovery** | `https://nnoo.app/reset-password` | **Yes** | Add to Allowed Redirect URLs | T4-P08 |
| **Mobile Auth Deep Link** | `nnoo://auth/callback` | No (Custom Scheme) | Add `nnoo://**` to Allowed Redirect URLs | T4-P07 / T4-P09 |
| **Paystack Billing Callback** | `https://nnoo.app/app/[businessSlug]/settings/billing/callback` | **Yes** | Dynamic per-transaction callback URL | T4-P08 |
| **Paystack Production Webhook** | `https://nnoo.app/api/v1/webhooks/paystack` | **Yes** | Register in Paystack Dashboard Settings | T4-P08 / T4-P10 |
| **Meta WhatsApp Webhook** | `https://nnoo.app/api/v1/webhooks/whatsapp` | **Yes** | Configure in Meta App Dashboard with Verify Token | T4-P08 / T4-P10 |
| **Inngest Serverless Handler** | `https://nnoo.app/api/inngest` | **Yes** | Auto-synced with Inngest Cloud via Signing Key | T4-P08 |
| **Credit Passport Public Verify** | `https://nnoo.app/passport/verify` | **Yes** | Web public route | T4-P08 |

---

## 5. Provider-Specific Production Readiness & Boundaries

### 5.1 Supabase Backend & Database
- **Parity Invariant:** The development database (`hoorlxgtnamwdxszsbwt`) currently holds 100% of canonical migrations (including `20260901000000_performance_index_optimization.sql`).
- **Production Setup Requirement:** When a dedicated production Supabase project is linked, schema will be provisioned strictly by running the version-controlled migrations in `supabase/migrations/`. No manual database table creation is permitted.
- **Backup & Recovery Invariant:** Production Supabase project must be configured on an approved paid tier supporting Point-in-Time Recovery (PITR) and daily automated backups per `DATA_PROTECTION_AND_RECOVERY.md`.

### 5.2 Paystack Recurring Billing
- **Mode Isolation Invariant:** `assertPaystackEnvironment()` strictly prohibits `sk_test_*` keys when `NNOO_ENV === 'production'` and prohibits `sk_live_*` keys when `NNOO_ENV === 'development'`.
- **Approved Commercial Plan Codes:** Production SaaS billing uses approved plan mappings defined in `public.billing_plan_provider_mappings` with exact minor-currency amounts (e.g. ₦15,000.00 / mo for Growth).
- **Fulfillment Invariant:** Webhook processing (`/api/v1/webhooks/paystack`) verifies HMAC-SHA512 signatures and is 100% idempotent. No value is delivered without server-side verification.

### 5.3 Google Gemini AI Server Client
- **Model Standard:** Default model is pinned to `gemini-2.5-flash`.
- **Kill-Switch Invariant:** Setting `AI_ENABLED=false` immediately disables all AI classification and insight routes with `AI_FEATURE_DISABLED`. Core business accounting operates with zero disruption.
- **Numeric Guard Invariant:** Deterministic domain calculations calculate all financial totals and Health scores; Gemini only generates textual explanations.

### 5.4 Meta WhatsApp Business Platform
- **Official API Standard:** Direct integration with Meta Cloud API (`v20.0`).
- **Opt-In / Opt-Out Invariant:** Inviolable respect of user `STOP` / `START` commands; consent records are verified on every outbound dispatch.
- **Deduplication Invariant:** Provider message IDs are deduplicated in `public.whatsapp_webhook_receipts` to prevent duplicate AI turns.

### 5.5 Mobile Application (Expo & EAS)
- **Application Identifiers:**
  - App Name: `NNOO`
  - Slug: `nnoo-mobile`
  - URL Scheme: `nnoo`
  - Package / Bundle Identifier: `com.nnoo.mobile`
  - EAS Project ID: `8b92b6a2-6f17-48f5-a08c-9a4f65c19e42`
  - Version: `1.0.0` (Android `versionCode: 1`, iOS `buildNumber: "1"`)
  - Android Target SDK: `35` (Android 15)
- **Backend Invariant:** Mobile app communicates exclusively with the canonical Supabase Production API URL (`https://hoorlxgtnamwdxszsbwt.supabase.co`) and public Web origin (`https://nnoo.app`).
- **Store Compliance Invariant:** In-app and public web account deletion workflows (`https://nnoo.app/account-deletion`) comply with Apple and Google Play store privacy requirements.


---

## 6. Secret Sanitization & Bundle Protection

- **Client Bundle Protection:** Web production builds strictly verify that zero server-only environment variables are exposed in JavaScript output.
- **Log Scrubbing:** Universal structured logging (`apps/web/src/server/observability/logger.ts`) runs `redactSecrets()` over all log messages and metadata.
- **Git Protection:** `.gitignore` blocks `.env`, `.env.local`, `.env.production`, `*.pem`, `*.jks`, `*.p8`, and `*.p12` across the root monorepo and `apps/mobile`.

---

## 7. Production Provider Certification Status (Tranche 4 Prompt 10)

| Provider | Configuration Status | Production Certification Status | Last Verified |
|---|---|---|---|
| **Supabase** | Configured (Production instance) | **REAL PRODUCTION VERIFIED** | 2026-08-19 |
| **Paystack** | Configured (Live mode) | **VERIFIED (Live Ready)** — Real monetary charges require explicit human authorization | 2026-08-19 |
| **Google Gemini** | Configured (`gemini-2.5-flash`) | **REAL PRODUCTION VERIFIED** | 2026-08-19 |
| **Inngest** | Configured (Cloud Production) | **REAL PRODUCTION VERIFIED** | 2026-08-19 |
| **Meta WhatsApp** | Configured (Cloud API `v20.0`) | **REAL PRODUCTION VERIFIED** | 2026-08-19 |
| **Expo Push / APNs / FCM** | Configured (Production gateway) | **REAL PRODUCTION VERIFIED** | 2026-08-19 |
| **Supabase Auth** | Configured (`https://nnoo.app`) | **REAL PRODUCTION VERIFIED** | 2026-08-19 |

Authoritative certification detail: `docs/project/PRODUCTION_PROVIDER_VALIDATION.md`.
