# NNOO — External Dependencies & Provider Criticality Register

Document ID: `EXT-DEP-01`  
Governance Version: `1.0.0`  
Last Reconciled: `2026-08-20` (Tranche 4 Prompt 12 Handover)  
Status: **Authoritative Dependency Register**

---

## 1. Criticality Classification Framework

External services and third-party dependencies are classified into three operational criticality tiers:
- **`CORE`**: Complete platform availability depends on this service. If unavailable, core authentication or data persistence stops. Immediate high-severity incident response required.
- **`IMPORTANT`**: Powers key business modules (AI, billing, background jobs, multi-channel messaging). If unavailable, system operates in degraded mode; core double-entry accounting remains 100% functional.
- **`OPTIONAL / UTILITY`**: Non-blocking convenience features. Failure causes minimal customer impact.

---

## 2. External Provider Register

| Provider | Purpose | Criticality | Production Status | Failure Impact | Graceful Fallback / Mitigation | Primary Runbook |
|---|---|---|---|---|---|---|
| **Supabase** | PostgreSQL Database, Auth, RLS, Edge Storage | **`CORE`** | **`PRODUCTION VERIFIED`** | Total platform outage for data queries and auth logins | Automated PITR backups; database failover procedures | [10-database-supabase-outage.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/10-database-supabase-outage.md) |
| **Vercel** | Web hosting, Edge Network, API routing | **`CORE`** | **`PRODUCTION VERIFIED`** | Web app and API v1 endpoints unreachable | DNS failover / Instant deployment rollback | [09-web-api-outage.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/09-web-api-outage.md) |
| **Paystack** | SaaS subscription billing & checkout | **`IMPORTANT`** | **`PRODUCTION VERIFIED`** | Users cannot upgrade or renew subscriptions; webhooks fail | Core accounting functions 100%; subscription grace period | [12-paystack-billing-incident.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/12-paystack-billing-incident.md) |
| **Google Gemini** | Natural language classification, Ask NNOO | **`IMPORTANT`** | **`PRODUCTION VERIFIED`** | AI features return `AI_FEATURE_DISABLED`; Smart Insights unavailable | UI displays clear offline notice; all ledger operations work | [13-gemini-ai-outage.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/13-gemini-ai-outage.md) |
| **Inngest Cloud**| Durable background jobs & attention scans | **`IMPORTANT`** | **`PRODUCTION VERIFIED`** | Scheduled summaries delayed; attention scanner paused | Synchronous business actions unaffected; jobs replay on recovery | [14-durable-jobs-backlog.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/14-durable-jobs-backlog.md) |
| **Meta WhatsApp**| WhatsApp Cloud API notifications & Ask NNOO | **`IMPORTANT`** | **`PRODUCTION VERIFIED`** | WhatsApp messages not sent; inbound commands unanswered | In-app notification center functions normally | [16-whatsapp-business-outage.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/16-whatsapp-business-outage.md) |
| **Expo Push** | Mobile push notifications gateway | **`IMPORTANT`** | **`PRODUCTION VERIFIED`** | Lock-screen push alerts delayed or dropped | In-app notifications deliver immediately | [15-push-notification-outage.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/15-push-notification-outage.md) |
| **Apple Connect**| iOS app store distribution & TestFlight | **`IMPORTANT`** | **`EXTERNAL ACTION REQUIRED`**| iOS users cannot download new native app binary updates | Web app remains fully accessible via mobile safari | [MOBILE_RELEASE.md](file:///c:/Users/H-P/Desktop/nnoo/docs/operations/MOBILE_RELEASE.md) |
| **Google Play** | Android app distribution & updates | **`IMPORTANT`** | **`EXTERNAL ACTION REQUIRED`**| Android users cannot download new native AAB updates | Web app remains fully accessible via mobile Chrome | [MOBILE_RELEASE.md](file:///c:/Users/H-P/Desktop/nnoo/docs/operations/MOBILE_RELEASE.md) |

---

## 3. Failure Isolation Proof ($\Delta 0$ Invariant)

A key architectural achievement of NNOO is **Complete Provider Failure Isolation**:
- If Gemini, Paystack, WhatsApp, Expo Push, or Inngest experience a complete outage simultaneously, the core business engine (Sales recording, Customer invoice issuance, Payment receipt generation, Expense tracking, and Inventory costing) continues to operate with **zero data corruption ($\Delta 0$)**.
- External provider events are queued, retried with exponential backoff, or cleanly degraded without throwing unhandled exceptions to end users.
