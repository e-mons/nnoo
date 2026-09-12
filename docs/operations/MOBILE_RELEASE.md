# NNOO — Mobile Release & Store Submission Guide

Document ID: `MOB-REL-01`  
Governance Version: `1.0.0`  
Last Reconciled: `2026-08-20` (Tranche 4 Prompt 12 Handover)  
Status: **Authoritative Mobile Release Guide**

---

## 1. Mobile Application Specifications

| Parameter | Android Specification | iOS Specification | Configuration File |
|---|---|---|---|
| **Package / Bundle ID** | `com.nnoo.mobile` | `com.nnoo.mobile` | `apps/mobile/app.json` |
| **Release Version** | `1.0.0` | `1.0.0` | `apps/mobile/app.json` |
| **Build Identifier** | `versionCode: 1` | `buildNumber: "1"` | `apps/mobile/app.json` |
| **Target SDK / API** | Target SDK 35 (Android 15) | iOS 16.0+ Deployment Target | `apps/mobile/app.json` |
| **Build Engine** | Expo Application Services (EAS) | EAS Cloud Build | `apps/mobile/eas.json` |
| **EAS Project ID** | `8b92b6a2-6f17-48f5-a08c-9a4f65c19e42` | `8b92b6a2-6f17-48f5-a08c-9a4f65c19e42` | `apps/mobile/app.json` |

---

## 2. EAS Production Build Commands

To generate signed production release candidates:

### 2.1 Android App Bundle (AAB)
```bash
cd apps/mobile
eas build --platform android --profile production
```
*(Produces an optimized `.aab` binary for Google Play Console upload).*

### 2.2 iOS App Archive (IPA)
```bash
cd apps/mobile
eas build --platform ios --profile production
```
*(Produces a signed `.ipa` binary for Apple TestFlight / App Store upload).*

---

## 3. Store Compliance & Account Deletion

To comply with Apple App Store Guideline 5.1.1(v) and Google Play Data Safety policies:
- **In-App Deletion:** Accessible at `apps/mobile/app/(app)/settings.tsx` $\to$ **"Delete Account"**.
- **Public Web Deletion Resource:** Available at `https://nnoo.app/account-deletion`.
- **Last-Owner Protection:** If the user is the sole active owner of an operating business, deletion is blocked until an alternate owner is designated or the business is closed.
- **Statutory Financial Retention:** Personal identity and credentials are removed, while statutory financial journal records remain immutable ($\Delta 0$).

---

## 4. App Store & Google Play Submission Steps

When authorized by David Bako to submit the release candidate to public app stores:
1. Review the complete store listing copy in [MOBILE_STORE_LISTING_READINESS.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/MOBILE_STORE_LISTING_READINESS.md).
2. Upload the production AAB to Google Play Console (Closed/Open Testing track).
3. Complete the Google Play Data Safety declaration matching the privacy matrix.
4. Upload the production IPA to App Store Connect (TestFlight).
5. Complete the Apple App Privacy questionnaire matching the privacy disclosures.
6. Provide demo account credentials in the reviewer notes.
