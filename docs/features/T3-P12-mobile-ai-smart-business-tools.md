# T3-P12 — Production Mobile AI & Smart Business Tools (Native Push & Mobile Intelligence)

## 1. Feature Specification & Mission

The **Mobile AI & Smart Business Tools** feature brings the complete NNOO Tranche 3 Intelligence suite into the native Expo mobile application (`apps/mobile`) while preserving all core architectural boundaries, security controls, and zero-drift invariants:

1. **Mobile Intelligence Hub** (`/(app)/intelligence`): Unified entry point to all smart tools with offline detection, real-time sync, and quick metrics.
2. **Mobile AI Bookkeeper** (`/(app)/intelligence/bookkeeper`): Filterable classification inbox, confidence badges, and interactive human-in-the-loop review/confirmation/rejection screens calling canonical Tranche 2 RPCs through server APIs.
3. **Mobile Smart Insights** (`/(app)/intelligence/insights`): Period selector, verified business fact cards, executive narrative with freshness timestamps, and actionable signal badges (0 Gemini calls on screen load).
4. **Mobile Ask NNOO** (`/(app)/intelligence/assistant`): Conversational assistant chat interface with server-side fact substitutions, suggested questions, fact reference chips, and double-tap protection.
5. **Mobile Business Health Score** (`/(app)/intelligence/health`): Circular animated health score gauge, band indicators, 5 dimension cards, "What is helping" / "Needs attention" callouts, and manual refresh trigger.
6. **Mobile Credit Passport** (`/(app)/intelligence/passport`): Live snapshot preview, freshness detection, immutable snapshot version generation, secure expiring share link modal, and PDF export preview.
7. **Mobile Automations Dashboard** (`/(app)/intelligence/automations`): Daily Summary, Weekly Health Check, and Attention Scanner preferences, schedule displays in Nigeria timezone (`Africa/Lagos`), active attention signals list, and manual "Run Now" triggers.
8. **Mobile Notification Center & Preferences** (`/(app)/notifications`): Real-time alert feed, unread counter badge, "Needs Attention" filter tab, and per-category channel delivery preference toggles (`IN_APP`, `PUSH`, `WHATSAPP`).
9. **Mobile WhatsApp Settings** (`/(app)/settings/whatsapp`): Real-time connection status pill, masked phone display, 10-minute cryptographic linking code modal, direct WhatsApp launcher, multi-business context switcher, and disconnect trigger.
10. **Native Mobile Push Notifications (Expo Push API v2)**:
    - Contextual permission request flow on authentication.
    - Stable installation ID binding with upsert on `(user_id, installation_id)` for token rollover.
    - Revocation on sign-out and security events.
    - Minimal lock-screen payload sanitization (phone and email masking, zero customer/supplier PII).
    - Idempotent delivery records in `public.mobile_push_deliveries`.
    - Auto-expiration of invalid tokens (`DeviceNotRegistered`).
    - Safe deep-link navigation via `MOBILE_ACTION_ROUTE_MAP` with server-side re-authentication and RBAC checks at destination screens.

---

## 2. Hard Governance & Safety Invariants

1. **Zero Mobile Gemini SDK / Secrets**:
   - `@google/genai` and `GEMINI_API_KEY` remain 100% server-side in `apps/web`. Zero Gemini credentials or AI SDKs exist in the mobile bundle.
2. **Zero Mobile Accounting Engine**:
   - Mobile never calculates Net Sales, Gross Profit, Expenses, AR, AP, Inventory Valuation, Health Scores, or Passport metrics locally. All calculations are executed by canonical server services, database RPCs, and formula engines.
3. **Zero Offline AI or Silent Financial Queues**:
   - When offline or disconnected, mobile displays clear, honest connection states without fake AI responses or queued unconfirmed financial writes.
4. **Push is a Channel, Not Authorization**:
   - Tapping a push notification deep link navigates to destination screens where user session, active business membership, and RBAC capabilities are verified afresh by the server before revealing sensitive data.
5. **Lock-Screen Privacy & Minimal Payload**:
   - Outbound push notifications convey essential alerts while stripping phone numbers, email addresses, and financial digits.
6. **Zero Direct Financial Mutations**:
   - Exploring intelligence screens, viewing health scores, previewing passports, and adjusting notification/WhatsApp preferences cause **0 mutations** to sales, expenses, invoices, payments, inventory, or journal ledgers.

---

## 3. Database Schema & Tables Applied

- **`public.mobile_push_devices`**:
  - `id` (uuid, PK)
  - `user_id` (uuid, FK `auth.users`, onDelete cascade)
  - `installation_id` (text, unique per user)
  - `provider` (text, default 'EXPO', check IN ('EXPO', 'FCM', 'APNS'))
  - `push_token` (text)
  - `platform` (text, check IN ('ios', 'android', 'web'))
  - `app_version` (text)
  - `environment` (text, default 'development')
  - `status` (text, default 'ACTIVE', check IN ('ACTIVE', 'REVOKED', 'EXPIRED'))
  - `permission_state` (text, default 'GRANTED', check IN ('GRANTED', 'DENIED', 'UNDETERMINED'))
  - `last_seen_at`, `created_at`, `updated_at`, `revoked_at` (timestamptz)
  - Indexes: `idx_push_devices_user_status` (partial on status='ACTIVE'), `idx_push_devices_token`.
  - Strict RLS policies allowing authenticated users to select, insert, update, and delete their own device rows.

