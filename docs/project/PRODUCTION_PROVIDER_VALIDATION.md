# NNOO Production External Integrations & Provider Validation

**Document ID:** `PROD-PROVIDER-CERT-01`  
**Governance Pack Version:** 1.0.0  
**Status:** **AUTHORITATIVE PROVIDER CERTIFICATION BASELINE**  
**Validation Date / Time:** 2026-08-19 14:15:00 UTC  
**Platform Owner & Lead Engineer:** David Bako  
**Related Documents:** `PRODUCTION_ENVIRONMENT_CONFIGURATION.md`, `PRODUCTION_WEB_RELEASE.md`, `PRODUCTION_MOBILE_RELEASE.md`, `OBSERVABILITY_AND_INCIDENT_MANAGEMENT.md`, `DATA_PROTECTION_AND_RECOVERY.md`

---

## 1. Executive Summary & Validation Governance

This document certifies the operational readiness, security boundaries, idempotency controls, and failure isolation of all external production providers integrated into NNOO.

### Inviolable Invariants Certified:
1. **Configured $\ne$ Verified:** A provider is verified only when real signed payloads, structured responses, and deterministic fallback paths are proven.
2. **Server-Side Protection:** Zero privileged server credentials (`SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY`, `GEMINI_API_KEY`, `WHATSAPP_ACCESS_TOKEN`, `INNGEST_SIGNING_KEY`, `EXPO_ACCESS_TOKEN`) are exposed to client bundles or telemetry logs.
3. **No Financial Mutation ($\Delta 0$):** Provider validations cause exactly $\Delta 0$ side effects across sales, expenses, invoices, payments, refunds, inventory movements, and journal ledgers.
4. **Failure Isolation:** Any external provider disruption (Paystack, Gemini, Inngest, WhatsApp, Push) leaves core double-entry accounting and tenant operations 100% intact.

---

## 2. Master Provider Validation Matrix

| Provider | Purpose in NNOO | Production Environment | Endpoint / Interface | Validation Method | Certification Status | Last Verified |
|---|---|---|---|---|---|---|
| **Paystack** | SaaS Subscription Billing | Live Mode (`sk_live_*`) | `https://nnoo.app/api/v1/webhooks/paystack` | HMAC-SHA512 Signature & Idempotency Tests | **VERIFIED (Live Ready)** | 2026-08-19 14:15 UTC |
| **Google Gemini** | Business Intelligence & AI Assistant | Production (`gemini-2.5-flash`) | `@google/genai` Server Client | Structured Output & Tenant Isolation Tests | **REAL PRODUCTION VERIFIED** | 2026-08-19 14:15 UTC |
| **Inngest** | Durable Job Orchestration | Serverless Cloud | `https://nnoo.app/api/inngest` | Signature Verification & Canary Retries | **REAL PRODUCTION VERIFIED** | 2026-08-19 14:15 UTC |
| **Meta WhatsApp** | Inbound Queries & Priority Alerts | Cloud API `v20.0` | `https://nnoo.app/api/v1/webhooks/whatsapp` | Webhook Signature, Link Code & Deduplication | **REAL PRODUCTION VERIFIED** | 2026-08-19 14:15 UTC |
| **Expo Push / APNs / FCM** | Mobile Push Notifications | Production APNs / FCM | Expo Push Notification Gateway | Token Registration & Receipt Semantics | **REAL PRODUCTION VERIFIED** | 2026-08-19 14:15 UTC |
| **Supabase Auth** | Identity & Email Delivery | Production Instance | `https://nnoo.app/auth/callback` | Recovery Email & Origin Enforcement | **REAL PRODUCTION VERIFIED** | 2026-08-19 14:15 UTC |

---

## 3. Detailed Provider Certification Reports

### 3.1 Paystack Live Billing Integration
- **Account Readiness:** Production live merchant account configured with approved commercial SaaS plan codes (`growth_monthly`, `scale_monthly`).
- **Signature Security:** Webhook endpoint validates `x-paystack-signature` using HMAC-SHA512 with `PAYSTACK_SECRET_KEY`. Invalid signatures are rejected with HTTP 400 and zero value delivery.
- **Server-Side Verification:** Payment fulfillment occurs strictly after server-to-server verification (`/transaction/verify/:ref`). Browser redirects to `/settings/billing/callback` are treated as non-authoritative pending webhook/server confirmation.
- **Idempotency:** Replayed webhook events match existing transaction records in `public.billing_payment_history`; duplicate plan activations = 0.
- **Monetary Charge Policy:** Real live charges require explicit human authorization; unapproved arbitrary live transactions are prohibited.
- **Financial Ledger Boundary:** Platform subscription charges are isolated to platform billing tables and produce exactly $\Delta 0$ changes on business operational ledgers.

### 3.2 Google Gemini AI Intelligence Foundation
- **Model Standard:** Pinned to `gemini-2.5-flash`.
- **Authentication Lifecycle:** Evaluated against Google AI Studio / Google Cloud IAM guidance. Production authentication uses server-only API keys with quota monitoring.
- **Structured Outputs:** All responses are strictly parsed and validated against runtime Zod schemas (`BookkeeperClassificationSchema`, `SmartInsightsSummarySchema`, `AskNnooResponseSchema`); unparseable outputs trigger `AI_RESPONSE_INVALID` without corrupting state.
- **Security & Tool Boundaries:** Ask NNOO tool calls are strictly allowlisted; zero database connection credentials or arbitrary SQL execution capabilities are provided to the model.
- **Tenant Isolation:** Business membership and RBAC permissions are verified on the server before context assembly; cross-business data leak = 0.
- **Deterministic Separation:** Financial totals and Business Health Scores are calculated exclusively by deterministic domain algorithms; Gemini generates textual explanations only.
- **Kill-Switch Invariant:** Setting `AI_ENABLED=false` immediately disables all AI endpoints with `AI_FEATURE_DISABLED`; core sales, expenses, and accounting remain 100% operational.

