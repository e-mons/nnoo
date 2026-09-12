# NNOO — Automations & Durable Background Jobs Guide

Document ID: `JOB-OPS-01`  
Governance Version: `1.0.0`  
Last Reconciled: `2026-08-20` (Tranche 4 Prompt 12 Handover)  
Status: **Authoritative Background Jobs Guide**

---

## 1. Background Job Architecture (Inngest Serverless)

NNOO uses **Inngest Cloud** (`inngest: 4.18.1`) for serverless durable event orchestration and scheduled cron tasks. All job handlers are registered at `/api/inngest` inside `apps/web`.

```text
┌─────────────────────────────────────────────────────────────┐
│                    INNGEST CLOUD EVENT BUS                  │
└──────────────────────────────┬──────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│      SCHEDULED CRONS        │ │       EVENT-DRIVEN JOBS     │
│  - Daily Attention Scanner  │ │  - Notification Fanout      │
│  - Weekly Health Refresh    │ │  - Paystack Webhook Handler │
│  - Monthly Insights Refresh │ │  - Summary Generation       │
└──────────────┬──────────────┘ └──────────────┬──────────────┘
               │                               │
               └───────────────┬───────────────┘
                               │ HTTP POST /api/inngest (Signed)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  NNOO SERVERLESS JOB HANDLERS               │
│  - Verifies INNGEST_SIGNING_KEY                             │
│  - Executes bounded database transactions                   │
│  - Idempotent deduplication keys                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Standard Background Job Registry

| Function Name | Trigger | Idempotency Key Pattern | Responsibility |
|---|---|---|---|
| `scan-attention-conditions` | Cron: Daily at 06:00 UTC | `attention-scan-${businessId}-${date}` | Scans products below reorder levels, overdue invoices, and pending AI reviews. Emits attention events. |
| `refresh-business-health` | Cron: Weekly / On-Demand | `health-refresh-${businessId}-${week}` | Computes deterministic Business Health Score and persists historical record. |
| `generate-smart-insights` | Cron: Weekly / Event | `insights-gen-${businessId}-${period}` | Gathers verified ledger facts and prompts Gemini for explanatory business recommendations. |
| `fanout-notification` | Event: `notification.created`| `notif-fanout-${notificationId}` | Dispatches notifications to In-App, Expo Push, and Meta WhatsApp based on RBAC and user preferences. |
| `process-paystack-webhook` | Event: `paystack.webhook` | `paystack-event-${eventReference}` | Re-verifies payment server-to-server and updates subscription entitlements. |

---

## 3. Idempotency & Retry Protocols

- **Deduplication:** Every job definition includes an explicit `idempotency` key. Replaying an identical event within the deduplication window executes exactly once.
- **Exponential Backoff:** If a job encounters a transient database timeout or external API rate limit, Inngest automatically retries with exponential backoff up to 5 times.
- **Permanent Failure Alerting:** Jobs failing after 5 attempts are routed to the Dead-Letter Queue (DLQ), logged to `admin_audit_logs`, and surface on the Platform Admin dashboard (`/admin`).

---

## 4. Operational Incident Procedures

### 4.1 Queue Backlog & Recovery (Runbook 14)
1. Navigate to the Inngest Cloud Dashboard: `https://app.inngest.com`.
2. Inspect the **Functions** tab for throttled executions or failing runs.
3. If backlogged due to database maintenance, pause functions temporarily:
   - Click **Pause Function** on `scan-attention-conditions`.
   - Resume once database connections stabilize.
4. For detailed step-by-step instructions, see [14-durable-jobs-backlog.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/14-durable-jobs-backlog.md).
