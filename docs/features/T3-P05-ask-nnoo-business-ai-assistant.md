# Acceptance Report: T3-P05 — Ask NNOO — Production Business AI Assistant

**Status:** ACCEPTED / READY FOR REVIEW  
**Date:** 2026-08-17  
**Governance Version:** 1.0.0  
**Feature Code:** T3-P05  
**Primary AI Provider:** Google Gemini API (via server-only NNOO Foundation)

---

## 1. Executive Summary

Ask NNOO is the production conversational business assistant for NNOO — Africa's AI Business Operating System. It enables authorized business owners, accountants, managers, and staff to ask natural-language business questions and receive verified, deterministic financial answers grounded strictly in canonical database records and reporting engine RPCs.

Ask NNOO operates on the foundational principle:
> **"NNOO COMPUTES, GEMINI EXPLAINS, ZERO MODEL-GENERATED SQL, ZERO HALLUCINATED NUMBERS, ZERO FINANCIAL MUTATIONS."**

---

## 2. Invariants & Safety Guarantees Verified

1. **Strict Read-Only Guarantee**:
   Ask NNOO has 0 mutation tools. It cannot create, edit, or delete sales, expenses, invoices, payments, refunds, stock movements, journal entries, or bookkeeping reviews.
2. **Zero Model-Generated SQL**:
   Gemini does not write or execute database queries. All data access occurs through 11 allowlisted, deterministic NNOO tools.
3. **Fact Reference Architecture**:
   All monetary amounts, percentages, quantities, and critical counts are rendered via server-verified fact substitutions (`[FACT:key]`). Gemini never types or invents financial figures into prose.
4. **Mutation Request Safe Handoff**:
   If a user asks to record an expense, sale, refund, or adjustment, Ask NNOO immediately refuses the direct mutation, explains that changes require secure verification, and returns `MUTATION_REQUIRES_WORKFLOW` with safe navigation action buttons (`OPEN_AI_BOOKKEEPER`, `RECORD_EXPENSE`, `OPEN_SALES_REPORT`).
5. **Role Downgrade Security**:
   Every assistant response tags `required_capabilities` (e.g. `reports.profitability.view`). If a user's role is subsequently downgraded (e.g. Owner -> Sales Staff), previously privileged answers are automatically redacted on fetch with the safe notice: *"This earlier response is no longer available because your Business permissions have changed."*
6. **Zero-Call Conversation Listing**:
   Listing, opening, and navigating conversation history requires 0 Gemini API calls.
7. **Prohibited Domain Guards**:
   Ask NNOO strictly blocks and rejects Business Health Scores (`/100`), Credit Scores, loan qualification claims, future sales forecasting, and tax liability calculations.

---

## 3. Allowlisted Read-Only Tools

| Tool Name | Required Module | Required Capability | Source Key | Default Action Key | Description |
|---|---|---|---|---|---|
| `getBusinessOverview` | reports | `reports.view` | `BUSINESS_OVERVIEW` | `OPEN_SALES_REPORT` | Executive performance & position overview |
| `getSalesSummary` | sales | `sales.view` | `SALES_REPORT` | `OPEN_SALES_REPORT` | Net sales, gross sales, refunds, count |
| `getProfitabilitySummary` | reports | `reports.profitability.view` | `PROFITABILITY_REPORT` | `OPEN_PROFITABILITY_REPORT` | Net sales, COGS, gross profit, operating result |
| `getExpenseSummary` | expenses | `expenses.view` | `EXPENSE_REPORT` | `OPEN_EXPENSE_REPORT` | Total expenses and category breakdown |
| `getReceivablesSummary` | sales | `sales.view` | `RECEIVABLES` | `OPEN_RECEIVABLES` | Accounts receivable and owing customers |
| `getPayablesSummary` | expenses | `expenses.view` | `PAYABLES` | `OPEN_PAYABLES` | Accounts payable and supplier bills |
| `getInventoryStatus` | inventory | `inventory.view` | `INVENTORY` | `OPEN_LOW_STOCK` | Low stock items, out of stock items, valuation |
| `getInvoiceStatus` | invoices | `invoices.view` | `INVOICES` | `OPEN_OVERDUE_INVOICES` | Unpaid and overdue sales invoices |
| `getBookkeeperStatus` | bookkeeper | `bookkeeper.view` | `BOOKKEEPER` | `OPEN_AI_BOOKKEEPER` | Count of pending AI Bookkeeper reviews |
| `lookupCustomer` | customers | `customers.view` | `RECEIVABLES` | `OPEN_RECEIVABLES` | Bounded customer search (up to 5) |
| `lookupProduct` | products | `products.view` | `INVENTORY` | `OPEN_INVENTORY` | Bounded catalog item search (up to 5) |

---

## 4. Test Evidence

- **Unit & Security Tests**: 82/82 passing across all 5 AI test suites (`ask-nnoo.test.ts`, `insights.test.ts`, `bookkeeper.test.ts`, `bookkeeper-review.test.ts`, `ai-foundation.test.ts`).
- **Production Build**: 41/41 routes built cleanly in Next.js Turbopack compiler.
- **Mobile Check**: `@nnoo/mobile` strict TypeScript typecheck passing with 0 errors.

---

## 5. Files Changed & Migrations Applied

- `supabase/migrations/20260824000000_ask_nnoo_conversations.sql` (Applied via Supabase MCP)
- `packages/supabase/database.types.ts` (Regenerated via Supabase MCP)
- `packages/contracts/ai.ts` (Added Ask NNOO error codes, types, and action registry)
- `packages/validation/ai.ts` (Added Ask NNOO Zod schemas)
- `apps/web/src/server/ai/registry/features.ts` (Enabled `ai.ask_nnoo` with prompt `1.0.0`)
- `apps/web/src/server/ai/prompts/registry.ts` (Registered version `1.0.0` system instructions)
- `apps/web/src/server/ai/assistant/tools/registry.ts` (Declared 11 tools and parameter schemas)
- `apps/web/src/server/ai/assistant/tools/executor.ts` (Deterministic tool executor with RBAC)
- `apps/web/src/server/ai/assistant/numeric-guard.ts` (Numeric and prohibited content validation)
- `apps/web/src/server/ai/assistant/assistant-service.ts` (Conversation and turn lifecycle orchestrator)
- `apps/web/src/app/api/v1/ai/assistant/conversations/route.ts` (Conversation listing and creation API)
- `apps/web/src/app/api/v1/ai/assistant/conversations/[id]/route.ts` (Conversation detail and archive API)
- `apps/web/src/app/api/v1/ai/assistant/conversations/[id]/messages/route.ts` (Message turn execution API)
- `apps/web/src/lib/auth/rbac-client.ts` (Added `assistant` module permissions)
- `apps/web/src/components/dashboard/AppSidebar.tsx` (Added Ask NNOO navigation item)
- `apps/web/src/components/assistant/AskNnooChat.tsx` (Interactive chat Web UI)
- `apps/web/src/app/app/[businessSlug]/assistant/page.tsx` (Server page for Ask NNOO)
- `apps/web/src/server/ai/__tests__/ask-nnoo.test.ts` (9 comprehensive automated tests)