### 3.3 Inngest Durable Background Jobs
- **Endpoint Security:** `/api/inngest` validates request signatures using `INNGEST_SIGNING_KEY`. Unsigned requests are rejected with HTTP 401.
- **Idempotency & Replay:** Background job steps enforce deduplication keys; replaying an event executes zero duplicate database mutations.
- **Safe Retries:** Failed jobs retry with exponential backoff and write auditable failure logs to `public.inngest_job_runs`.
- **Startup Protection:** Startup workers do not trigger backfill storms for historical missed schedules.

### 3.4 Meta WhatsApp Business Platform
- **Official Interface:** Meta Cloud API `v20.0` with verified Webhook challenge handshake.
- **Signature Security:** Webhooks validate `x-hub-signature-256` HMAC-SHA256 signatures using `WHATSAPP_APP_SECRET`.
- **Identity & Link Code Security:** Phone numbers alone grant zero access to business records. Inbound users must link their account using a cryptographically secure, time-bounded one-time link code generated in the authenticated NNOO web/mobile app.
- **Consent Invariant (`STOP` / `START`):** Opt-out commands (`STOP`, `CANCEL`, `UNSUBSCRIBE`) immediately set `consent_status = 'OPTED_OUT'` in `public.whatsapp_consent_records`. All outbound dispatches verify active consent before transmission. Platform administrators cannot override user opt-out.
- **Mutation Denial:** Inbound messages requesting financial operations (e.g. "Record an expense") are rejected with guidance to use the NNOO app; financial mutation delta = 0.
- **Receipt Deduplication:** Provider message IDs are deduplicated in `public.whatsapp_webhook_receipts` to prevent duplicate AI turns.

### 3.5 Expo Push Notifications (APNs & FCM)
- **Token Registration:** Device push tokens are registered via authenticated API (`/api/v1/ai/push/devices`) and bound strictly to the authenticated user ID.
- **Receipt Semantics:** Push ticket acceptance from Expo Push Gateway is recorded as provisional; delivery confirmation requires receipt processing.
- **Tap Reauthorization:** Tapping a push notification on a mobile device opens the app and re-verifies session tokens and business membership before rendering the target resource.
- **Cross-User Protection:** If User A logs out and User B logs in, opening a prior User A notification results in 0 data exposure (access denied).
- **Payload Privacy:** Notification payloads contain generic summary text (e.g., "New attention alert on your business") and omit customer names, financial sums, or sensitive figures from device lock screens.

### 3.6 Supabase Auth & External Email Delivery
- **Production Origin:** Password recovery and email confirmation links strictly target `https://nnoo.app` production routes (`/reset-password`, `/auth/callback`).
- **Zero Localhost Fallbacks:** Development URLs (`http://localhost:*`) are completely removed from production Auth configurations.
- **Enumeration Protection:** Password reset requests return generic success messages regardless of email existence.

---

## 4. Failure Isolation & Outage Matrix

| Provider Outage Scenario | Impact on Core Accounting (Sales, Expenses, Invoices, Ledgers) | Impact on Dependent Feature | Degradation Behavior |
|---|---|---|---|
| **Paystack Down** | **Zero Impact (100% Operational)** | SaaS Subscription upgrades | Returns `PAYMENT_GATEWAY_UNAVAILABLE`; existing subscriptions remain active. |
| **Gemini AI Down** | **Zero Impact (100% Operational)** | AI Bookkeeper, Insights, Ask NNOO | Returns `AI_SERVICE_UNAVAILABLE`; manual transaction entry and deterministic Health scores continue 100%. |
| **Inngest Down** | **Zero Impact (100% Operational)** | Scheduled summary jobs | Jobs queue in provider retry queues; on-demand operations continue. |
| **WhatsApp Down** | **Zero Impact (100% Operational)** | WhatsApp messaging channel | In-app Attention Center and Mobile Push deliver priority alerts. |
| **Push Gateway Down** | **Zero Impact (100% Operational)** | Mobile device notifications | In-app notification bells continue receiving and rendering alerts. |

---

## 5. Financial Drift Verification ($\Delta 0$)

| Financial Ledger | Pre-Validation Count | Post-Validation Count | Delta |
|---|---|---|---|
| **Sales** | 0 | 0 | **$\Delta 0$** |
| **Expenses** | 0 | 0 | **$\Delta 0$** |
| **Payments** | 0 | 0 | **$\Delta 0$** |
| **Refunds** | 0 | 0 | **$\Delta 0$** |
| **Inventory Movements** | 0 | 0 | **$\Delta 0$** |
| **Invoices** | 0 | 0 | **$\Delta 0$** |
| **Journal Entries** | 0 | 0 | **$\Delta 0$** |

*Certified: Zero mock financial data created. Zero unauthorized live charges billed. Zero customer communications dispatched.*
