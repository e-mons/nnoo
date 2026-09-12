# NNOO — Artificial Intelligence & Business Intelligence Architecture

Document ID: `AI-INTEL-01`  
Governance Version: `1.0.0`  
Last Reconciled: `2026-08-20` (Tranche 4 Prompt 12 Handover)  
Status: **Authoritative AI Architecture Reference**

---

## 1. The Core AI Invariant

> [!IMPORTANT]
> **DETERMINISTIC NNOO CALCULATES AUTHORITATIVE FACTS.**  
> **GOOGLE GEMINI CLASSIFIES, SUMMARIZES, AND EXPLAINS THOSE FACTS.**

Generative AI models are fundamentally non-deterministic and prone to mathematical hallucination. In NNOO:
- Generative AI **NEVER** calculates sales totals, profit margins, account balances, or Business Health Scores.
- Generative AI **NEVER** executes autonomous financial mutations on the general ledger.
- Generative AI **NEVER** receives direct access to arbitrary SQL execution engines.

---

## 2. Server-Only Execution Boundary

All Google Gemini interactions use the official `@google/genai` (v2.17.1) SDK and execute strictly within Node.js server boundaries (`apps/web/src/server/ai/*`):
- **Model Identifier:** `gemini-2.5-flash` (Configurable via `GEMINI_MODEL_DEFAULT`).
- **Credential Storage:** `GEMINI_API_KEY` is injected exclusively as a server environment variable in Vercel.
- **Client Bundle Isolation:** Zero AI keys or provider SDKs are included in Web browser bundles or Mobile application binaries.

```text
┌───────────────────────────┐
│     CLIENT (Web/Mobile)   │
└─────────────┬─────────────┘
              │ 1. User Input (Text / Query)
              ▼
┌───────────────────────────┐
│   NNOO TRUSTED SERVER     │
│   (Next.js API / Action)  │
│                           │
│  - Authenticate Session   │
│  - Resolve Active Tenant  │
│  - Query Deterministic DB │
│  - Construct Grounded     │
│    System Prompt          │
└─────────────┬─────────────┘
              │ 2. Grounded Prompt with Boundary Delimiters
              ▼
┌───────────────────────────┐
│     GOOGLE GEMINI AI      │
│     (gemini-2.5-flash)    │
└─────────────┬─────────────┘
              │ 3. Structured JSON Output
              ▼
┌───────────────────────────┐
│   SERVER VALIDATION GATE  │
│                           │
│  - Runtime Zod Parsing    │
│  - Sanitize Values        │
│  - Delta 0 Ledger Check   │
└─────────────┬─────────────┘
              │ 4. Staged Suggestion / Validated Answer
              ▼
┌───────────────────────────┐
│   CLIENT / REVIEW INTERFACE│
└───────────────────────────┘
```

---

## 3. The AI Bookkeeper Workflow

The AI Bookkeeper provides automated bookkeeping with mandatory human-in-the-loop oversight:

```text
[ Natural Language Input ]
          │
          ▼
[ Gemini Classification ] ──► Runtime Zod Schema Validation
          │
          ▼
[ Suggestion Staging ] ────► Stored in `ai_bookkeeper_reviews` (Δ 0 Financial Effect)
          │
          ▼
[ Human Review UI ] ───────► User reviews/edits category, amount, supplier
          │
          ▼
[ Confirmation Action ] ───► Atomically posts 1 canonical Expense & Journal Entry
          │
          ▼
[ Idempotency Guard ] ─────► Subsequent confirmation calls return ALREADY_APPLIED
```

1. **Intake:** User submits raw receipt text or description (e.g. *"Paid ₦25,000 generator fuel"*).
2. **Classification:** Gemini extracts proposed transaction type (`EXPENSE`), suggested category (`Utilities`), and counterparty candidate.
3. **Staging ($\Delta 0$ Invariant):** The suggestion is saved in `ai_bookkeeper_reviews` with status `PENDING`. **Zero ledger rows or financial records are created.**
4. **Human Review:** The authorized business owner or accountant reviews the recommendation, adjusts fields if needed, and clicks "Confirm".
5. **Canonical Posting:** The server creates exactly one canonical `expenses` row and posts the balancing debit/credit entries to `journal_entries`.
6. **Replay Protection:** Re-submitting the confirmation request evaluates the idempotency key and rejects duplicate postings.

---

## 4. Ask NNOO Conversational Architecture

**Ask NNOO** enables business owners to query operational data through natural language:
- **Tenant Context Grounding:** The server pre-queries deterministic aggregates (e.g. Gross Sales, COGS, Net Profit, Inventory valuation, Overdue Invoices) for the authenticated `business_id` only.
- **Read-Only Tool Boundaries:** Ask NNOO is supplied with allowlisted, read-only factual lookup tools. It has zero tools to perform mutations (create sales, delete records, update balances).
- **Prompt Injection Defense:** User inputs are treated strictly as untrusted data within boundary tags; instructions attempting role elevation or cross-tenant inspection are neutralized.

---

## 5. Smart Insights Architecture

- **Automated Synthesis:** Background jobs gather point-in-time financial facts for the current period (Revenue changes, top-selling items, margin shifts, overdue debt).
- **Narrative Generation:** Gemini synthesizes these verified facts into 3 concise, actionable business recommendations.
- **Fact Verification:** Narrative figures must match underlying database metrics with zero numerical deviation.

---

## 6. Degraded Mode & Kill-Switch Architecture

- **Emergency Kill-Switch:** Setting the environment variable `AI_ENABLED="false"` immediately deactivates all Gemini API calls.
- **Graceful Client Fallback:** When disabled or during a Google API outage, AI endpoints return `AI_FEATURE_DISABLED`. The UI displays an informative offline banner.
- **Zero Impact on Core Business:** All sales recording, inventory tracking, invoice generation, and double-entry accounting operations remain **100% operational**.
