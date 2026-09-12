# NNOO — Handover Actions Required (Owner Action Matrix)

Document ID: `ACT-01`  
Governance Version: `1.0.0`  
Last Reconciled: `2026-08-20` (Tranche 4 Prompt 12 Handover)  
Status: **Authoritative Action Matrix**

---

## 1. Owner Action Principles

Certain administrative actions can only be executed by the legal business owner (**David Bako**) due to platform identity verification, legal terms agreements, or banking compliance regulations.

> [!NOTE]
> These actions represent standard post-handover operational administration. Because all technical code, build candidates, configurations, and test suites are 100% verified in the repository, **none of these external owner actions block technical project handover or Tranche 4 closeout.**

---

## 2. Outstanding Owner Action Registry

| Action ID | Action Description | Provider / Platform | Responsible Actor | Blocks Web Prod? | Blocks Store Submit? | Blocks P13 Acceptance? |
|---|---|---|---|:---:|:---:|:---:|
| **ACT-01** | Accept Vercel Team Owner invitation and verify billing card | Vercel | David Bako | No | No | **No** |
| **ACT-02** | Confirm Supabase Organization Owner role and verify PITR backup retention | Supabase | David Bako | No | No | **No** |
| **ACT-03** | Verify Paystack Live settlement bank account for NNOO SaaS revenue disbursements | Paystack | David Bako | No | No | **No** |
| **ACT-04** | Confirm Google Cloud Project IAM Owner role for Gemini AI API billing | Google Cloud | David Bako | No | No | **No** |
| **ACT-05** | Confirm Meta Business Manager Admin access for official WABA phone number | Meta Business | David Bako | No | No | **No** |
| **ACT-06** | Accept Apple Developer Program annual agreement and grant App Store Connect roles | Apple Developer | David Bako | No | **Yes** | **No** |
| **ACT-07** | Create Google Play Developer account and upload production Android App Bundle | Google Play | David Bako | No | **Yes** | **No** |
| **ACT-08** | Rotate developer-provided temporary API keys following account takeover | All Providers | David Bako | No | No | **No** |
