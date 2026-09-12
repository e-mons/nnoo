# NNOO — Master Project Handover Document

Document ID: `NNOO-HANDOVER-01`  
Project: **NNOO — Africa’s AI Business Operating System**  
Owner & Lead Developer: **David Bako**  
Governance Version: `1.0.0`  
Release Identifier: `RELEASE-WEB-20260819-01` / `RELEASE-MOBILE-20260819-01`  
Target Delivery Date: **August 2026**  
Status: **Official Handover Package (Tranche 4 Prompt 12)**

---

## 1. Executive Summary & Handover Purpose

This document serves as the master engineering, operational, and architectural handover entry point for **NNOO**. It provides incoming software engineers, DevOps administrators, product operators, and David Bako with complete, durable, and authoritative knowledge required to understand, operate, maintain, deploy, and extend NNOO in production.

NNOO is built with strict discipline:
- **One combined Next.js web application** (`apps/web`) serving public marketing, authentication, multi-tenant business applications, platform administration, and API v1 endpoints.
- **One React Native Expo mobile application** (`apps/mobile`) delivering native Android and iOS experiences.
- **One shared canonical Supabase PostgreSQL backend** per environment with 100% Row-Level Security (RLS) across all 60 business tables.
- **Strict separation of mathematical truth and generative AI**: Financial calculations and double-entry ledgers are computed purely by deterministic domain code; Google Gemini (`gemini-2.5-flash`) operates server-side to classify, summarize, and explain verified facts.
- **Idempotent, server-verified external integrations** across Paystack (SaaS billing), Inngest (durable jobs), Meta WhatsApp (Cloud API v20.0), and Expo Push (APNs & FCM).

---

## 2. August 2026 Scope & System Capabilities

### 2.1 Implemented & Accepted Production Modules

1. **Public Marketing & Onboarding:** Dynamic marketing pages, SEO, `/sign-up`, `/sign-in`, `/onboarding`, email verification, and business workspace initialization.
2. **Multi-Tenant Identity & Access (RBAC):** Owner, Business Admin, Manager, Accountant, Sales Staff, Inventory Staff, and Read-Only roles. Cryptographic staff invitation tokens and last-active-owner invariant protection.
3. **Commerce & Daily Operations:** Products/Services catalog, weighted-average stock costing, Customers, Suppliers, Sales, Payments, PDF Receipts, Refunds with inventory restock, Operating Expenses, and Accounts Payable (AP) liability tracking.
4. **Financial Engine & Reporting:** Double-entry general ledger, automated debit/credit balancing, COGS computation, Accounts Receivable, Accounts Payable, Profit & Loss reports, and real-time dashboard aggregates ($\Delta 0$ drift).
5. **Paystack SaaS Subscription Billing:** Automated plan initialization, server-verified checkouts, HMAC-SHA512 webhook signature verification, and idempotent single-activation subscription entitlements.
6. **AI Bookkeeper:** Natural-language transaction classification, suggestion-only staging ($\Delta 0$ financial mutation before review), human review/correction workflow, single canonical posting, and replay protection.
7. **Business Intelligence & Smart Insights:** Real-time grounded business summaries, Ask NNOO conversational financial Q&A (bounded by tenant context with zero mutation capabilities).
8. **Business Health Score:** 100% deterministic domain algorithm (`business-health-score-v1`, 0–100 scale) measuring liquidity, profitability, and operational efficiency (0 Gemini calculation calls).
9. **Credit Passport:** Point-in-time financial profile snapshots, SHA-256 integrity hash verification, downloadable PDF exports, and time-bounded public sharing with instant revocation.
10. **Automations & Durable Background Jobs:** Inngest serverless event orchestration, daily/weekly/monthly schedules, low-stock attention detection, and automated event resolution.
11. **Multi-Channel Notifications:** In-app notification center, RBAC-filtered fanout, user channel preferences, generic safe lock-screen Push notifications, and Meta WhatsApp automated alerts.
12. **Meta WhatsApp Integration:** WhatsApp Cloud API v20.0, cryptographic link codes, multi-business context switching, deterministic commands (`HELP`, `START`, `BUSINESS`), and inviolable `STOP` opt-out enforcement.
13. **Platform Administration:** `/admin` operational dashboard, tenant health oversight, business suspension/reactivation, enquiry management, and immutable audit logs (with zero admin ability to edit customer journal entries).
14. **Cross-Platform Parity:** 14 core modules verified identical across Web and Mobile.

