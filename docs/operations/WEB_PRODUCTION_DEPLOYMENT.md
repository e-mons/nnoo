# NNOO — Web Production Deployment & Release Engineering Guide

Document ID: `WEB-DEPLOY-01`  
Governance Version: `1.0.0`  
Last Reconciled: `2026-08-20` (Tranche 4 Prompt 12 Handover)  
Status: **Authoritative Web Deployment Guide**

---

## 1. Production Deployment Pipeline

The NNOO Web application is deployed to **Vercel** via GitHub integration:

```text
┌──────────────────────────────────────────────┐
│           GITHUB MAIN BRANCH REPO            │
│         (davidbako/nnoo @ release SHA)       │
└──────────────────────┬───────────────────────┘
                       │ Git Push / Release Tag
                       ▼
┌──────────────────────────────────────────────┐
│               VERCEL CI / BUILD              │
│  - Monorepo Root: ./ (Root vercel.json)      │
│  - Build Command: pnpm --filter=web build    │
│  - Output Directory: apps/web/.next          │
│  - Server Environment Variables Injected     │
└──────────────────────┬───────────────────────┘
                       │ Optimized Static & Dynamic Route Compilation
                       ▼
┌──────────────────────────────────────────────┐
│           VERCEL EDGE GLOBAL NETWORK         │
│  - Canonical Apex Domain: https://nnoo.app   │
│  - Let's Encrypt Managed TLS / HSTS          │
│  - Instant Immutable Release Promotion       │
└──────────────────────────────────────────────┘
```

---

## 2. Standard 15-Step Production Release Procedure

Every production deployment must execute the following 15-step release procedure:

1. **Candidate Verification:** Ensure the target commit SHA is accepted on `main`.
2. **Git Working Tree Cleanliness:** Confirm `git status` shows zero uncommitted changes.
3. **Automated Quality Gate:** Run `pnpm test` (all 375 tests must pass).
4. **Secret Scan:** Verify zero server secrets exist in client code, docs, or git history.
5. **Database Drift Preflight:** Confirm `Development DB == Migrations == TypeScript Types`.
6. **Backup Snapshot Check:** Verify Supabase PITR or take a pre-release logical snapshot.
7. **Migration Forward-Plan:** Review any new migration files in `supabase/migrations/`.
8. **Apply Production Migration:** Execute `npx supabase db push --linked` to production.
9. **Compile Local Build:** Run `pnpm run build` to verify Next.js builds cleanly.
10. **Trigger Vercel Release:** Promote release deployment in Vercel dashboard or push to `main`.
11. **Verify Apex Domain & SSL:** Check `https://nnoo.app` responds with valid HTTPS certificate.
12. **Execute Production Smoke Tests:** Query `/api/v1/health` and verify HTTP 200 `{"status":"ok"}`.
13. **Provider Re-Check:** Validate external callbacks (Paystack, Inngest, WhatsApp).
14. **Observability Review:** Monitor structured logs for unexpected errors or exceptions.
15. **Release Sign-Off:** Publish release manifest and update `PROJECT_STATE.md`.

---

## 3. Environment Variable Injection on Vercel

> [!CAUTION]
> Secrets must be injected exclusively via the Vercel Project Settings Dashboard (`https://vercel.com/dashboard/projects/nnoo/settings/environment-variables`). Never commit `.env.production` files to GitHub.
