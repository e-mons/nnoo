# NNOO — Provider Operations & Integration Map

Document ID: `PROV-OPS-MAP-01`  
Governance Version: `1.0.0`  
Last Reconciled: `2026-08-20` (Tranche 4 Prompt 12 Handover)  
Status: **Authoritative Provider Operations Map**

---

## 1. Production Provider Operations Map

| Provider | Purpose | Production Environment | Operational Dashboard | Credential Owner | Validation Status | Primary Runbook |
|---|---|---|---|---|---|---|
| **Supabase** | Core PostgreSQL Database, Auth, Storage | Cloud (`hoorlxgtnamwdxszsbwt`) | `https://supabase.com/dashboard/project/hoorlxgtnamwdxszsbwt` | David Bako | **`CERTIFIED`** (P10) | [10-database-supabase-outage.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/10-database-supabase-outage.md) |
| **Vercel** | Web Application Hosting & Edge Routing | Edge Network (`nnoo`) | `https://vercel.com/dashboard/projects/nnoo` | David Bako | **`CERTIFIED`** (P08) | [09-web-api-outage.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/09-web-api-outage.md) |
| **Paystack** | SaaS Subscription Billing & Checkout | Live Mode API | `https://dashboard.paystack.com` | David Bako | **`CERTIFIED`** (P10) | [12-paystack-billing-incident.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/12-paystack-billing-incident.md) |
| **Google Gemini** | Natural Language AI Assistant | Cloud API (`gemini-2.5-flash`) | `https://console.cloud.google.com/apis/dashboard` | David Bako | **`CERTIFIED`** (P10) | [13-gemini-ai-outage.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/13-gemini-ai-outage.md) |
| **Inngest Cloud**| Serverless Durable Jobs & Crons | Cloud Production App | `https://app.inngest.com` | David Bako | **`CERTIFIED`** (P10) | [14-durable-jobs-backlog.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/14-durable-jobs-backlog.md) |
| **Meta WhatsApp**| WhatsApp Cloud API Messaging | Graph API `v20.0` (WABA) | `https://business.facebook.com/wa/manage` | David Bako | **`CERTIFIED`** (P10) | [16-whatsapp-business-outage.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/16-whatsapp-business-outage.md) |
| **Expo Push** | Mobile Push Notification Dispatch | Cloud Gateway | `https://expo.dev/accounts/davidbako/projects/mobile` | David Bako | **`CERTIFIED`** (P10) | [15-push-notification-outage.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/15-push-notification-outage.md) |
