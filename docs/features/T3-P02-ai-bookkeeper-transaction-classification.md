# Feature Acceptance Report: T3-P02 AI Bookkeeper — Transaction Understanding & Classification

**Project:** NNOO — Africa's AI Business Operating System  
**Tranche:** 3 — Smart Business Tools & Communication  
**Feature:** T3-P02 AI Bookkeeper — Transaction Understanding & Classification  
**Date:** 2026-08-17  
**Status:** **PASS**  
**Author / Execution:** Antigravity / David Bako  

---

## 1. Executive Summary

Tranche 3 Prompt 2 establishes the production intelligence that transforms unstructured real-world bookkeeping descriptions into **STRUCTURED BOOKKEEPING SUGGESTIONS** without mutating financial ledgers or auto-posting accounting records.

The implementation strictly satisfies the foundational invariant: **AI Bookkeeper Suggestion ≠ Accounting Transaction**. A Gemini classification is an ephemeral suggestion stored in `public.ai_bookkeeping_classifications` with `requiresHumanReview: true` unconditionally enforced by server code. Prompt 3 will own the review, explanation, and user acceptance workflow.

---

## 2. Core Architectural Pipeline

```text
AUTHENTICATED USER / CLIENT (POST /api/v1/ai/bookkeeper/classify)
        │
        ▼
SERVER AUTHENTICATION & BUSINESS MEMBERSHIP (Server-Resolved Context)
        │
        ▼
RBAC ROLE PREFLIGHT (owner, business_admin, manager, accountant allowed)
        │
        ▼
SHA-256 INPUT FINGERPRINTING & IDEMPOTENCY PREFLIGHT
        │
        ▼
DETERMINISTIC SAME-TENANT CANDIDATE RETRIEVAL (Categories, Suppliers, Customers, Duplicates)
        │
        ▼
OPAQUE CANDIDATE KEY MAPPING (category_1, supplier_1, customer_1, duplicate_1)
        │
        ▼
PROMPT REGISTRY (ai.bookkeeper.classify.v1) & BOUNDARY DELIMITERS
        │
        ▼
GEMINI STRUCTURED GENERATION (@google/genai structured JSON)
        │
        ▼
RUNTIME ZOD SCHEMA VALIDATION (BookkeepingStructuredOutputSchema)
        │
        ▼
DETERMINISTIC DOMAIN POST-CHECKS (Direction Contradiction Downgrade, Candidate UUID Reverse Mapping)
        │
        ▼
PERSISTENCE IN public.ai_bookkeeping_classifications (requiresHumanReview: true)
        │
        ▼
SAFE SUGGESTION RESULT RETURNED (0 Ledger Mutations, 0 Auto-Posting)
```

---

## 3. Key Invariants & Security Guarantees

1. **AI Suggestion Only (Zero Journal Effect):** Delta = 0 across Sales, Expenses, Payments, Refunds, Inventory Movements, Invoices, and Journal Entries.
2. **Opaque Candidate Keys (Anti-Hallucination & Anti-Enumeration):** Gemini chooses only from opaque keys (`category_1`, `supplier_1`, `customer_1`, `duplicate_1`). Database UUIDs are never exposed to Gemini. Unknown or forged candidate keys returned by the model are rejected and nulled by server post-validation.
3. **No Financial Authority:** Canonical Money amounts, transaction dates, and currency codes cannot be altered by Gemini.
4. **Deterministic Direction Post-Validation:** Contradictions (e.g. `MONEY_IN` with Operating Expense or `MONEY_OUT` with Sale) are downgraded to `UNKNOWN` with `DIRECTION_CONFLICT` warnings.
5. **Strict RBAC:** Permitted roles (`owner`, `business_admin`, `manager`, `accountant`) can request classifications. Other roles (`sales_staff`, `inventory_staff`, `read_only`) are rejected before provider invocation with `AI_BOOKKEEPER_FORBIDDEN`.
6. **Request Idempotency & Reclassification:** Identical requests return cached suggestions; conflicting payloads throw `AI_BOOKKEEPER_IDEMPOTENCY_CONFLICT`; reclassification supersedes prior suggestions (`superseded_at = now()`) without altering historical accounting records.
7. **Database RLS:** `public.ai_bookkeeping_classifications` enforces tenant isolation via Row Level Security (platform admins and business members select own records; direct client writes are forbidden).

