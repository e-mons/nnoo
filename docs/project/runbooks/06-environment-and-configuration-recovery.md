# Runbook 06: Environment & Provider Configuration Recovery

**Owner:** Platform Operations & Security  
**Audience:** Platform Admin / Infrastructure Engineer  
**Severity:** HIGH (Configuration Loss)  

---

## 1. Overview & Principles

Defines how to reconstruct environment variables and external provider secrets in the event of platform configuration loss (e.g. Vercel project reconfiguration, EAS credentials loss).

> [!IMPORTANT]
> **SECRETS ARE NEVER STORED IN REPOSITORY DOCUMENTS.**  
> Lost secrets must be rotated/re-issued directly from provider portals and updated in secure vaults.

---

## 2. Configuration Recovery Inventory

| Environment Variable | System / Purpose | Managed Where | Recovery / Rotation Action | Secret in Docs? |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API Endpoint | Vercel / EAS | Copy from Supabase Project Settings. | NO (Public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Client JWT Key | Vercel / EAS | Copy from Supabase API Settings. | NO (Public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Database Access | Vercel Secret Store | Re-issue from Supabase API settings if compromised. | **NO (REDACTED)** |
| `PAYSTACK_SECRET_KEY` | Paystack Server Charges | Vercel Secret Store | Re-generate API secret in Paystack Dashboard. | **NO (REDACTED)** |
| `PAYSTACK_PUBLIC_KEY` | Paystack Inline Checkout | Vercel / EAS | Copy from Paystack API keys. | NO (Public) |
| `PAYSTACK_WEBHOOK_SECRET` | Webhook HMAC Validation | Vercel Secret Store | Copy/update webhook signing key in Paystack Dashboard. | **NO (REDACTED)** |
| `GEMINI_API_KEY` | Google GenAI Client | Vercel Secret Store | Re-issue API Key in Google AI Studio. | **NO (REDACTED)** |
| `INNGEST_SIGNING_KEY` | Durable Job Execution | Vercel Secret Store | Re-issue in Inngest Cloud Dashboard. | **NO (REDACTED)** |
| `WHATSAPP_API_TOKEN` | Meta WhatsApp Cloud API | Vercel Secret Store | Re-generate System User Access Token in Meta Business Suite. | **NO (REDACTED)** |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Meta Webhook Handshake | Vercel Secret Store | Set matching verification string in Meta Developer portal. | **NO (REDACTED)** |

---

## 3. Secret Rotation & Post-Recovery Validation

1. Populate environment variables in target platform (Vercel Project Settings $\to$ Environment Variables).
2. Redeploy Web application.
3. Test provider handshakes (Paystack webhook test ping, WhatsApp verify endpoint).
