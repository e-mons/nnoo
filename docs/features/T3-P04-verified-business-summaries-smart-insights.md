# Feature Acceptance Report: T3-P04 Verified Business Summaries & Smart Insights

**Owner:** David Bako  
**Project:** NNOO — Africa's AI Business Operating System  
**Tranche:** Tranche 3 — Smart Business Tools & Communication  
**Feature:** Verified Business Summaries & Smart Insights (Prompt 4 of 14)  
**Status:** COMPLETED & ACCEPTED  
**Date:** 2026-08-17  

---

## 1. Executive Summary

Tranche 3 Prompt 4 establishes NNOO's production capability to transform verified, canonical operational and financial records into plain-English business summaries and deterministic smart insights.

The implementation strictly satisfies the immutable governance principle:
**"NNOO COMPUTES, GEMINI EXPLAINS, HUMAN REVIEWS, ZERO INVENTED NUMBERS."**

Key architectural guarantees:
1. **Arithmetic Integrity**: All financial metrics (Net Sales, Gross Profit, COGS, Operating Expenses, Operating Result, Accounts Receivable, Accounts Payable, Inventory Valuation) are computed exclusively by canonical Tranche 2 reporting RPCs (`get_dashboard_performance_metrics`, `get_dashboard_current_position`). Gemini never calculates, totals, or invents financial numbers.
2. **Deterministic Directions & Deltas**: Mathematical directions (`UP`, `DOWN`, `UNCHANGED`, `NOT_COMPARABLE`) and percentage changes are derived on the server prior to Gemini invocation.
3. **Zero Autonomous Financial Mutations**: Summary generation produces 0 sales, 0 expenses, 0 payments, 0 refunds, 0 inventory movements, 0 invoices, and 0 journal entries.
4. **Zero-Call Fact Loading**: Viewing the Business Insights page or toggling period filters fetches verified metrics instantly with 0 Gemini API calls.
5. **Deduplication & Summary Reuse**: SHA-256 fingerprinting of underlying fact bundles allows identical data states to reuse existing active summaries with 0 extra Gemini API calls.
6. **Strict Prohibitions**: Numeric and literal guards prevent injection of Business Health Scores (1-100), Credit Scores, future revenue forecasts, and ungrounded numbers.

---

## 2. Database Schema & Migration

**Migration File:** `supabase/migrations/20260823000000_verified_business_summaries.sql`  
**Applied To Dev Project:** `hoorlxgtnamwdxszsbwt` via Supabase MCP.

### Tables Created

1. **`public.ai_business_summaries`**:
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE`
   - `requested_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
   - `summary_type TEXT NOT NULL CHECK (summary_type IN ('today', 'this_week', 'this_month', 'custom'))`
   - `period_start DATE NOT NULL`
   - `period_end DATE NOT NULL`
   - `as_of_timestamp TIMESTAMPTZ NOT NULL DEFAULT now()`
   - `business_timezone TEXT NOT NULL DEFAULT 'Africa/Lagos'`
   - `currency_code TEXT NOT NULL DEFAULT 'NGN'`
   - `source_fact_schema_version TEXT NOT NULL DEFAULT '1.0.0'`
   - `source_fingerprint TEXT NOT NULL`
   - `permission_scope_fingerprint TEXT NOT NULL`
   - `headline TEXT NOT NULL`
   - `overview TEXT NOT NULL`
   - `selected_highlight_signal_keys JSONB NOT NULL DEFAULT '[]'::jsonb`
   - `selected_attention_signal_keys JSONB NOT NULL DEFAULT '[]'::jsonb`
   - `selected_action_keys JSONB NOT NULL DEFAULT '[]'::jsonb`
   - `verified_fact_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb`
   - `prompt_version TEXT NOT NULL DEFAULT '1.0.0'`
   - `response_schema_version TEXT NOT NULL DEFAULT '1.0.0'`
   - `model_id TEXT NOT NULL DEFAULT 'gemini-2.5-flash'`
   - `ai_invocation_id UUID REFERENCES public.ai_invocations(id) ON DELETE SET NULL`
   - `status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('ready', 'failed', 'superseded'))`
   - `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`