- **`public.mobile_push_deliveries`**:
  - `id` (uuid, PK)
  - `business_id` (uuid, FK `businesses`, onDelete cascade)
  - `notification_id` (uuid, FK `business_notifications`, onDelete cascade)
  - `recipient_user_id` (uuid, FK `auth.users`, onDelete cascade)
  - `device_id` (uuid, FK `mobile_push_devices`, onDelete set null)
  - `idempotency_key` (text, UNIQUE)
  - `status` (text, default 'QUEUED', check IN ('QUEUED', 'SENT', 'FAILED', 'SKIPPED'))
  - `provider_ticket_id`, `provider_receipt_status`, `error_code` (text)
  - `rendered_title`, `rendered_body` (text, sanitized)
  - `sent_at`, `failed_at`, `created_at`, `updated_at` (timestamptz)
  - Indexes: `idx_push_deliveries_biz_recip`, `idx_push_deliveries_notif`, `idx_push_deliveries_status`.
  - RLS policy allowing recipients to view their own deliveries.

- **`public.notification_preferences`**:
  - Channel constraint extended to `CHECK (channel IN ('IN_APP', 'WHATSAPP', 'PUSH'))`.

---

## 4. Server-Side Push Architecture (`apps/web`)

- **`ExpoPushProviderAdapter`** (`apps/web/src/server/ai/push/adapter.ts`):
  - Sends single or batch (up to 100) push notifications to Expo Push API v2.
  - Queries delivery receipts via Expo Receipts API.
  - Normalizes provider error codes and detects invalid tokens (`DeviceNotRegistered`).
- **`PushDeviceService`** (`apps/web/src/server/ai/push/device-service.ts`):
  - `registerDevice`: Upsert device token with rollover support.
  - `revokeDevice`: Mark device `REVOKED` on user sign-out.
  - `revokeAllDevices`: Revoke all active devices for security events.
  - `listActiveDevices`: Retrieve active devices for current user.
  - `getActiveTokens`: Retrieve active tokens for notification fan-out.
  - `markDeviceExpired`: Auto-expire invalid tokens.
  - `touchDevice`: Update `last_seen_at` on app foreground.
- **`PushDeliveryService`** (`apps/web/src/server/ai/push/delivery-service.ts`):
  - Idempotent delivery check via unique idempotency key `${notification_id}:${recipient_user_id}`.
  - Preference re-check (verifies PUSH channel is enabled for notification category).
  - Active device token resolution.
  - Lock-screen content sanitization (`sanitizeForLockScreen`).
  - Delivery record persistence and invalid token deactivation.
- **REST API Routes**:
  - `POST /api/v1/ai/push/devices`: Register or update push token.
  - `GET /api/v1/ai/push/devices`: List active devices for authenticated user.
  - `POST /api/v1/ai/push/devices/revoke`: Revoke device on sign-out.

---

## 5. Mobile Client Architecture (`apps/mobile`)

- **`MobilePushManager`** (`apps/mobile/lib/push.ts`):
  - Contextual permission request and token acquisition.
  - Token refresh / rollover listener.
  - Foreground notification presentation handler (`shouldShowBanner: true`, `shouldShowList: true`).
  - Response received listener mapping notification action keys to safe deep links.
  - Badge reset on app foreground.
  - Token revocation on sign-out in `AuthContext.tsx`.
- **`NNOO Mobile API Client`** (`apps/mobile/lib/api.ts`):
  - Type-safe HTTP client with automatic session token injection and normalized error codes.
- **`Deep Link Routing`** (`apps/mobile/lib/linking.ts`):
  - Secure action route resolver mapping all allowlisted `MobileActionKey` entries to app screens.
- **Mobile UI Screens**:
  - `/(app)/intelligence/index.tsx`: Intelligence Hub.
  - `/(app)/intelligence/bookkeeper/index.tsx`: AI Bookkeeper inbox.
  - `/(app)/intelligence/bookkeeper/[id].tsx`: Interactive review and confirmation.
  - `/(app)/intelligence/insights.tsx`: Smart Insights dashboard.
  - `/(app)/intelligence/assistant/index.tsx`: Ask NNOO conversation list.
  - `/(app)/intelligence/assistant/[id].tsx`: Ask NNOO chat interface.
  - `/(app)/intelligence/health.tsx`: Business Health Score gauge and dimensions.
  - `/(app)/intelligence/passport/index.tsx`: Credit Passport preview, share, and export.
  - `/(app)/intelligence/automations.tsx`: Automations schedules and triggers.
  - `/(app)/notifications/index.tsx`: Notification feed and unread badge.
  - `/(app)/notifications/preferences.tsx`: In-App, Push, and WhatsApp delivery toggles.
  - `/(app)/settings/whatsapp.tsx`: WhatsApp linking and context switcher.
  - `/(app)/index.tsx`: Enhanced home dashboard with Notification Bell, Needs Attention banner, and Smart Business Tools grid.
  - `/(app)/more/index.tsx`: Enhanced More menu with complete Intelligence & AI section.

---

## 6. Test Evidence & Quality Gates

- **Automated Push Test Suite**: `apps/web/src/server/ai/__tests__/mobile-push.test.ts` (14 tests).
- **Total Test Baseline**: **183/183 tests passing across 23 test suites with 0 failures**.
- **Mobile TypeScript Verification**: `pnpm --filter mobile exec tsc --noEmit` passed with 0 errors.
- **Next.js Production Web Build**: `next build` passed across 78 routes with 0 errors.
- **Zero Secrets / Zero Gemini in Mobile**: Confirmed zero `@google/genai` imports or API keys in `apps/mobile`.
