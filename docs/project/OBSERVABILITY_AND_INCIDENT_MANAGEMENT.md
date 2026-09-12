# NNOO Observability & Incident Management Operations Manual

Owner and Lead Developer: **David Bako**  
Project: **NNOO — Africa’s AI Business Operating System**  
Status: **Authoritative Operations & Incident Document**  
Governance Version: **1.0.0**

---

## 1. Primary Purpose & Philosophy

Make NNOO operationally observable, diagnosable, and resilient under failure.

Observability exists to answer ten essential questions during an anomaly:
1. **What failed?** (Exact error code and component)
2. **When did it fail?** (Precise UTC timestamp)
3. **Which service or feature failed?** (Clear subsystem namespace)
4. **Which environment is affected?** (`development`, `preview`, `production`)
5. **Which business tenant or operation is affected?** (Scoped internal reference)
6. **Is the failure transient or permanent?** (Retryable vs terminal)
7. **Is canonical accounting data at risk?** (Mathematical parity check $\Delta 0$)
8. **Are end users affected?** (Safe user messaging)
9. **Is retry safe?** (Idempotency and double-spend protection)
10. **What operational action should be taken?** (Direct runbook link)

> [!IMPORTANT]
> **Core Operating Invariant:**
> **Observability watches NNOO — it never becomes NNOO's source of truth.**
> Telemetry failure runs fail-open and will NEVER cause a duplicate financial mutation or abort a legitimate transaction.

---

## 2. The Three Observability Signals

```text
USER ACTION / SYSTEM EVENT
           ↓
    CORRELATION ID
           ↓
     NNOO SERVICE
           ↓
DATABASE / UPSTREAM PROVIDER
           ↓
   NORMALIZED RESULT
   ┌───────┼───────┐
   ↓       ↓       ↓
 LOGS   METRICS  TRACES
```

1. **Logs (What happened):** Structured JSON events emitted by server services with level, timestamp, correlation ID, error code, and redacted metadata.
2. **Metrics (How often / How much):** Real counts, latencies, failure rates, and queue depths computed deterministically with zero paid provider pings.
3. **Traces & Correlation (How an operation traveled):** Propagation of a single `correlationId` through API requests, domain services, database transactions, background jobs, and outbound delivery adapters.

---

## 3. Structured Logging Architecture

