# NNOO — Technical Handover Walkthrough Agenda

Document ID: `WALK-01`  
Governance Version: `1.0.0`  
Estimated Duration: **90 Minutes**  
Last Reconciled: `2026-08-20` (Tranche 4 Prompt 12 Handover)  
Status: **Authoritative Technical Handover Agenda**

---

## 1. Handover Session Structure

This agenda is designed for a comprehensive, structured technical walkthrough between the engineering team, incoming maintainers, and **David Bako**.

| Session Segment | Duration | Primary Topics Covered | Reference Documents |
|---|---|---|---|
| **1. Product Scope & Vision** | 10 Min | August 2026 delivery, core modules, deferred roadmap items | [PROJECT_OVERVIEW.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/PROJECT_OVERVIEW.md) |
| **2. Monorepo & Local Setup** | 10 Min | pnpm workspaces, Turborepo pipelines, scripts, local dev | [REPOSITORY_GUIDE.md](file:///c:/Users/H-P/Desktop/nnoo/docs/development/REPOSITORY_GUIDE.md), [LOCAL_DEVELOPMENT.md](file:///c:/Users/H-P/Desktop/nnoo/docs/development/LOCAL_DEVELOPMENT.md) |
| **3. Backend, Tenancy & RLS** | 15 Min | Supabase schema, 60 tables, RLS policies, migrations, MCP | [DATABASE_OPERATIONS.md](file:///c:/Users/H-P/Desktop/nnoo/docs/operations/DATABASE_OPERATIONS.md), [DATA_PROTECTION_AND_RECOVERY.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/DATA_PROTECTION_AND_RECOVERY.md) |
| **4. Financial Engine & Ledger**| 15 Min | Integer math (Kobo), double-entry debits/credits, COGS, refunds | [FINANCIAL_ENGINE.md](file:///c:/Users/H-P/Desktop/nnoo/docs/architecture/FINANCIAL_ENGINE.md) |
| **5. AI & Intelligence Grounding**| 10 Min | Gemini server-only, AI Bookkeeper $\Delta 0$ staging, Ask NNOO | [AI_AND_INTELLIGENCE.md](file:///c:/Users/H-P/Desktop/nnoo/docs/architecture/AI_AND_INTELLIGENCE.md), [BUSINESS_HEALTH_SCORE.md](file:///c:/Users/H-P/Desktop/nnoo/docs/architecture/BUSINESS_HEALTH_SCORE.md) |
| **6. Providers & Integrations**| 15 Min | Paystack billing, Inngest jobs, Meta WhatsApp, Expo Push | [PROVIDER_OPERATIONS.md](file:///c:/Users/H-P/Desktop/nnoo/docs/operations/PROVIDER_OPERATIONS.md), [PRODUCTION_PROVIDER_VALIDATION.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/PRODUCTION_PROVIDER_VALIDATION.md) |
| **7. Production Web & Recovery**| 10 Min | Vercel release process, apex domain SSL, instant rollback | [WEB_PRODUCTION_DEPLOYMENT.md](file:///c:/Users/H-P/Desktop/nnoo/docs/operations/WEB_PRODUCTION_DEPLOYMENT.md), [RELEASE_ROLLBACK.md](file:///c:/Users/H-P/Desktop/nnoo/docs/operations/RELEASE_ROLLBACK.md) |
| **8. Mobile EAS & Stores** | 10 Min | EAS build profiles, Target SDK 35, App Store / Play Store | [MOBILE_RELEASE.md](file:///c:/Users/H-P/Desktop/nnoo/docs/operations/MOBILE_RELEASE.md), [MOBILE_STORE_LISTING_READINESS.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/MOBILE_STORE_LISTING_READINESS.md) |
| **9. Actions & Owner Wrap-Up** | 10 Min | Account ownership transfers, secret rotation, P13 readiness | [HANDOVER_ACTIONS_REQUIRED.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/HANDOVER_ACTIONS_REQUIRED.md), [HANDOVER_CHECKLIST.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/HANDOVER_CHECKLIST.md) |

---

## 2. Key Demonstrations to Perform During Walkthrough

1. **Local Setup & Test Suite:** Run `pnpm test` and show all 375 tests passing.
2. **Next.js Production Build:** Run `pnpm run build` and demonstrate clean 82-route compilation.
3. **Double-Entry Balance Verification:** Inspect `journal_entries` and `journal_lines` in the development database.
4. **AI Bookkeeper Review Flow:** Show raw receipt entry $\to$ suggestion staging ($\Delta 0$) $\to$ human review $\to$ confirmed expense.
5. **WhatsApp Command Execution:** Demonstrate `HELP`, `STOP` opt-out, and multi-business switching.
6. **Vercel Rollback Dashboard:** Show the "Promote to Production" button on Vercel deployments.
