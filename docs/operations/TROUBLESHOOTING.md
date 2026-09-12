# NNOO — Production Operations Troubleshooting Guide

Document ID: `TSHOOT-01`  
Governance Version: `1.0.0`  
Last Reconciled: `2026-08-20` (Tranche 4 Prompt 12 Handover)  
Status: **Authoritative Troubleshooting Guide**

---

## 1. Golden Rules of Troubleshooting

> [!CAUTION]
> **STRICT PROHIBITION ON UNSAFE REPAIRS:**  
> When resolving operational symptoms:
> - **NEVER** manually edit `journal_entries` or `journal_lines` in the database to adjust totals.
> - **NEVER** disable Row-Level Security (RLS) on any table.
> - **NEVER** paste `SUPABASE_SERVICE_ROLE_KEY` or `PAYSTACK_SECRET_KEY` into browser consoles.
> - **NEVER** delete sales, expenses, invoices, or payment rows to "clean" data (use canonical refunds/reversals).

---

## 2. Symptom Diagnosis & Resolution Catalog

### 2.1 "User cannot log in or email confirmation fails"
- **Cause:** Supabase Auth redirect URL misconfiguration or expired link.
- **Check:** Verify Supabase Auth Site URL is set strictly to `https://nnoo.app` with redirect URI `https://nnoo.app/auth/callback`.
- **Action:** Resend confirmation email from the sign-in screen; verify user profile exists in `profiles`.

### 2.2 "Staff invitation link returns invalid or expired"
- **Cause:** Token already consumed, expired (> 7 days), or recipient email mismatch.
- **Check:** Query `invitations` table for `token_hash` and `consumed_at` timestamp.
- **Action:** Have the business owner issue a fresh invitation from `/app/[businessSlug]/settings/team`.

### 2.3 "Dashboard sales, profit, or inventory numbers look wrong"
- **Cause:** Unreconciled transactions or pending refunds.
- **Diagnosis Process:** Follow [11-financial-integrity-incident.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/11-financial-integrity-incident.md).
  1. Inspect the source `sales` and `expenses` tables for the business ID.
  2. Sum the underlying `journal_lines` to verify double-entry debits equal credits.
  3. Identify missing or duplicate source transactions; post compensating canonical entries.

### 2.4 "Sale recorded but inventory stock quantity did not decrease"
- **Cause:** Product was created with `is_tracked = false` (service item), or database transaction rolled back.
- **Check:** Inspect `products.is_tracked` and `inventory_movements` for the `product_id`.
- **Action:** If the product should be tracked, enable inventory tracking in product settings and record a stock receipt.

### 2.5 "AI Bookkeeper returns error or fails to suggest categories"
- **Cause:** `AI_ENABLED="false"`, Google Gemini API rate limit, or invalid API key.
- **Check:** Verify `GEMINI_API_KEY` is set in Vercel. Check Vercel server logs for `@google/genai` errors.
- **Action:** If Gemini is degraded, users can still enter categories manually. Follow [13-gemini-ai-outage.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/13-gemini-ai-outage.md).

### 2.6 "Ask NNOO returns 'Service temporarily unavailable'"
- **Cause:** Network timeout to Google Gemini or temporary database connection pool exhaustion.
- **Action:** Ask NNOO automatically falls back to an informative message. Core business reports remain accessible under `/reports`.

### 2.7 "Credit Passport PDF export fails to download"
- **Cause:** Missing snapshot data or `@react-pdf/renderer` font loading issue.
- **Check:** Verify snapshot exists in `credit_passport_snapshots` with valid JSON payload.
- **Action:** Re-generate snapshot if corrupted; download from desktop browser.

### 2.8 "Mobile Push notifications not arriving on device"
- **Cause:** User has not granted notification permissions, device token expired, or user muted category in preferences.
- **Check:** Query `push_device_installations` for active device token under `user_id`. Check `user_notification_preferences`.
- **Action:** Have user toggle Push permissions in device settings and re-login to register a fresh token.

### 2.9 "WhatsApp bot not responding to commands"
- **Cause:** Meta Cloud API token expired, webhook signature verification failed, or phone number unlinked.
- **Check:** Verify `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_APP_SECRET` in Vercel. Follow [16-whatsapp-business-outage.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/16-whatsapp-business-outage.md).
- **Action:** If unlinked, generate a fresh 6-digit link code at `/app/[businessSlug]/settings/whatsapp`.

### 2.10 "Paystack subscription not activating after successful card charge"
- **Cause:** Delayed webhook delivery or webhook signature mismatch.
- **Check:** Inspect Paystack Merchant Dashboard Webhooks log for `/api/v1/webhooks/paystack` response code.
- **Action:** Navigate to `/app/[businessSlug]/settings/billing/callback` to trigger manual server verification with the transaction reference.
