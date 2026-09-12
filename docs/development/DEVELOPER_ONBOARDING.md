# NNOO — Developer Onboarding Guide & Engineering Checklist

Document ID: `ONBOARD-GUIDE-01`  
Governance Version: `1.0.0`  
Last Reconciled: `2026-08-20` (Tranche 4 Prompt 12 Handover)  
Status: **Authoritative Onboarding Guide**

---

## 1. Welcome to NNOO Engineering

Welcome to the NNOO engineering team! This guide provides a step-by-step onboarding checklist to take you from a fresh workstation to a productive contributor capable of building, testing, and shipping features safely.

NNOO is an engineering-first, high-integrity platform. Every line of code must respect our core tenets: mathematical accounting accuracy ($\Delta 0$ drift), absolute multi-tenant data isolation (100% RLS), and strict boundaries between deterministic domain calculations and generative AI.

---

## 2. Onboarding Checklist for New Engineers

### Phase 1: Accounts & Repository Access
- [ ] **GitHub Access:** Request read/write collaborator access to `https://github.com/davidbako/nnoo`.
- [ ] **Supabase Development Access:** Request developer access to the Supabase Development project.
- [ ] **Vercel Preview Access:** Request developer access to Vercel team deployment previews.
- [ ] **Read System Architecture:** Read [ARCHITECTURE.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/ARCHITECTURE.md) and [PROJECT_OVERVIEW.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/PROJECT_OVERVIEW.md).
- [ ] **Read Operating Rules:** Read [AGENTS.md](file:///c:/Users/H-P/Desktop/nnoo/AGENTS.md) and [DEFINITION_OF_DONE.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/DEFINITION_OF_DONE.md).

### Phase 2: Local Workstation Setup
- [ ] **Install Node.js 24 LTS:** Ensure `node -v` outputs `v24.x`.
- [ ] **Enable pnpm 11:** Run `corepack enable && corepack prepare pnpm@11.0.0 --activate`.
- [ ] **Clone Monorepo:** Run `git clone https://github.com/davidbako/nnoo.git && cd nnoo`.
- [ ] **Install Dependencies:** Run `pnpm install`.
- [ ] **Configure Local Environment:** Copy `.env.example` to `.env.local` in `apps/web` and `apps/mobile`.

### Phase 3: Run & Verify the Applications
- [ ] **Start Web Development Server:** Run `pnpm run dev:web` and navigate to `http://localhost:3000`.
- [ ] **Test Sign-Up / Onboarding Flow:** Register a test business account and verify workspace dashboard rendering.
- [ ] **Start Mobile Bundler:** Run `pnpm run dev:mobile` and launch on iOS Simulator or Android Emulator.
- [ ] **Run Full Test Suite:** Run `pnpm test` and verify **375 / 375 tests pass with 0 failures**.
- [ ] **Run Production Build Check:** Run `pnpm run build` and verify all 82 routes compile cleanly.

---

## 3. Core Architectural Concepts You Must Know

Before modifying code, you must understand these 7 foundational architecture concepts:

### 1. Canonical Tenancy Model
Tenancy is strictly relational. A user identity in `auth.users` maps to a single `profiles` row, which joins to multiple `businesses` via `business_memberships`:
```text
auth.users (UUID) ──► profiles (id = auth.uid()) ──► business_memberships (role, status) ──► businesses (id, slug)
```
*Never introduce a `profiles.business_id` column; users can belong to multiple businesses.*

### 2. 100% Row-Level Security (RLS) Coverage
Every business-owned table requires `ROW LEVEL SECURITY` enabled. Every policy must resolve the tenant boundary by checking active membership in `business_memberships`:
```sql
CREATE POLICY "tenant_isolation_select" ON public.sales
FOR SELECT USING (
  business_id IN (
    SELECT business_id FROM public.business_memberships
    WHERE user_id = auth.uid() AND status = 'active'
  )
);
```

### 3. Exact Integer Currency (No Floating-Point)
All monetary values in NNOO are stored and calculated as integers in minor currency units (e.g. Kobo for Nigerian Naira: ₦1,500.00 is stored as `150000`). Never use JavaScript floating-point arithmetic (`0.1 + 0.2`) for financial math. Use the `@nnoo/domain` currency helpers.

### 4. Double-Entry Accounting Invariant
Every financial transaction (sale, payment, refund, expense) automatically posts balanced journal debit and credit entries in `journal_entries` and `journal_lines`. The permanent invariant is:
$$\sum \text{Debits} = \sum \text{Credits}$$
Posted transactions are never deleted; adjustments are made via compensating credit/debit entries.

### 5. Deterministic AI Grounding (Gemini Server-Only)
Google Gemini (`gemini-2.5-flash`) is called strictly from server code (`apps/web/src/server/ai/*`). Gemini **never** calculates authoritative financial numbers or health scores; deterministic domain code computes exact figures, and Gemini provides natural language explanations. In the **AI Bookkeeper**, suggestions are staged with $\Delta 0$ accounting side effects until explicitly reviewed and confirmed by an authorized human.

### 6. Forward-Only Immutable Database Migrations
Never edit an existing migration file in `supabase/migrations/` that has already been applied. Always create a new, versioned SQL migration script (e.g. `YYYYMMDDHHMMSS_feature_description.sql`).

### 7. Google Antigravity & AI Pair Programming Governance
When working with Antigravity AI agents:
- Strictly follow the **One-Feature Rule** (work on one approved feature at a time).
- Do not bypass required quality gates (linting, typechecking, tests, build).
- Always sync durable project memory (`PROJECT_STATE.md`, `FEATURE_LEDGER.md`, `CHANGELOG.md`) upon completion.