### 2.2 Explicitly Deferred Roadmap Items (Out-of-Scope)

To prevent operational assumptions, the following features are **NOT** part of the August 2026 release:
- Direct institutional lending or balance sheet credit underwriting.
- Public multi-lender Loan Marketplace.
- Direct external bank Credit Intelligence API.
- Government/Tax Authority automated filing integrations (FIRS/LIRS).
- Automated payroll disbursement and PAYE tax withholding.
- USSD or SMS text-messaging applications.
- Voice / IVR interactive calling agents.
- Full offline two-way database synchronization.
- Pan-African localized tax engines outside standard NGN base currency models.

---

## 3. Master Document Directory

| Operational Domain | Primary Handover Document | Document ID | Purpose |
|---|---|---|---|
| **System Architecture** | [ARCHITECTURE.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/ARCHITECTURE.md) | `ARCH-01` | High-level system structure, data flow, and boundaries |
| **Domain Model** | [DOMAIN_MODEL.md](file:///c:/Users/H-P/Desktop/nnoo/docs/architecture/DOMAIN_MODEL.md) | `DOM-01` | Canonical entities, lifecycles, and relational mappings |
| **API & Data Contracts** | [API_AND_DATA_CONTRACTS.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/API_AND_DATA_CONTRACTS.md) | `API-01` | REST endpoints, Server Actions, DTOs, and event contracts |
| **Role & RBAC Matrix** | [ROLE_PERMISSION_MATRIX.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/ROLE_PERMISSION_MATRIX.md) | `RBAC-01` | Full permission mapping across UI, API, and RLS policies |
| **Repository Layout** | [REPOSITORY_GUIDE.md](file:///c:/Users/H-P/Desktop/nnoo/docs/development/REPOSITORY_GUIDE.md) | `REPO-01` | Monorepo structure, package dependencies, and rules |
| **Local Development** | [LOCAL_DEVELOPMENT.md](file:///c:/Users/H-P/Desktop/nnoo/docs/development/LOCAL_DEVELOPMENT.md) | `DEV-01` | Prerequisites, toolchains, and package scripts |
| **Developer Onboarding** | [DEVELOPER_ONBOARDING.md](file:///c:/Users/H-P/Desktop/nnoo/docs/development/DEVELOPER_ONBOARDING.md) | `ONBOARD-01` | Step-by-step technical onboarding checklist |
| **Database Operations** | [DATABASE_OPERATIONS.md](file:///c:/Users/H-P/Desktop/nnoo/docs/operations/DATABASE_OPERATIONS.md) | `DB-OPS-01` | Supabase schema migrations, generated types, and MCP workflow |
| **Data Protection & DR** | [DATA_PROTECTION_AND_RECOVERY.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/DATA_PROTECTION_AND_RECOVERY.md) | `DR-01` | Backups, PITR, restore runbooks, and validation gates |
| **Financial Engine** | [FINANCIAL_ENGINE.md](file:///c:/Users/H-P/Desktop/nnoo/docs/architecture/FINANCIAL_ENGINE.md) | `FIN-01` | Double-entry accounting truth, integer money, and journal balancing |
| **AI & Intelligence** | [AI_AND_INTELLIGENCE.md](file:///c:/Users/H-P/Desktop/nnoo/docs/architecture/AI_AND_INTELLIGENCE.md) | `AI-01` | Gemini integration, deterministic fact grounding, and boundaries |
| **Business Health Score** | [BUSINESS_HEALTH_SCORE.md](file:///c:/Users/H-P/Desktop/nnoo/docs/architecture/BUSINESS_HEALTH_SCORE.md) | `HEALTH-01` | Deterministic scoring algorithms and health indicators |
| **Credit Passport** | [CREDIT_PASSPORT.md](file:///c:/Users/H-P/Desktop/nnoo/docs/architecture/CREDIT_PASSPORT.md) | `PASSPORT-01` | Immutable financial snapshots, PDF export, and sharing |
| **Web Production Release** | [WEB_PRODUCTION_DEPLOYMENT.md](file:///c:/Users/H-P/Desktop/nnoo/docs/operations/WEB_PRODUCTION_DEPLOYMENT.md) | `WEB-REL-01` | GitHub to Vercel release pipelines and apex domain binding |
| **Release Rollback** | [RELEASE_ROLLBACK.md](file:///c:/Users/H-P/Desktop/nnoo/docs/operations/RELEASE_ROLLBACK.md) | `ROLLBACK-01` | Vercel deployment rollback and database incident recovery |
| **Mobile Release & Stores**| [MOBILE_RELEASE.md](file:///c:/Users/H-P/Desktop/nnoo/docs/operations/MOBILE_RELEASE.md) | `MOB-REL-01` | EAS build pipelines, store listing readiness, and signing keys |
| **Store Listing Readiness**| [MOBILE_STORE_LISTING_READINESS.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/MOBILE_STORE_LISTING_READINESS.md) | `STORE-01` | Apple App Privacy, Google Data Safety, and store metadata |
| **Provider Validation** | [PRODUCTION_PROVIDER_VALIDATION.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/PRODUCTION_PROVIDER_VALIDATION.md) | `PROV-01` | Master certification across all 6 external production providers |
| **Provider Operations** | [PROVIDER_OPERATIONS.md](file:///c:/Users/H-P/Desktop/nnoo/docs/operations/PROVIDER_OPERATIONS.md) | `PROV-OPS-01` | Operational management map for Paystack, Gemini, Inngest, etc. |
| **Paystack Billing** | [PAYSTACK_BILLING.md](file:///c:/Users/H-P/Desktop/nnoo/docs/operations/PAYSTACK_BILLING.md) | `BILL-01` | SaaS subscription plans, webhooks, and idempotent fulfillment |
| **Automations & Jobs** | [AUTOMATIONS_AND_JOBS.md](file:///c:/Users/H-P/Desktop/nnoo/docs/operations/AUTOMATIONS_AND_JOBS.md) | `JOB-OPS-01` | Inngest event registration, schedules, and retry handling |
| **Push Notifications** | [PUSH_NOTIFICATIONS.md](file:///c:/Users/H-P/Desktop/nnoo/docs/operations/PUSH_NOTIFICATIONS.md) | `PUSH-OPS-01` | Expo Push gateway, token lifecycle, and receipt handling |
| **WhatsApp Operations** | [WHATSAPP.md](file:///c:/Users/H-P/Desktop/nnoo/docs/operations/WHATSAPP.md) | `WA-OPS-01` | Meta Cloud API v20.0, webhooks, linking, and opt-out rules |
| **Account Ownership** | [PRODUCTION_ACCOUNT_OWNERSHIP.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/PRODUCTION_ACCOUNT_OWNERSHIP.md) | `OWN-01` | Account ownership matrix, access tiers, and transfer actions |
| **Observability & Incidents**| [OBSERVABILITY_AND_INCIDENT_MANAGEMENT.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/OBSERVABILITY_AND_INCIDENT_MANAGEMENT.md) | `OBS-01` | Logging taxonomy, alert thresholds, and incident triage |
| **Runbook Index** | [RUNBOOK_INDEX.md](file:///c:/Users/H-P/Desktop/nnoo/docs/operations/RUNBOOK_INDEX.md) | `RUN-IDX-01` | Complete index of all 18 production incident runbooks |
| **Troubleshooting Guide** | [TROUBLESHOOTING.md](file:///c:/Users/H-P/Desktop/nnoo/docs/operations/TROUBLESHOOTING.md) | `TSHOOT-01` | Symptom-based diagnosis and non-destructive resolution |
| **Support Operations** | [SUPPORT_OPERATIONS.md](file:///c:/Users/H-P/Desktop/nnoo/docs/operations/SUPPORT_OPERATIONS.md) | `SUP-01` | Customer support triage, data minimization, and defect escalation |
| **Security Operations** | [SECURITY_OPERATIONS.md](file:///c:/Users/H-P/Desktop/nnoo/docs/operations/SECURITY_OPERATIONS.md) | `SEC-OPS-01` | Security monitoring, RLS auditing, and secret rotation |
| **Secret Rotation** | [18-secret-rotation.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/18-secret-rotation.md) | `RUN-18` | Step-by-step rotation guide for all 6 production secrets |
| **Platform Admin Guide** | [PLATFORM_ADMIN_GUIDE.md](file:///c:/Users/H-P/Desktop/nnoo/docs/guides/PLATFORM_ADMIN_GUIDE.md) | `ADM-GUIDE-01` | Complete manual for `/admin` operators |
| **Business User Guide** | [BUSINESS_USER_GUIDE.md](file:///c:/Users/H-P/Desktop/nnoo/docs/guides/BUSINESS_USER_GUIDE.md) | `BIZ-GUIDE-01` | Non-technical operating guide for business owners and staff |
| **Mobile User Guide** | [MOBILE_USER_GUIDE.md](file:///c:/Users/H-P/Desktop/nnoo/docs/guides/MOBILE_USER_GUIDE.md) | `MOB-GUIDE-01` | Guide for the React Native mobile application |
| **System Inventory** | [SYSTEM_INVENTORY.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/SYSTEM_INVENTORY.md) | `INV-01` | Comprehensive inventory of services, environments, and repos |
| **Production Identifiers**| [PRODUCTION_IDENTIFIERS.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/PRODUCTION_IDENTIFIERS.md) | `PROD-ID-01` | Non-secret production IDs, package names, and domain bindings |
| **External Dependencies** | [EXTERNAL_DEPENDENCIES.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/EXTERNAL_DEPENDENCIES.md) | `EXT-DEP-01` | Criticality, failure impacts, and fallback strategies |
| **Handover Checklist** | [HANDOVER_CHECKLIST.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/HANDOVER_CHECKLIST.md) | `CHK-01` | Service-by-service handover verification checklist |
| **Handover Actions** | [HANDOVER_ACTIONS_REQUIRED.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/HANDOVER_ACTIONS_REQUIRED.md) | `ACT-01` | Explicit account invitations and owner actions required |
| **Technical Walkthrough** | [TECHNICAL_HANDOVER_WALKTHROUGH.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/TECHNICAL_HANDOVER_WALKTHROUGH.md) | `WALK-01` | 90-minute technical onboarding walkthrough agenda |
| **Operations Quick Ref** | [OPERATIONS_QUICK_REFERENCE.md](file:///c:/Users/H-P/Desktop/nnoo/docs/operations/OPERATIONS_QUICK_REFERENCE.md) | `QREF-01` | Fast answers to common production operational emergencies |
| **Handover Package Manifest**| [HANDOVER_PACKAGE_MANIFEST.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/HANDOVER_PACKAGE_MANIFEST.md) | `MAN-01` | Complete manifest of all handover documents |

---

## 4. Key Production Facts & Verified Identifiers

- **Web Application Production Release SHA:** `69b8cc8f21091676b72758801cc410ba38db34f6`
- **Web Production Canonical URL:** `https://nnoo.app`
- **Mobile Android Package / Application ID:** `com.nnoo.mobile` (Version `1.0.0`, Version Code `1`, Target SDK 35)
- **Mobile iOS Bundle Identifier:** `com.nnoo.mobile` (Version `1.0.0`, Build Number `"1"`)
- **EAS Project ID:** `8b92b6a2-6f17-48f5-a08c-9a4f65c19e42`
- **Production Supabase Project Reference:** `hoorlxgtnamwdxszsbwt` (`https://hoorlxgtnamwdxszsbwt.supabase.co`)
- **Database Schema Status:** 34 / 34 migrations applied; latest: `20260901000000_performance_index_optimization.sql`
- **Test Suite Status:** **375 / 375 tests passing across 115 test suites with 0 failures**
- **Go-Live Rehearsal Status:** Formally certified as **GO-LIVE REHEARSAL PASSED** (Prompt 11)

---

## 5. Permanent Engineering & Operational Invariants

Incoming engineers and operators must adhere strictly to these permanent system invariants:

1. **Zero Financial Mutation via AI or UI Direct Editing:** Generative AI (`gemini-2.5-flash`) operates strictly as an explanatory and classification engine. All financial totals, COGS, journal lines, and Business Health Scores are calculated exclusively by deterministic domain code.
2. **Reversals Over Deletions:** In accordance with standard statutory accounting, posted transactions (sales, payments, expenses, refunds) are never deleted from database tables. Reversals and restocks generate compensatory credit/debit journal entries, preserving the audit trail.
3. **Unified Backend Parity:** Web and Mobile interfaces consume the identical Supabase PostgreSQL database and REST API v1 endpoints. No separate backend or fragmented database exists.
4. **Strict Server-Only Secrets:** Zero secret credentials (`SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY`, `GEMINI_API_KEY`, `WHATSAPP_ACCESS_TOKEN`, `INNGEST_SIGNING_KEY`) exist in client-side bundles, public GitHub repositories, or telemetry logs.
5. **Forward-Only Database Migrations:** Once applied to production, a migration script in `supabase/migrations/` is immutable. Database alterations must always be applied as new, additive forward migrations.
6. **Inviolable User Consent & Opt-Out:** User opt-out requests (e.g. WhatsApp `STOP` command) are unconditionally enforced and cannot be overridden by administrators.
