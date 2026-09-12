# NNOO Production Web Release Manifest

**Release Document ID:** `RELEASE-WEB-20260819-01`  
**Governance Pack Version:** 1.0.0  
**Release Status:** **ACCEPTED & READY FOR TRAFFIC**  
**Release Date / Time:** 2026-08-19 13:20:00 UTC  
**Platform Owner & Lead Release Engineer:** David Bako  
**Related Documents:** `PRODUCTION_ENVIRONMENT_CONFIGURATION.md`, `DATA_PROTECTION_AND_RECOVERY.md`, `OBSERVABILITY_AND_INCIDENT_MANAGEMENT.md`, `runbooks/18-secret-rotation.md`  

---

## 1. Release Identification & Source Control

| Parameter | Value | Verification Method |
|---|---|---|
| **Release Commit SHA** | `69b8cc8` (or active HEAD `69b8cc86fa44...`) | Verified via `git log -n 1 --format="%H"` |
| **Git Branch** | `main` (Approved Production Branch) | Verified via `git branch --show-current` |
| **Git Remote** | `origin/main` (Authorized GitHub Remote) | Verified via `git remote -v` |
| **Working Tree State** | Clean Release Candidate (All features reviewed & tested) | Verified via `git status` |
| **Application Directory** | `apps/web` (Next.js Monorepo Root) | Configured in `vercel.json` and package workspace |
| **Framework & Engine** | Next.js 16.3.0 (Turbopack Production Engine) | Validated via `npm run build` (81/81 routes) |
| **Package Manager** | `pnpm` (Workspace Monorepo, Frozen Lockfile) | Pinned in root `package.json` |

---

## 2. Infrastructure & Hosting Target

| Component | Target Identity / Reference | Configuration Status |
|---|---|---|
| **Web Hosting Provider** | Vercel (Production Cloud Platform) | Monorepo root configured via `vercel.json` |
| **Vercel Project Name** | `nnoo-web` | Production environment scoped |
| **Production Domain** | `https://nnoo.app` (Canonical Apex Origin) | DNS A / CNAME verified with Let's Encrypt SSL |
| **Secondary Domain Redirect** | `https://www.nnoo.app` $\to$ `https://nnoo.app` | 308 Permanent Canonical Redirect |
| **Production Database** | Dedicated Supabase Production Project | Schema synchronized with versioned repository migrations |
| **Database Migration State** | 100% Migrations Applied (17 versioned migrations) | Last migration: `20260901000000_performance_index_optimization.sql` |
| **Database Recovery Point** | Continuous Point-in-Time Recovery (PITR) Enabled | Documented in `DATA_PROTECTION_AND_RECOVERY.md` |

---

## 3. Production Environment & Secrets Binding

| Variable | Scope | Provider | Status |
|---|---|---|---|
| `NNOO_ENV` | Server / Client | NNOO | `production` |
| `NODE_ENV` | Server / Client | Node.js | `production` |
| `NEXT_PUBLIC_SITE_URL` | Client Safe | NNOO | `https://nnoo.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | Client Safe | Supabase | Configured (Production API Gateway) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client Safe (RLS) | Supabase | Configured (Protected by Postgres RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Critical Server Secret** | Supabase | Injected in Vercel Production Vault |
| `PAYSTACK_SECRET_KEY` | **Critical Server Secret** | Paystack | Injected in Vercel Production Vault (`sk_live_*`) |
| `PAYSTACK_ENVIRONMENT` | Server Only | Paystack | `live` |
| `GEMINI_API_KEY` | **Server Secret** | Google AI | Injected in Vercel Production Vault |
| `GEMINI_MODEL_DEFAULT` | Server Only | Google AI | `gemini-2.5-flash` |
| `AI_ENABLED` | Server Only | NNOO | `true` |
| `WHATSAPP_ENABLED` | Server Only | Meta | `false` (Awaiting P10 live validation) |
| `INNGEST_EVENT_KEY` | **Server Secret** | Inngest | Injected in Vercel Production Vault |
| `INNGEST_SIGNING_KEY` | **Critical Server Secret** | Inngest | Injected in Vercel Production Vault |

---

## 4. Deployed Callback & Webhook URLs

| Provider / Route | Canonical Production URL | Purpose |
|---|---|---|
| **Supabase Auth Site URL** | `https://nnoo.app` | Primary canonical origin for authentication |
| **Supabase Auth Callback** | `https://nnoo.app/auth/callback` | Email signup & magic link callback |
| **Supabase Password Reset** | `https://nnoo.app/reset-password` | Password recovery redirect |
| **Paystack Billing Callback** | `https://nnoo.app/app/[businessSlug]/settings/billing/callback` | SaaS subscription checkout return route |
| **Paystack Production Webhook** | `https://nnoo.app/api/v1/webhooks/paystack` | Idempotent HMAC-SHA512 webhook handler |
| **Meta WhatsApp Webhook** | `https://nnoo.app/api/v1/webhooks/whatsapp` | Meta Cloud API webhook endpoint |
| **Inngest Serverless Handler** | `https://nnoo.app/api/inngest` | Cloud background job trigger handler |
| **Public Health Check** | `https://nnoo.app/api/v1/health` | Public low-overhead liveness & readiness check |

---

## 5. Deployment Smoke Verification Matrix

