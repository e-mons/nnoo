# Feature Acceptance Report: T3-P08 — Production Intelligence Jobs & Automation Foundation

**Owner / Author:** David Bako  
**Date:** 2026-08-18  
**Feature Code:** T3-P08  
**Status:** COMPLETED & VERIFIED  
**Tranche:** Tranche 3 — Smart Business Tools & Communication  

---

## 1. Overview & Architectural Role

The **Production Intelligence Jobs & Automation Foundation** provides the authoritative background orchestration and operational condition detection engine for NNOO. It enables businesses to configure and run intelligence tasks reliably in the background without violating NNOO's strict architectural boundaries.

### Core Guarantees & Invariants
1. **"WHEN, NOT WHO/WHAT IS AUTHORITATIVE"**: Background execution only orchestrates *when* canonical tasks execute; authoritative calculations remain exclusively within domain code and database functions.
2. **Zero Financial Mutations**: Automated background jobs NEVER create sales, expenses, payments, refunds, stock movements, invoices, receipts, or journal entries.
3. **No AI Bookkeeper Auto-Posting**: High-confidence classifications are NEVER auto-posted in the background; human confirmation from T3-P03 remains mandatory.
4. **No Credit Passport Auto-Generation**: Stale credit passports emit attention events, but are NEVER automatically generated or published.
5. **Zero Notification Delivery (Prompt 8 Scope)**: Emits internal stateful/occurrence attention events only; notification dispatch (email, push, WhatsApp) is strictly reserved for Prompt 9.
6. **Serverless Safety & Durability**: Implemented using Inngest serverless handlers (`apps/web/src/app/api/inngest/route.ts`) with concurrency controls, exponential retries, and strict idempotency keys without relying on in-memory timers or continuous polling loops.
7. **Business Timezone Scheduling**: Schedules resolve execution times and comparison windows in the canonical business timezone (`Africa/Lagos`).
8. **Deduplication & Zero-Gemini Reuse**: Scheduled AI summaries verify source fingerprints before invoking Gemini; unchanged facts reuse summaries with 0 provider calls. Scheduled health score refreshes execute deterministically with 0 Gemini calls.

---

## 2. Database Schema & Multi-Tenant Isolation

Applied migration: `supabase/migrations/20260827000000_intelligence_automation_foundation.sql`

1. `public.business_automations`:
   - Configures per-business automation schedules (`business_summary`, `health_score_refresh`, `attention_scan`).
   - Supports frequencies: `daily`, `weekly`, `monthly`, `off`.
   - Stores `schedule_local_time`, `schedule_weekday`, `schedule_monthday`, and `config_version`.
   - RLS policy: Isolated to business members with `reports.view` or `settings.manage` permissions.
2. `public.intelligence_job_runs`:
   - Durable execution history with `idempotency_key`, `attempt_count`, `source_fingerprint`, `result_id`, `skip_reason`, and optional foreign key to `public.ai_invocations`.
   - RLS policy: Multi-tenant isolated to business members.
3. `public.business_attention_events`:
   - Stateful and occurrence condition records with `dedupe_key`, `severity` (`info`, `attention`, `important`, `critical`), `category` (`STATEFUL`, `OCCURRENCE`), and automatic resolution lifecycle (`active`, `resolved`, `dismissed`).
   - RLS policy: Multi-tenant isolated to business members.

---

## 3. Server-Side Execution Engine

- `apps/web/src/server/ai/automation/scheduler.ts`: Timezone schedule calculator and period comparison resolver.
- `apps/web/src/server/ai/automation/idempotency.ts`: Deterministic idempotency key builder for scheduled and on-demand manual runs.
- `apps/web/src/server/ai/automation/attention-scanner.ts`: Deterministic condition scanner covering:
  - Low stock & Out of stock catalog items (with automatic resolution upon restocking).
  - Overdue unpaid issued invoices (with automatic resolution upon settlement/voiding).
  - Pending AI Bookkeeper reviews (with automatic resolution upon review).
  - Stale Credit Passport detection (snapshots $\ge$ 30 days old).
