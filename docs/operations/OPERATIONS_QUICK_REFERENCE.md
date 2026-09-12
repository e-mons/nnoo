# NNOO — Operations Emergency Quick Reference

Document ID: `OPS-QREF-01`  
Governance Version: `1.0.0`  
Last Reconciled: `2026-08-20` (Tranche 4 Prompt 12 Handover)  
Status: **Authoritative Operations Quick Reference**

---

## Fast Answers to Common Operational Emergencies

### 1. "Web is down — where do I look?"
1. Query `/api/v1/health` on `https://nnoo.app`.
2. Inspect the **Vercel Deployments** dashboard (`https://vercel.com/dashboard/projects/nnoo`).
3. Check Vercel global status at `https://www.vercel-status.com`.
4. If a recent release introduced an error, click **"Promote to Production"** on the previous green deployment in Vercel.
5. See [09-web-api-outage.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/09-web-api-outage.md).

### 2. "Database is unavailable or returning connection errors — what do I do?"
1. Open the **Supabase Dashboard** (`https://supabase.com/dashboard/project/hoorlxgtnamwdxszsbwt`).
2. Inspect **Database** $\to$ **Connection Pooling** (PgBouncer/Supavisor).
3. If database corruption occurred, trigger Point-in-Time Recovery (PITR) to a timestamp before the incident.
4. See [10-database-supabase-outage.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/10-database-supabase-outage.md) and [01-database-recovery.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/01-database-recovery.md).

### 3. "Google Gemini AI is down — what should still work?"
- **Everything core works 100%:** Recording sales, issuing invoices, collecting payments, tracking inventory, logging expenses, calculating profit, and viewing reports continue without interruption.
- AI Bookkeeper and Ask NNOO will display a clean offline notice (`AI_FEATURE_DISABLED`).
- See [13-gemini-ai-outage.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/13-gemini-ai-outage.md).

### 4. "Paystack webhook is failing or subscriptions not activating — what do I check?"
1. Open Paystack Merchant Dashboard $\to$ **Settings** $\to$ **Webhooks**.
2. Inspect the HTTP response code returned by `/api/v1/webhooks/paystack`.
3. If HTTP 400, verify `PAYSTACK_SECRET_KEY` in Vercel environment variables.
4. User can trigger manual server verification at `/app/[businessSlug]/settings/billing/callback`.
5. See [12-paystack-billing-incident.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/12-paystack-billing-incident.md).

### 5. "WhatsApp bot stopped responding — what do I check?"
1. Check Meta Developer Portal $\to$ **WhatsApp** $\to$ **API Setup**.
2. Verify `WHATSAPP_ACCESS_TOKEN` is active and not expired.
3. Check webhook delivery logs in Meta Business Manager.
4. See [16-whatsapp-business-outage.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/16-whatsapp-business-outage.md).

### 6. "Mobile Push notifications not arriving — what do I check?"
1. Check Expo Status: `https://status.expo.dev`.
2. Query `push_device_installations` in the database to verify the user has an active registered token.
3. Verify user has not muted the notification category in `/settings`.
4. See [15-push-notification-outage.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/15-push-notification-outage.md).

### 7. "Possible data leak or cross-tenant query reported — what do I do?"
1. Immediately inspect `admin_audit_logs` and request correlation IDs.
2. Verify RLS policy status on the affected table (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`).
3. Execute the automated test suite `pnpm test` to verify tenant isolation boundaries.
4. See [03-accidental-deletion-and-corruption-recovery.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/03-accidental-deletion-and-corruption-recovery.md).

### 8. "Need to rotate a production secret — what do I do?"
1. Follow the step-by-step procedure in [18-secret-rotation.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/18-secret-rotation.md).
2. Update the secret in Vercel Project Settings.
3. Redeploy the Next.js application to bind the updated environment variable.
