# NNOO — Meta WhatsApp Business Platform Operations Guide

Document ID: `WA-OPS-01`  
Governance Version: `1.0.0`  
Last Reconciled: `2026-08-20` (Tranche 4 Prompt 12 Handover)  
Status: **Authoritative WhatsApp Guide**

---

## 1. Provider Topology & Architecture

NNOO integrates with the **Meta WhatsApp Business Platform (Cloud API v20.0)** to provide conversational business queries (**Ask NNOO**) and automated utility alert dispatches:

```text
┌───────────────────────────┐
│   WHATSAPP USER HANDSET   │
└─────────────┬─────────────┘
              │ Inbound Message (HTTPS)
              ▼
┌───────────────────────────┐
│     META GRAPH API v20    │
└─────────────┬─────────────┘
              │ Webhook POST /api/v1/webhooks/whatsapp
              ▼
┌───────────────────────────┐
│    NNOO WEB SERVER        │
│                           │
│  - HMAC-SHA256 Signature  │
│    Verification (x-hub)   │
│  - Deduplication Check    │
│  - Resolve Phone Lookup   │
│  - Execute Command / Query│
└───────────────────────────┘
```

---

## 2. Inbound Webhook Security & Signature Verification

- **Signature Header:** `x-hub-signature-256`
- **Verification Algorithm:** HMAC-SHA256 computed over raw request body bytes using `WHATSAPP_APP_SECRET`.
- **Rejection Policy:** Requests with invalid or missing signatures are immediately rejected with HTTP 400 with **zero backend processing**.

---

## 3. Cryptographic Account Linking Flow

> [!IMPORTANT]
> **A WHATSAPP PHONE NUMBER ALONE GRANTS ZERO ACCESS TO BUSINESS DATA.**  
> An incoming message from an unlinked phone number receives helpful setup instructions and cannot view any financial data.

### Secure Account Linking Process
1. Authenticated user navigates to `/app/[businessSlug]/settings/whatsapp` on Web or Mobile.
2. User clicks **"Link WhatsApp"** $\to$ server generates a cryptographic 6-digit numeric link code with a strict 10-minute TTL.
3. User messages the link code to the official NNOO WhatsApp Business number.
4. Server verifies code hash, associates the phone number HMAC with the authenticated `user_id`, and marks the connection active.

---

## 4. Deterministic Commands & WhatsApp Rules

The following standard commands execute deterministically with **zero Gemini calls**:

| Command | Action / Response | Operational Rule |
|---|---|---|
| `HELP` | Returns menu of available commands and usage instructions | 0 Gemini calls |
| `STOP` | **Unconditional User Opt-Out:** Pauses all outbound WhatsApp notifications immediately | **Inviolable:** Platform administrators cannot override user opt-out |
| `START` | Resumes WhatsApp notification deliveries for the linked number | Opt-in re-established |
| `BUSINESS` | Lists all linked businesses for the user account | Shows numbered list of businesses |
| `BUSINESS <n>` | Switches active conversational context to business number `n` | Updates session context |

---

## 5. Permanent WhatsApp Invariant: Zero Financial Mutation

WhatsApp is designed strictly as an **informational, notification, and read-only conversational interface**:
- Requests attempting to create sales, record expenses, issue refunds, or modify inventory quantities via WhatsApp are **strictly rejected**.
- Financial transactions must be executed through the authenticated Web or Mobile interfaces where explicit multi-field validation and confirmation occur.
