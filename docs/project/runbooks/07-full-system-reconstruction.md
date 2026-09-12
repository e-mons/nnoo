# Runbook 07: Total Environment Rebuild & Disaster Reconstruction

**Owner:** Platform Operations & Lead Engineer  
**Audience:** Platform Admin / DevOps  
**Severity:** CRITICAL (Disaster Recovery)  

---

## 1. Overview & Total Rebuild Sequence

Defines the complete end-to-end sequence for spinning up the full NNOO system from bare infrastructure in a disaster recovery event.

```text
1. PROVISION CORE INFRASTRUCTURE
   - Provision new Supabase project (PostgreSQL 17).
   - Create required storage buckets (credit-passport-artifacts, business-logos, receipt-documents).
          ↓
2. RESTORE DATABASE & SCHEMAS
   - Restore database backup snapshot (or apply all migrations from supabase/migrations/).
   - Verify all 60 public tables exist with 100% RLS coverage.
          ↓
3. REGENERATE TYPES & BUILD MONOREPO
   - Run type generation: pnpm --filter @nnoo/supabase run generate:types
   - Verify TypeScript compilation across packages, web, and mobile.
          ↓
4. CONFIGURE SECRETS & ENVIRONMENT
   - Configure Vercel and EAS environment variables using Runbook 06.
   - Point application to new Supabase project URL and keys.
          ↓
5. RECONCILE EXTERNAL PROVIDER CHANNELS
   - Paystack: verify webhook URL and re-sync any unconfirmed subscriptions.
   - WhatsApp: configure webhook callback and verify token; confirm STOP opt-outs.
   - Inngest: link app server and initialize scheduled jobs in PAUSED state.
          ↓
6. RUN POST-RESTORE VERIFICATION GATES (Runbook 08)
   - Financial ledger reconciliation (Δ 0 discrepancy).
   - Multi-tenant isolation tests (0 cross-tenant leaks).
   - Auth identity and last-owner invariant checks.
          ↓
7. RESUME SERVICES & GO LIVE
   - Unpause Inngest background jobs.
   - Route production DNS (Vercel) to new web deployment.
   - Operator and David Bako final sign-off.
```
