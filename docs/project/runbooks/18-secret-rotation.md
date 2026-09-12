# NNOO Operational Runbook 18: Production Secret Rotation & Credential Lifecycle

**Document ID:** `RUNBOOK-18`  
**Governance Pack:** 1.0.0  
**Status:** **AUTHORITATIVE**  
**Audience:** Platform Owner (David Bako), Infrastructure & Operations Engineers  
**Related Documents:** `ENVIRONMENT_AND_SECRETS.md`, `PRODUCTION_ENVIRONMENT_CONFIGURATION.md`, `OBSERVABILITY_AND_INCIDENT_MANAGEMENT.md`  

---

## 1. Overview & Rotation Principles

This runbook defines the standard operating procedures for rotating, re-issuing, and revoking production credentials across all NNOO external providers.

### Core Rules:
1. **Never Extract from Backup Files:** Lost or compromised credentials must always be rotated or re-issued directly from the upstream provider dashboard, never searched in plaintext backups or git history.
2. **Zero Plaintext Credentials:** Secrets must never be communicated in chat, ticketing systems, pull requests, commit messages, or unencrypted documentation.
3. **No Unplanned Invalidation:** Always stage replacement credentials in the runtime environment manager (Vercel / Supabase / EAS) before revoking the previous credential to avoid customer disruption.
4. **Immediate Compromise Response:** If an active production secret is committed to a public repository, exposed in a client bundle, or exfiltrated, initiate **Emergency Rotation (SEV-1)** immediately.

---

## 2. Universal 7-Step Rotation Lifecycle

```text
[1. Identify] ──> [2. Issue Replacement] ──> [3. Stage in Vault] ──> [4. Smoke Validate]
                                                                            │
[7. Audit Log] <── [6. Telemetry Monitor] <── [5. Revoke Previous] <────────┘
```

1. **Identify:** Determine the specific credential, provider, affected environment (Production vs Preview), and impacted services.
2. **Issue Replacement:** Generate a new cryptographically secure credential within the official upstream provider dashboard.
3. **Stage in Vault:** Update the encrypted environment variable in Vercel, Supabase Vault, or EAS Secrets.
4. **Smoke Validate:** Trigger a canary request or verify component health (`/api/v1/health`) to confirm the new credential operates cleanly without authorization failures.
5. **Revoke Previous:** Revoke, delete, or deactivate the old credential in the upstream provider dashboard.
6. **Telemetry Monitor:** Monitor structured logs for 30 minutes to verify zero `401 Unauthorized` or `403 Forbidden` provider errors.
7. **Audit Log:** Record the rotation event (timestamp, provider, credential category, operator, reason) in the platform maintenance log without recording the secret value.

---

## 3. Provider-Specific Rotation Runbooks

### 3.1 Supabase Service Role Key (`SUPABASE_SERVICE_ROLE_KEY`)
- **Impact:** Server-side background jobs, admin billing overrides, auth admin client.
- **Location:** Vercel Production Environment Variables.
- **Procedure:**
  1. Access **Supabase Dashboard** -> Project Settings -> **API**.
  2. Under Project API Keys, locate `service_role` secret and click **Roll Key / Generate New**.
  3. Copy new service role key.
  4. Navigate to **Vercel Dashboard** -> Project Settings -> **Environment Variables**.
  5. Edit `SUPABASE_SERVICE_ROLE_KEY` for `Production` scope.
  6. Trigger a redeployment of the web application (`vercel redeploy`).
  7. Verify `/api/v1/health` reports `database: HEALTHY` and `coreApi: HEALTHY`.
  8. Delete/invalidate the old service role key in Supabase.

### 3.2 Paystack Live Secret Key (`PAYSTACK_SECRET_KEY`)
- **Impact:** SaaS subscription checkout initialization, transaction verification, webhook HMAC checks.
- **Location:** Vercel Production Environment Variables.
- **Procedure:**
  1. Access **Paystack Dashboard** -> Settings -> **API Keys & Webhooks**.
  2. Under Live Secret Key, generate a new live secret key (`sk_live_...`).
  3. Update `PAYSTACK_SECRET_KEY` in Vercel Production Environment Variables.
  4. Redeploy Web application.
  5. Verify `/api/v1/health` reports `paystackBilling: HEALTHY`.
  6. In Paystack Dashboard, revoke the previous secret key.
  7. Verify webhook signature verification continues to match inbound events.

