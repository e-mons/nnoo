# NNOO — Maintenance & Dependency Upgrade Guide

Document ID: `MAINT-01`  
Governance Version: `1.0.0`  
Last Reconciled: `2026-08-20` (Tranche 4 Prompt 12 Handover)  
Status: **Authoritative Maintenance Guide**

---

## 1. Safe Dependency Upgrade Principles

NNOO enforces strict dependency governance:
- **No Automatic In-Flight Upgrades:** Never perform framework or major dependency upgrades during standard feature implementation.
- **Dedicated Upgrade Workflows:** Dependency upgrades must be executed in a dedicated, isolated branch using the official `safe-dependency-upgrade` workflow (`.agents/workflows/safe-upgrade.md`).
- **Strict Version Pinning:** Exact resolved dependency versions are pinned in `package.json` and `pnpm-lock.yaml`.

---

## 2. Framework & SDK Maintenance Protocols

### 2.1 Expo SDK Upgrades (Mobile)
1. Read the official Expo SDK release notes and breaking changes guide.
2. Upgrade Expo dependencies using the official CLI tool:
   ```bash
   cd apps/mobile && npx expo install --fix
   ```
3. Run Expo Doctor to verify native dependency compatibility:
   ```bash
   npx expo-doctor
   ```
4. Verify Android Target SDK requirements against Google Play policies.

### 2.2 Next.js & React Upgrades (Web)
1. Review Next.js upgrade guides for App Router and Turbopack compatibility.
2. Verify React 19 Server Actions and SSR cookie session handling (`@supabase/ssr`).
3. Run the full web production build and test suite (`pnpm run check && pnpm test`).

### 2.3 Google Gemini AI API Maintenance
1. Periodically check Google Cloud AI Studio for model release schedules.
2. NNOO currently pins `gemini-2.5-flash` via `GEMINI_MODEL_DEFAULT`.
3. When testing a newer model, evaluate structured JSON output schemas against `@nnoo/validation` Zod schemas before promoting to production.

### 2.4 Meta WhatsApp Graph API Version Maintenance
1. Meta supports each Graph API version for approximately 2 years. NNOO currently pins `v20.0`.
2. When upgrading the API version:
   - Update the version string in `apps/web/src/server/whatsapp/client.ts`.
   - Re-verify webhook payload schemas and utility template delivery receipts.

### 2.5 App Store Policy & Target SDK Compliance
- **Google Play:** Google requires new app submissions and updates to target the latest Android API level (currently Target SDK 35 / Android 15).
- **Apple App Store:** Ensure Apple App Privacy declarations and third-party SDK privacy manifests are updated prior to annual SDK cutoffs.