---

## 4. Test Verification Results

All 40 tests passed cleanly across the server AI test suite (`pnpm --filter web test`):

```text
▶ Tranche 3 Prompt 1: Production AI & Intelligence Foundation
  ✔ 1. Valid Structured Output is parsed and validates against runtime Zod schema (27.9976ms)
  ✔ 2. Invalid Structured Output is rejected with AI_RESPONSE_INVALID (no unsafe cast) (4.0669ms)
  ✔ 3. Authorization Before Provider: missing permission fails before provider call (0 provider invocations) (0.6589ms)
  ✔ 4. RBAC Preflight: unauthenticated or forbidden user cannot invoke feature (0.7278ms)
  ✔ 5. Global AI Kill Switch: AI_ENABLED=false blocks all AI with AI_FEATURE_DISABLED (1.1658ms)
  ✔ 6. Prompt Injection Defense: injection delimiters in input are neutralized and labeled as data (0.4581ms)
  ✔ 7. Stored Business Text Defense: malicious product/note text is treated strictly as data (0.2804ms)
  ✔ 8. Oversized Input is rejected before provider invocation (0.2795ms)
  ✔ 9. Safe AI Tool Registry: default read-only, unknown tools rejected, mutation tools absent (0.6483ms)
  ✔ 10. Data Minimization: PII and auth secrets are stripped from AI context (0.3105ms)
  ✔ 11. Application Rate Limiter: throttles rapid requests with AI_RATE_LIMITED (0.171ms)
  ✔ 12. Provider 429 Rate Limit is normalized to AI_PROVIDER_RATE_LIMITED (0.1036ms)
  ✔ 13. Provider Timeout is normalized to AI_PROVIDER_TIMEOUT (0.0802ms)
  ✔ 14. Provider Safety Block is normalized to AI_RESPONSE_BLOCKED (0.068ms)
  ✔ 15. Provider Outage / 503 is normalized to AI_PROVIDER_UNAVAILABLE (0.0625ms)
  ✔ 16. Log Redaction: scrubs Gemini API keys, Supabase tokens, Paystack keys, and passwords (0.2917ms)
  ✔ 17. Request Fingerprinting: computes SHA-256 fingerprint without storing raw prompt (0.1506ms)
  ✔ 18. Token Pricing Estimation: clearly labeled isEstimate and calculates non-authoritative dollar cost (0.1159ms)
  ✔ 19. Verified Fact Envelope: preserves source provenance and timestamp (0.1368ms)
  ✔ 20. Zero Financial Side Effects: AI Foundation executes with ZERO ledger mutations (0.069ms)
  ✔ 21. Mobile & Shared Packages Boundary: @google/genai and GEMINI_API_KEY are server-only (0.4602ms)
  ✔ 22. Model Selection Policy: client cannot override server-defined model (0.0898ms)
✔ Tranche 3 Prompt 1: Production AI & Intelligence Foundation (40.2794ms)
▶ Tranche 3 Prompt 2: AI Bookkeeper — Transaction Understanding & Classification
  ✔ 1. Manual Flow A: Operating Expense ("Paid shop rent") suggests OPERATING_EXPENSE with category candidate and zero expense mutation (36.2311ms)
  ✔ 2. Manual Flow B: Stock Purchase ("Bought cartons of drinks from ABC Traders to sell in shop") suggests STOCK_PURCHASE with supplier candidate, no expense category, and zero inventory movements (8.2807ms)
  ✔ 3. Manual Flow C: Customer Payment ("Customer paid remaining balance") suggests CUSTOMER_PAYMENT and adds SALE_SELECTION_REQUIRED (5.2011ms)
  ✔ 4. Manual Flow D: Supplier Payment ("Paid supplier balance we owe") suggests SUPPLIER_PAYMENT and adds PAYABLE_SELECTION_REQUIRED (6.3957ms)
  ✔ 5. Manual Flow E: Sale ("Sold three packs of water to Chidi") suggests SALE and requires product lines (3.8449ms)
  ✔ 6. Manual Flow F: Refund ("Refunded customer for returned goods") suggests REFUND and requires sale selection (2.8446ms)
  ✔ 7. Manual Flow G: Unknown description ("Handled the matter today") produces UNKNOWN and confidence LOW (2.5236ms)
  ✔ 8. Manual Flow H: Ambiguous description ("Bought water") returns LOW/MEDIUM confidence with ambiguity warning (1.9801ms)
  ✔ 9. Unsupported description ("Paid staff monthly salary and calculated PAYE tax") suggests UNSUPPORTED (2.4395ms)
  ✔ 10. Money & Amount Integrity: Gemini cannot alter canonical amount (₦50,000 input vs prose "paid 45k") (3.9337ms)
  ✔ 11. Direction Conflict: MONEY_IN with model returning OPERATING_EXPENSE is deterministically downgraded to UNKNOWN with DIRECTION_CONFLICT (2.8802ms)
  ✔ 12. Forged Candidate Key Attack: model returning supplier_999 is rejected and nulled (2.2313ms)
  ✔ 13. Prompt Injection Defense: injection attempting admin escalation or secret theft is neutralized as data (1.9651ms)
  ✔ 14. RBAC Preflight: permitted roles (owner, business_admin, manager, accountant) allowed; denied roles rejected before provider (6.3295ms)
  ✔ 15. Idempotency: identical request with same idempotency key returns cached suggestion without extra Gemini call (1.5734ms)
  ✔ 16. Idempotency Conflict: same idempotency key with different payload throws AI_BOOKKEEPER_IDEMPOTENCY_CONFLICT (2.051ms)
  ✔ 17. Reclassification: supersedes prior classification and creates fresh suggestion (3.2981ms)
  ✔ 18. Zero Financial Side Effects: Executing classifications results in 0 sales, 0 expenses, 0 invoices, 0 inventory movements, and 0 journal entries (6.6916ms)
✔ Tranche 3 Prompt 2: AI Bookkeeper — Transaction Understanding & Classification (102.921ms)
ℹ tests 40
ℹ suites 2
ℹ pass 40
ℹ fail 0
```

---

## 5. Quality Gates Summary

| Quality Gate | Command | Result |
|---|---|---|
| Contracts Typecheck | `pnpm --filter @nnoo/contracts typecheck` | **PASS (0 errors)** |
| Validation Typecheck | `pnpm --filter @nnoo/validation typecheck` | **PASS (0 errors)** |
| Supabase Typecheck | `pnpm --filter @nnoo/supabase typecheck` | **PASS (0 errors)** |
| Mobile TypeScript Check | `pnpm --filter mobile exec tsc --noEmit` | **PASS (0 errors)** |
| Server AI Test Suite | `pnpm --filter web test` | **PASS (40/40 tests)** |
| Web Production Build | `pnpm --filter web build` | **PASS (Next.js 16.3.0)** |
| Client Secret Scan | Grep `@google/genai` across packages/mobile | **PASS (0 leaks)** |

---

## 6. Conclusion & Recommendation

Tranche 3 Prompt 2 is **ACCEPTED and 100% COMPLETE**.

Next Recommended Feature (do NOT start automatically):  
**TRANCHE 3 — PROMPT 3: AI BOOKKEEPER — REVIEW, EXPLANATION & USER ACCEPTANCE WORKFLOW**
