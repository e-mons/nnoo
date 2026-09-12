# Runbook 15: Push Notification Outage Response

**Severity:** SEV-3 (Medium - Messaging Degraded)  
**Target:** Expo Push Notification Service, Apple APNs, Google FCM & Device Token Management  
**Authority:** David Bako (NNOO Lead Developer / Platform Owner)

---

## 1. Operating Invariant
> **Push delivery failure must NEVER compromise In-App notifications or core business operations.**
> Canonical notifications remain fully visible in the In-App Attention Center even if all push services are down.

---

## 2. Trigger Conditions
- Expo Push API returns 5xx or `DeviceNotRegistered` error rate > 20%.
- Mobile users report not receiving push notifications for attention events or low-stock alerts.
- APNs / FCM production credentials expired or invalid.

---

## 3. Diagnostic Steps
1. Inspect structured messaging logs (`service: "push"`).
2. Check Expo Push Service status (https://status.expo.dev).
3. Query `public.user_push_devices` for invalid / inactive device tokens:
   ```sql
   SELECT user_id, device_token, platform, is_active, last_seen_at 
   FROM public.user_push_devices 
   WHERE is_active = true ORDER BY last_seen_at DESC LIMIT 20;
   ```
4. Differentiate between:
   - **Scenario A (Device Specific):** User uninstalled app or revoked push permissions (`DeviceNotRegistered`).
   - **Scenario B (Systemic Provider Failure):** Expo / APNs / FCM service outage.

---

## 4. Remediation Procedures
- **Invalid Token Deactivation:**
  - When Expo returns `DeviceNotRegistered`, mark `is_active = false` immediately.
  - Do NOT repeatedly attempt push delivery to uninstalled devices.
- **Provider Outage:**
  - Allow push notifications to fail gracefully (fail-open).
  - Do NOT backlog or storm-retry thousands of stale push notifications when service resumes.
- **Credential Rotation:**
  - If APNs / FCM certificate expired, generate new keys in Apple Developer / Firebase Console and update EAS secrets (T4-P09).

---

## 5. Verification
1. Send test push notification from development console to verified test device.
2. Confirm device receives alert and tapping deep-link navigates safely with valid session.
3. Confirm zero impact on business ledger data ($\Delta 0$).
