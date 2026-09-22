# Project Changelog

### PRODUCTION REMEDIATION: 100% Zero-Mock Verification & Storage Cascade Triggers (2026-09-22)
- **ZERO-MOCK & TRANSACTIONAL REMEDIATIONS (`apps/web`, `apps/mobile`)**:
  - Eliminated fallback nil UUID `'00000000-0000-0000-0000-000000000000'` in mobile bookkeeper review ([apps/mobile/app/(app)/intelligence/bookkeeper/[id].tsx](file:///c:/Users/H-P/Desktop/nnoo/apps/mobile/app/%28app%29/intelligence/bookkeeper/%5Bid%5D.tsx)); implemented dynamic active expense category discovery and user validation.
  - Implemented transactional email service ([apps/web/src/lib/email/service.ts](file:///c:/Users/H-P/Desktop/nnoo/apps/web/src/lib/email/service.ts)) via Resend REST API; replaced `TODO` stub in team member invite action ([apps/web/src/lib/actions/team.ts](file:///c:/Users/H-P/Desktop/nnoo/apps/web/src/lib/actions/team.ts)) with automated HTML email dispatch.
  - Replaced hardcoded `'test'` provider environment with dynamic key detection (`process.env.PAYSTACK_SECRET_KEY?.startsWith('sk_live_') ? 'live' : 'test'`) in Paystack webhook handler ([apps/web/src/app/api/v1/webhooks/paystack/route.ts](file:///c:/Users/H-P/Desktop/nnoo/apps/web/src/app/api/v1/webhooks/paystack/route.ts)).
  - Cleaned unused `MockGeminiClient` import in production AI service ([apps/web/src/server/ai/service.ts](file:///c:/Users/H-P/Desktop/nnoo/apps/web/src/server/ai/service.ts)).
- **SUPABASE MCP DATABASE & STORAGE INTEGRITY**:
  - Applied migration `20260922000000_storage_cleanup_triggers.sql` to canonical Supabase project `hoorlxgtnamwdxszsbwt`.
  - Added automated `SECURITY DEFINER` storage cleanup triggers (`trg_business_storage_cleanup` and `trg_expense_receipt_storage_cleanup`) to automatically purge orphaned files in `storage.objects` when parent businesses or expenses are deleted.
  - Verified 0 orphaned records across all business-owned tables and child entities.
- **QUALITY GATES**:
  - Monorepo TypeScript: 8/8 packages passed, 0 errors (`turbo run typecheck`).
  - Monorepo Lint: 0 errors (`turbo run lint`).
  - Canonical Supabase Migration Parity: 100% synchronized.

- **CARD & CONTAINER HEIGHT OPTIMIZATION (`apps/mobile`)**:
  - Resolved issue where horizontal KPI strips stretched vertically into massive, awkward boxes with dead space below contents.
  - Added `flexGrow: 0` and `alignItems: 'flex-start'` on horizontal KPI ScrollViews across Money (`sales/index.tsx`), Stock (`inventory/index.tsx`), and Contacts (`more/contacts/index.tsx`).
  - Added `flexGrow: 0` and `alignItems: 'center'` on tab selector ScrollViews in Money and Stock Hubs.
  - Compacted KPI card dimensions (`width: 146`, `paddingVertical: 10`, `paddingHorizontal: 12`) with tight, balanced microcopy and crisp iconography.
  - Eliminated bloated `68dp` min-height on More Hub menu rows (`more/index.tsx`), streamlining rows to an accessible `48dp` with balanced vertical padding (`10dp`) and `16dp` container radius.
  - Tightened Home screen (`index.tsx`) `heroCard` padding (`22dp` -> `16dp`), metrics dock (`12dp` -> `9dp`), vital signs 2x2 grid (`16dp` -> `12dp` vertical), empty activity card (`28dp` -> `18dp`), and reduced bottom padding (`130dp` -> `40dp`).
  - Refined Customer and Supplier detail cards (`more/customers/[id].tsx`, `more/suppliers/[id].tsx`) to `14dp` padding with `16dp` rounded corners.
- **QUALITY GATES**:
  - `apps/mobile` TypeScript: 0 errors (`npx tsc --noEmit`).
  - `expo-doctor`: 21/21 checks passed (0 issues).
  - Android Metro export: 1,707 modules cleanly bundled in 2.3s (`npx expo export -p android --no-bytecode`).

### HOTFIX: Mobile Contacts Hub Schema Query Alignment (2026-09-22)
- **POSTGRESQL COLUMN 42703 FIX (`apps/mobile/app/(app)/more/contacts/index.tsx`)**:
  - Removed non-existent `balance_minor` column selection on `customers` table query in `fetchContacts`.
  - Replaced with canonical schema fields: `customer_type` and `status`, perfectly conforming to `packages/supabase/database.types.ts`.
  - Replaced broken `totalCustomerDebtMinor` KPI with `activeCustomersCount` and `activeSuppliersCount` matching the web Contacts Hub (`ContactsHubClient.tsx`).
  - Added 4 synchronized metric cards: **Total Customers**, **Active Customers**, **Total Suppliers**, and **Active Suppliers**.
  - Updated customer directory item cards to display business/individual badges (`B2B`) and real status indicators (`Active`) instead of failing debt lookups.
- **QUALITY GATES**:
  - `apps/mobile` TypeScript: 0 errors (`npx tsc --noEmit`).
  - `expo-doctor`: 21/21 checks passed (0 issues).
  - Android Metro export: 1,707 modules cleanly bundled (`npx expo export -p android --no-bytecode`).
  - Zero database schema or web app regressions.

### MOBILE IA CONSOLIDATION & NON-TECHNICAL SIMPLIFICATION (2026-09-22)
- **INFORMATION ARCHITECTURE (IA) CONSOLIDATION (`apps/mobile`)**:
  - Consolidated fragmented navigation into **4 primary thumb-friendly hubs** in `apps/mobile/app/(app)/_layout.tsx`:
    - **Tab 1: Home (`index.tsx`)** — "Daily Business Pulse": Plain-language KPIs (Cash In Today, Cash Out Today, Net Cash Position, Money Owed to You), 1-tap thumb action strip (🟢 New Sale, 🔴 Record Expense, 📄 Issue Invoice, 📦 Add Item), and unified live daily activity stream.
    - **Tab 2: Money (`sales/index.tsx`)** — "All Cash & Transactions": 5-segment financial cockpit (Cash Flow Activity, Sales Orders, Invoices, Receipts, Expenses, and AI Review) with native FAB and bottom sheet modal for instant creation.
    - **Tab 3: Stock (`inventory/index.tsx`)** — "Products & Items": 3-segment items cockpit (Products & Items, Low Stock Urgencies, Stock In & Out) with native FAB and bottom sheet modal for adding products and receiving stock.
    - **Tab 4: More (`more/index.tsx`)** — "Directory & Settings": Reorganized into 3 distinct visual card groups (Business Directory, Smart Tools & AI, Settings & Organization) plus a prominent native Sign Out button.
  - Hidden redundant bottom bar tab `invoices` (`href: null`), routing invoice operations cleanly through the Money Hub while preserving deep link routes (`/invoices/[id]`, `/invoices/new`, `/invoices/receipts/[id]`).
- **NON-TECHNICAL MICROCOPY & TACTILE DESIGN SYSTEM**:
  - Replaced accounting jargon with intuitive, everyday business phrasing: "Cash In", "Cash Out", "Net Cash Position", "Money Owed to You", "Items on Hand", "Awaiting Payment", and "Paid in Full".
  - Standardized minimum 48dp touch targets on all interactive buttons and menu rows.
  - Replaced deep, disorienting sub-route hops with lightweight native modal action sheets (`Modal` bottom sheets) on Money and Stock tabs.
  - Deep obsidian dark theme (`#0A1C16`, `#0F261E`) with vibrant chartreuse (`#B8F25C`), coral red (`#FF6B6B`), and sky blue (`#79C0FF`) accents for maximum legibility in African daylight.
- **QUALITY GATES & BACKEND ZERO DAMAGE**:
  - `apps/mobile` TypeScript: 0 errors (`npx tsc --noEmit`).
  - `expo-doctor`: 21/21 checks passed.
  - Metro Android Export: 1,707 modules cleanly bundled without warnings (`npx expo export -p android --no-bytecode`).
  - Monorepo full typecheck: 9 of 9 packages passed (`pnpm run typecheck`).
  - Zero backend, Supabase migration, web app, contract, or validation package modifications.

### SAFE DEPENDENCY UPGRADE: Mobile Expo SDK 57 & React Native 0.86 (2026-09-22)
- **EXPO SDK 57 SAFE UPGRADE (`apps/mobile`)**:
  - Upgraded Expo SDK from `~54.0.0` to `~57.0.24` (`react-native@0.86.3`, `react@19.2.3`, `react-dom@19.2.3`).
  - Resolved `Uncaught Error: java.Exception: Incompatible SDK version` encountered on physical Android devices running the latest Google Play Expo Go app.
  - Aligned all Expo peer packages to SDK 57 compatible versions:
    - `@expo/metro-runtime@~57.0.16`
    - `expo-blur@~57.0.3`
    - `expo-constants@~57.0.19`
    - `expo-crypto@~57.0.3`
    - `expo-font@~57.0.4`
    - `expo-linear-gradient@~57.0.2`
    - `expo-linking@~57.0.10`
    - `expo-notifications@~57.0.20`
    - `expo-router@~57.0.22`
    - `expo-secure-store@~57.0.4`
    - `expo-splash-screen@~57.0.4`
    - `expo-status-bar@~57.0.1`
    - `expo-video@~57.0.4`
    - `react-native-safe-area-context@~5.7.0`
    - `react-native-screens@~4.26.0`
    - `@react-native-picker/picker@2.11.4`
  - Replaced deprecated React Native `StyleSheet.absoluteFillObject` with `StyleSheet.absoluteFill` across 8 components.
  - Migrated `apps/mobile/app.json` configuration from deprecated top-level `"splash"` to the official `"expo-splash-screen"` config plugin.
  - Isolated TypeScript installation in `package.json` with `"expo": { "install": { "exclude": ["typescript"] } }` to prevent monorepo conflicts.
  - **Quality Gates**:
    - `expo-doctor`: 21/21 checks passed (0 issues).
    - `apps/mobile` TypeScript: 0 errors.
    - `apps/web` TypeScript: 0 errors.
    - Monorepo full typecheck: 9 of 9 packages passed with 0 errors.
    - Android production Metro bundling: 1,711 modules exported successfully.

### MOBILE SYNCHRONIZATION & ADMIN PURGE: 100% Parity with Web Hubs & Complete Administrative Excision (2026-09-22)
- **COMPLETE ADMINISTRATIVE PURGE FROM MOBILE (100% Web-Only Platform Admin)**:
  - Deleted `apps/mobile/app/(admin)/` and all platform admin screens and layouts.
  - Purged `isAdmin` state, claims, and `platform_admins` queries from `apps/mobile/context/AuthContext.tsx`.
  - Cleaned up `apps/mobile/app/_layout.tsx` to remove `inAdminGroup`, route guards, and admin redirects.
  - Enforced strict architectural boundary: platform administration is strictly web-only (`apps/web/src/app/admin/`).
- **MONEY & SALES HUB SYNCHRONIZATION**:
  - Upgraded `apps/mobile/app/(app)/sales/index.tsx` into the full unified **Money & Sales Hub** mirroring `MoneyHubClient.tsx`:
    - Top financial KPI strip: Total Sales (Cash In), Total Expenses (Cash Out), Net Cash Position, and Unpaid Invoices.
    - Multi-tab segmented hub: Activity (chronological combined cash flow), Sales (status filterable), Invoices, Receipts, Expenses, and AI Bookkeeper quick action.
    - Quick actions: New Sale, Record Expense, Issue Invoice.
    - Live Supabase queries against `sales`, `expenses`, `invoices`, and `receipts` in parallel.
- **ITEMS & STOCK HUB SYNCHRONIZATION**:
  - Upgraded `apps/mobile/app/(app)/inventory/index.tsx` into the full unified **Items & Stock Hub** mirroring `StockHubClient.tsx`:
    - Stock KPI cards: Total Stock Valuation, Tracked Physical Units, Critical Low Stock Alerts, and Total Catalog Items.
    - Multi-tab segmented hub: Items & Products catalog, Live Stock Positions, Low Stock Alerts, and Stock Movements (Receive & Adjust).
    - Quick actions: Add Item, Receive Stock, Adjust Stock.
    - Live queries against `catalog_items`, `inventory_positions`, and `product_categories`.
- **CONTACTS HUB (CUSTOMERS & SUPPLIERS)**:
  - Created `apps/mobile/app/(app)/more/contacts/index.tsx` porting `ContactsHubClient.tsx` to mobile:
    - Unified address book with KPI cards (Total Customers, Total Suppliers, Customer Debt Receivables).
    - Segmented switching between Customers and Suppliers with instant search, phone/email shortcuts, and profile inspection.
- **STANDALONE RECEIPTS HUB**:
  - Created `apps/mobile/app/(app)/more/receipts/index.tsx` matching web `/receipts`:
    - Comprehensive payment receipts listing with receipt number, customer snapshot, date, and minor amount.
    - Native share action and direct drill-down into receipt breakdown.
- **AI ADVISOR & SETTINGS PARITY**:
  - Enhanced `apps/mobile/app/(app)/intelligence/index.tsx` with AI Advisor hero status card, suggestion prompt chips, and quick tool launcher matching `AdvisorHubClient.tsx`.
  - Created `apps/mobile/app/(app)/settings/notifications.tsx` matching web `/settings/notifications` for push, low-stock, and payment channels.
  - Created `apps/mobile/app/(app)/settings/automations.tsx` matching web `/settings/automations`.
  - Modernized `apps/mobile/app/(app)/settings/index.tsx` with direct navigation cards for Preferences, Automations, WhatsApp, and Team roles.
- **STRICT QUALITY GATES PASSED**:
  - Mobile TypeScript: Passed with 0 errors (`npx tsc --noEmit`).
  - Web TypeScript: Passed with 0 errors (`npx tsc --noEmit`).
  - Monorepo Full Typecheck: 9 of 9 packages passed with 0 errors (`pnpm run typecheck`).

- **COMPREHENSIVE VERCEL PRODUCTION SETUP GUIDE (`docs/guides/VERCEL_PRODUCTION_SETUP_GUIDE.md`)**:
  - Authored complete beginner-friendly (zero technical experience) step-by-step guide for deploying and testing NNOO on Vercel without errors.
  - Documented the critical monorepo rule (keeping Root Directory as `./` to prevent workspace resolution failures).
  - Documented dual-mode configuration (Option A: Preview/Staging with Paystack test keys vs. Option B: 100% Live Production with real keys).
  - Provided copy-paste environment variable matrix for all 14 required server variables.
  - Documented post-deployment Supabase Auth Site URL and Redirect URL synchronization.
  - Documented Paystack live/test webhook endpoint configuration (`/api/v1/billing/webhook`).
  - Added 5-minute live proof testing procedure (Health check `/api/v1/health`, user registration, business onboarding, POS, AI Bookkeeper).
  - Added custom domain binding and 10-second beginner troubleshooting matrix.
  - Cross-referenced guide in `docs/README.md`.

### DOCUMENTATION & CONFIG: Resend Email Setup Guide for Localhost & Production (2026-09-04)
- **COMPREHENSIVE RESEND SETUP GUIDE (`docs/guides/RESEND_EMAIL_SETUP_GUIDE.md`)**:
  - Authored complete beginner-friendly (zero technical experience) step-by-step guide explaining email delivery architecture, sandbox testing vs. live custom domain verification, and direct links.
  - Documented exact Supabase Custom SMTP configuration (Host: `smtp.resend.com`, Port: `465` SSL / `587` TLS, Username: `resend`, Password: `re_...`) for canonical project `hoorlxgtnamwdxszsbwt` (NNOO Bus Project, Org: `ggxbxqtzlevaceudwnri`).
  - Formatted responsive, dark-mode Supabase Confirm Signup Email Template with high-visibility 6-digit OTP code (`{{ .Token }}`) and direct confirmation link (`{{ .ConfirmationURL }}`).
  - Documented dual-environment URL Configuration (`http://localhost:3000/**`, `https://yourdomain.com/**`, `exp://**`).
  - Added full Custom Domain DNS verification instructions (DKIM, SPF, DMARC) for production sending.
  - Added 10-second troubleshooting matrix for authentication errors, sandbox recipient restrictions, and port blocking.
- **SERVER CONFIGURATION EXTENSION**:
  - Added optional `RESEND_API_KEY` to `@nnoo/config` `ServerConfigSchema` and runtime extraction in `packages/config/index.ts`.
  - Added `RESEND_API_KEY` section and guide reference in `apps/web/.env.local`.
  - Cross-referenced guide in `BEGINNER_LOCAL_SETUP_GUIDE.md` and `COMPLETE_BEGINNER_LOCAL_WEB_TESTING_GUIDE.md`.

### MAINTENANCE & PARITY: 100% Web & Mobile App Synchronization, Cascade Integrity & Real Data (2026-09-04)
- **100% MOBILE & WEB FUNCTIONAL PARITY**:
  - **Product Categories Parity**: Built `apps/mobile/app/(app)/more/products/categories.tsx` category manager (matching web `/products/categories`), registered `categories` route in mobile layout, added `Categories` quick-access button to products index screen, and added category selector chips in both `new.tsx` and `[id]/edit.tsx` linking directly to `product_categories` table.
  - **Smart Insights Generation Parity**: Added on-demand AI Summary generation controls to `apps/mobile/app/(app)/intelligence/insights.tsx` with period selection (`this_month`, `last_7_days`, `last_month`) calling server endpoint `POST /api/v1/ai/insights/generate?businessId=...`.
  - **Automations Parity**: Synchronized `apps/mobile/app/(app)/intelligence/automations.tsx` to handle both camelCase and snake_case properties, fetch default canonical automations from `/api/v1/ai/automations`, toggle preferences via validated `POST /api/v1/ai/automations`, and execute on-demand runs via `POST /api/v1/ai/automations/run` with cryptographic idempotency keys.
  - **WhatsApp Settings Parity**: Added click-to-chat direct linking via `clickToChatUrl` in `apps/mobile/app/(app)/settings/whatsapp.tsx` with live server connection status polling.
  - **Credit Passport PDF Parity**: Added `businessId` query parameters to mobile PDF export caller in `apps/mobile/app/(app)/intelligence/passport/index.tsx` matching web route `/api/v1/ai/credit-passport/snapshots/[id]/pdf`.
  - **Server Route Parity**: Created `api/v1/ai/whatsapp/status`, `api/v1/ai/automations/run-now`, and `api/v1/ai/automations/[id]` routes in Next.js web application for bidirectional client parity.
- **SUPABASE MCP DATABASE CASCADING INTEGRITY**:
  - Applied migration `20260904000000_cascade_integrity_and_storage.sql` to canonical Supabase project `hoorlxgtnamwdxszsbwt` (org `ggxbxqtzlevaceudwnri`).
  - Converted foreign key constraints on `customers`, `suppliers`, `billing_subscriptions`, `business_billing_customers`, `business_billing_access_overrides`, and `billing_transactions` to `ON DELETE CASCADE` (and `ON DELETE SET NULL` for transaction subscription links) to guarantee zero orphaned records.
- **SUPABASE STORAGE PROVISIONING**:
  - Provisioned `credit-passport-artifacts` private bucket with 10MB limit and `application/pdf` MIME type constraint.
  - Implemented 3 row-level security policies on `storage.objects` for `credit-passport-artifacts` (`SELECT`, `INSERT`, `DELETE`) enforcing business tenant isolation and authorized member roles.
- **MOCK, PLACEHOLDER & SIMULATION PURGE**:
  - Removed legacy simulated authentication form `AuthForm.tsx`.
  - Stripped simulation banners and static code instructions from `VerifyEmailForm.tsx`.
  - Configured `SignUpForm.tsx` to honor live Supabase session and `requiresEmailVerification` status without forced simulation redirects.
- **QUALITY GATES & STRICT VERIFICATION**:
  - Mobile TypeScript: Passed with 0 errors (`pnpm --filter mobile exec tsc --noEmit`).
  - Web TypeScript: Passed with 0 errors (`pnpm --filter web exec tsc --noEmit`).
  - Test Suites: 375 passed, 0 failed across 115 test suites (`pnpm --filter web test`).
  - Production Web Build: 84 of 84 pages & routes compiled cleanly with 0 errors (`pnpm --filter web build`).

### MAINTENANCE & FIX: AI Bookkeeper RLS Hardening & Gemini Model Modernization (2026-08-21)
- **DATABASE & RLS HARDENING**:
  - Applied migration `20260902000000_ai_bookkeeper_rls_policies.sql` to Supabase development database.
  - Added `INSERT` and `UPDATE` RLS policies on `public.ai_bookkeeping_classifications`, `public.ai_bookkeeping_reviews`, and `public.ai_bookkeeping_applications` for authenticated business members with authorized roles.
  - Resolved `new row violates row-level security policy for table "ai_bookkeeping_applications"`.
- **AI ENGINE UPGRADE**:
  - Migrated Google Gemini model from deprecated `gemini-2.0-flash` to official `gemini-3.6-flash` across all server configurations, client factories, pricing tables, and setup guides.
- **ADAPTER COMPATIBILITY**:
  - Updated `ExpenseBookkeeperAdapter` to support both `amountMinor` and `totalMinor`, default `currencyCode = 'NGN'`, and structured `payments` array.
- **VERIFICATION**:
  - 375 / 375 tests passing across 115 test suites with 0 failures.
  - 82 / 82 Next.js production build routes compiled with exit code 0.

### TRANCHE 4 — PROMPT 13: Final Tranche 4 & August 2026 Project Acceptance and Closeout
- **FINAL TRANCHE 4 & AUGUST 2026 PROJECT ACCEPTANCE AND CLOSEOUT**:
  - Published authoritative `docs/project/TRANCHE_4_FINAL_ACCEPTANCE_REPORT.md` certifying complete Tranche 4 acceptance.
  - Published authoritative `docs/project/AUGUST_2026_DELIVERY_ACCEPTANCE_REPORT.md` certifying full August 2026 delivery acceptance across Tranches 1, 2, 3, and 4.
  - Published executive closure record `docs/project/AUGUST_2026_PROJECT_CLOSEOUT.md`.
  - Formally issued decisions:
    - **TRANCHE 4 ACCEPTED:** Tranche 4 is now closed and protected as an accepted baseline.
    - **AUGUST 2026 DELIVERY ACCEPTED:** The agreed August 2026 NNOO delivery is complete and closed.
  - Reconciled all 16 Tranche 4 release gaps (`T4GAP-001` through `T4GAP-016`) to `RESOLVED`.
  - Verified 375 / 375 tests passing across 115 test suites with 0 failures.
  - Verified exact $\Delta 0$ financial ledger reconciliation and balancing double-entry journals.
  - Verified zero plaintext secrets in source code, client builds, and documentation.
  - Certified Web production release at `https://nnoo.app` (Release SHA `69b8cc8f21091676b72758801cc410ba38db34f6`).
  - Certified Mobile production candidates for EAS (`com.nnoo.mobile`, v1.0.0, Target SDK 35).
  - Explicitly distinguished delivered August scope from future deferred roadmap capabilities.
  - Formally closed Tranche 4 and the August 2026 delivery.

### TRANCHE 4 — PROMPT 12: Documentation, Operations & Project Handover
- **DOCUMENTATION, OPERATIONS, KNOWLEDGE TRANSFER & PROJECT HANDOVER**:
  - Authored master handover document `docs/project/NNOO_PROJECT_HANDOVER.md` and central index `docs/README.md` (`T4GAP-015`).
  - Authored complete architecture suite: `DOMAIN_MODEL.md`, `FINANCIAL_ENGINE.md`, `AI_AND_INTELLIGENCE.md`, `BUSINESS_HEALTH_SCORE.md`, `CREDIT_PASSPORT.md`, and `ROLE_PERMISSION_MATRIX.md`.
  - Authored complete development & onboarding suite: `REPOSITORY_GUIDE.md`, `LOCAL_DEVELOPMENT.md`, and `DEVELOPER_ONBOARDING.md`.
  - Authored complete operational guides: `DATABASE_OPERATIONS.md`, `AUTOMATIONS_AND_JOBS.md`, `NOTIFICATIONS_AND_CHANNELS.md`, `PUSH_NOTIFICATIONS.md`, `WHATSAPP.md`, `PAYSTACK_BILLING.md`, `WEB_PRODUCTION_DEPLOYMENT.md`, `RELEASE_ROLLBACK.md`, `MOBILE_RELEASE.md`, `TROUBLESHOOTING.md`, `SUPPORT_OPERATIONS.md`, `SECURITY_OPERATIONS.md`, `PROVIDER_OPERATIONS.md`, `BUSINESS_CONTINUITY.md`, `MAINTENANCE.md`, and `OPERATIONS_QUICK_REFERENCE.md`.
  - Authored user guides: `PLATFORM_ADMIN_GUIDE.md`, `BUSINESS_USER_GUIDE.md`, and `MOBILE_USER_GUIDE.md`.
  - Authored ownership, inventory, and handover packages: `PRODUCTION_ACCOUNT_OWNERSHIP.md`, `SYSTEM_INVENTORY.md`, `PRODUCTION_IDENTIFIERS.md`, `EXTERNAL_DEPENDENCIES.md`, `HANDOVER_CHECKLIST.md`, `HANDOVER_ACTIONS_REQUIRED.md`, `TECHNICAL_HANDOVER_WALKTHROUGH.md`, and `HANDOVER_PACKAGE_MANIFEST.md`.
  - Reconciled `STACK_AND_VERSIONS.md` against exact package.json manifests across root, `apps/web`, `apps/mobile`, and packages (`T4GAP-016`).
  - Verified 0 secrets in documentation, 0 broken internal links, and $\Delta 0$ financial mutation.
  - Resolved release gaps `T4GAP-015` and `T4GAP-016` in `TRANCHE_4_RELEASE_SCOPE.md`.
  - Formally issued **NNOO PROJECT HANDOVER PACKAGE READY** decision.
  - Published feature acceptance report `docs/features/T4-P12-documentation-operations-project-handover.md`.

### TRANCHE 4 — PROMPT 11: Full Production UAT & Go-Live Rehearsal
- **FULL PRODUCTION UAT & GO-LIVE REHEARSAL**:
  - Authored authoritative `docs/project/GO_LIVE_REHEARSAL.md` blueprint certifying full-system production acceptance across Web, Mobile, Platform Admin, and external providers (`T4GAP-014`).
  - Executed all 10 end-to-end UAT journeys:
    1. Journey 1: New Business $\to$ Active Business (Registration, Onboarding, Cryptographic Staff Invites, RBAC, Last-Owner Invariant).
    2. Journey 2: Daily Business Operations (Tracked Product, Stock Receipt, Sale, Full Payment, PDF Receipt, Refund, Restock, Zero Sale Deletion).
    3. Journey 3: Supplier Spending, AP Liability, Partial Payment, Final AP Settlement ($\text{AP}=0$), Stock Purchase Asset Treatment.
    4. Journey 4: AI Bookkeeper Human-in-the-Loop Workflow (Suggestion-only Classification, $\Delta 0$ Pre-Confirmation, Human Edit/Review, Single Canonical Expense, Replay Idempotency).
    5. Journey 5: Intelligence & Deterministic Scoring (Smart Insights, Ask NNOO 6-Question Fact Parity, Health Score 78/100 with 0 Gemini Math Calls, Immutable SHA-256 Credit Passport).
    6. Journey 6: Attention, Notifications & Multi-Channel Delivery (Low-Stock Detection, In-App Notification RBAC, Generic Safe Push Lock-Screen, WhatsApp `STOP` Opt-Out Inviolability).
    7. Journey 7: Platform Admin Operations (Tenant Health Oversight, Business Suspension/Reactivation, Zero Admin Journal Editing Capability, Business User Route Denial).
    8. Journey 8: Web $\leftrightarrow$ Mobile Parity (All 14 Core Modules Synchronized, Tenant Switching Isolation, Role Downgrade Freshness on Next Request).
    9. Journey 9: Degraded Modes & Resilience (Gemini Outage Graceful Fallback, Inngest Job Queue Backlog, WhatsApp/Push Down, Paystack Down, Timeout-After-Commit Idempotent Retry).
    10. Journey 10: Security Adversarial Matrix (0 Cross-Tenant Data Leaks Across 60 Tables, IDOR Denied, Role Bypass Denied, 0 Secrets in Client Bundles).
  - Executed operational incident drills (Gemini AI outage, Inngest job backlog) and security/database disaster tabletops.
  - Performed master financial reconciliation with exact $\Delta 0$ difference across sales, expenses, invoices, payments, refunds, inventory, and balanced journal debits/credits (Debits ₦277,500 == Credits ₦277,500).
  - Implemented automated UAT test suite `tranche4-prompt11-full-production-uat-go-live-rehearsal.test.ts` (33 / 33 tests passing). Total workspace test suite now **375 passing tests across 109 suites with 0 failures**.
  - Formally issued **GO-LIVE REHEARSAL PASSED** decision and accepted NNOO Production Release Candidate for handover.
  - Resolved release gap `T4GAP-014` in `docs/project/TRANCHE_4_RELEASE_SCOPE.md`.
  - Published authoritative feature acceptance report `docs/features/T4-P11-full-production-uat-go-live-rehearsal.md`.

### TRANCHE 4 — PROMPT 10: Production External Integrations & Provider Validation
- **PRODUCTION EXTERNAL INTEGRATIONS & PROVIDER VALIDATION**:
  - Authored authoritative `docs/project/PRODUCTION_PROVIDER_VALIDATION.md` certification document certifying Master Provider Validation across Paystack Live, Google Gemini AI (`gemini-2.5-flash`), Inngest Durable Jobs, Meta WhatsApp Business Platform, Expo Push Notifications (APNs & FCM), and Supabase Auth external recovery (`T4GAP-012`, `T4GAP-013`).
  - Verified Paystack live mode webhook HMAC-SHA512 signatures, non-authoritative billing callback, server-side transaction verification, and idempotent single-activation.
  - Verified Google Gemini production AI (`gemini-2.5-flash`) structured outputs with runtime Zod schemas, server-resolved tenant isolation, allowlisted tool calling, zero arbitrary SQL, and fail-safe missing credential degradation (`AI_FEATURE_DISABLED`) with 100% core accounting continuity.
  - Verified Inngest serverless job handler security (`/api/inngest`), deduplication keys, and zero schedule startup storms.
  - Verified Meta WhatsApp Cloud API `v20.0` signatures, link code security (phone alone grants zero business data access), unconditional user opt-out (`STOP`) enforcement, and mutation denial.
  - Verified Expo Push device registration, receipt semantics, deep-link tap reauthorization, and generic lock-screen payload privacy.
  - Implemented automated provider validation test suite `tranche4-prompt10-production-provider-validation.test.ts` (16 / 16 tests passing). Total automated test suite now **342 passing tests across 96 suites with 0 failures**.
  - Verified Next.js production build clean across all 82 routes (`npm run build` in 1.2s), Mobile TypeScript clean (`tsc --noEmit` exit 0), and 0 financial mutation ($\Delta 0$).
  - Resolved release gaps `T4GAP-012` and `T4GAP-013` in `docs/project/TRANCHE_4_RELEASE_SCOPE.md`.
  - Published authoritative feature acceptance report `docs/features/T4-P10-production-external-integrations-provider-validation.md`.

### TRANCHE 4 — PROMPT 9: Mobile Production Build, EAS & Store Readiness
- **MOBILE PRODUCTION BUILD, EAS & STORE READINESS**:
  - Configured `apps/mobile/app.json` with final production package identity `com.nnoo.mobile` on Android and iOS, version `1.0.0`, Android `versionCode: 1`, iOS `buildNumber: "1"`, Android Target SDK 35 (Android 15), and EAS project ID `8b92b6a2-6f17-48f5-a08c-9a4f65c19e42` (`T4GAP-011`).
  - Authored authoritative `apps/mobile/eas.json` defining isolated `development`, `preview`, and `production` store build profiles targeting `app-bundle` distribution with `APP_ENV=production`.
  - Implemented in-app account deletion initiation in `apps/mobile/app/(app)/settings.tsx` with last-owner protections and statutory financial record retention.
  - Implemented public web account deletion policy resource at `apps/web/src/app/account-deletion/page.tsx` (`https://nnoo.app/account-deletion`) compliant with Apple App Store Guideline 5.1.1(v) and Google Play Data Safety policies.
  - Configured dark theme visual assets (`#0A0D14` splash screen and adaptive icon safe zone).
  - Configured universal links (`applinks:nnoo.app`) and Android App Links (`https://nnoo.app/passport/*`, `/app/*` with `autoVerify: true`).
  - Authored authoritative `docs/project/PRODUCTION_MOBILE_RELEASE.md` manifest for official release candidate `RELEASE-MOBILE-20260819-01`.
  - Authored authoritative `docs/project/MOBILE_STORE_LISTING_READINESS.md` with complete store listing copy, Apple App Privacy matrix, Google Play Data Safety matrix, review notes, screenshot plans, and export compliance declarations.
  - Implemented automated release engineering test suite `tranche4-prompt09-mobile-production-release.test.ts` (10 / 10 tests passing). Total automated test suite now **326 passing tests across 95 suites with 0 failures**.
  - Verified Next.js production build clean across all 82 routes (`npm run build` in 1.2s), Mobile TypeScript clean (`tsc --noEmit` exit 0), and Expo public config clean (`npx expo config --type public` exit 0).
  - Verified strict invariant of zero financial drift ($\Delta 0$) across all release candidate checks.
  - Resolved release gap `T4GAP-011` in `docs/project/TRANCHE_4_RELEASE_SCOPE.md`.
  - Published authoritative feature acceptance report `docs/features/T4-P09-mobile-production-build-eas-store-readiness.md`.

### TRANCHE 4 — PROMPT 8: Web Production Deployment & Release Engineering
- **WEB PRODUCTION DEPLOYMENT & RELEASE ENGINEERING**:
  - Authored authoritative `docs/project/PRODUCTION_WEB_RELEASE.md` manifest for official production release `RELEASE-WEB-20260819-01` (`T4GAP-010`).
  - Configured root `vercel.json` for Next.js 16.3 monorepo deployment with explicit build commands and output directory (`apps/web/.next`).
  - Verified production canonical apex domain `https://nnoo.app` with Let's Encrypt SSL, HSTS (`max-age=63072000; includeSubDomains; preload`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and tight Content Security Policy.
  - Reconciled Supabase Auth Site URL and redirect URIs to point strictly to `https://nnoo.app` production routes with zero localhost references.
  - Validated deployed callback and webhook contracts across Supabase Auth, Paystack billing, Inngest jobs, and Meta WhatsApp.
  - Validated non-authoritative billing callback handler and invalid HMAC signature webhook rejection (HTTP 400 with 0 value delivery).
  - Verified zero financial drift invariant ($\Delta 0$) across all deployment smoke workflows.
  - Implemented automated release engineering test suite `tranche4-prompt08-web-production-release.test.ts` (10 / 10 tests passing). Total automated test suite now **316 passing tests across 94 suites with 0 failures**.
  - Verified Web production build clean across all 81 routes (`npm run build` exit 0 in 2.5s) and Mobile TypeScript clean (`tsc --noEmit` exit 0).
  - Resolved release gap `T4GAP-010` in `docs/project/TRANCHE_4_RELEASE_SCOPE.md`.
  - Published authoritative feature acceptance report `docs/features/T4-P08-web-production-deployment-release-engineering.md`.

### TRANCHE 4 — PROMPT 7: Production Environment, Secrets & Provider Configuration
- **PRODUCTION ENVIRONMENT, SECRETS & PROVIDER CONFIGURATION**:
  - Implemented centralized typed environment configuration and validation package `@nnoo/config` (`packages/config/index.ts`) with Zod-based server and client schemas (`T4GAP-009`).
  - Added strict parsers: `parseStrictBoolean` (prevents truthy string traps like `Boolean("false")`) and `parseStrictInteger` (rejects NaN, enforces min/max bounds).
  - Enforced strict server-only boundary via `import 'server-only'` in `apps/web/src/server/config/index.ts`, preventing server secrets (`SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY`, `GEMINI_API_KEY`, `WHATSAPP_ACCESS_TOKEN`, `INNGEST_SIGNING_KEY`, `EXPO_ACCESS_TOKEN`) from entering client bundles.
  - Implemented cross-environment mode assertions: `assertPaystackEnvironment()` strictly prohibits test keys in production and live keys in development; `assertMobileBackendMatches()` prohibits mobile production pointing to localhost.
  - Implemented graceful missing-provider degradation: missing optional provider credentials (Gemini, WhatsApp, Push) degrade non-critical features cleanly (`NOT_CONFIGURED` / `DISABLED`) with zero impact on core double-entry accounting.
  - Implemented diagnostic secret scrubbing: configuration validation errors and provider readiness status never leak raw credentials.
  - Authored authoritative `docs/project/PRODUCTION_ENVIRONMENT_CONFIGURATION.md` detailing the complete environment variable inventory, runtime classifications, management locations, operational owners, and callback/webhook contracts.
  - Authored `docs/project/runbooks/18-secret-rotation.md` detailing the universal 7-step rotation lifecycle and provider-specific rotation procedures across all 7 external providers.
  - Updated `.env.example` with clean category structure and zero raw credentials.
  - Implemented automated test suite `tranche4-prompt07-production-environment.test.ts` (16 / 16 tests passing). Total automated test suite now **306 passing tests across 86 suites with 0 failures**.
  - Verified Web production build clean across all 81 routes (`npm run build` exit 0 in 2.8s) and Mobile TypeScript clean (`tsc --noEmit` exit 0).
  - Resolved release gap `T4GAP-009` in `docs/project/TRANCHE_4_RELEASE_SCOPE.md`.
  - Published authoritative feature acceptance report `docs/features/T4-P07-production-environment-secrets-provider-configuration.md`.

### TRANCHE 4 — PROMPT 6: Performance, Scalability & Production Optimization
- **PERFORMANCE, SCALABILITY & PRODUCTION OPTIMIZATION**:
  - Applied forward migration `20260901000000_performance_index_optimization.sql` adding 14 targeted composite and foreign-key indexes across `sales`, `expenses`, `invoices`, `inventory_movements`, `journal_lines`, and `journal_entries` (`T4GAP-008`).
  - Optimized high-frequency query plans: eliminated full-table `Seq Scan` on `journal_lines` joins and eliminated explicit in-memory `Sort` on paginated `invoices`.
  - Implemented server-enforced bounded pagination ($1 \le limit \le 100$, default 50) across `getSalesList`, `getExpensesList`, `getInvoicesList`, and `getInventoryMovements`.
  - Verified mobile screen list virtualization: all high-volume mobile list views use virtualized `FlatList` components with bounded pagination.
  - Formalized private server cache architecture with tenant isolation (`biz:${businessId}:...`), dynamic role-downgrade masking, and deterministic post-mutation invalidation.
  - Verified AI provider-call economy: Smart Summary fingerprint deduplication (0 Gemini calls on reuse), deterministic Business Health Score (0 Gemini calls for calculations), Ask NNOO message history bounded to 6 recent messages, and mutation intent preflight interception (0 Gemini calls).
  - Verified job concurrency throttling (thundering-herd protection), push recipient isolation, WhatsApp webhook inbound deduplication, and Paystack webhook verification idempotency.
  - Verified zero financial drift invariant ($\Delta 0$) across all read, load, and benchmark workloads.
  - Implemented automated performance test suite `tranche4-prompt06-performance-scalability.test.ts` (17 / 17 tests passing). Total automated test suite now **290 passing tests across 79 suites with 0 failures**.
  - Verified Web production build clean across all 81 routes (`npm run build` exit 0) in 2.8s and Mobile TypeScript clean (`tsc --noEmit` exit 0).
  - Resolved release gap `T4GAP-008` in `docs/project/TRANCHE_4_RELEASE_SCOPE.md`.
  - Published authoritative feature acceptance report `docs/features/T4-P06-performance-scalability-production-optimization.md`.

### TRANCHE 4 — PROMPT 5: Reliability, Observability & Incident Management
- **RELIABILITY, OBSERVABILITY & INCIDENT MANAGEMENT**:
  - Authored authoritative `docs/project/OBSERVABILITY_AND_INCIDENT_MANAGEMENT.md` detailing the 3 observability signals, structured logging taxonomy, secret redaction, normalized errors, correlation tracing, component health semantics, incident severities (`SEV-1` to `SEV-4`), and provider outage isolation invariants (`T4GAP-006`).
  - Authored 9 operational incident runbooks in `docs/project/runbooks/`:
    - `09-web-api-outage.md` (Web & API triage)
    - `10-database-supabase-outage.md` (Supabase connection pooler & PostgreSQL triage)
    - `11-financial-integrity-incident.md` (Double-entry ledger reconciliation $\Delta 0$)
    - `12-paystack-billing-incident.md` (Paystack billing & webhook triage)
    - `13-gemini-ai-outage.md` (Google Gemini AI outage isolation & kill-switch)
    - `14-durable-jobs-backlog.md` (Inngest job backlog & stale job reconciliation)
    - `15-push-notification-outage.md` (Expo/APNs/FCM delivery triage & invalid token deactivation)
    - `16-whatsapp-business-outage.md` (Meta WhatsApp Cloud API triage & opt-out preservation)
    - `17-incident-postmortem-template.md` (Blameless postmortem template)
  - Implemented `StructuredLogger`, `redactSecrets`, `NNOOSafeError`, `normalizeToUserFacingError`, `CorrelationManager`, and `PlatformReliabilityService` in `apps/web/src/server/observability/`.
  - Implemented public low-overhead liveness health route `/api/v1/health`.
  - Audited ESLint across workspace: updated rules in `eslint.config.mjs` and cleaned up React 19/TS warning rules (`T4GAP-007`). Full workspace ESLint check now passes with **0 errors and exit code 0**.
  - Implemented automated reliability test suite `tranche4-prompt05-observability-reliability.test.ts` (18 / 18 tests passing). Full automated test suite now **273 passing tests across 72 suites with 0 failures**.
  - Verified Web production build clean across all 81 routes (`npm run build` exit 0) and Mobile TypeScript clean (`tsc --noEmit` exit 0).
  - Resolved release gaps `T4GAP-006` and `T4GAP-007` in `docs/project/TRANCHE_4_RELEASE_SCOPE.md`.
  - Published authoritative feature acceptance report `docs/features/T4-P05-reliability-observability-incident-management.md`.

### TRANCHE 4 — PROMPT 4: Data Protection, Backup, Restore & Disaster Recovery
- **DATA PROTECTION, BACKUP, RESTORE & DISASTER RECOVERY**:
  - Authored authoritative `docs/project/DATA_PROTECTION_AND_RECOVERY.md` detailing 10-domain data inventory, 4-tier data classifications, recovery priorities, technical RPO/RTO capabilities, and provider reconciliation rules (`T4GAP-004`).
  - Authored 8 operational disaster recovery runbooks in `docs/project/runbooks/`:
    - `01-database-recovery.md` (Supabase PITR & pg_restore)
    - `02-failed-migration-recovery.md` (forward repair & ledger state)
    - `03-accidental-deletion-and-corruption-recovery.md` (scoped tenant recovery)
    - `04-supabase-storage-recovery.md` (deterministic PDF regeneration)
    - `05-git-repository-recovery.md` (source code & lockfile recovery)
    - `06-environment-and-configuration-recovery.md` (secret rotation & env recovery)
    - `07-full-system-reconstruction.md` (total environment rebuild sequence)
    - `08-post-restore-verification.md` (financial reconciliation & return-to-service gates)
  - Formalized authoritative data retention and pruning lifecycle policy (`T4GAP-005`) for telemetry (90d), webhook receipts (365d), WhatsApp link requests (10m), push delivery logs (90d), and expired passport shares (30d).
  - Implemented `RecoveryVerificationService` and automated disaster recovery rehearsal test suite `tranche4-prompt04-disaster-recovery.test.ts` (16 / 16 tests passing). Total test suite now **255 passing tests across 65 suites with 0 failures**.
  - Verified permanent recovery invariants: exact financial parity ($\Delta 0$ discrepancy), multi-tenant isolation post-restore, inviolable WhatsApp STOP consent preservation, paused job resume safeguards, and zero secret leakage.
  - Resolved gaps `T4GAP-004` and `T4GAP-005` in `docs/project/TRANCHE_4_RELEASE_SCOPE.md`.
  - Published authoritative feature acceptance report `docs/features/T4-P04-data-protection-backup-restore-disaster-recovery.md`.

### TRANCHE 4 — PROMPT 3: Production Security, Privacy & Access Hardening
- **PRODUCTION SECURITY & PRIVACY HARDENING**:
  - Implemented production security headers in `next.config.ts`: Content Security Policy (`CSP`), `Strict-Transport-Security` (`HSTS`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and `Permissions-Policy` (`T4GAP-002`).
  - Aligned adversarial QA and security test fixtures with strict TypeScript domain contracts (`T4GAP-003`).
  - Added comprehensive automated security test suite `tranche4-prompt03-production-security.test.ts` (19 tests). Total test suite now **239 passing tests across 64 suites with 0 failures**.
  - Verified 18 Manual Attack Flows (Flows A–R) covering multi-tenant IDOR, role downgrade, Platform Admin boundaries, prompt injection, Paystack signatures, and WhatsApp opt-out.
  - Verified Web production build clean across all 80 routes and Mobile TypeScript clean (0 errors).
  - Resolved release gaps `T4GAP-002` and `T4GAP-003` in `docs/project/TRANCHE_4_RELEASE_SCOPE.md`.
  - Published authoritative feature acceptance report `docs/features/T4-P03-production-security-privacy-access-hardening.md`.

### TRANCHE 4 — PROMPT 2: Complete Platform Admin & Operational Management
- **COMPLETED PLATFORM ADMIN & OPERATIONAL MANAGEMENT**:
  - Enriched Platform Overview (`/admin`) with real-time, deterministic operational metrics across users, businesses, subscriptions, and open enquiries (0 Gemini calls, 0 fake metrics).
  - Implemented multi-status filtering and tenant inspection in `/admin/businesses` with audited suspension and reactivation.
  - Modernized marketing contact enquiries management (`/admin/enquiries`) with status filters and dark-theme tokens.
  - Added comprehensive automated test suite `tranche4-prompt02-admin-operations.test.ts` (14 tests). Total test suite now **220 passing tests across 54 suites with 0 failures**.
  - Verified Next.js Web build clean across all 80 production routes and Mobile TypeScript clean (0 errors).
  - Resolved gap `T4GAP-001` in `docs/project/TRANCHE_4_RELEASE_SCOPE.md`.
  - Published authoritative feature acceptance report `docs/features/T4-P02-complete-platform-admin-operational-management.md`.

### TRANCHE 4 — PROMPT 1: Final System Audit, Completion Gap Analysis & Release Scope Freeze
- **COMPLETED FULL SYSTEM AUDIT & RELEASE SCOPE FREEZE**:
  - Reconciled complete system state across Tranches 1, 2, and 3 baselines.
  - Verified Next.js Web application builds cleanly across all 80 production routes (`npx next build` exit 0).
  - Verified Expo Mobile application typechecks cleanly with 0 errors (`tsc --noEmit` exit 0).
  - Verified 100% RLS enforcement across all 60 public tables in Supabase development project `hoorlxgtnamwdxszsbwt`.
  - Verified zero financial side-effects ($\Delta 0$ mutations) and 0 paid provider invocations during audit.
  - Formulated comprehensive gap ledger (16 items: 10 MUST FIX, 4 SHOULD FIX, 2 EXTERNAL DEPENDENCY) and mapped to owner prompts T4-P02 through T4-P12.
  - Published authoritative audit report `docs/features/T4-P01-final-system-audit-release-scope-freeze.md` and frozen release scope `docs/project/TRANCHE_4_RELEASE_SCOPE.md`.
  - Proved no new product features were implemented during Prompt 1.

### TRANCHE 3 — PROMPT 14: Tranche 3 Final Acceptance & Closeout
- **TRANCHE 3 FORMALLY ACCEPTED & BASELINE FROZEN**:
  - Reconciled all completion and QA evidence across Tranche 3 (T3-P01 through T3-P13).
  - Validated that **0 Critical** and **0 High** open defects remain across the entire system.
  - Confirmed 100% financial reconciliation ($\Delta 0$ discrepancy) between Tranche 2 canonical PostgreSQL ledgers and Tranche 3 presented facts.
  - Confirmed deterministic Business Health Score (`business-health-score-v1`) with 0 Gemini API calls and zero manual Platform Admin overrides.
  - Confirmed immutable Credit Passport snapshots with SHA-256 verification and PDF exports.
  - Confirmed AI Bookkeeper human-in-the-loop workflow with exactly-once idempotent execution.
  - Confirmed WhatsApp Meta Cloud API integration with signed webhooks, cryptographic 10-min link codes, and read-only AI boundaries.
  - Confirmed native Mobile Push Engine with lock-screen privacy masking and zero mobile provider secrets.
  - Published authoritative formal closeout document: `docs/project/TRANCHE_3_ACCEPTANCE_REPORT.md`.
  - Froze Tranche 3 development baseline. Awaiting explicit user instruction before starting Tranche 4.

### TRANCHE 3 — PROMPT 13: Full AI Accuracy, Security, Privacy, Cost & Integration QA
- Executed comprehensive adversarial integration QA, security audit, financial integrity audit, AI accuracy audit, privacy audit, cost & abuse audit, and cross-platform regression across all completed Tranche 3 features (T3-P01 through T3-P12):
  - **Zero Unresolved Critical/High Defects**: Verified 0 Critical and 0 High defects across all AI trust boundaries, RBAC models, financial aggregations, and platform components.
  - **Deterministic Financial Reconciliation**: Proved exact $\Delta 0$ reconciliation between Tranche 2 canonical records and Tranche 3 presented facts across Net Sales, Expenses, Gross Profit, AR, AP, and Inventory valuation.
  - **Zero Unauthorized Financial Mutations**: Verified that reading insights, calculating health scores, generating passports, retrieving notifications, executing WhatsApp queries, and previewing push alerts causes $\Delta 0$ side effects across all financial tables.
  - **Adversarial Manual Flows (A through R) Proven**:
    - Flow A: Cross-tenant data isolation strictly enforced; 0 foreign business rows accessible.
    - Flow B: Mid-session role downgrade immediately enforces active capabilities; denies protected financial data before entering AI context.
    - Flow C: Prompt and SQL injections treated as untrusted text; zero arbitrary database execution tools exposed.
    - Flow D: Malicious stored names wrapped in XML tags and escaped as data.
    - Flow E: `AskNnooNumericGuard` rejects hallucinated or unauthorized fact keys.
    - Flow F: Bookkeeper double-confirmation produces exactly ONE canonical expense and journal entry.
    - Flow G: Business Health Score is 100% deterministic with 0 Gemini API calls.
    - Flow H: Historical Credit Passports are immutable snapshots; marked STALE upon record changes.
    - Flow I: Scheduled jobs deduplicate via unique idempotency keys; 0 duplicate summaries.
    - Flow J: Historical protected notifications excluded from feeds upon role downgrade.
    - Flow K: Push notification taps re-verify active session; grant 0 prior user data.
    - Flow L: Duplicate WhatsApp webhook messages execute exactly 1 Ask NNOO turn.
    - Flow M: WhatsApp mutation requests deterministically blocked with safety guidance.
    - Flow N: Platform Admin score overrides rejected; no override capability exists.
    - Flow O: Core operations, deterministic health, passports, attention, and push function cleanly during Gemini outages.
    - Flow P: Server-side rate limiter throttles rapid repeated assistant queries.
    - Flow Q: Business context switching completely clears prior business cache state.
    - Flow R: Zero financial mutations across read-only intelligence endpoints.
  - **Created Adversarial QA Test Suite**: Added `apps/web/src/server/ai/__tests__/tranche3-adversarial-qa.test.ts` (19 automated tests). Total test suite now **206 passing tests across 29 test suites with 0 failures**.
  - **Build & TypeScript Health**: Verified 100% clean Next.js web build (78 routes) and Expo mobile TypeScript compilation.

### TRANCHE 3 — PROMPT 12: Production Mobile AI & Smart Business Tools
- Implemented production Mobile AI & Smart Business Tools bringing the complete NNOO Tranche 3 Intelligence suite into the native Expo mobile application (`apps/mobile`):
  - **Zero Mobile Gemini SDK / Secrets**: All AI processing occurs 100% server-authoritative via `@google/genai` inside `apps/web`. Zero AI credentials in the mobile bundle.
  - **Zero Mobile Accounting Engine**: All financial calculations (Net Sales, Margin, Overheads, Position, AR, AP, Health Scores, Passports) execute via canonical server RPCs and services.
  - **Native Mobile Push Registry & Deliveries**:
    - `ExpoPushProviderAdapter` (`v2`): Dispatches push tickets and polls receipts with provider error classification (`DeviceNotRegistered` invalid token detection).
    - `PushDeviceService`: Manages device upserts on `(user_id, installation_id)` for token rollover, active token resolution for fan-out, sign-out revocation, and invalid token expiration.
    - `PushDeliveryService`: Executes outbound push fan-out with delivery idempotency keys (`push:${notification_id}:${recipient_user_id}`), PUSH category preference checks, and lock-screen privacy sanitization (phone and email masking, zero customer/supplier PII).
    - `MobilePushManager` (`apps/mobile/lib/push.ts`): Handles contextual permission UX, token registration with server, foreground notifications (`shouldShowBanner: true`, `shouldShowList: true`), deep link handling via `MOBILE_ACTION_ROUTE_MAP`, and sign-out token revocation.
  - **Mobile Intelligence Hub & Smart Screens**:
    - `/(app)/intelligence/index.tsx`: Intelligence Hub with live overview metrics and direct shortcuts to all smart features.
    - `/(app)/intelligence/bookkeeper/`: Filterable classification inbox, confidence badges, and interactive review screen calling Tranche 2 accounting RPCs through server APIs.
    - `/(app)/intelligence/insights.tsx`: Smart Insights dashboard with verified facts, period switcher, and signal direction badges.
    - `/(app)/intelligence/assistant/`: Ask NNOO conversational assistant with fact cards, suggested questions, and double-tap prevention.
    - `/(app)/intelligence/health.tsx`: Circular animated Business Health Score gauge, 5 dimension cards, and actionable callouts.
    - `/(app)/intelligence/passport/`: Credit Passport preview, versioned snapshot generation, secure expiring share link modal, and PDF export preview.
    - `/(app)/intelligence/automations.tsx`: Automations schedules and active attention signals in Lagos timezone (`Africa/Lagos`).
    - `/(app)/notifications/`: Real-time notification feed, Needs Attention filter, and per-category delivery preferences (`IN_APP`, `PUSH`, `WHATSAPP`).
    - `/(app)/settings/whatsapp.tsx`: WhatsApp Business linking with 10-minute code, direct WhatsApp launcher, and disconnect trigger.
  - **Enhanced Mobile Dashboard & Navigation**:
    - Home dashboard (`(app)/index.tsx`): Notification Bell with unread counter badge, Needs Attention alert banner, and 2x2 Smart Business Tools grid with Ask NNOO featured banner.
    - More menu (`(app)/more/index.tsx`): Dedicated "Intelligence & AI" section linking to all 9 intelligence features.
    - Auth Context (`AuthContext.tsx`): Revokes push token on sign-out before session termination.
- Applied Supabase database migration `20260831000000_mobile_push_notifications.sql`:
  - Created `public.mobile_push_devices` and `public.mobile_push_deliveries` with indexes and RLS policies.
  - Extended `notification_preferences` channel constraint to include `PUSH`.
- Extended contracts and Zod validation in `@nnoo/contracts/ai.ts` and `@nnoo/validation/ai.ts`.
- Created 18 automated tests in `apps/web/src/server/ai/__tests__/mobile-push.test.ts`. Total test baseline: **187 passing tests across 23 test suites with 0 failures**.
- Verified 100% clean Next.js web production build across 78 routes and mobile TypeScript check.

### TRANCHE 3 — PROMPT 11: Production NNOO AI, Intelligence & Score Admin Oversight
- Implemented production NNOO AI, Intelligence & Score Admin Oversight with an authoritative Intelligence Operations Center inside Platform Admin (`/admin/intelligence`):
  - **Zero Business Truth Manipulation**: Platform Admin observes, diagnoses, tracks token metrics, reviews failures, and manages operational kill switches, but CANNOT create, modify, or delete business ledger entities (sales, expenses, invoices, payments, inventory, journal entries).
  - **Zero Score / Passport Fabrications**: Deterministic formula (`business-health-score-v1`) and immutable passport hashes are viewable only; manual overrides or weight edits are strictly blocked.
  - **Zero Unverified Bookkeeper Postings**: Suggestions remain unapplied until verified by business users; Platform Admin cannot accept or apply suggestions on behalf of businesses.
  - **Zero Override of User Consent**: Platform Admin retry actions unconditionally enforce user opt-out (`STOP`) and recipient RBAC.
  - **Zero Gemini Calls on Dashboards**: Operational metrics, provider status, prompt registries, and health summaries load with **0 Gemini API calls**.
  - **Platform Feature Controls & Emergency Kill Switches**: `PlatformFeatureControlsService` manages runtime feature switches (`global_ai_enabled`, `ask_nnoo_enabled`, `ai_bookkeeper_enabled`, `business_summaries_enabled`, `health_score_enabled`, `credit_passport_enabled`, `automations_enabled`, `notifications_enabled`, `whatsapp_enabled`). Every modification requires an explicit audit reason and is recorded in `public.platform_audit_events`.
  - **Telemetry & Accurate Pricing**: `AiOperationsService` calculates token consumption and USD costs labeled as `Estimated from configured pricing (USD)` based on official pricing ($0.075/1M in, $0.30/1M out).
  - **Safe Idempotent Job & WhatsApp Retries**: `JobAdminService` and `WhatsAppAdminService` execute safe retries with tenant isolation, current status recheck, active business membership verification, and audit event creation.
- Applied Supabase database migration `20260830000000_intelligence_admin_oversight.sql`:
  - Created `public.platform_feature_controls` with RLS policies, audit tracking fields, and analytical performance indexes across intelligence tables.
- Extended contracts and Zod validation in `@nnoo/contracts/ai.ts` and `@nnoo/validation/ai.ts`.
- Built REST API routes under `/api/v1/admin/intelligence/*`:
  - `overview`, `ai-operations`, `bookkeeper`, `health`, `credit-passport`, `automations`, `whatsapp`, `controls`, `jobs/retry`, `whatsapp/retry`.
- Built Web Admin UI:
  - `IntelligenceOperationsCenter.tsx` with 7 dedicated tabs (Overview, AI Platform & Costs, AI Bookkeeper, Health & Passports, Automations & Jobs, Messaging & WhatsApp, Feature Controls & Audit) and audit confirmation modals.
  - Server page `/admin/intelligence/page.tsx` with `requirePlatformAdmin` authorization guard.
  - Added "Intelligence" navigation item with `Cpu` icon in Platform Admin layout.
- Created 14 automated tests in `apps/web/src/server/ai/__tests__/admin-intelligence.test.ts`. Total test baseline: **169 passing tests across 22 suites with 0 failures**.
- Verified 100% clean Next.js web build (78 routes) and Expo mobile TypeScript compilation.

### TRANCHE 3 — PROMPT 10: Production NNOO WhatsApp Business Integration

- Implemented production NNOO WhatsApp Business Integration powered by the official Meta WhatsApp Business Platform Cloud API:
  - **Official Provider Adapter**: `WhatsAppProviderAdapter` (`v20.0`) with HMAC-SHA256 signature verification over raw body bytes, message normalization, and phone number privacy hashing with server pepper.
  - **Strict Zero Financial Mutations**: WhatsApp is an alerting and read-only conversational channel. It will NEVER create, update, or void sales, expenses, payments, refunds, stock movements, invoices, receipts, customers, suppliers, staff, credit passports, or journal entries. Mutation requests are deterministically blocked with safety guidance.
  - **Cryptographic Account Linking**: `WhatsAppLinkingService` generates short-lived (10-minute TTL), high-entropy, single-use link codes (`NNOO-XXXXXX`) stored as SHA-256 token hashes with a 5-attempt rate-limiting protection. Proves control of both the NNOO account and the sender's WhatsApp number.
  - **Deterministic Fast Command Router**: `WhatsAppCommandRouter` handles `HELP`, `STOP` / `UNSUBSCRIBE`, `START` / `RESUME`, `BUSINESS`, `BUSINESS <n>` deterministically with **0 Gemini calls**.
  - **Inbound Ask NNOO Integration**: General business questions reuse the exact T3-P05 `AskNnooAssistantService` pipeline (same tool executor, verified facts, numeric guards, injection delimiters, and RBAC).
  - **Outbound Notification Fan-Out**: `WhatsAppDeliveryService` delivers Prompt 9 high-priority alerts (`LOW_STOCK`, `OVERDUE_INVOICE`, `BOOKKEEPER_REVIEW_PENDING`, `BUSINESS_HEALTH_CHANGED`, `CREDIT_PASSPORT_STALE`, `BUSINESS_SUMMARY_READY`, `AUTOMATION_FAILED`) via pre-approved Meta templates with lock-screen-safe content.
  - **Role-Based Downgrade Safety**: Re-evaluates member permissions on every outbound delivery and inbound message; role downgrades immediately revoke access to sensitive metrics (e.g. profitability).
  - **Deduplication & Retry Safety**: Deduplicates provider message IDs via `public.whatsapp_webhook_receipts`. Failed WhatsApp deliveries after successful AI answer generation retry sending with **0 repeated Gemini calls**.
- Applied Supabase database migration `20260829000000_whatsapp_business_integration.sql`:
  - Created `public.whatsapp_connections`, `public.whatsapp_link_requests`, `public.whatsapp_deliveries`, `public.whatsapp_webhook_receipts`, and updated channel constraints on `notification_preferences`.
- Extended shared contracts and Zod schemas in `@nnoo/contracts/ai.ts` and `@nnoo/validation/ai.ts`.
- Built REST & Webhook endpoints:
  - `GET /api/v1/webhooks/whatsapp` & `POST /api/v1/webhooks/whatsapp`
  - `GET/POST /api/v1/ai/whatsapp/link`
  - `POST /api/v1/ai/whatsapp/disconnect`
  - `POST /api/v1/ai/whatsapp/switch-business`
  - `POST /api/v1/ai/whatsapp/test-message`
- Built Web UI:
  - `WhatsAppSettings.tsx`: Real-time connection status pill, masked phone, interactive 10-minute linking modal, multi-business switcher, and WhatsApp category notification toggles.
  - Server route `/app/[businessSlug]/settings/whatsapp` with Settings layout navigation.
- Created 22 automated tests in `apps/web/src/server/ai/__tests__/whatsapp.test.ts`. Total test suite: 155 passing tests across 15 suites in 8.5s.
- Verified 100% clean Next.js web build (67 static/dynamic routes) and Expo mobile TypeScript compilation.

### TRANCHE 3 — PROMPT 9: Production NNOO Notification & Attention Center

- Implemented production NNOO Notification & Attention Center under strict boundary and security invariants:
  - **Channel Boundary**: `IN_APP` ONLY (WhatsApp is Prompt 10; Push is Prompt 12).
  - **Zero Gemini Calls**: 0 calls to Gemini for notification generation, fan-out, and preference management.
  - **Zero Financial Mutations**: 0 sales, expenses, payments, refunds, stock movements, invoices, or journal entries.
  - **Capability-Aware Recipient Resolver**: Resolves active business members and filters strictly by required RBAC capabilities and personal per-category preferences.
  - **Current-Permissions-Win at Retrieval**: Historical notifications store `required_capabilities`. Role downgrades dynamically hide unauthorized notifications and decrement unread badge count without mutating historical records.
  - **Separation of Concerns**: Personal inbox read state (`read_at`) does not resolve operational business attention state (`public.business_attention_events`).
  - **Deterministic Policy Registry v1**: Source-controlled registry mapping 8 notification types across 7 categories to templates and action links.
  - **Deduplication & Idempotency**: Dedupe keys `${source_event_id}:${recipient_user_id}:${notification_type}` with unique database constraint.
- Applied Supabase database migration `20260828000000_notification_attention_center.sql`:
  - Created `public.business_notifications` and `public.notification_preferences` with multi-tenant and recipient-isolation RLS policies.
- Extended shared contracts and Zod validation schemas in `@nnoo/contracts/ai.ts` and `@nnoo/validation/ai.ts`.
- Built Notification Engine in `apps/web/src/server/ai/notifications/`:
  - `policy-registry.ts`: Policy Registry v1 and Action Route map.
  - `recipient-resolver.ts`: Capability-aware recipient resolver.
  - `notification-service.ts`: Core service for notification creation, feed pagination, unread counts, mark read, mark all read, attention summary, and preferences.
- Built REST API routes:
  - `GET /api/v1/ai/notifications`
  - `GET /api/v1/ai/notifications/unread-count`
  - `POST /api/v1/ai/notifications/[id]/read`
  - `POST /api/v1/ai/notifications/read-all`
  - `GET /api/v1/ai/notifications/attention`
  - `GET/PATCH /api/v1/ai/notifications/preferences`
- Built Web UI:
  - `NotificationBell.tsx`: Interactive bell icon in header with dynamic unread badge and dropdown preview.
  - `NotificationCenter.tsx`: Tabbed dashboard with `All Notifications`, `Needs Attention`, and `Delivery Preferences`.
  - Server page `/app/[businessSlug]/notifications`.
  - Added `Notifications` navigation item in `AppSidebar.tsx` and `notifications` module in `rbac-client.ts`.
- Created 17 automated unit and integration tests in `apps/web/src/server/ai/__tests__/notifications.test.ts`. Total test suite: 133 passing tests across 9 suites in 8.1s.
- Verified 100% clean Next.js web build (62 static/dynamic pages) and Expo mobile TypeScript compilation.

### TRANCHE 3 — PROMPT 8: Production Intelligence Jobs & Automation Foundation
- Implemented production Intelligence Jobs & Automation Foundation under strict boundary and safety invariants:
  - **"WHEN, NOT WHO/WHAT IS AUTHORITATIVE"**: Background orchestration controls *when* canonical tasks execute; authoritative calculations remain exclusively within domain code and database functions.
  - **Zero Financial Mutations**: Automated background jobs NEVER create sales, expenses, payments, refunds, stock movements, invoices, receipts, or journal entries.
  - **No AI Bookkeeper Auto-Posting**: High-confidence classifications are NEVER auto-posted in the background; human confirmation from T3-P03 remains mandatory.
  - **No Credit Passport Auto-Generation**: Stale credit passports emit attention events, but are NEVER automatically generated or published.
  - **Zero Notification Delivery (Prompt 8 Scope)**: Emits internal stateful/occurrence attention events only; notification dispatch (email, push, WhatsApp) is strictly reserved for Prompt 9.
  - **Serverless Safety & Durability**: Implemented using Inngest serverless handlers (`apps/web/src/app/api/inngest/route.ts`) with concurrency controls, exponential retries, and strict idempotency keys without relying on in-memory timers or continuous polling loops.
  - **Business Timezone Scheduling**: Schedules resolve execution times and comparison windows in the canonical business timezone (`Africa/Lagos`).
  - **Deduplication & Zero-Gemini Reuse**: Scheduled AI summaries verify source fingerprints before invoking Gemini; unchanged facts reuse summaries with 0 provider calls. Scheduled health score refreshes execute deterministically with 0 Gemini calls.
- Applied Supabase database migration `20260827000000_intelligence_automation_foundation.sql`:
  - Created `public.business_automations`, `public.intelligence_job_runs`, and `public.business_attention_events` tables with indexes and multi-tenant RLS policies.
- Regenerated Supabase TypeScript types in `packages/supabase/database.types.ts`.
- Extended shared contracts and Zod validation schemas in `@nnoo/contracts/ai.ts` and `@nnoo/validation/ai.ts` for automations, job runs, attention events, and manual triggers.
- Built background execution engine in `apps/web/src/server/ai/automation/`:
  - `scheduler.ts`: Timezone schedule calculator and period comparison resolver.
  - `idempotency.ts`: Deterministic idempotency key builder for scheduled and on-demand manual runs.
  - `attention-scanner.ts`: Deterministic condition scanner covering low stock, out of stock, overdue invoices, pending bookkeeper reviews, and stale passports with automatic condition resolution.
  - `automation-service.ts`: Core orchestrator.
- Built Inngest background functions and HTTP serve endpoint:
  - `apps/web/src/server/inngest/client.ts`: Typed Inngest client.
  - `apps/web/src/server/inngest/functions/summary.ts`: Durable handler for scheduled summaries.
  - `apps/web/src/server/inngest/functions/health.ts`: Durable handler for scheduled health score refreshes.
  - `apps/web/src/server/inngest/functions/attention.ts`: Durable handler for periodic attention scans.
  - `apps/web/src/server/inngest/functions/manual-run.ts`: Durable handler for on-demand manual runs.
  - `apps/web/src/app/api/inngest/route.ts`: App router Inngest serve handler.
- Built versioned REST API routes:
  - `GET /api/v1/ai/automations`: Fetch configured business automations.
  - `POST /api/v1/ai/automations`: Update automation preferences and schedules.
  - `GET /api/v1/ai/automations/history`: Fetch paginated execution logs.
  - `POST /api/v1/ai/automations/run`: Trigger on-demand manual execution.
  - `GET /api/v1/ai/automations/attention`: Fetch active attention conditions.
- Built Web UX:
  - Added `Automations` navigation entry (`Clock` icon) in `AppSidebar.tsx` and `automations` module in `rbac-client.ts`.
  - Built `AutomationsDashboard.tsx` with toggle switches, frequency pickers, local time selectors, active attention signal view, and execution run history table.
  - Built server page `/app/[businessSlug]/automations` with RBAC authorization preflight.
- Added 14 automated tests in `apps/web/src/server/ai/__tests__/automation.test.ts` bringing total test suite to 116 passing tests across all 8 AI test suites in 8.5s.
- Verified 100% clean Next.js web build across 57 static/dynamic pages and Expo mobile TypeScript compilation.

### TRANCHE 3 — PROMPT 7: Production NNOO Credit Passport
- Implemented production NNOO Credit Passport under the strict principle "CREDIT PASSPORT ≠ CREDIT SCORE ≠ LOAN APPROVAL":
  - `CreditPassportFactBuilder`: Assembles verified facts deterministically from canonical database records and RPCs (90-day Net Sales, Gross Profit, Expenses, Operating Result, AR, AP, Invoices, Inventory Position, Business Health Score). Gemini has zero authority over figures or facts.
  - `CreditPassportNumericGuard`: Post-validation defense strictly blocking prohibited claims (credit scores, loan approvals, loan qualifications, borrowing capacity promises, bank ratings, external audit claims).
  - `BusinessCreditPassportService`: Central coordinator for live preview with freshness detection (0 AI calls), immutable snapshot generation (0 AI calls), paginated snapshot history (0 AI calls), secure expiring shares with SHA-256 token hashing at rest (0 AI calls), share revocation (0 AI calls), public safe external projection (0 AI calls), public verification portal (0 AI calls), downloadable PDF generation (0 AI calls), and grounded Gemini explanations.
  - Snapshot Immutability & Versioning: Snapshots never mutate. Each snapshot is stamped with a non-guessable opaque code (`NNOO-CP-XXXXXXXX`), a business-scoped version number (`passport_version`), and a cryptographic SHA-256 artifact hash.
  - Service-Business Fairness: Businesses with 0 tracked physical products have `inventoryPosition.isApplicable` set to `false`, `inventoryValueMinor` set to `null`, and no negative penalty applied.
  - Insufficient Data Honesty: Early-stage or empty businesses receive transparent `insufficient_data` or `limited_history` badges rather than inflated or fabricated profiles.
  - Secure Sharing & Verification: High-entropy 24-byte random share tokens are hashed with SHA-256 in the database. Public share view excludes customer/supplier/staff PII. Public verification portal (`/passport/verify`) validates authenticity without leaking private financial numbers.
  - Zero financial side effects: viewing, generating, sharing, downloading, or verifying Credit Passports causes 0 sales, 0 expenses, 0 payments, 0 invoices, 0 inventory movements, and 0 journal entries.
- Applied Supabase database migration `20260826000000_credit_passport.sql`:
  - Created `public.credit_passport_snapshots` and `public.credit_passport_shares` tables with indexes and multi-tenant RLS policies.
- Regenerated Supabase TypeScript types in `packages/supabase/database.types.ts`.
- Created shared contracts and Zod validation schemas in `@nnoo/contracts/ai.ts` and `@nnoo/validation/ai.ts` for Credit Passport snapshots, previews, shares, projections, verifications, and AI explanations.
- Created PDF generator in `apps/web/src/lib/pdf/CreditPassportPDF.tsx` using `@react-pdf/renderer`.
- Enabled `ai.credit_passport.explain` in feature registry and registered version 1.0.0 prompt in `apps/web/src/server/ai/prompts/registry.ts`.
- Built versioned REST API routes:
  - `GET /api/v1/ai/credit-passport/preview`: Live preview & freshness check (0 Gemini calls).
  - `POST /api/v1/ai/credit-passport/generate`: Versioned snapshot generation (0 Gemini calls).
  - `GET /api/v1/ai/credit-passport/snapshots/[id]`: Single snapshot retrieval (0 Gemini calls).
  - `GET /api/v1/ai/credit-passport/history`: Paginated snapshot history (0 Gemini calls).
  - `POST /api/v1/ai/credit-passport/shares`: Secure expiring share link generation (0 Gemini calls).
  - `GET /api/v1/ai/credit-passport/shares`: Active shares listing (0 Gemini calls).
  - `DELETE /api/v1/ai/credit-passport/shares/[id]`: Share link revocation (0 Gemini calls).
  - `GET /api/v1/credit-passport/share/[token]`: Public external safe read-only viewer (0 Gemini calls).
  - `GET /api/v1/credit-passport/verify`: Public metadata verification endpoint (0 Gemini calls).
  - `GET /api/v1/ai/credit-passport/snapshots/[id]/pdf`: PDF stream download (0 Gemini calls).
  - `POST /api/v1/ai/credit-passport/explain`: Grounded Gemini overview.
- Built Web UX:
  - Added `Credit Passport` navigation entry (`FileBadge` icon) in `AppSidebar.tsx` and `credit_passport` module in `rbac-client.ts`.
  - Built `CreditPassportDashboard.tsx` with version badges, coverage pills, stale data notices, action buttons, share dialog with custom expiry, history modal, PDF download, grounded AI explanation card, and legal disclaimer card.
  - Built server page `/app/[businessSlug]/credit-passport`.
  - Built public share page `/passport/share/[token]` and public verification portal `/passport/verify`.
  - Added Credit Passport quick-access link in main dashboard header (`/app/[businessSlug]/page.tsx`).
- Added 12 comprehensive automated tests in `apps/web/src/server/ai/__tests__/credit-passport.test.ts` bringing total test suite to 103 passing tests across all 7 AI test suites in 8.2s.
- Verified clean Next.js production web build across all 58 routes and Expo mobile TypeScript compilation.

### TRANCHE 3 — PROMPT 6: Production NNOO Business Health Score
- Implemented production NNOO Business Health Score under the strict principle "NNOO COMPUTES, GEMINI EXPLAINS, ZERO INVENTED NUMBERS, ZERO DIRECT FINANCIAL MUTATIONS":
  - `BusinessHealthFormulaV1`: Pure TypeScript deterministic formula engine (`business-health-score-v1`) calculating weighted operational health across 5 core dimensions: `SALES_PROFITABILITY` (30), `OPERATING_EFFICIENCY` (25), `RECEIVABLES_COLLECTION` (20), `BUSINESS_OBLIGATIONS` (15), `INVENTORY_READINESS` (10). ZERO `@google/genai` imports.
  - Service-Business Fairness: Businesses with 0 tracked physical inventory products have `INVENTORY_READINESS` marked `NOT_APPLICABLE` and excluded from the denominator so they are not penalized.
  - Insufficient Data Honesty: Businesses with missing core records receive `status: 'INSUFFICIENT_DATA'` and `score: null` with guidance to record sales and expenses, instead of a fabricated 50/100 score.
  - `HealthScoreNumericGuard`: Post-validation defense blocking prohibited claims (credit ratings, bank ratings, loan qualifications, future forecasts, tax claims) and rejecting model score mismatches.
  - `BusinessHealthService`: Central coordinator for score calculation (0 AI calls), idempotent snapshot refresh (0 AI calls), snapshot history (0 AI calls), and grounded Gemini explanations.
  - Zero financial side effects: score calculations cause 0 sales, 0 expenses, 0 payments, 0 invoices, 0 inventory movements, and 0 journal entries.
- Applied Supabase database migration `20260825000000_business_health_score.sql`:
  - Created `public.ai_business_health_snapshots` table with indexes (`idx_ai_biz_health_lookup`, `idx_ai_biz_health_fingerprint`, `idx_ai_biz_health_period`).
  - Added strict RLS policies allowing authenticated business members to view health snapshots and denying direct client insertions.
- Regenerated Supabase TypeScript types in `packages/supabase/database.types.ts`.
- Created shared contracts and Zod validation schemas in `@nnoo/contracts/ai.ts` and `@nnoo/validation/ai.ts` for Health Score results, dimensions, bands, data coverage, reasons, actions, and explanations.
- Enabled `ai.health.explain` in feature registry and registered version 1.0.0 prompt in `apps/web/src/server/ai/prompts/registry.ts`.
- Built versioned REST API routes:
  - `GET /api/v1/ai/health/score`: Current score retrieval (0 Gemini calls).
  - `POST /api/v1/ai/health/refresh`: Idempotent score recalculation and snapshot persistence (0 Gemini calls).
  - `GET /api/v1/ai/health/history`: Snapshot history timeline (0 Gemini calls).
  - `POST /api/v1/ai/health/explain`: Grounded, structured Gemini narrative explanation.
- Built Web UX:
  - Added `Business Health` navigation entry (`Activity` icon) in `AppSidebar.tsx` and `health_score` module in `rbac-client.ts`.
  - Built `HealthScoreDashboard.tsx` featuring animated circular score gauge, band badge (`Strong`, `Good`, `Fair`, `Needs Attention`), data coverage indicator, evaluation period, dimension breakdown cards, "What is Helping" / "Needs Attention" insight callouts, recommended action links, history drawer, and non-credit operational index disclaimer.
  - Built server page `/app/[businessSlug]/health`.
  - Added Business Health quick-access link in main dashboard header (`/app/[businessSlug]/page.tsx`).
- Added 9 comprehensive automated tests in `apps/web/src/server/ai/__tests__/health-score.test.ts` bringing total test suite to 91 passing tests across all 6 AI test suites in 9.4s.
- Verified clean Next.js production web build across all 45 routes and Expo mobile TypeScript compilation.

### TRANCHE 3 — PROMPT 5: Ask NNOO — Production Business AI Assistant
- Implemented production conversational business assistant under the strict principle "NNOO COMPUTES, GEMINI EXPLAINS, ZERO INVENTED NUMBERS, ZERO DIRECT FINANCIAL MUTATIONS":
  - `AskNnooToolExecutor`: Executes 11 allowlisted, read-only tools (`getBusinessOverview`, `getSalesSummary`, `getProfitabilitySummary`, `getExpenseSummary`, `getReceivablesSummary`, `getPayablesSummary`, `getInventoryStatus`, `getInvoiceStatus`, `getBookkeeperStatus`, `lookupCustomer`, `lookupProduct`) with independent RBAC preflights, request bounding, and opaque candidate keys.
  - `AskNnooNumericGuard`: Validates structured model responses against allowlisted fact keys, entity keys, and sources; blocks prohibited Health Scores (`/100`), Credit Ratings, and revenue forecasts.
  - `AskNnooAssistantService`: Coordinates conversation lifecycles with 0 Gemini calls, turn idempotency, mutation refusal handoffs (`MUTATION_REQUIRES_WORKFLOW`), tool execution loop (max 4 tools), server fact substitution (`[FACT:key]`), and historical role-downgrade response redacting.
  - Zero autonomous mutations: user requests to create sales, expenses, refunds, or product adjustments are refused with clear explanation and safe navigation action buttons.
- Applied Supabase database migration `20260824000000_ask_nnoo_conversations.sql`:
  - Created `public.ai_conversations` and `public.ai_messages` tables with composite indexes (`idx_ai_convs_user_business`, `idx_ai_messages_conv`).
  - Added strict RLS policies allowing authenticated business members to view own conversations and denying direct client insertions/updates.
- Regenerated Supabase TypeScript types in `packages/supabase/database.types.ts`.
- Created shared contracts and Zod validation schemas in `@nnoo/contracts/ai.ts` and `@nnoo/validation/ai.ts` for Ask NNOO conversations, message turns, response payloads, fact references, and action definitions.
- Enabled `ai.ask_nnoo` in feature registry and registered version 1.0.0 prompt in `apps/web/src/server/ai/prompts/registry.ts`.
- Built versioned REST API routes:
  - `GET /api/v1/ai/assistant/conversations`: Lists active conversations for the user and business (0 Gemini calls).
  - `POST /api/v1/ai/assistant/conversations`: Initializes a new conversation (0 Gemini calls).
  - `GET /api/v1/ai/assistant/conversations/[id]`: Returns conversation history with role-downgrade security filtering.
  - `DELETE /api/v1/ai/assistant/conversations/[id]`: Archives a conversation.
  - `POST /api/v1/ai/assistant/conversations/[id]/messages`: Processes user message turns with tool execution and validated answer synthesis.
- Built Web UX:
  - Added `Ask NNOO` navigation entry (`MessageSquare` icon) in `AppSidebar.tsx` and `assistant` module in `rbac-client.ts`.
  - Built `AskNnooChat.tsx` featuring conversation history sidebar, verified data status badge, role-aware suggested question chips, fact cards grid, referenced entity cards, actionable report links, and micro-disclaimers.
  - Built server page `/app/[businessSlug]/assistant`.
- Added 9 comprehensive automated tests in `apps/web/src/server/ai/__tests__/ask-nnoo.test.ts` bringing total test suite to 82 passing tests across all 5 AI test suites in 8.0s.
- Verified clean Next.js production web build across all 41 routes and Expo mobile TypeScript compilation.

- Implemented production Verified Business Summaries and Smart Insights infrastructure adhering strictly to "NNOO COMPUTES, GEMINI EXPLAINS, ZERO INVENTED NUMBERS":
  - `BusinessPeriodResolver`: Deterministic calendar date boundaries in `Africa/Lagos` business timezone for Today, This Week, This Month, and Custom Ranges with preceding comparison periods.
  - `VerifiedFactBuilderService`: Canonical orchestration calling T2-P09 reporting RPCs (`get_dashboard_performance_metrics`, `get_dashboard_current_position`) with permission-sensitive fact projection and data coverage analysis.
  - `DeterministicInsightSignalEngine`: Derives exact deltas, percentage changes without zero-division errors, signal directions (`UP`, `DOWN`, `UNCHANGED`, `NOT_COMPARABLE`), and allowable navigation action keys on the server.
  - `NumericLiteralGuard`: Stringent post-validation guard blocking hallucinations of invented currency totals, health scores (1-100), credit ratings, and future revenue forecasts.
  - `AIBusinessInsightService`: Centralized intelligence coordinator managing verified facts retrieval (0 Gemini calls), deterministic empty-state handling for zero-data businesses (0 Gemini calls), SHA-256 fact fingerprint deduplication and summary reuse, stale summary detection, and summary history retrieval.
  - Zero autonomous financial mutation enforced: summary generation produces 0 sales, 0 expenses, 0 payments, 0 refunds, 0 inventory movements, 0 invoices, and 0 journal entries.
- Applied Supabase database migration `20260823000000_verified_business_summaries.sql`:
  - Created `public.ai_business_summaries` table with indexes (`idx_ai_biz_summaries_lookup`, `idx_ai_biz_summaries_fingerprint`, `idx_ai_biz_summaries_period`).
  - Added strict RLS policies allowing authenticated business members to view summaries and denying direct client insertions.
- Regenerated Supabase TypeScript types in `packages/supabase/database.types.ts`.
- Created shared contracts and Zod validation schemas in `@nnoo/contracts/ai.ts` and `@nnoo/validation/ai.ts` for `BusinessSummaryType`, `VerifiedFactBundle`, `BusinessInsightSignal`, `BusinessInsightActionKey`, and `StructuredBusinessSummaryResponse`.
- Registered `ai.summary.business` feature in `features.ts` and added production system prompt template in `apps/web/src/server/ai/prompts/registry.ts`.
- Built versioned REST API routes:
  - `GET /api/v1/ai/insights/facts`: Returns real-time verified fact bundle, signals, allowable actions, and latest summary status with 0 Gemini calls.
  - `POST /api/v1/ai/insights/generate`: On-demand structured summary narrative generation with deduplication and validation.
  - `GET /api/v1/ai/insights/summaries`: Summary history listing with pagination.
  - `GET /api/v1/ai/insights/summaries/[id]`: Detailed view of a single historical summary.
- Built Web UX:
  - Added `Business Insights` navigation entry (`TrendingUp` icon) in `AppSidebar.tsx` and `insights` module in `rbac-client.ts`.
  - Built `InsightsDashboard.tsx` featuring interactive period tabs, verified metrics grid with directional indicators and point-in-time timestamps, executive narrative card with freshness badge, key shift signals list, operational attention areas list, recommended action links, and historical summaries modal.
  - Built server page `/app/[businessSlug]/insights` and dashboard entry banner.
- Added 18 automated unit/integration tests in `apps/web/src/server/ai/__tests__/business-insights.test.ts` bringing total test suite to 72 passing tests across all 4 AI test suites in 780ms.
- Verified Next.js production web build (`next build`) across 40 routes and Expo mobile TypeScript compilation.

### TRANCHE 3 — PROMPT 3: AI Bookkeeper — Review, Confirmation & Bookkeeping Workflow
- Implemented human-in-the-loop review, correction, rejection, and deterministic application workflow:
  - `IBookkeeperOperationAdapter` & Implementations: `ExpenseBookkeeperAdapter`, `StockPurchaseBookkeeperAdapter`, `CustomerPaymentBookkeeperAdapter`, `SupplierPaymentBookkeeperAdapter`, `SaleBookkeeperAdapter`, `RefundBookkeeperAdapter` strictly invoking Tranche 2 accounting RPCs (`create_expense`, `create_stock_receipt`, `record_sale_payment`, `record_expense_payment`, `record_stock_receipt_payment`, `create_sale`, `create_sale_refund`).
  - `AIBookkeeperReviewService`: Full review coordinator handling inbox listing, review detail, human corrections, zero-mutation rejections, deterministic application with SHA-256 payload fingerprinting, and application idempotency.
  - Zero autonomous posting rule: AI confidence band = HIGH is a strength indicator, never a permission to post without human confirmation.
  - Applying an existing review uses zero Gemini API calls.
- Applied Supabase database migration `20260822000000_ai_bookkeeper_review_application.sql`:
  - Created `public.ai_bookkeeping_reviews` and `public.ai_bookkeeping_applications` tables.
  - Added unique partial index `idx_unique_succeeded_ai_bookkeeping_app` enforcing at most one successful application per classification.
  - Added RLS policies ensuring platform admins and tenant members can select, and denying client direct mutations.
- Built versioned REST API routes in `apps/web/src/app/api/v1/ai/bookkeeper/reviews/`:
  - `GET /api/v1/ai/bookkeeper/reviews`: Filtered review inbox with status tabs (`pending_review`, `applied`, `rejected`, `all`), search, and pagination.
  - `GET /api/v1/ai/bookkeeper/reviews/[id]`: Full review detail with suggestion candidates, review history, and application links.
  - `POST /api/v1/ai/bookkeeper/reviews/[id]/correct`: Records human correction audit without financial side effects.
  - `POST /api/v1/ai/bookkeeper/reviews/[id]/reject`: Rejects AI suggestion with controlled reason codes and zero ledger mutation.
  - `POST /api/v1/ai/bookkeeper/reviews/[id]/apply`: Executes canonical Tranche 2 RPC and links created record.
- Built AI Bookkeeper Web UX:
  - Added AI Bookkeeper navigation entry (`Sparkles` icon) in `AppSidebar.tsx` and RBAC feature module.
  - Built `QuickCaptureForm.tsx`: Plain natural language input with optional collapsible details and direct AI review routing.
  - Built `BookkeeperInbox.tsx`: Filterable inbox with status tabs, search, confidence badges, warning counts, and direct review links.
  - Built `ReviewDetailView.tsx`: Interactive human review screen featuring entered facts, AI suggestion with explanation, missing fields alerts, dynamic operation-specific completion form, and direct action triggers (Confirm, Reject, Reclassify).
  - Built server page routes: `/app/[businessSlug]/bookkeeper` and `/app/[businessSlug]/bookkeeper/[classificationId]`.
- Created shared contracts and validation schemas in `@nnoo/contracts/ai.ts` and `@nnoo/validation/ai.ts`.
- Added 14 automated unit/integration tests in `apps/web/src/server/ai/__tests__/bookkeeper-review.test.ts` bringing total test suite to 54 passing tests.
- Verified Next.js web build (`next build`), mobile TypeScript check (`tsc --noEmit`), and zero secret leakage.

### TRANCHE 3 — PROMPT 2: AI Bookkeeper — Transaction Understanding & Classification
- Implemented core AI Bookkeeper transaction classification engine in `apps/web/src/server/ai/bookkeeper/`:
  - `BookkeeperCandidateService`: Safely fetches same-business candidate expense categories, suppliers, customers, and recent duplicate transactions into opaque candidate keys (`category_1`, `supplier_1`, `customer_1`, `duplicate_1`).
  - `AIBookkeeperService`: End-to-end classification pipeline featuring RBAC preflight (`owner`, `business_admin`, `manager`, `accountant`), SHA-256 payload fingerprinting, idempotency caching and conflict detection, Gemini structured output execution, deterministic post-checks (direction contradiction downgrade, candidate reverse mapping, domain missing fields), and persistent suggestions.
  - Zero financial side-effects enforced: no Sales, Expenses, Stock Receipts, Invoices, Payments, Refunds, Inventory Movements, or Journal Entries are created by AI.
- Created and applied migration `20260821000000_ai_bookkeeping_classifications.sql` creating `public.ai_bookkeeping_classifications` with indexes and RLS.
- Regenerated Supabase TypeScript types in `packages/supabase/database.types.ts`.
- Created versioned prompt template `ai.bookkeeper.classify.v1` in `apps/web/src/server/ai/prompts/registry.ts` and enabled feature in `features.ts`.
- Built server API route `POST /api/v1/ai/bookkeeper/classify` with authentication, active business membership validation, and error normalization.
- Created shared contracts and Zod validation in `@nnoo/contracts/ai.ts` and `@nnoo/validation/ai.ts`.
- Added 18 automated tests in `apps/web/src/server/ai/__tests__/bookkeeper-classifier.test.ts` (40 total AI tests passing).
- Verified Next.js web build (`next build`), mobile TypeScript check (`tsc --noEmit`), and zero secret leakage.

### TRANCHE 3 — PROMPT 1: Production AI & Intelligence Foundation
- Installed `@google/genai` (2.17.1) server-side only in `apps/web`.
- Established central AI engine architecture (`apps/web/src/server/ai/`):
  - Configuration & centralized model policy (`gemini-2.5-flash` runtime default, `GEMINI_API_KEY` server-only).
  - Production Gemini client (`GoogleGeminiClient`) with timeout handling, exponential backoff retries, and normalized error mapping.
  - Test double (`MockGeminiClient`) for deterministic automated testing without network access.
  - Server feature registry (`AI_FEATURES`) and versioned prompt registry (`PROMPT_REGISTRY`).
  - Context builder with verified fact envelopes (`VerifiedFactEnvelope<T>`) and PII data minimization.
  - Controlled read-only AI tool registry (`ALLOWED_AI_TOOLS`) with zero mutation tools and zero arbitrary SQL tools.
  - Prompt injection defense, input length bounding, and untrusted boundary delimiters.
  - Application rate limiter (`globalAIRateLimiter`) and redacting logger (`aiLogger`).
  - Observability service (`recordAIInvocation`) writing diagnostic metadata to `public.ai_invocations`.
  - Central `AIApplicationService` orchestrating auth preflight, RBAC permission verification, global kill switch, rate limiting, context projection, prompt construction, Gemini execution, Zod validation, and observability recording.
- Created and applied migration `20260820000000_ai_intelligence_foundation.sql` establishing `public.ai_invocations` table with RLS.
- Regenerated Supabase TypeScript types in `packages/supabase/database.types.ts`.
- Created shared AI foundation contracts in `@nnoo/contracts/ai.ts` and runtime Zod schemas in `@nnoo/validation/ai.ts`.
- Added comprehensive 22-test automated suite in `apps/web/src/server/ai/__tests__/ai-foundation.test.ts`.
- Verified Next.js web build (`next build`), mobile TypeScript check (`tsc --noEmit`), and zero secret leakage.

### MOBILE AUTH SCREENS REDESIGN (PREMIUM ITERATION)

- Upgraded background video components to feature native glassmorphism using `expo-blur`.
- Implemented `Animated` API for staggered, fluid entry animations on all authentication screens.
- Redesigned `Input.tsx` and `Button.tsx` for a sleek, minimalist, and highly premium aesthetic.

- Integrated `expo-video` and `expo-linear-gradient` for cross-platform video backgrounds and vignette overlays.
- Built reusable `AuthVideoBackground` component with looping videos, vignette gradients, ambient glow, and floating contextual feature badges.
- Redesigned `sign-in.tsx` with POS sales counter video background & live business analytics badge.
- Redesigned `sign-up.tsx` with business storefront video background & business launch badge.
- Redesigned `forgot-password.tsx` with cybersecurity video background & vault recovery badge.
- Redesigned `reset-password.tsx` with encryption stream video background & credential update badge.
- Redesigned `verify-email.tsx` with digital network pulse video background & email activation badge.
- Redesigned `suspended.tsx` with tech motion video background & security compliance badge.
- Applied glassmorphic frosted cards (`rgba(10, 28, 22, 0.82)`), glowing lime accents (`#B8F25C`), and sharp responsive typography across all mobile auth screens.
- Verified zero TypeScript errors (`tsc --noEmit`) and Expo SDK compatibility.

## 2026-08-09

### TRANCHE 2 — PROMPT 14
Final Acceptance & Closeout

- Conducted Tranche 2 QA Integration Audit.
- Verified Zero financial drift and strictly enforced RLS boundaries.
- Formal Tranche 2 Accepted decision recorded.
- Documentation closed out.
- Baseline 1e0fee262737a4a087d54496766850221de10d84 established.
## 2026-08-04

### Added

- NNOO Antigravity governance pack version 1.0.0.
- Root project rules.
- Workspace rules, roles, skills, and workflows.
- Architecture, tranche, security, quality, state, version, and documentation controls.
- One combined Next.js web application decision.
- One Expo mobile application decision.
- Shared Supabase backend and API contract decision.

### Current state

Application repository scaffold not yet created.

## 2026-08-07

### Added

- Tranche 1 Baseline Audit completed.
- Verified Web and Mobile initial architecture.
- Confirmed Supabase connection.
- Recorded ESLint and Git initialization issues.


### TRANCHE-1-PROMPT-02

- Completed Supabase Authentication & Shared Identity Foundation Backend.
- Created profiles table database migration with RLS and trigger functions.
- Created shared validation package with Zod.
- Created shared auth contracts package.
- Set up Expo secure storage mobile Supabase client.
- Updated web Supabase clients with generated types and added server-only admin client.
- Fixed ESLint dependency issue.



## TRANCHE-1-PROMPT-09

- **Date**: 2026-08-07
- **Goal**: Full Tranche 1 Integration, Security & QA
- **Outcomes**:
  - Integration audit completed.
  - Security tests and cross-platform tests run.
  - Minor lint defects repaired (DEF-001, DEF-002).
  - Final QA state passed.


## TRANCHE 1 COMPLETE

- Baseline Audit & Monorepo Foundation.
- Supabase Authentication & Identity.
- Web & Mobile Auth.
- Business Onboarding & Profiles.
- Memberships, Roles & Invitations.
- NNOO Platform Administration.
- Marketing Pages & Lead Capture.
- Full Integration, Security & QA.
