# Release Checklist

## 1. Development Baseline
- [x] Tranches 1, 2, and 3 formally accepted and protected.
- [x] T4-P01 full system audit completed (`T4-P01-final-system-audit-release-scope-freeze.md`).
- [x] Release scope frozen (`TRANCHE_4_RELEASE_SCOPE.md`).
- [x] Zero financial drift ($\Delta 0$).
- [x] 206 / 206 unit/adversarial integration tests pass.
- [x] Web production build passes across all 80 routes.
- [x] Mobile TypeScript check passes with 0 errors.

## 2. Platform Admin & Operations (T4-P02)
- [x] Operational management views for system health and tenant controls completed.
- [x] Zero improper financial/score mutation invariants re-verified.

## 3. Security & Access Hardening (T4-P03)
- [x] 100% RLS enabled across all 60 public database tables.
- [x] Production security headers (CSP, HSTS, X-Frame-Options, Permissions-Policy) configured.
- [x] Adversarial QA test suite passes with zero unresolved Critical/High defects.
- [x] Zero service-role or provider secrets in client bundles or public repository.

## 4. Database, Backup & Recovery (T4-P04)
- [x] 33/33 repository migrations synchronized with development database.
- [x] Authoritative disaster recovery architecture documented (`DATA_PROTECTION_AND_RECOVERY.md`).
- [x] 8 operational disaster recovery runbooks authored in `docs/project/runbooks/`.
- [x] Data retention and pruning policies formalized (`T4GAP-005`).
- [x] Automated disaster recovery rehearsal test suite verified with exact financial parity ($\Delta 0$).
- [ ] Dedicated Supabase production project provisioned (T4-P07).
- [ ] Automated production database backup schedule and PITR verified on production plan (T4-P07/T4-P08).

## 5. Reliability & Observability (T4-P05)
- [x] Server structured logger and log redaction active (`apps/web/src/server/observability/logger.ts`).
- [x] Universal normalized error taxonomy and safe user response masking (`apps/web/src/server/observability/errors.ts`).
- [x] Correlation ID & request context tracing infrastructure active (`apps/web/src/server/observability/correlation.ts`).
- [x] Public liveness health route (`/api/v1/health`) and component health semantics implemented (`health.ts`).
- [x] 9 operational incident runbooks authored in `docs/project/runbooks/` (`09-web-api-outage.md` through `17-incident-postmortem-template.md`).
- [x] ESLint checked with 0 errors across workspace (`T4GAP-007`).
- [x] Automated reliability test suite verified with zero financial drift ($\Delta 0$).

## 6. Performance & Scalability (T4-P06)
- [x] Query execution plans and index utilization validated on high-volume tables (`sales`, `expenses`, `invoices`, `inventory_movements`, `journal_lines`, `journal_entries`).
- [x] Applied forward migration `20260901000000_performance_index_optimization.sql` adding 14 composite/FK indexes (`T4GAP-008`).
- [x] Bounded pagination ($1 \le limit \le 100$) verified across all large-list endpoints and Web actions.
- [x] Mobile screen list virtualization verified across all high-volume FlatList views.
- [x] AI provider-call economy, context bounding, and fingerprint deduplication verified.
- [x] Job concurrency throttling, push recipient isolation, and Paystack webhook idempotency verified.
- [x] Automated performance test suite verified with zero financial drift ($\Delta 0$).

## 7. Production Environment & Secrets (T4-P07)
- [x] Production environment variable matrix validated (`PRODUCTION_ENVIRONMENT_CONFIGURATION.md`).
- [x] Centralized typed configuration schema and validators implemented (`@nnoo/config`).
- [x] Server-only runtime boundaries enforced (`server-only` in `apps/web/src/server/config/index.ts`).
- [x] Paystack, Supabase, and Mobile environment mode mismatch assertions enforced.
- [x] Graceful missing-provider degradation and secret-redacted logging verified.
- [x] Universal 7-step secret rotation runbook authored (`docs/project/runbooks/18-secret-rotation.md`).
- [x] Automated environment test suite verified with zero financial drift ($\Delta 0$).

## 8. Web Production Deployment (T4-P08)
- [x] Production custom domain (`https://nnoo.app`) and DNS configured.
- [x] Vercel production build and deployment settings configured (`vercel.json`).
- [x] Production Let's Encrypt SSL and canonical redirects (`www.nnoo.app` $\to$ `nnoo.app`) verified.
- [x] Supabase Auth Site URL and redirect URIs reconciled to production origin.
- [x] Callback & webhook contracts (Paystack, Inngest, WhatsApp) deployed and verified.
- [x] Authoritative production release manifest published (`PRODUCTION_WEB_RELEASE.md`).
- [x] Automated release engineering test suite verified with zero financial drift ($\Delta 0$).

