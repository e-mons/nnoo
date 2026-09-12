# NNOO — Production Account Ownership & Access Matrix

Document ID: `PROD-OWN-01`  
Governance Version: `1.0.0`  
Last Reconciled: `2026-08-20` (Tranche 4 Prompt 12 Handover)  
Status: **Authoritative Ownership Reference**

---

## 1. Executive Ownership Policy

This document establishes the authoritative ownership, administrative access tiers, and operational responsibility across all third-party cloud platforms, SaaS providers, and infrastructure accounts powering NNOO.

### Permanent Handover Rules
1. **Zero Plaintext Credentials:** Handover documents record account identities, access levels, and transfer actions; they **NEVER** contain passwords, API tokens, private keys, or session cookies.
2. **Provider-Native Team Access:** Account transfers must be executed via official provider team management features (e.g. organization invites, role delegation, ownership transfer) rather than sharing personal login credentials.
3. **Multi-Admin Protection:** Every critical production service must maintain at least two authorized administrative accounts to eliminate single-point-of-failure (SPOF) risks.

---

## 2. Production Service Ownership Matrix

| Service / Platform | Resource / Project ID | Current Account / Role | Required Final Owner | Access Status | Handover & Transfer Action |
|---|---|---|---|---|---|
| **GitHub** | `davidbako/nnoo` | Lead Developer (`Owner`) | David Bako / NNOO Org | **Active / Controlled** | Ensure 2FA active; invite secondary engineering lead with Admin role. |
| **Domain Registrar / DNS** | `nnoo.app` | Registrar Account (`Owner`) | David Bako / NNOO Ops | **Active / Controlled** | Verify domain auto-renewal; document DNS zone management in Cloudflare/Registrar. |
| **Vercel** | Project: `nnoo` (Next.js 16.3) | Developer Team (`Owner`) | David Bako / NNOO Team | **Active / Deployed** | Invite David Bako as Team Owner; verify production domain binding `https://nnoo.app`. |
| **Supabase** | Prod: `hoorlxgtnamwdxszsbwt` | Developer Org (`Owner`) | David Bako / NNOO Org | **Active / Verified** | Invite David Bako to Supabase Organization as Owner; verify database backup settings. |
| **Paystack** | Merchant: NNOO Live Billing | Merchant Admin (`Owner`) | David Bako (Executive) | **Active / Live Ready** | Complete business verification; configure live bank settlement account for SaaS revenue. |
| **Google Cloud / Gemini** | Project: `nnoo-ai-production` | GCP Admin (`Owner`) | David Bako / NNOO Cloud | **Active / Verified** | Grant Owner role in Google Cloud Console; configure billing alert thresholds. |
| **Inngest Cloud** | Cloud App: `nnoo-production` | Workspace Admin (`Owner`) | David Bako / NNOO Ops | **Active / Verified** | Add secondary admin to Inngest organization; verify webhook signing key synchronization. |
| **Meta Business / WABA** | WABA: `NNOO WhatsApp` (API v20.0) | Meta Business Manager (`Admin`) | David Bako (Business Admin) | **Active / Verified** | Link official Meta Business verification; assign System User permissions for token rotation. |
| **Expo / EAS** | Project: `8b92b6a2-6f17-48f5-a08c-9a4f65c19e42` | Expo Account (`Owner`) | David Bako / NNOO Org | **Active / Verified** | Create EAS organization account `nnoo`; transfer project ownership; backup signing keys. |
| **Apple Developer** | Team: `com.nnoo.mobile` | Apple Developer Account | David Bako (Account Holder) | **Pending Store Submission** | Execute Apple Developer Program agreement; grant App Store Connect Admin access. |
| **Google Play Console** | App: `com.nnoo.mobile` | Play Console Account | David Bako (Account Owner) | **Pending Store Submission** | Complete Google Play developer registration; grant Release Manager permissions. |
| **Google FCM (Firebase)** | Project: `nnoo-mobile-push` | Firebase Admin (`Owner`) | David Bako / NNOO Cloud | **Active / Verified** | Link Firebase project to Google Play Developer account for push token routing. |
| **Transactional Email** | Provider: Supabase Managed Auth | Auth Settings Admin | David Bako (Admin) | **Active / Configured** | Verify custom SMTP configuration (Postmark/Resend) when scaling beyond free limits. |

---

## 3. Single-Point-of-Failure (SPOF) Risk Audit

| Service | Risk Level | Current Single Point of Failure | Recommended Mitigation |
|---|---|---|---|
| **Domain Registrar (`nnoo.app`)** | **HIGH** | Single registrar personal login | Enable hardware security key (FIDO2) 2FA; configure secondary technical contact email. |
| **Supabase Production** | **HIGH** | Single organization owner | Invite secondary co-administrator with Organization Admin permissions. |
| **Paystack Merchant Account** | **HIGH** | Single primary email | Configure multiple team members with distinct roles (Billing Admin, Developer, Support). |
| **Apple Developer Account** | **MEDIUM** | Account Holder identity constraint | Assign secondary user with Admin and App Manager roles in App Store Connect. |
| **Google Cloud Console** | **MEDIUM** | Single IAM owner | Assign Owner role to a secondary corporate Google Workspace administrator account. |

---

## 4. Provider Billing & Subscription Ownership

The ongoing operational infrastructure costs for NNOO must be funded through authorized corporate payment methods:

| Provider / Service | Billing Frequency | Current Plan Tier | Management URL | Billing Owner |
|---|---|---|---|---|
| **Vercel** | Monthly | Pro Team | `https://vercel.com/dashboard/billing` | David Bako / NNOO Finance |
| **Supabase** | Monthly | Pro Plan (with PITR backups) | `https://supabase.com/dashboard/org/_/billing` | David Bako / NNOO Finance |
| **Google Cloud (Gemini AI)** | Usage-based | Pay-as-you-go | `https://console.cloud.google.com/billing` | David Bako / NNOO Finance |
| **Inngest Cloud** | Monthly | Starter / Pro | `https://app.inngest.com/settings/billing` | David Bako / NNOO Finance |
| **Meta WhatsApp Business** | Usage-based | Standard Tier (Free tier + utility rate) | `https://business.facebook.com/billing_hub` | David Bako / NNOO Finance |
| **Expo / EAS** | Monthly | On-demand / Production | `https://expo.dev/accounts/_/billing` | David Bako / NNOO Finance |
| **Apple Developer Program** | Annual ($99/yr) | Enterprise / Organization | `https://developer.apple.com/account` | David Bako / NNOO Finance |
| **Google Play Console** | One-time ($25) | Developer Registration | `https://play.google.com/console` | David Bako / NNOO Finance |
| **Domain Name (`nnoo.app`)** | Annual | Standard Registration | Registrar Dashboard | David Bako / NNOO Finance |
