# NNOO — Business Continuity & Outage Impact Guide

Document ID: `BIZ-CONT-01`  
Governance Version: `1.0.0`  
Last Reconciled: `2026-08-20` (Tranche 4 Prompt 12 Handover)  
Status: **Authoritative Business Continuity Guide**

---

## 1. Provider Outage Degradation Matrix

| Provider Outage | Affected Features | Unaffected Core Features | Operator Action & Recovery Path |
|---|---|---|---|
| **Google Gemini AI Down** | AI Bookkeeper suggestions, Smart Insights generation, Ask NNOO conversational queries. | Sales, Inventory, Invoicing, Customer Payments, Expenses, Accounting General Ledger, Dashboard reports. | System degrades automatically with `AI_FEATURE_DISABLED`; users enter expense categories manually; follow [13-gemini-ai-outage.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/13-gemini-ai-outage.md). |
| **Paystack Billing Down** | SaaS subscription upgrades, renewal card charges, billing checkout modal. | All business operations (Sales, Invoices, Stock, Expenses, AI Bookkeeper, Accounting). | Subscriptions enter 3-day grace period; core accounting unaffected; follow [12-paystack-billing-incident.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/12-paystack-billing-incident.md). |
| **Inngest Cloud Down** | Scheduled background cron jobs (daily low-stock scans, weekly health recalculations). | All synchronous web and mobile user operations (recording sales, creating products, generating PDF receipts). | Synchronous actions execute immediately; jobs queue and replay on recovery; follow [14-durable-jobs-backlog.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/14-durable-jobs-backlog.md). |
| **Meta WhatsApp Down** | WhatsApp alert deliveries and WhatsApp Ask NNOO inbound messages. | In-app notification center, Mobile push alerts, Web & Mobile applications. | In-app notifications deliver uninterrupted; follow [16-whatsapp-business-outage.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/16-whatsapp-business-outage.md). |
| **Expo Push Gateway Down**| Lock-screen mobile push alert delivery. | In-app notification inbox, Web application, WhatsApp alerts. | Users see alerts directly in the in-app notification center; follow [15-push-notification-outage.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/15-push-notification-outage.md). |
| **Vercel Web Hosting Down**| Web application and API endpoints. | Supabase backend data, Mobile app local caching. | Failover DNS or check Vercel status; follow [09-web-api-outage.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/09-web-api-outage.md). |
| **Supabase Database Down** | Entire platform persistence and authentication. | None (Critical platform dependency). | Execute Point-in-Time Recovery (PITR) or failover; follow [10-database-supabase-outage.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/10-database-supabase-outage.md). |
