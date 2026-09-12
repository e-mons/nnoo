# NNOO — Paystack SaaS Subscription Billing Operations Guide

Document ID: `PAYSTACK-OPS-01`  
Governance Version: `1.0.0`  
Last Reconciled: `2026-08-20` (Tranche 4 Prompt 12 Handover)  
Status: **Authoritative Paystack Billing Guide**

---

## 1. System Boundary: SaaS Billing vs Business Accounting

> [!IMPORTANT]
> **PAYSTACK POWERS NNOO SAAS SUBSCRIPTION BILLING ONLY.**  
> Paystack is used to bill business owners for their NNOO SaaS software subscription tiers (Starter, Growth, Scale). It is strictly separated from a business's daily operational accounting ledgers.

---

## 2. Subscription Plans & Currency Mapping

All NNOO subscription plans are billed in Nigerian Naira (`NGN`) and calculated in Kobo:

| Plan Name | Plan Tier | Monthly Price (NGN) | Price in Kobo | Target Enterprise Profile |
|---|---|---|---|---|
| **Starter** | `STARTER` | ₦5,000 / mo | `500000` | Sole traders, single-user micro-businesses |
| **Growth** | `GROWTH` | ₦15,000 / mo | `1500000` | Growing businesses, multiple staff roles, AI Bookkeeper |
| **Scale** | `SCALE` | ₦35,000 / mo | `3500000` | High-volume retail, advanced multi-branch operations |

---

## 3. Server-Verified Checkout & Webhook Lifecycle

```text
[ Business Owner selects Plan ]
              │
              ▼
[ Server Initializes Checkout ] ──► POST https://api.paystack.co/transaction/initialize
              │
              ▼
[ Paystack Secure Hosted Modal ] ─► User authorizes payment with Card / Bank
              │
      ┌───────┴───────────────────────────────┐
      │ (Browser Redirect)                    │ (Server Webhook)
      ▼                                       ▼
[ Non-Authoritative Callback ]         [ HMAC-SHA512 Signed Webhook ]
- Route: /settings/billing/callback    - Route: /api/v1/webhooks/paystack
- Displays temporary "Verifying..."    - Header: x-paystack-signature
- Triggers server verification         - Validates Raw Body Bytes
      │                                       │
      └──────────────────┬────────────────────┘
                         │
                         ▼
             [ SERVER VERIFICATION GATE ]
             - Re-queries Paystack API: GET /transaction/verify/:ref
             - Checks: Status = "success"
             - Checks: Amount matches Plan price exactly
             - Checks: Currency = "NGN"
             - Checks: Business ID matches metadata
                         │
                         ▼
             [ IDEMPOTENT ENTITLEMENT ACTIVATION ]
             - Updates `subscriptions` row
             - Replayed webhooks return HTTP 200 without duplicate activations
```

---

## 4. Webhook Security & Idempotency Rules

1. **HMAC-SHA512 Verification:** Inbound webhooks at `/api/v1/webhooks/paystack` must validate the `x-paystack-signature` header using `PAYSTACK_SECRET_KEY`. Requests with forged or missing signatures are rejected with HTTP 400.
2. **Non-Authoritative Browser Callback:** The browser redirect URL is purely for user experience. Value delivery (activating the subscription) requires verified server-to-server confirmation.
3. **Replay Idempotency:** If Paystack re-sends a `charge.success` event, the handler detects the existing active subscription reference and returns HTTP 200 with **zero duplicate billing adjustments**.
4. **Live Mode Authorization Rule:** Executing real monetary transactions on Paystack Live requires explicit human operator authorization.