- `apps/web/src/server/ai/automation/automation-service.ts`: Core orchestration service providing query runs, manual trigger preflight, scheduled execution dispatch, and attention scanning.
- `apps/web/src/server/inngest/`:
  - `client.ts`: Typed Inngest client.
  - `functions/summary.ts`: Durable handler for scheduled summaries.
  - `functions/health.ts`: Durable handler for scheduled health refreshes.
  - `functions/attention.ts`: Durable handler for periodic attention scans.
  - `functions/manual-run.ts`: Durable handler for on-demand runs.
  - `apps/web/src/app/api/inngest/route.ts`: App router Inngest serve handler.

---

## 4. API Endpoints & RBAC Client

- `GET /api/v1/ai/automations`: Fetch configured business automations.
- `POST /api/v1/ai/automations`: Update automation preferences and schedules.
- `GET /api/v1/ai/automations/history`: Fetch paginated execution logs.
- `POST /api/v1/ai/automations/run`: Trigger on-demand manual execution.
- `GET /api/v1/ai/automations/attention`: Fetch active attention conditions.
- RBAC permissions: Owner, Business Admin, Manager, Accountant permitted; unauthorized roles (e.g. Sales Staff) denied with 403.

---

## 5. Web Interface

- `apps/web/src/components/automations/AutomationsDashboard.tsx`:
  - Interactive schedule configuration cards for Business Summary, Health Score Refresh, and Attention Scanner.
  - Frequency dropdowns, local time pickers, and weekday/monthday selectors.
  - "Run Now" on-demand triggers with real-time status badges and toast feedback.
  - Active Attention Conditions panel with severity badges and direct navigation links.
  - Execution History Table with idempotency keys, execution duration, and result badges.
- `apps/web/src/app/app/[businessSlug]/automations/page.tsx`: Server page enforcing RBAC preflight.
- `apps/web/src/components/dashboard/AppSidebar.tsx`: Added Automations navigation item.

---

## 6. Verification & Automated Test Evidence

Automated test suite `apps/web/src/server/ai/__tests__/automation.test.ts` (14 tests) + full AI suite (116 tests total):
```text
▶ Tranche 3 Prompt 8: Production Intelligence Jobs & Automation Foundation
  ✔ resolves scheduled periods accurately across daily, weekly, and monthly frequencies (13.7ms)
  ✔ computes next execution timestamp for daily and weekly schedules (0.8ms)
  ✔ builds deterministic idempotency keys for scheduled and manual runs (0.1ms)
  ✔ skips scheduled run when automation is disabled with 0 Gemini calls (0.9ms)
  ✔ skips Gemini calls and reuses existing summary when source facts are fresh and unchanged (35.7ms)
  ✔ refreshes health score deterministically with 0 Gemini calls (1.3ms)
  ✔ detects low stock and out of stock conditions with deterministic deduplication (1.5ms)
  ✔ automatically resolves stock attention events when inventory is replenished (0.6ms)
  ✔ detects overdue invoices and resolves them when settled (1.3ms)
  ✔ detects pending AI Bookkeeper reviews and resolves when confirmed (0.9ms)
  ✔ returns existing job run when triggered with identical idempotency key (0.8ms)
  ✔ denies execution to non-authorized roles (e.g. sales_staff) (0.5ms)
  ✔ PROVES ZERO FINANCIAL MUTATIONS: background jobs never create financial records (5.1ms)
  ✔ PROVES ZERO NOTIFICATION DELIVERIES: Prompt 8 emits internal events only, does not send user messages (0.4ms)
✔ Tranche 3 Prompt 8: Production Intelligence Jobs & Automation Foundation (65.2ms)

ℹ tests 116
ℹ suites 8
ℹ pass 116
ℹ fail 0
```

Production builds:
- Web production build (`next build`): SUCCESS (0 errors, 57 static/dynamic pages compiled).
- Mobile type check (`tsc --noEmit`): SUCCESS (0 errors).