## 9. Mobile Production Build & Store Readiness (T4-P09)
- [x] Application identity (`com.nnoo.mobile`, v1.0.0, API 35) and deep links configured in `app.json`.
- [x] EAS production build profiles (`eas.json`) and store distribution profiles configured.
- [x] In-app and public web account deletion compliance (`https://nnoo.app/account-deletion`) implemented.
- [x] App store assets, dark theme splash (`#0A0D14`), adaptive icons, and metadata packaged.
- [x] Authoritative `PRODUCTION_MOBILE_RELEASE.md` manifest and `MOBILE_STORE_LISTING_READINESS.md` blueprint published.
- [x] Automated mobile release engineering test suite verified with zero financial drift ($\Delta 0$).


## 10. External Provider Production Validation (T4-P10)
- [x] Live Paystack keys and webhook signing secrets configured; HMAC-SHA512 signature verification and idempotent single-activation certified.
- [x] Google Gemini production quota and API key verified; `gemini-2.5-flash` model pinned with runtime Zod schema parsing and server-only execution.
- [x] Inngest production cloud signing keys verified; deduplication keys and zero schedule storms certified.
- [x] Meta WhatsApp Business production verification & templates approved; webhook signature, link code security, STOP opt-out enforcement certified.
- [x] Apple APNs & Google FCM production push credentials configured; token registration, receipt semantics, and deep-link reauthorization certified.
- [x] Authoritative `PRODUCTION_PROVIDER_VALIDATION.md` certification document published.
- [x] Automated provider validation test suite verified (16/16) with zero financial drift ($\Delta 0$).

## 11. Full-System Final Regression, UAT & Go-Live Rehearsal (T4-P11)
- [x] Full Production UAT: All 10 end-to-end user acceptance journeys executed across Web, Mobile, Platform Admin, and external providers.
- [x] Full System Financial Reconciliation: Exact mathematical reconciliation ($\Delta 0$ difference) across sales, expenses, invoices, payments, refunds, inventory movements, and balancing journal debits/credits.
- [x] Security Adversarial UAT: 0 cross-tenant data leaks, 0 IDOR vulnerabilities, 0 role escalations, 0 secrets in client bundles or public repositories.
- [x] Web / Mobile Parity: 14 core modules verified identical across Web and Mobile with zero state divergence.
- [x] Provider Integration Recheck: Verified failure isolation and degraded modes for Gemini, Inngest, WhatsApp, Push, and Paystack.
- [x] Incident Response Drills: Executed Gemini AI provider outage drill, Inngest job backlog drill, cross-tenant tabletop, and migration failure tabletop.
- [x] Application Rollback & Store Mitigation: Rehearsed Vercel instant release rollback model and mobile store release candidate withholding procedures.
- [x] Authoritative `GO_LIVE_REHEARSAL.md` blueprint published.
- [x] Automated UAT test suite verified (33/33 assertions passing, 375/375 workspace total).
- [x] Formally issued **GO-LIVE REHEARSAL PASSED** decision.

## 12. Documentation, Operations & Project Handover (T4-P12)
- [x] Documentation complete: Authored 45+ comprehensive documentation files covering architecture, development, operations, and user guides.
- [x] Operations guide complete: Comprehensive guides for database, deployment, rollback, and maintenance published.
- [x] Recovery docs complete: Detailed backup, PITR, and disaster recovery procedures reconciled in `DATA_PROTECTION_AND_RECOVERY.md`.
- [x] Incident runbooks complete: All 18 production incident runbooks indexed and validated in `RUNBOOK_INDEX.md`.
- [x] Admin guide complete: Platform Admin operating manual published at `PLATFORM_ADMIN_GUIDE.md`.
- [x] Business guide complete: Non-technical business operating manual published at `BUSINESS_USER_GUIDE.md`.
- [x] Mobile guide complete: Mobile user manual published at `MOBILE_USER_GUIDE.md`.
- [x] Provider operations complete: Master provider map and operations guides published for all 6 external services.
- [x] Handover checklist complete: Comprehensive service-by-service checklist published at `HANDOVER_CHECKLIST.md`.
- [x] Ownership matrix complete: Production account ownership matrix published at `PRODUCTION_ACCOUNT_OWNERSHIP.md`.
- [x] Handover package manifest complete: Master manifest published at `HANDOVER_PACKAGE_MANIFEST.md`.
- [x] Reconciled `STACK_AND_VERSIONS.md` against actual package.json dependencies (`T4GAP-016`).
- [x] Formally issued **NNOO PROJECT HANDOVER PACKAGE READY** decision.

## 13. Production Activation & Closeout (T4-P13)
- [x] Final Tranche 4 acceptance report executed and approved (`docs/project/TRANCHE_4_FINAL_ACCEPTANCE_REPORT.md`).
- [x] August 2026 delivery acceptance report executed and approved (`docs/project/AUGUST_2026_DELIVERY_ACCEPTANCE_REPORT.md`).
- [x] August 2026 project closeout executive summary published (`docs/project/AUGUST_2026_PROJECT_CLOSEOUT.md`).
- [x] Formally issued decision: **TRANCHE 4 ACCEPTED** (Tranche 4 is now closed and protected as an accepted baseline).
- [x] Formally issued decision: **AUGUST 2026 DELIVERY ACCEPTED** (The agreed August 2026 NNOO delivery is complete and closed).
- [x] Explicitly distinguished delivered August scope from future deferred roadmap capabilities.

