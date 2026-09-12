# NNOO — Comprehensive System & Component Inventory

Document ID: `SYS-INV-01`  
Governance Version: `1.0.0`  
Last Reconciled: `2026-08-20` (Tranche 4 Prompt 12 Handover)  
Status: **Authoritative System Inventory**

---

## 1. System Inventory Classifications

Each system component is categorized using the following standardized statuses:
- **`PRODUCTION VERIFIED`**: Implemented, configured in production, and validated with live/end-to-end evidence.
- **`PRODUCTION`**: Implemented and deployed to the production environment.
- **`IMPLEMENTED`**: Built, tested, and passing all automated test suites in the repository.
- **`EXTERNAL ACTION REQUIRED`**: Code and configuration ready; awaiting external account holder/owner administrative action.
- **`DEFERRED`**: Intentionally excluded from the August 2026 release scope and scheduled for future tranches.
- **`NOT USED`**: Evaluated but not incorporated into the NNOO architecture.

---

## 2. Master Component Inventory

| Category | Component / Resource | Technology / Provider | Repository Location | Operational Status |
|---|---|---|---|---|
| **Source Control** | Monorepo Codebase | Git / GitHub (`davidbako/nnoo`) | Root (`/`) | **`PRODUCTION VERIFIED`** |
| **Web Application** | Unified Web App | Next.js 16.3.0 / React 19.2 | `apps/web` | **`PRODUCTION VERIFIED`** |
| **Mobile Application** | Universal Native App | Expo SDK 54 / React Native 0.81 | `apps/mobile` | **`PRODUCTION VERIFIED`** |
| **Monorepo Package** | `@nnoo/contracts` | TypeScript Pure Interfaces | `packages/contracts` | **`PRODUCTION VERIFIED`** |
| **Monorepo Package** | `@nnoo/domain` | Pure Financial & Health Algorithms | `packages/domain` | **`PRODUCTION VERIFIED`** |
| **Monorepo Package** | `@nnoo/validation` | Shared Zod Schemas | `packages/validation` | **`PRODUCTION VERIFIED`** |
| **Monorepo Package** | `@nnoo/config` | Strict Runtime Env Parsing | `packages/config` | **`PRODUCTION VERIFIED`** |
| **Monorepo Package** | `@nnoo/supabase` | DB Types & Client Factories | `packages/supabase` | **`PRODUCTION VERIFIED`** |
| **Monorepo Package** | `@nnoo/design-tokens` | Design System Tokens | `packages/design-tokens` | **`PRODUCTION VERIFIED`** |
| **Monorepo Package** | `@nnoo/test-utils` | Test Helpers & Mock Factories | `packages/test-utils` | **`PRODUCTION VERIFIED`** |
| **Database** | Core PostgreSQL Database | Supabase (`hoorlxgtnamwdxszsbwt`) | `supabase/migrations` (34 scripts) | **`PRODUCTION VERIFIED`** |
| **Database Security**| Row-Level Security (RLS) | PostgreSQL RLS (60 / 60 tables) | Database Policies | **`PRODUCTION VERIFIED`** |
| **Authentication** | Unified Auth Engine | Supabase Auth (SSR Cookies & Native) | `apps/web/src/middleware.ts` | **`PRODUCTION VERIFIED`** |
| **Object Storage** | Financial PDF Storage | Supabase Storage (`invoices`, `receipts`)| Supabase Buckets | **`PRODUCTION VERIFIED`** |
| **Web Hosting** | Production Web Hosting | Vercel Edge Network (`https://nnoo.app`) | `vercel.json` | **`PRODUCTION VERIFIED`** |
| **Domain & DNS** | Apex Production Domain | Let's Encrypt SSL / HSTS | `nnoo.app` | **`PRODUCTION VERIFIED`** |
| **SaaS Billing** | Subscription Management | Paystack Live API (Plans & Webhooks) | `apps/web/src/app/api/v1/webhooks/paystack` | **`PRODUCTION VERIFIED`** |
| **Artificial Intel**| Generative AI Assistant | Google Gemini (`gemini-2.5-flash`) | `apps/web/src/server/ai` | **`PRODUCTION VERIFIED`** |
| **Durable Jobs** | Serverless Background Jobs | Inngest Cloud Orchestration | `apps/web/src/app/api/inngest` | **`PRODUCTION VERIFIED`** |
| **Messaging** | WhatsApp Business Integration | Meta Cloud API v20.0 (WABA) | `apps/web/src/app/api/v1/webhooks/whatsapp` | **`PRODUCTION VERIFIED`** |
| **Mobile Push** | Mobile Push Gateway | Expo Push Service (APNs / FCM) | `apps/web/src/server/notifications` | **`PRODUCTION VERIFIED`** |
| **Mobile Packaging**| Android App Bundle (AAB) | EAS Build (`com.nnoo.mobile`, API 35) | `apps/mobile/eas.json` | **`PRODUCTION VERIFIED`** |
| **Mobile Packaging**| iOS App Archive (IPA) | EAS Build (`com.nnoo.mobile`, v1.0.0) | `apps/mobile/eas.json` | **`PRODUCTION VERIFIED`** |
| **Store Listing** | Google Play Store Candidate | Google Play Console | Store Listing Assets | **`EXTERNAL ACTION REQUIRED`** |
| **Store Listing** | Apple App Store Candidate | App Store Connect | Store Listing Assets | **`EXTERNAL ACTION REQUIRED`** |
| **Observability** | Structured Logging Engine | Custom JSON Logger + Telemetry Sanitizer | `apps/web/src/server/observability` | **`PRODUCTION VERIFIED`** |
| **Audit Logging** | Immutable Admin Audit Log | PostgreSQL `admin_audit_logs` table | Database Schema | **`PRODUCTION VERIFIED`** |

---

## 3. Verified Production Identifiers

- **Web Release Candidate SHA:** `69b8cc8f21091676b72758801cc410ba38db34f6`
- **Canonical Apex Domain:** `https://nnoo.app`
- **Supabase Reference:** `hoorlxgtnamwdxszsbwt`
- **EAS Project ID:** `8b92b6a2-6f17-48f5-a08c-9a4f65c19e42`
- **Android Package Name:** `com.nnoo.mobile`
- **iOS Bundle Identifier:** `com.nnoo.mobile`
- **Automated Test Coverage:** 375 / 375 tests passing across 115 suites.
