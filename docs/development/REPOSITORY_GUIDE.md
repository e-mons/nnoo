# NNOO — Monorepo & Repository Structure Guide

Document ID: `REPO-GUIDE-01`  
Governance Version: `1.0.0`  
Last Updated: `2026-08-20` (Tranche 4 Prompt 12 Handover)  
Status: **Authoritative Repository Guide**

---

## 1. Monorepo Layout & High-Level Shape

The NNOO codebase is organized as a pnpm workspace monorepo managed with Turborepo (`turbo`).

```text
nnoo/
├── apps/
│   ├── web/                     # The ONLY Next.js web application
│   └── mobile/                  # The ONLY React Native Expo mobile application
├── packages/
│   ├── config/                  # Strict runtime environment variable parsing (@nnoo/config)
│   ├── contracts/               # Pure TypeScript contracts, API DTOs, domain interfaces (@nnoo/contracts)
│   ├── design-tokens/           # Shared UI tokens, color palette, typography scales (@nnoo/design-tokens)
│   ├── domain/                  # Pure accounting math, health score, and domain rules (@nnoo/domain)
│   ├── supabase/                # Generated database types, client factories, RLS helpers (@nnoo/supabase)
│   ├── test-utils/              # Shared test fixtures, mocks, synthetic data factories (@nnoo/test-utils)
│   └── validation/              # Shared Zod validation schemas for forms and APIs (@nnoo/validation)
├── supabase/
│   ├── migrations/              # Immutable SQL migration scripts (34 versioned migrations)
│   ├── functions/               # Supabase Edge Functions
│   └── tests/                   # Database-level SQL tests
├── docs/                        # Authoritative system documentation, runbooks, and handover guides
└── .agents/                     # Antigravity governance rules, skills, and operational workflows
```

---

## 2. Applications (`apps/*`)

### 2.1 Web Application (`apps/web`)
- **Framework:** Next.js 16.3.0 (Turbopack, App Router, React 19)
- **Role:** Single consolidated web entry point for public marketing, authentication, business management, platform administration, and API v1 endpoints.
- **Internal Routing Boundaries:**
  - `src/app/(marketing)/` — Public marketing pages, features, pricing, terms, privacy, and account deletion.
  - `src/app/(auth)/` — Sign-in, sign-up, password reset, email verification callbacks.
  - `src/app/(app)/` — Protected business workspace routes (`/app/[businessSlug]/...`) requiring active business membership.
  - `src/app/(admin)/` — Protected platform administration routes (`/admin/...`) requiring the `platform_admin` role.
  - `src/app/api/v1/` — Versioned REST API endpoints and webhook receivers (Paystack, WhatsApp, Inngest).
- **Rule:** Never create a separate web application for admin or marketing. All web experiences live inside `apps/web`.

### 2.2 Mobile Application (`apps/mobile`)
- **Framework:** Expo SDK 54.0.0 (React Native 0.81.5, Expo Router 6.0, React 19)
- **Role:** Single native mobile application delivering Android and iOS experiences.
- **Internal Routing Boundaries:**
  - `app/(auth)/` — Mobile sign-in, registration, and password recovery.
  - `app/(onboarding)/` — Business workspace creation and onboarding wizard.
  - `app/(app)/` — Full business management features (Sales, Inventory, Expenses, Invoices, AI tools, Settings).
- **Rule:** Never duplicate financial calculation rules or business logic in mobile. Always use shared domain packages and the canonical Supabase backend.

---

## 3. Shared Workspace Packages (`packages/*`)

| Package | Responsibility | Consumers | What MUST NOT be placed here |
|---|---|---|---|
| `@nnoo/contracts` | Canonical TypeScript types, API request/response DTOs, domain interfaces, enums | `apps/web`, `apps/mobile`, all packages | No executable runtime logic, no database clients, no secrets. |
| `@nnoo/domain` | Pure financial calculations, double-entry journal balance logic, weighted-average costing, Business Health Score formulas | `apps/web`, `apps/mobile`, `@nnoo/supabase` | No UI code, no direct database queries, no third-party network calls. |
| `@nnoo/validation` | Shared Zod schemas for form validation, API payload validation, and provider input validation | `apps/web`, `apps/mobile` | No React hooks, no server secrets. |
| `@nnoo/config` | Strict runtime environment variable parsing and schema enforcement | `apps/web`, `apps/mobile` | No hardcoded secret values. |
| `@nnoo/supabase` | Generated database types (`Database`), typed Supabase client factories, RLS helpers | `apps/web`, `apps/mobile` | No business logic calculations (use `@nnoo/domain`). |
| `@nnoo/design-tokens` | Unified color palette, typography scales, spacing tokens, dark-mode tokens | `apps/web`, `apps/mobile` | No application-specific component markup. |
| `@nnoo/test-utils` | Shared test fixtures, mock factories, synthetic business builders | Test suites across workspace | No production application code. |

---

## 4. Package Dependency Boundaries

To maintain strict modularity and prevent circular dependencies:

```text
[ @nnoo/contracts ] (Pure interfaces — lowest dependency layer)
       ▲
       ├── [ @nnoo/validation ] (Depends only on contracts + zod)
       ├── [ @nnoo/domain ]     (Depends only on contracts)
       └── [ @nnoo/supabase ]   (Depends on contracts + supabase-js)
              ▲
              ├── [ apps/web ]    (Imports packages; server-only code kept on server)
              └── [ apps/mobile ] (Imports packages; zero server secrets)
```

- **Rule 1:** A package in `packages/` must never import from `apps/*`.
- **Rule 2:** `@nnoo/contracts` must have zero internal package dependencies.
- **Rule 3:** `@nnoo/domain` must be 100% pure TypeScript (zero Node.js or browser DOM dependencies).
- **Rule 4:** Server-only modules (e.g. `@google/genai`, `inngest`) must never be imported into `@nnoo/domain` or client bundles.