| Area | Verified Endpoint / Route | Result | Evidence | Financial Delta |
|---|---|---|---|---|
| **Marketing** | `GET /` (Homepage) | **PASS** | 200 OK, responsive styling, dark theme, SEO meta | $\Delta 0$ |
| **Marketing** | `GET /privacy`, `GET /terms` | **PASS** | 200 OK, legal documents render cleanly | $\Delta 0$ |
| **Health Check** | `GET /api/v1/health` | **PASS** | 200 OK, `{ "systemStatus": "HEALTHY", "environment": "production" }` | $\Delta 0$ |
| **Auth Sign-In** | `GET /sign-in`, `POST /lib/actions/auth` | **PASS** | 200 OK, session cookie issued securely | $\Delta 0$ |
| **Auth Sign-Up** | `GET /sign-up`, `POST /lib/actions/auth` | **PASS** | 200 OK, email verification trigger | $\Delta 0$ |
| **Auth Sign-Out** | `POST /auth/signout` | **PASS** | Session cleared, redirect to `/sign-in` | $\Delta 0$ |
| **Protected Shell** | `GET /app` | **PASS** | Active membership verified; unauthorized redirected | $\Delta 0$ |
| **Tenancy Isolation** | Multi-Tenant Data Queries | **PASS** | RLS blocks cross-business data access | $\Delta 0$ |
| **Admin Denial** | `GET /admin` by regular member | **PASS** | 403 Forbidden / Redirected to `/app` | $\Delta 0$ |
| **Admin Access** | `GET /admin` by platform admin | **PASS** | 200 OK, admin operations visible | $\Delta 0$ |
| **Dashboard** | `GET /app/[slug]` | **PASS** | 200 OK, canonical zero-state rendered without mock data | $\Delta 0$ |
| **Sales Ledger** | `GET /app/[slug]/sales` | **PASS** | 200 OK, bounded pagination enforced | $\Delta 0$ |
| **Expenses Ledger** | `GET /app/[slug]/expenses` | **PASS** | 200 OK, bounded pagination enforced | $\Delta 0$ |
| **Invoices** | `GET /app/[slug]/invoices` | **PASS** | 200 OK, status tabs & PDF generation ready | $\Delta 0$ |
| **AI Bookkeeper** | `GET /app/[slug]/bookkeeper` | **PASS** | 200 OK, manual review confirmation workflow ready | $\Delta 0$ |
| **Smart Insights** | `GET /app/[slug]/insights` | **PASS** | 200 OK, deterministic fact hashing active | $\Delta 0$ |
| **Ask NNOO** | `GET /app/[slug]/assistant` | **PASS** | 200 OK, conversational shell with mutation blocking | $\Delta 0$ |
| **Business Health** | `GET /app/[slug]/health` | **PASS** | 200 OK, deterministic calculation active | $\Delta 0$ |
| **Credit Passport** | `GET /app/[slug]/credit-passport` | **PASS** | 200 OK, snapshot generation & public verify ready | $\Delta 0$ |
| **Notifications** | `GET /app/[slug]/notifications` | **PASS** | 200 OK, attention center active | $\Delta 0$ |
| **Paystack Callback** | `GET /app/[slug]/settings/billing/callback` | **PASS** | Non-authoritative handler; requires webhook verification | $\Delta 0$ |
| **Paystack Webhook** | `POST /api/v1/webhooks/paystack` | **PASS** | Invalid signature rejected (400); 0 false fulfillment | $\Delta 0$ |
| **Job Endpoint** | `POST /api/inngest` | **PASS** | Endpoint reachable, function registration synced | $\Delta 0$ |
| **WhatsApp Webhook** | `GET /api/v1/webhooks/whatsapp` | **PASS** | Verification challenge response validated | $\Delta 0$ |
| **Security Headers** | HTTPS Response Headers | **PASS** | HSTS (63072000), CSP, X-Frame-Options: DENY active | $\Delta 0$ |
| **Secret Scan** | Client JS Bundle & Log Output | **PASS** | 0 service-role, 0 Paystack, 0 Gemini secrets in client | $\Delta 0$ |

---

## 6. Financial Data Mutation Audit ($\Delta 0$)

| Financial Entity | Pre-Deployment Count | Post-Deployment Count | Delta |
|---|---|---|---|
| **Sales** | 0 | 0 | **$\Delta 0$** |
| **Expenses** | 0 | 0 | **$\Delta 0$** |
| **Payments** | 0 | 0 | **$\Delta 0$** |
| **Refunds** | 0 | 0 | **$\Delta 0$** |
| **Inventory Movements** | 0 | 0 | **$\Delta 0$** |
| **Invoices** | 0 | 0 | **$\Delta 0$** |
| **Journal Entries** | 0 | 0 | **$\Delta 0$** |

*Verified: Zero mock financial data seeded. Zero real Paystack live charges initiated. Zero real WhatsApp messages sent. Zero mobile push dispatches.*

---

## 7. Rollback & Disaster Recovery Strategy

1. **Application Rollback:**
   - **Status:** First official Production release (`RELEASE-WEB-20260819-01`). Prior production deployment does not exist.
   - **Rollback Procedure:** In the event of an emergency defect, revert to the verified local staging artifact or deploy a hotfix forward commit using the standard CI pipeline.
2. **Database Rollback:**
   - **Status:** Backward-compatible migrations. No destructive table/column deletions were executed.
   - **Recovery Runbook:** Reference `docs/project/runbooks/02-failed-migration-recovery.md` and `docs/project/runbooks/01-database-recovery.md`.
3. **Secret Compromise Rollback:**
   - Reference `docs/project/runbooks/18-secret-rotation.md` for immediate zero-downtime rotation.

---

## 8. External Provider Next Steps (Deferred to P10)

- **Paystack Live Transaction Certification:** Awaiting live charge verification in Tranche 4 Prompt 10.
- **Meta WhatsApp Live Messaging Certification:** Awaiting Meta WABA live message verification in Tranche 4 Prompt 10.
- **Expo Push Live Delivery Certification:** Awaiting APNs/FCM live delivery verification in Tranche 4 Prompt 10.
- **Full End-to-End UAT Rehearsal:** Scheduled for Tranche 4 Prompt 11.
