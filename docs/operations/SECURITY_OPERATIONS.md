# NNOO — Security Operations & Threat Mitigation Guide

Document ID: `SEC-OPS-01`  
Governance Version: `1.0.0`  
Last Reconciled: `2026-08-20` (Tranche 4 Prompt 12 Handover)  
Status: **Authoritative Security Operations Guide**

---

## 1. Multi-Tenant Isolation & RLS Governance

Multi-tenant data isolation is the cornerstone of NNOO’s security architecture:
- **100% Active RLS:** All 60 business-owned PostgreSQL tables enforce Row-Level Security.
- **Tenant Context Verification:** Every database policy resolves the tenant boundary by checking `business_memberships` for `user_id = auth.uid()` and `status = 'active'`.
- **Periodic RLS Auditing:** Run automated multi-tenant adversarial test suites to verify zero cross-tenant data leaks:
  ```bash
  pnpm test
  ```

---

## 2. Platform Admin Boundary & Privilege Separation

- **Administrative Route Separation:** `/admin` routes require the authenticated user to hold the `platform_admin` role in `profiles.is_platform_admin`.
- **Normal User Route Denial:** Standard business users attempting to access `/admin` receive an immediate HTTP 403 Forbidden response.
- **Client Service-Role Exclusion:** The `SUPABASE_SERVICE_ROLE_KEY` is restricted strictly to server-side background handlers and is **NEVER** exposed to client browsers or mobile devices.

---

## 3. Incident Response for Compromised Mobile Handset

If a user reports a lost or stolen mobile phone:
1. **Revoke Active User Sessions:** In Supabase Dashboard $\to$ **Authentication** $\to$ **Users**, locate the user and click **"Sign Out All Sessions"**.
2. **Deactivate Push Device Tokens:** In the database, execute:
   ```sql
   UPDATE public.push_device_installations 
   SET is_active = false 
   WHERE user_id = '<COMPROMISED_USER_UUID>';
   ```
3. **Unlink WhatsApp Connection (if applicable):** Disconnect the user's WhatsApp number linkage from the business workspace.

---

## 4. Suspicious Inbound Webhooks & Secret Exposure

- **Forged Webhook Detection:** Inbound webhooks for Paystack (`x-paystack-signature`) and WhatsApp (`x-hub-signature-256`) that fail HMAC validation are rejected immediately with HTTP 400.
- **Emergency Secret Rotation:** If any production secret (`SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY`, `GEMINI_API_KEY`, `WHATSAPP_ACCESS_TOKEN`, `INNGEST_SIGNING_KEY`) is suspected of compromise, follow the comprehensive step-by-step procedures in [18-secret-rotation.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/18-secret-rotation.md).
