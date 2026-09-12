# NNOO — Multi-Channel Notifications Architecture & Delivery Guide

Document ID: `NOTIF-OPS-01`  
Governance Version: `1.0.0`  
Last Reconciled: `2026-08-20` (Tranche 4 Prompt 12 Handover)  
Status: **Authoritative Notifications Guide**

---

## 1. Notification Architecture Overview

NNOO delivers real-time operational alerts and business intelligence across three integrated channels:
1. **In-App Notification Center:** Web & Mobile inbox with unread counts and direct action routing.
2. **Mobile Push Notifications:** Privacy-safe lock-screen notifications delivered via Expo Push (APNs for iOS, FCM for Android).
3. **Meta WhatsApp Business:** Automated utility template alerts delivered to linked WhatsApp numbers.

```text
[ Business Attention Condition Detected ]
                  │
                  ▼
[ Logical Notification Created in Database ]
                  │
                  ▼
[ Recipient Resolution (Role-Based RBAC Preflight) ]
                  │
                  ▼
[ User Channel Preferences Evaluation ]
                  │
         ┌────────┴────────┬────────────────────────┐
         ▼                 ▼                        ▼
  ┌───────────────┐ ┌───────────────┐        ┌───────────────┐
  │    IN-APP     │ │   EXPO PUSH   │        │   WHATSAPP    │
  │ Notification  │ │ Generic Title │        │ Template Msg  │
  │ Inbox & Badge │ │ (PII-Free)    │        │ (Opted-in)    │
  └───────────────┘ └───────────────┘        └───────────────┘
```

---

## 2. Recipient RBAC Filtering Matrix

Notifications are strictly filtered at dispatch time based on the recipient's active role in the business:

| Notification Type | Trigger Condition | Authorized Recipient Roles | Excluded Roles |
|---|---|---|---|
| `LOW_STOCK` | On-hand quantity falls below reorder level | `owner`, `business_admin`, `manager`, `inventory_staff` | `sales_staff`, `accountant`, `read_only` |
| `OVERDUE_INVOICE` | Unpaid invoice passes due date | `owner`, `business_admin`, `manager`, `accountant` | `inventory_staff`, `sales_staff` |
| `BOOKKEEPER_REVIEW`| New transaction needs human review | `owner`, `business_admin`, `accountant` | `manager`, `sales_staff`, `inventory_staff` |
| `HEALTH_UPDATE` | Weekly health score calculated | `owner`, `business_admin`, `manager` | `sales_staff`, `inventory_staff`, `read_only` |
| `INSIGHTS_READY` | New weekly Smart Insights available | `owner`, `business_admin`, `manager` | `sales_staff`, `inventory_staff`, `read_only` |

---

## 3. Dynamic Role Downgrade & Session Freshness

- **Fresh Authorization:** When a staff member's role is downgraded (e.g. from Manager to Sales Staff), unread notifications requiring elevated privileges are hidden immediately on the next request.
- **Push Notification Tap Reauthorization:** Tapping a historical lock-screen push notification re-authenticates the current user session and active business role before opening the target route. If unauthorized, the user is redirected with an access-denied message.

---

## 4. User Preferences & Muting

- **Channel Muting:** Users can selectively disable Push or WhatsApp dispatches for specific categories in `/app/[businessSlug]/settings`.
- **Decoupled Attention State:** Muting a channel stops external messages but does **NOT** hide the active condition from the in-app "Needs Attention" business widget.