### 3.3 Google Gemini AI API Key (`GEMINI_API_KEY`)
- **Impact:** AI Bookkeeper classification, Smart Insights generation, Ask NNOO assistant, Health score explanations.
- **Location:** Vercel Production Environment Variables.
- **Procedure:**
  1. Access **Google AI Studio** / **Google Cloud Console** -> API Keys.
  2. Create a new API Key with restricted scope to Gemini API.
  3. Update `GEMINI_API_KEY` in Vercel Production Environment Variables.
  4. Redeploy Web application.
  5. Test canary AI explanation or run automated health check.
  6. Delete old API Key in Google Cloud Console.

### 3.4 Meta WhatsApp Access Token & App Secret (`WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_APP_SECRET`)
- **Impact:** Inbound WhatsApp webhook message processing, outbound notifications.
- **Location:** Vercel Production Environment Variables.
- **Procedure:**
  1. Access **Meta Business Suite** -> Business Settings -> **System Users**.
  2. Select the NNOO System User and generate a new permanent token with `whatsapp_business_messaging` and `whatsapp_business_management` permissions.
  3. Update `WHATSAPP_ACCESS_TOKEN` in Vercel Production Environment.
  4. If App Secret was rotated, update `WHATSAPP_APP_SECRET` and ensure webhook HMAC SHA-256 validation matches.
  5. Redeploy Web application.
  6. Revoke old system user token in Meta Business Manager.

### 3.5 Inngest Signing & Event Keys (`INNGEST_SIGNING_KEY`, `INNGEST_EVENT_KEY`)
- **Impact:** Durable background job execution, scheduled automations, attention event scans.
- **Location:** Vercel Production Environment Variables.
- **Procedure:**
  1. Access **Inngest Cloud Dashboard** -> Manage Apps -> `nnoo-web` -> **Keys**.
  2. Issue new Signing Key and Event Key.
  3. Update `INNGEST_SIGNING_KEY` and `INNGEST_EVENT_KEY` in Vercel Production Environment.
  4. Redeploy Web application.
  5. Sync app endpoints in Inngest Cloud.
  6. Delete old keys in Inngest Cloud.

### 3.6 Expo Push Access Token (`EXPO_ACCESS_TOKEN`)
- **Impact:** Dispatch of push notifications to Expo Push service for mobile devices.
- **Location:** Vercel Production Environment Variables.
- **Procedure:**
  1. Access **Expo Dashboard** (expo.dev) -> Account Settings -> **Access Tokens**.
  2. Create new Access Token named `nnoo-production-push`.
  3. Update `EXPO_ACCESS_TOKEN` in Vercel Production Environment.
  4. Redeploy Web application.
  5. Delete expired/compromised token in Expo Dashboard.

### 3.7 Supabase Anonymous / Public Key (`NEXT_PUBLIC_SUPABASE_ANON_KEY` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`)
- **Impact:** Web browser authentication and Mobile app data fetching.
- **Note:** Because this key is bundled in client applications, rotating requires a coordinated release.
- **Procedure:**
  1. Generate new `anon` key in Supabase Dashboard.
  2. Update `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel and redeploy Web.
  3. Update `EXPO_PUBLIC_SUPABASE_ANON_KEY` in EAS Secrets and publish Mobile OTA update / EAS build.
  4. Allow 48-hour transition window for mobile clients to update before revoking old anon key in Supabase.

---

## 4. Emergency Rotation Checklist (Credential Compromise)

In the event of an active leak or suspected compromise:

- [ ] **Triage & Isolate:** Classify as **SEV-1 Security Incident**.
- [ ] **Generate Immediate Replacement:** Issue fresh credentials across affected providers immediately.
- [ ] **Inject & Deploy:** Apply to Vercel/EAS production vaults and force redeployment.
- [ ] **Immediate Revocation:** Revoke compromised credential in provider dashboard immediately (do not wait for maintenance windows).
- [ ] **Audit Provider Logs:** Review provider access logs for unauthorized API calls, unexpected data exports, or forged transactions.
- [ ] **Audit Database & Ledger:** Run financial reconciliation check to verify $\Delta 0$ unauthorized financial mutations across all tables.
- [ ] **Document Postmortem:** Author Incident Postmortem using `Runbook 17` template.
