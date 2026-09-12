# NNOO — Master Operational & Handover Checklist

Document ID: `CHK-01`  
Governance Version: `1.0.0`  
Last Reconciled: `2026-08-20` (Tranche 4 Prompt 12 Handover)  
Status: **Authoritative Handover Checklist**

---

## 1. Handover Status Definitions

- **`COMPLETE`**: Fully verified, configured, tested, and documented.
- **`COMPLETE WITH EXTERNAL ACTION`**: Code and configuration ready; awaiting external platform account invitation or administrative agreement.
- **`INCOMPLETE`**: Work remaining (Blocks handover).
- **`NOT APPLICABLE`**: Excluded from August 2026 release scope.

---

## 2. Master Operational Handover Checklist

### 2.1 Source Control & Repository
- [x] **GitHub Repository:** `https://github.com/davidbako/nnoo` confirmed accessible. — `COMPLETE`
- [x] **Release Commit SHA:** `69b8cc8f21091676b72758801cc410ba38db34f6` verified clean with zero uncommitted changes. — `COMPLETE`
- [x] **Branch Protection:** `main` branch configured as protected release branch. — `COMPLETE`

### 2.2 Domain & DNS Infrastructure
- [x] **Production Apex Domain:** `https://nnoo.app` active and bound to Vercel. — `COMPLETE`
- [x] **SSL / TLS Certificate:** Valid Let's Encrypt automated TLS with HSTS enabled. — `COMPLETE`
- [x] **DNS Management:** Cloudflare / Registrar DNS records documented. — `COMPLETE`

### 2.3 Web Hosting & Vercel Pipeline
- [x] **Vercel Project:** Project `nnoo` configured with root `./` and `pnpm --filter=web build`. — `COMPLETE`
- [x] **Environment Variables:** All server secrets configured securely in Vercel project settings. — `COMPLETE`
- [x] **Instant Rollback:** Vercel immutable release promotion verified. — `COMPLETE`

### 2.4 Supabase Database, Auth & Security
- [x] **Production Project:** `hoorlxgtnamwdxszsbwt` active on Supabase PostgreSQL 15. — `COMPLETE`
- [x] **Migrations Current:** 34 / 34 migrations applied; latest: `20260901000000_performance_index_optimization.sql`. — `COMPLETE`
- [x] **Row-Level Security (RLS):** 100% active across all 60 business-owned tables. — `COMPLETE`
- [x] **Disaster Recovery:** Point-in-Time Recovery (PITR) and backup runbooks documented. — `COMPLETE`

### 2.5 Paystack SaaS Billing
- [x] **Live Mode Verification:** Server-to-server verification and HMAC-SHA512 webhook signature certified. — `COMPLETE`
- [x] **Plans Mapped:** Starter (₦5,000), Growth (₦15,000), and Scale (₦35,000) plans configured. — `COMPLETE`
- [x] **Idempotent Single Activation:** Replay attacks tested and rejected. — `COMPLETE`

### 2.6 Google Gemini AI Engine
- [x] **Server-Only API Key:** `GEMINI_API_KEY` injected exclusively on the server. — `COMPLETE`
- [x] **Model Pinned:** `gemini-2.5-flash` with runtime Zod schema parsing. — `COMPLETE`
- [x] **Kill-Switch:** `AI_ENABLED="false"` verified for graceful offline degradation. — `COMPLETE`

### 2.7 Inngest Cloud Background Jobs
- [x] **Serverless Endpoint:** `/api/inngest` authenticated via signing keys. — `COMPLETE`
- [x] **Job Schedules:** Attention scanner, health refresh, and notification fanout registered. — `COMPLETE`
- [x] **Zero Schedule Storms:** Deduplication keys configured on all recurring tasks. — `COMPLETE`

### 2.8 Meta WhatsApp Business Platform
- [x] **Graph API v20.0:** Inbound webhook signature verification (HMAC-SHA256) certified. — `COMPLETE`
- [x] **Cryptographic Link Codes:** 6-digit one-time link code flow verified. — `COMPLETE`
- [x] **STOP Opt-Out Inviolability:** User opt-out unconditionally enforced. — `COMPLETE`

### 2.9 Expo Push Notifications
- [x] **Expo Gateway:** Token registration and invalid token deactivation verified. — `COMPLETE`
- [x] **Lock-Screen Privacy:** Zero financial sums or customer names in push payloads. — `COMPLETE`
- [x] **Tap Reauthorization:** Deep-link opens re-verify active session and RBAC role. — `COMPLETE`

### 2.10 Mobile Build & Store Readiness
- [x] **EAS Project Configured:** Project ID `8b92b6a2-6f17-48f5-a08c-9a4f65c19e42`. — `COMPLETE`
- [x] **Package Identifier:** `com.nnoo.mobile` on Android (Target SDK 35) and iOS. — `COMPLETE`
- [x] **Account Deletion:** Public URL `https://nnoo.app/account-deletion` and in-app deletion verified. — `COMPLETE`
- [ ] **Google Play Console Upload:** Production AAB ready for upload. — `COMPLETE WITH EXTERNAL ACTION`
- [ ] **Apple App Store Connect Upload:** Production IPA ready for TestFlight upload. — `COMPLETE WITH EXTERNAL ACTION`

### 2.11 Documentation & Operations
- [x] **18 Production Runbooks:** Indexed and verified in `docs/project/runbooks/`. — `COMPLETE`
- [x] **User Guides:** Platform Admin, Business User, and Mobile User guides authored. — `COMPLETE`
- [x] **Architecture Guides:** Financial Engine, AI, Health Score, and Credit Passport guides authored. — `COMPLETE`
- [x] **Zero Secret Exposure:** Verified 0 plaintext credentials across all documentation. — `COMPLETE`
