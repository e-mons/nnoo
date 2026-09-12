# NNOO — Mobile Push Notifications Operations Guide

Document ID: `PUSH-OPS-01`  
Governance Version: `1.0.0`  
Last Reconciled: `2026-08-20` (Tranche 4 Prompt 12 Handover)  
Status: **Authoritative Push Operations Guide**

---

## 1. Provider Topology & Architecture

NNOO delivers native mobile push notifications through the **Expo Push Gateway**, which routes messages to Apple APNs (iOS) and Google FCM (Android):

```text
┌───────────────────────────┐
│     NNOO SERVER APP       │
│  (Next.js Job Worker)     │
└─────────────┬─────────────┘
              │ HTTP POST /--/api/v2/push/send
              ▼
┌───────────────────────────┐
│     EXPO PUSH GATEWAY     │
│   (https://exp.host)      │
└─────────────┬─────────────┘
              │
      ┌───────┴───────┐
      ▼               ▼
┌───────────┐   ┌───────────┐
│ APPLE APNs│   │GOOGLE FCM │
│   (iOS)   │   │ (Android) │
└─────┬─────┘   └─────┬─────┘
      │               │
      ▼               ▼
┌───────────────────────────┐
│     USER MOBILE DEVICE    │
│    (apps/mobile Native)   │
└───────────────────────────┘
```

---

## 2. Device Registration & Token Lifecycle

1. **Token Acquisition:** Upon mobile app startup, the native client requests permissions via `expo-notifications` and obtains a unique `ExponentPushToken[...]`.
2. **Server Registration:** The mobile client registers the token via `POST /api/v1/ai/push/devices`. The token is stored in `push_device_installations` strictly bound to the authenticated `user_id`.
3. **Logout Revocation:** When the user logs out, `POST /api/v1/ai/push/devices/revoke` marks the token `is_active: false`.
4. **Invalid Token Cleanup:** If the Expo gateway returns `DeviceNotRegistered`, the server immediately deactivates the token, preventing infinite delivery retry loops.

---

## 3. Important Delivery Semantics: Tickets vs Receipts

> [!NOTE]
> **EXPO PUSH TICKET $\neq$ DEVICE DELIVERY CONFIRMATION.**  
> An HTTP 200 `status: "ok"` ticket from the Expo gateway indicates that the message was accepted for delivery, **NOT** that it has displayed on the user's physical handset.

- **Tickets:** Synchronous HTTP response returned when dispatching messages to `https://exp.host`.
- **Receipts:** Asynchronous status reports queried using ticket IDs. If a push fails (e.g. `MessageTooBig`, `InvalidCredentials`), the receipt logs the root cause.

---

## 4. Privacy & Lock-Screen Security Rules

To comply with enterprise security and mobile privacy guidelines:
1. **Generic Payloads:** Lock-screen push payloads contain generic category summaries (e.g. *"Low Stock Alert — 1 item requires attention"*).
2. **Zero PII on Lock Screen:** Push notification bodies **NEVER** contain customer names, customer phone numbers, or exact financial monetary sums.
3. **Re-Authentication on Tap:** Tapping a push notification launches the app using the embedded route (e.g. `/app/my-shop/inventory`), where the native app verifies active session tokens and RBAC permissions before rendering the screen.