### 3.1 Standard Structured JSON Schema
All server-side logs conform to the standard structure implemented in `StructuredLogger` ([`apps/web/src/server/observability/logger.ts`](file:///c:/Users/H-P/Desktop/nnoo/apps/web/src/server/observability/logger.ts)):

```json
{
  "timestamp": "2026-08-19T12:00:00.000Z",
  "level": "INFO",
  "environment": "production",
  "service": "billing",
  "feature": "paystack_webhook",
  "eventName": "webhook_verified",
  "correlationId": "nnoo_corr_a1b2c3d4e5f67890",
  "requestId": "req_98765432",
  "businessRef": "biz_01948572",
  "userRef": "usr_99887766",
  "provider": "paystack",
  "operationRef": "sub_active_plan_pro",
  "attempt": 1,
  "status": "SUCCESS",
  "durationMs": 42,
  "metadata": {
    "planCode": "PLN_growth_monthly",
    "currency": "NGN"
  }
}
```

### 3.2 Service Namespaces
- `web`: Next.js frontend pages, server actions, route transitions.
- `api`: REST endpoint handlers under `/api/v1/`.
- `database`: PostgreSQL queries, connection pooling, migrations.
- `ai`: Gemini invocations, structured output parsing, Ask NNOO tools.
- `billing`: Paystack checkout, webhook processing, subscription lifecycle.
- `jobs`: Inngest background jobs, schedules, retry execution.
- `whatsapp`: Meta Cloud API webhooks, linking, template dispatch.
- `push`: Expo / APNs / FCM push notification delivery.
- `recovery`: Backup verification, disaster recovery rehearsals, restore audits.
- `security`: Authentication, RBAC checks, rate limiting, RLS guards.

### 3.3 Log Level Model
- `DEBUG`: Verbose diagnostic information during development. Suppressed in production by default.
- `INFO`: Normal operational milestones (successful logins, sales created, invoices issued, jobs completed).
- `WARN`: Recoverable degradation, transient retryable failures, rate-limit warnings, suppressed notifications.
- `ERROR`: Unhandled exceptions, persistent provider outages, failed webhook verification, data-reconciliation alerts.

---

## 4. Secret & PII Redaction Policy

### 4.1 Strict Masking Patterns
The `redactSecrets` utility scrubs all sensitive patterns prior to log emission:
- **Gemini API Keys:** `AIza...` $\to$ `[REDACTED_GEMINI_KEY]`
- **Supabase Tokens:** `sbp_...` $\to$ `[REDACTED_SUPABASE_TOKEN]`
- **Supabase JWTs:** `eyJhbG...` $\to$ `[REDACTED_SUPABASE_JWT]`
- **Paystack Keys:** `sk_test_...` / `sk_live_...` $\to$ `[REDACTED_PAYSTACK_KEY]`
- **Meta WhatsApp Tokens:** `EAAG...` $\to$ `[REDACTED_META_TOKEN]`
- **Inngest Keys:** `signkey-...` $\to$ `[REDACTED_INNGEST_KEY]`
- **Bearer Tokens:** `Bearer ...` $\to$ `Bearer [REDACTED_JWT]`
- **JSON Fields:** `"password"`, `"secret"`, `"token"`, `"apiKey"` $\to$ `"[REDACTED]"`

### 4.2 Data Minimization Rules
1. Never log raw financial transaction payloads (customer credit card numbers, complete sales line items).
2. Never log raw conversational text from Ask NNOO chats or WhatsApp messages.
3. Never log raw mobile push device tokens.
4. Truncate metadata strings exceeding 1,000 characters to prevent memory amplification.

---

## 5. Normalized Error System

All server exceptions are mapped to standard `NNOOErrorCode` values defined in [`apps/web/src/server/observability/errors.ts`](file:///c:/Users/H-P/Desktop/nnoo/apps/web/src/server/observability/errors.ts):

| Error Code | Category | User-Facing Message | Retryable? |
|---|---|---|---|
| `AUTH_REQUIRED` | Identity | Authentication required. Please sign in to continue. | No |
| `PERMISSION_DENIED` | Authorization | You do not have permission to perform this action. | No |
| `BUSINESS_SUSPENDED` | Account State | This business account is currently suspended. Please contact support. | No |
| `VALIDATION_FAILED` | Client Input | The provided data is invalid. Please check your inputs and try again. | No |
| `NOT_FOUND` | Resource | The requested resource could not be found. | No |
| `CONFLICT` | State | A conflict occurred with an existing record. Please refresh and try again. | Yes |
| `RATE_LIMITED` | Edge / Rate | Too many requests. Please slow down and try again shortly. | Yes |
| `DATABASE_UNAVAILABLE` | Database | We are experiencing temporary service disruption. Please try again in a few moments. | Yes |
| `PAYSTACK_UNAVAILABLE` | Billing Provider | Payment provider is currently unavailable. Your payment was not processed. | Yes |
| `PAYSTACK_VERIFICATION_FAILED` | Billing Verification | Payment verification could not be completed. Please contact support. | No |
| `GEMINI_UNAVAILABLE` | AI Provider | AI intelligence is temporarily unavailable. Core business features remain functional. | Yes |
| `GEMINI_RATE_LIMITED` | AI Provider | AI processing quota reached. Please retry in a few moments. | Yes |
| `JOB_FAILED` | Background Job | Background processing encountered an issue. It will be retried automatically. | Yes |
| `PUSH_DELIVERY_FAILED` | Push Provider | Push notification could not be delivered to device. | Yes |
| `WHATSAPP_DELIVERY_FAILED` | Messaging Provider | WhatsApp message delivery failed. Please check your notification preferences. | Yes |
| `STORAGE_UNAVAILABLE` | Object Storage | Document storage is temporarily unavailable. Please try again shortly. | Yes |
| `INTERNAL_ERROR` | Server Runtime | An unexpected error occurred. Our team has been notified. | No |

---

## 6. Component Health & Status Semantics

### 6.1 Status Taxonomy
- `NOT_CONFIGURED`: Missing environment secrets (e.g. Paystack Live key not set in dev).
- `CONFIGURED`: Secrets present, waiting for first real event.
- `HEALTHY`: 0 recent failures in observation window, or failure rate $\le 30\%$.
- `DEGRADED`: Failure rate $> 30\%$ but service partially responding.
- `UNAVAILABLE`: 100% recent failures or complete connection refusal.
- `UNKNOWN`: No telemetry received within the staleness window (> 60 minutes).

### 6.2 Zero-Cost Health Policy
Health evaluation in `PlatformReliabilityService` runs passively against cached telemetry. It makes:
- **0 paid Gemini API calls**
- **0 WhatsApp test messages**
- **0 Push notification alerts**
- **0 fake Paystack transactions**

---

## 7. Incident Classification & Severity Model

| Severity | Definition | Examples | Response Target |
|---|---|---|---|
| **SEV-1 (Critical)** | Core platform outage, cross-tenant data leak, or double-entry ledger corruption. | Database unreachable, unposted journal imbalance, widespread auth failure. | Immediate response (< 15 mins) |
| **SEV-2 (High)** | Major provider outage or critical workflow degradation where core remains intact. | Paystack billing down, Inngest job backlog > 500, widespread WhatsApp delivery failure. | Urgent (< 1 hour) |
| **SEV-3 (Medium)** | Single non-essential feature degradation. | Gemini AI rate-limited, single push token failure, AI Bookkeeper suggestion delayed. | Same day (< 4 hours) |
| **SEV-4 (Low)** | Minor cosmetic or non-blocking diagnostic anomaly. | Single un-retried log emission failure, documentation link typo. | Next business day |

---

## 8. Provider Outage Isolation Invariants

```text
PROVIDER OUTAGE             EFFECT ON NNOO
══════════════════════════════════════════════════════════════════════
Gemini AI Down           →  Ask NNOO shows friendly pause.
                            Health Score & Credit Passport CONTINUE (Deterministic).
                            Sales, Expenses, Invoices CONTINUE.

WhatsApp API Down        →  WhatsApp messaging paused.
                            In-App Notifications & Push CONTINUE.
                            Core Web & Mobile apps CONTINUE.

Push Service Down        →  Push alerts delayed.
                            In-App Attention Center & WhatsApp CONTINUE.

Inngest Jobs Down        →  Background daily summaries queued/delayed.
                            On-demand user transactions CONTINUE.

Paystack API Down        →  SaaS checkout/upgrade delayed.
                            Existing business ledger data 100% SAFE.
```

---

## 9. Operational Incident Runbooks Index

| Runbook ID | Title | Target File |
|---|---|---|
| `01` | Database Recovery & PITR | [`01-database-recovery.md`](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/01-database-recovery.md) |
| `02` | Failed Migration Recovery | [`02-failed-migration-recovery.md`](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/02-failed-migration-recovery.md) |
| `03` | Accidental Deletion / Corruption | [`03-accidental-deletion-and-corruption-recovery.md`](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/03-accidental-deletion-and-corruption-recovery.md) |
| `04` | Supabase Storage Recovery | [`04-supabase-storage-recovery.md`](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/04-supabase-storage-recovery.md) |
| `05` | Git Repository Recovery | [`05-git-repository-recovery.md`](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/05-git-repository-recovery.md) |
| `06` | Environment & Config Recovery | [`06-environment-and-configuration-recovery.md`](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/06-environment-and-configuration-recovery.md) |
| `07` | Full System Reconstruction | [`07-full-system-reconstruction.md`](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/07-full-system-reconstruction.md) |
| `08` | Post-Restore Verification | [`08-post-restore-verification.md`](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/08-post-restore-verification.md) |
| `09` | Core Web & API Outage | [`09-web-api-outage.md`](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/09-web-api-outage.md) |
| `10` | Database & Supabase Outage | [`10-database-supabase-outage.md`](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/10-database-supabase-outage.md) |
| `11` | Financial Integrity Incident | [`11-financial-integrity-incident.md`](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/11-financial-integrity-incident.md) |
| `12` | Paystack Billing Incident | [`12-paystack-billing-incident.md`](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/12-paystack-billing-incident.md) |
| `13` | Google Gemini AI Outage | [`13-gemini-ai-outage.md`](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/13-gemini-ai-outage.md) |
| `14` | Durable Jobs Backlog | [`14-durable-jobs-backlog.md`](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/14-durable-jobs-backlog.md) |
| `15` | Push Notification Outage | [`15-push-notification-outage.md`](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/15-push-notification-outage.md) |
| `16` | WhatsApp Business Outage | [`16-whatsapp-business-outage.md`](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/16-whatsapp-business-outage.md) |
| `17` | Incident Postmortem Template | [`17-incident-postmortem-template.md`](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/17-incident-postmortem-template.md) |

---

## 10. Production Provider Observability Validation (Tranche 4 Prompt 10)

All production external provider operations are observable through the structured logging and correlation infrastructure established in T4-P05:

| Provider | Observable Operation | Correlation Field | Log Privacy |
|---|---|---|---|
| **Paystack** | Initialization, verification, webhook, fulfillment | `paystack_reference` (masked) | Zero card data or authorization secrets |
| **Gemini** | Request, structured response, schema validation | `correlation_id` | Zero full prompts or API keys |
| **Inngest** | Job dispatch, execution, retry, completion | `inngest_function_id`, `attempt` | Zero signing keys or event keys |
| **WhatsApp** | Inbound webhook, signature verification, outbound dispatch | `whatsapp_message_id` (masked phone) | Zero raw phone numbers or access tokens |
| **Push** | Token registration, ticket dispatch, receipt processing | `push_ticket_id` | Zero push tokens or device identifiers |
| **Supabase Auth** | Signup confirmation, password recovery, callback | `correlation_id` | Zero password hashes or reset tokens |

Production provider validation verified on 2026-08-19. See `docs/project/PRODUCTION_PROVIDER_VALIDATION.md` for complete certification.
