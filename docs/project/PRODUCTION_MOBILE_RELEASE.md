# NNOO Production Mobile Release Manifest

**Release Document ID:** `RELEASE-MOBILE-20260819-01`  
**Governance Pack Version:** 1.0.0  
**Release Candidate Status:** **ACCEPTED & READY FOR STORE SUBMISSION**  
**Release Date / Time:** 2026-08-19 14:00:00 UTC  
**Platform Owner & Lead Mobile Engineer:** David Bako  
**Target Application:** `apps/mobile` ONLY  
**Related Documents:** `MOBILE_STORE_LISTING_READINESS.md`, `PRODUCTION_WEB_RELEASE.md`, `PRODUCTION_ENVIRONMENT_CONFIGURATION.md`, `DATA_PROTECTION_AND_RECOVERY.md`

---

## 1. Application Identity & Versioning

| Parameter | Android (Google Play) | iOS (App Store) | Verification Method |
|---|---|---|---|
| **Application Name** | `NNOO` | `NNOO` | Verified in `app.json` |
| **Package / Bundle Identifier** | `com.nnoo.mobile` | `com.nnoo.mobile` | Verified in `app.json` |
| **App Version** | `1.0.0` | `1.0.0` | Verified in `app.json` / `package.json` |
| **Version Code / Build Number** | `1` (`versionCode: 1`) | `1` (`buildNumber: "1"`) | Verified in `app.json` |
| **Expo SDK** | `54.0.0` | `54.0.0` | Pinned in `package.json` |
| **React Native Version** | `0.81.5` | `0.81.5` | Pinned in `package.json` |
| **Expo Project ID** | `8b92b6a2-6f17-48f5-a08c-9a4f65c19e42` | `8b92b6a2-6f17-48f5-a08c-9a4f65c19e42` | Configured in `app.json` `extra.eas` |
| **Release Commit SHA** | `69b8cc8` | `69b8cc8` | Git HEAD on `main` |

---

## 2. Production Environment & Canonical Backend Binding

| Parameter | Configuration Value | Status |
|---|---|---|
| **Mobile Runtime Environment** | `APP_ENV=production` | Verified in `eas.json` production profile |
| **Canonical Supabase URL** | `https://hoorlxgtnamwdxszsbwt.supabase.co` | Identical to Web Production backend |
| **Supabase Anon Key** | Client-safe public key (Protected by Postgres RLS) | Injected via `EXPO_PUBLIC_SUPABASE_ANON_KEY` |
| **Canonical Web URL** | `https://nnoo.app` | Bound for deep links and auth callbacks |
| **Development Backend Fallback** | **STRICTLY PROHIBITED** | Verified: zero `localhost` or dev fallback in prod |
| **Privileged Server Secrets** | **STRICTLY ABSENT (0 found)** | Verified: zero service-role, Paystack, Gemini keys |

---

## 3. Platform Build Specifications & Store Compliance

### 3.1 Android (Google Play)
- **Target Distribution:** Android App Bundle (`.aab`) via EAS Build.
- **Android Target API Level:** API 35 (Android 15) / Min API 24 (Android 7.0). Fully satisfies Google Play target API requirement for August 2026 submissions.
- **Application Signing:** Google Play App Signing with secure EAS-managed release keystore (zero private keys in Git repository).
- **Permissions Audit:**
  - `RECEIVE_BOOT_COMPLETED`: Required for scheduling local offline notification triggers.
  - `POST_NOTIFICATIONS`: Contextually requested at runtime for priority business alerts.
  - *Unnecessary permissions removed:* Zero Camera, Microphone, Contacts, or Background Location permissions.
- **Deep Links & Android App Links:**
  - Scheme: `nnoo://`
  - App Links: `https://nnoo.app/passport/*` and `https://nnoo.app/app/*` (`autoVerify: true`).

### 3.2 iOS (Apple App Store)
- **Target Distribution:** Production App Store archive (`.ipa`) via EAS Build.
- **iOS Deployment Target:** iOS 15.1+.
- **Application Signing:** Apple Distribution Certificate & App Store Provisioning Profile managed via EAS credentials.
- **Entitlements Audit:**
  - `aps-environment`: `production` (Push Notifications).
  - `com.apple.developer.associated-domains`: `applinks:nnoo.app`.
- **Privacy Manifest:** Configured per Apple required-reason API specifications for User Defaults and File Timestamp access.

---

## 4. Visual Assets & Production Branding

| Asset | File Path | Resolution / Quality | Theme Background |
|---|---|---|---|
| **App Icon** | `apps/mobile/assets/icon.png` | 1024x1024 PNG | `#0A0D14` Dark |
| **Android Adaptive Icon** | `apps/mobile/assets/android-icon-foreground.png` | 1024x1024 PNG (Safe Zone Centered) | `#0A0D14` Dark |
| **Splash Screen** | `apps/mobile/assets/splash-icon.png` | High-res vector render | `#0A0D14` Dark |
| **Web Favicon** | `apps/mobile/assets/favicon.png` | 48x48 PNG | Dark Brand Icon |

---

## 5. Store Policy Readiness & User Rights

1. **Account Deletion:**
   - **In-App Initiation:** Implemented in `apps/mobile/app/(app)/settings.tsx` under "Account & Privacy".
   - **Web Deletion Resource:** Publicly accessible at `https://nnoo.app/account-deletion`.
   - **Data Handling Invariant:** Personal credentials, push device registrations, and WhatsApp connections are purged; business financial accounting records remain preserved ($\Delta 0$).
   - **Last Owner Protection:** Sole owners cannot delete personal accounts without transferring business ownership or initiating formal business closure.
2. **In-App Purchases & SaaS Billing:**
   - Mobile app displays current subscription tier and feature entitlements.
   - Subscription upgrades redirect to verified web checkout at `https://nnoo.app/app/[slug]/settings/billing` in accordance with Apple/Google multiplatform business management guidelines.
3. **Data Safety & Privacy Disclosures:**
   - Complete Apple App Privacy and Google Play Data Safety matrices authored in `MOBILE_STORE_LISTING_READINESS.md`.
   - Public Privacy Policy URL: `https://nnoo.app/privacy`.

---

## 6. Financial Integrity Audit ($\Delta 0$)

| Financial Entity | Pre-Build Count | Post-Build Count | Delta |
|---|---|---|---|
| **Sales** | 0 | 0 | **$\Delta 0$** |
| **Expenses** | 0 | 0 | **$\Delta 0$** |
| **Payments** | 0 | 0 | **$\Delta 0$** |
| **Refunds** | 0 | 0 | **$\Delta 0$** |
| **Inventory Movements** | 0 | 0 | **$\Delta 0$** |
| **Invoices** | 0 | 0 | **$\Delta 0$** |
| **Journal Entries** | 0 | 0 | **$\Delta 0$** |

*Verified: Zero mock financial data embedded in mobile bundles. Zero live Paystack charges executed. Zero customer push notifications dispatched.*