### Indexes & RLS Policies
- `idx_ai_biz_summaries_lookup`: Composite index on `(business_id, requested_by_user_id, summary_type, status, created_at DESC)`.
- `idx_ai_biz_summaries_fingerprint`: Index on `(business_id, source_fingerprint)`.
- `idx_ai_biz_summaries_period`: Index on `(business_id, period_start, period_end)`.
- Strict RLS policy enforcing active business membership for SELECT queries, denying direct client mutations.

---

## 3. Architecture & Service Components

```text
BUSINESS RECORDS -> CANONICAL REPORTING RPCS -> VERIFIED FACT BUILDER -> DETERMINISTIC SIGNAL ENGINE -> GEMINI (ON DEMAND) -> NUMERIC GUARD -> AI_BUSINESS_SUMMARIES -> WEB UX
```

1. **`BusinessPeriodResolver`** (`apps/web/src/server/ai/insights/period-resolver.ts`):
   - Computes deterministic start/end dates in `Africa/Lagos` business timezone for `today`, `this_week`, `this_month`, and `custom`.
   - Derives preceding comparison period of equal duration.
2. **`VerifiedFactBuilderService`** (`apps/web/src/server/ai/insights/fact-builder.ts`):
   - Orchestrates canonical reporting RPCs (`get_dashboard_performance_metrics`, `get_dashboard_current_position`).
   - Normalizes minor currency values and enforces role-based fact visibility (`owner`, `business_admin`, `manager`, `accountant`).
3. **`DeterministicInsightSignalEngine`** (`apps/web/src/server/ai/insights/signal-engine.ts`):
   - Computes mathematical deltas and directions (`UP`, `DOWN`, `UNCHANGED`, `NOT_COMPARABLE`).
   - Zero-division safety: avoids `NaN`/`Infinity` when prior period metric is 0.
   - Derives allowable navigation action keys (`OPEN_SALES_REPORT`, `OPEN_EXPENSE_REPORT`, `OPEN_PROFITABILITY_REPORT`, `OPEN_RECEIVABLES`, `OPEN_PAYABLES`, `OPEN_INVENTORY`, `OPEN_LOW_STOCK`, `OPEN_OVERDUE_INVOICES`).
4. **`NumericLiteralGuard`** (`apps/web/src/server/ai/insights/numeric-guard.ts`):
   - Validates that returned signal and action keys belong to the request allowlist.
   - Enforces regex-based blocking of prohibited content: Health Scores (`/100`), Credit Scores, and Future Revenue Forecasts.
5. **`AIBusinessInsightService`** (`apps/web/src/server/ai/insights/insight-service.ts`):
   - `getVerifiedFacts`: Returns fact bundle, signals, allowable actions, and latest summary status with 0 Gemini calls.
   - `generateSummary`: Handles on-demand AI narrative generation, SHA-256 fingerprint deduplication, zero-data business deterministic handling, and supersession management.
   - `getSummaryHistory`: Fetches historical summaries with pagination.

---

## 4. API Endpoints

- `GET /api/v1/ai/insights/facts`: Returns real-time verified fact bundle and deterministic signals.
- `POST /api/v1/ai/insights/generate`: Triggers on-demand validated summary narrative generation.
- `GET /api/v1/ai/insights/summaries`: Returns summary generation history for the active tenant.
- `GET /api/v1/ai/insights/summaries/[id]`: Returns a single historical summary detail.

---

## 5. Web User Experience

- **Navigation**: Added `Business Insights` link with `TrendingUp` icon in `AppSidebar.tsx` and RBAC authorization in `rbac-client.ts`.
- **`InsightsDashboard.tsx`**:
  - Period tabs: Today, This Week, This Month, Custom Date Range.
  - Verified Performance Grid (Net Sales, Gross Profit, Operating Expenses, Operating Result) with source tags and currency formatting.
  - Point-in-Time Position Cards (AR, AP, Inventory Valuation) with explicit `asOfTimestamp` badges.
  - AI Narrative Card with Freshness Indicator ("Fresh with current data", "Data changed since last summary", "Awaiting generation") and Generate/Update button with loading spinner.
  - Key Shift Signals and Operational Areas Needing Attention lists with direct action buttons.
  - What to Review Next quick report launcher.
  - History drawer for historical summaries.
