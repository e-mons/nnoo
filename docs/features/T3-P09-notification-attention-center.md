# Feature Specification: T3-P09 — Production NNOO Notification & Attention Center

## Overview
- **Feature ID**: T3-P09
- **Tranche**: Tranche 3 — Smart Business Tools & Communication
- **Prompt**: 9 of 14
- **Channel**: `IN_APP` ONLY (WhatsApp is Prompt 10; Push is Prompt 12).
- **Gemini Call Count**: 0 for notification generation.

## Capabilities & Architecture
1. **Notification Policy Registry v1**:
   - Source-controlled registry mapping 8 notification types across 7 categories to required capabilities, deterministic message generators, and navigation actions.
   - Categories: `INVENTORY`, `INVOICES`, `BOOKKEEPER`, `BUSINESS_HEALTH`, `CREDIT_PASSPORT`, `BUSINESS_SUMMARIES`, `AUTOMATIONS`.
2. **Capability-Aware Recipient Resolver**:
   - Resolves active business members and filters by required RBAC capabilities and personal per-category preferences.
   - Strictly enforces that sales staff do not receive sensitive financial, health, or passport notifications.
3. **Current-Permissions-Win at Retrieval**:
   - Notifications store `required_capabilities`.
   - On retrieval, current active role is re-evaluated. Role downgrades dynamically hide unauthorized historical notifications and exclude them from the unread badge count without mutating historical records.
4. **Separation of Concerns**:
   - `business_notifications` (personal inbox) vs `business_attention_events` (operational state).
   - Marking a personal notification as read updates `read_at`; it does not resolve the business condition.
   - Resolving an attention event clears the active condition from `Needs Attention`; historical personal notifications remain in the feed.
5. **Deduplication & Idempotency**:
   - Deterministic dedupe key `${source_event_id}:${recipient_user_id}:${notification_type}` with unique database constraint `(business_id, recipient_user_id, dedupe_key)`.
6. **Multi-Tenant RLS & Security**:
   - Users can only read and mutate their own notifications and preferences in businesses where they hold an active membership.

## Automated Verification
- **Test Suite**: `apps/web/src/server/ai/__tests__/notifications.test.ts` (17 tests, all green).
- **Quality Gates**: All 133 AI tests pass; Next.js production build succeeds; Mobile TypeScript check passes.
