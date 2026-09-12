# NNOO — Verified Production Identifiers Reference

Document ID: `PROD-ID-01`  
Governance Version: `1.0.0`  
Last Reconciled: `2026-08-20` (Tranche 4 Prompt 12 Handover)  
Status: **Authoritative Production Identifiers Reference**

---

## 1. Safe Production Identifiers

This document catalogs all verified, non-secret resource identifiers, domain bindings, application IDs, and service endpoints across the NNOO production deployment.

> [!IMPORTANT]
> This document contains public and administrative resource identifiers only. It contains **ZERO** secret keys, private credentials, or database passwords.

---

## 2. Infrastructure & Hosting Identifiers

| Parameter | Production Value | Description |
|---|---|---|
| **Production Canonical Apex Domain** | `https://nnoo.app` | Primary public web address |
| **Vercel Project Identifier** | `nnoo` | Web application deployment project on Vercel |
| **Vercel Monorepo Root Directory** | `./` | Build execution root (configured in `vercel.json`) |
| **Production Git Release SHA** | `69b8cc8f21091676b72758801cc410ba38db34f6` | Git commit SHA of the accepted release candidate |
| **Supabase Project Reference** | `hoorlxgtnamwdxszsbwt` | Supabase managed cloud project ID |
| **Supabase API Gateway URL** | `https://hoorlxgtnamwdxszsbwt.supabase.co` | Base REST / GraphQL / Realtime endpoint |
| **Database Engine & Version** | PostgreSQL 15.x | Core relational database engine |
| **Latest Applied Migration** | `20260901000000_performance_index_optimization.sql` | 34th immutable database migration |

---

## 3. Mobile Application & Store Identifiers

| Parameter | Production Value | Description |
|---|---|---|
| **Android Package Name / App ID** | `com.nnoo.mobile` | Google Play package identifier |
| **Android Target SDK Version** | `35` (Android 15) | Configured in `apps/mobile/app.json` |
| **Android Version Code** | `1` | Release version code |
| **iOS Bundle Identifier** | `com.nnoo.mobile` | Apple App Store Connect bundle ID |
| **iOS Build Number** | `"1"` | Release build number |
| **Release Version String** | `1.0.0` | Semantic version string across Android & iOS |
| **Expo / EAS Project ID** | `8b92b6a2-6f17-48f5-a08c-9a4f65c19e42` | EAS cloud build project identifier |
| **Universal Link Domain** | `nnoo.app` | iOS Universal Links & Android App Links domain |
| **EAS Build Profile** | `production` | Defined in `apps/mobile/eas.json` |

---

## 4. Provider & Integration Identifiers

| Provider | Identifier / Parameter | Value / Specification |
|---|---|---|
| **Google Gemini AI** | Runtime Model Identifier | `gemini-2.5-flash` |
| **Google Gemini AI** | SDK Package | `@google/genai` (v2.17.1) |
| **Inngest Cloud** | Application Name | `nnoo` |
| **Inngest Cloud** | Serverless Endpoint Path | `/api/inngest` |
| **Meta WhatsApp** | Graph API Version | `v20.0` |
| **Meta WhatsApp** | Inbound Webhook Path | `/api/v1/webhooks/whatsapp` |
| **Paystack Billing** | Live Webhook Path | `/api/v1/webhooks/paystack` |
| **Paystack Billing** | Base Currency | `NGN` (Nigerian Naira, stored in Kobo) |
| **Expo Push** | Push Gateway Endpoint | `https://exp.host/--/api/v2/push/send` |
| **Public Account Deletion URL**| Apple/Google Store Compliance | `https://nnoo.app/account-deletion` |
