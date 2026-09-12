# Runbook 12: Paystack SaaS Billing Incident Response

**Severity:** SEV-2 (High Billing / Subscription Degradation)  
**Target:** Paystack API, SaaS Checkout, Webhook Processing & Subscriptions  
**Authority:** David Bako (NNOO Lead Developer / Platform Owner)

---

## 1. Trigger Conditions
- Paystack API returning 5xx or connection timeouts during checkout initialization.
- Webhook signature verification failing repeatedly on incoming Paystack events.
- Customer payment confirmed on Paystack dashboard but business subscription remains `inactive`.
- Duplicate webhook delivery detected without proper idempotency lock.

---

## 2. Immediate Containment
1. **Verify Paystack System Status:**
   - Inspect Paystack status page (https://status.paystack.com).
2. **Preserve Webhook Invariant:**
   - NEVER trust client redirects or URL parameters to activate subscriptions.
   - All value delivery requires verified HMAC-SHA512 webhook signature or authoritative server-to-server verification (`/transaction/verify/:reference`).

---

## 3. Diagnostic Procedures
1. Check structured billing logs:
   ```bash
   # Filter logs by service="billing" and eventName="paystack_webhook"
   ```
2. Inspect `public.paystack_webhook_receipts` table for pending or failed events:
   ```sql
   SELECT id, event_type, reference, status, error_message, created_at 
   FROM public.paystack_webhook_receipts 
   WHERE status = 'FAILED' OR status = 'PROCESSING'
   ORDER BY created_at DESC LIMIT 20;
   ```
3. If signature verification is failing:
   - Verify that `PAYSTACK_SECRET_KEY` in server environment matches the active Paystack account mode (Test vs Live).

---

## 4. Remediation & Reconciliation
- **Scenario A: Webhook Delivery Delayed by Provider**
  - Use Platform Admin Billing view (`/admin/billing/subscriptions`) or manual reconciliation endpoint to query Paystack `/transaction/verify/:ref` server-side.
  - On 200 verification from Paystack, update subscription to `active` via canonical server service (`SubscriptionService.activate`).
- **Scenario B: Webhook Failed Due to Temporary DB Timeout**
  - Query Paystack API to confirm payment status.
  - Re-process receipt idempotently via `RecoveryVerificationService.reconcilePaystackState`.
  - Zero double-charging occurs.

---

## 5. Verification & Return to Service
1. Confirm customer business subscription reflects `active` status with correct billing cycle end date.
2. Confirm zero unauthorized manual mutations to accounting ledgers ($\Delta 0$).
3. Record billing incident log and notify platform owner.