- **Server Page**: `/app/[businessSlug]/insights`.
- **Dashboard Banner**: Added "View Smart Insights" entry point to main business dashboard.

---

## 6. Verification & Automated Test Evidence

**Test Command:** `pnpm --filter web test`  
**Results:** **72 / 72 PASSING** across 4 test suites in **780ms**.

### Test Suite Breakdown

1. **`ai-foundation.test.ts`**: 22 tests passing.
2. **`bookkeeper-classifier.test.ts`**: 18 tests passing.
3. **`bookkeeper-review.test.ts`**: 14 tests passing.
4. **`business-insights.test.ts`**: 18 tests passing:
   - *Test 1 (Report Parity)*: Verified facts match canonical RPC outputs exactly (₦45,000 net sales, ₦25,000 gross profit, ₦10,000 expenses, ₦15,000 result, ₦25,000 AR, ₦15,000 AP, ₦120,000 stock, 2 overdue invoices, 3 low stock items).
   - *Test 2 (Period & Timezone Resolution)*: Resolves 'today', 'this_month', and 'custom' with deterministic comparison periods in 'Africa/Lagos'.
   - *Test 3 (Zero-Division Safety)*: Prior period = 0 does not produce `NaN` or `Infinity`.
   - *Test 4 (Current Position Separation)*: Point-in-time metrics have explicit `asOfTimestamp`.
   - *Test 5 (Permission Projection)*: `sales_staff` denied business summaries with `AI_INSIGHTS_FORBIDDEN`.
   - *Test 6 (Deterministic Signal Engine)*: Server computes directions `UP`, `DOWN`, `UNCHANGED`, `NOT_COMPARABLE` without calling Gemini.
   - *Test 7 (Zero-Data Business)*: Empty business returns deterministic state with **0 Gemini calls**.
   - *Test 8 (Structured Output Validation)*: Valid Gemini structured response parses against Zod schema.
   - *Test 9 (Signal Allowlist)*: Fabricated signal key rejected with `AI_INSIGHTS_INVALID_RESULT`.
   - *Test 10 (Action Allowlist)*: Unknown action key rejected with `AI_INSIGHTS_INVALID_RESULT`.
   - *Test 11 (Numeric Guard)*: Hallucinated Health Score (`85/100`) or Credit Score rejected with `AI_INSIGHTS_INVALID_RESULT`.
   - *Test 12 (Forecast Guard)*: Hallucinated revenue forecast rejected.
   - *Test 13 (Summary Reuse)*: Same fact fingerprint reuses active summary with **0 extra Gemini calls**.
   - *Test 14 (Stale Summary Detection)*: Changing underlying facts flags previous summary as stale (`isFresh: false`).
   - *Test 15 (Provider Outage Resilience)*: Verified facts remain 100% accessible when Gemini errors.
   - *Test 16 (Global AI Kill Switch)*: `AI_ENABLED=false` blocks summary generation while keeping facts readable.
   - *Test 17 (Tenant Security)*: Business A user cannot access or generate Business B facts.
   - *Test 18 (Zero Financial Mutations)*: Summary generation causes 0 sales, 0 expenses, 0 invoices, 0 movements, and 0 journal entries.

### Build & Quality Gates
- `pnpm --filter web build`: Succeeded with **0 errors across all 40 routes**.
- `pnpm --filter mobile exec tsc --noEmit`: Succeeded with **0 errors**.
- `pnpm --filter @nnoo/contracts --filter @nnoo/validation --filter @nnoo/supabase exec tsc --noEmit`: Succeeded with **0 errors**.

---

## 7. Next Step

Tranche 3 Prompt 4 is complete. In accordance with Rule 3 and Rule 4 of `AGENTS.md`, work stops here.
The next approved feature is **Tranche 3 Prompt 5: Ask NNOO — Business AI Assistant**.
