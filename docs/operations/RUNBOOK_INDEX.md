# NNOO — Master Operational Runbook Index

Document ID: `RUN-INDEX-01`  
Governance Version: `1.0.0`  
Last Reconciled: `2026-08-20` (Tranche 4 Prompt 12 Handover)  
Status: **Authoritative Runbook Index**

---

## 1. Incident Severity Definitions

- **SEV-1 (Critical):** Core platform outage (Web app down, database unreachable, widespread data corruption).
- **SEV-2 (High):** Major business module outage (Auth failure, payment webhook failing, background job queue blocked).
- **SEV-3 (Medium):** Degraded non-blocking integration (Gemini AI rate limit, WhatsApp delivery delay, push gateway slow).
- **SEV-4 (Low):** Minor UI cosmetic defect, single non-critical edge case.

---

## 2. Complete Production Runbook Catalog

| Runbook ID | Title | Severity | Primary Focus Area | Document Link |
|---|---|---|---|---|
| **RUN-01** | Database Recovery & Snapshot Restore | SEV-1 | Database Disaster Recovery | [01-database-recovery.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/01-database-recovery.md) |
| **RUN-02** | Failed Migration Recovery | SEV-2 | Database Schema Repair | [02-failed-migration-recovery.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/02-failed-migration-recovery.md) |
| **RUN-03** | Accidental Deletion & Corruption Recovery | SEV-1 | Data Integrity & Point-in-Time | [03-accidental-deletion-and-corruption-recovery.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/03-accidental-deletion-and-corruption-recovery.md) |
| **RUN-04** | Supabase Storage Recovery | SEV-2 | Object Storage & PDF Documents | [04-supabase-storage-recovery.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/04-supabase-storage-recovery.md) |
| **RUN-05** | Git Repository Recovery | SEV-1 | Source Code & Release Commits | [05-git-repository-recovery.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/05-git-repository-recovery.md) |
| **RUN-06** | Environment & Configuration Recovery | SEV-2 | Vercel & Supabase Environment | [06-environment-and-configuration-recovery.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/06-environment-and-configuration-recovery.md) |
| **RUN-07** | Full System Reconstruction | SEV-1 | Catastrophic Bare-Metal Rebuild | [07-full-system-reconstruction.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/07-full-system-reconstruction.md) |
| **RUN-08** | Post-Restore Verification & Parity Audit | SEV-1 | Return-to-Service Certification | [08-post-restore-verification.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/08-post-restore-verification.md) |
| **RUN-09** | Web Application & API Outage | SEV-1 | Vercel Hosting & Route Routing | [09-web-api-outage.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/09-web-api-outage.md) |
| **RUN-10** | Supabase Database & Auth Outage | SEV-1 | Backend Platform Connectivity | [10-database-supabase-outage.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/10-database-supabase-outage.md) |
| **RUN-11** | Financial Integrity Incident & Discrepancy | SEV-1 | Accounting Ledger Reconciliation | [11-financial-integrity-incident.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/11-financial-integrity-incident.md) |
| **RUN-12** | Paystack Billing & Webhook Incident | SEV-2 | SaaS Subscriptions & Payments | [12-paystack-billing-incident.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/12-paystack-billing-incident.md) |
| **RUN-13** | Google Gemini AI Outage & Rate Limiting | SEV-3 | AI Features & Graceful Fallback | [13-gemini-ai-outage.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/13-gemini-ai-outage.md) |
| **RUN-14** | Durable Background Jobs Backlog | SEV-2 | Inngest Serverless Job Queues | [14-durable-jobs-backlog.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/14-durable-jobs-backlog.md) |
| **RUN-15** | Push Notification Gateway Outage | SEV-3 | Expo Push Token Routing | [15-push-notification-outage.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/15-push-notification-outage.md) |
| **RUN-16** | WhatsApp Business Integration Outage | SEV-3 | Meta Cloud API Webhook Routing | [16-whatsapp-business-outage.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/16-whatsapp-business-outage.md) |
| **RUN-17** | Incident Postmortem Template | All | Root Cause Analysis & Learning | [17-incident-postmortem-template.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/17-incident-postmortem-template.md) |
| **RUN-18** | Production Secret Rotation Procedures | SEV-1/2 | Credential Lifecycle Management | [18-secret-rotation.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/18-secret-rotation.md) |
