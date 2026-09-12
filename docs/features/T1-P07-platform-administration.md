# T1-P07: Initial NNOO Platform Administration

## Overview
This feature establishes the initial internal NNOO platform administration system within the single `apps/web` application. It allows authorized NNOO platform administrators to securely oversee users, businesses, and platform activity (audit).

## Scope

### In Scope
- Platform administrator authorization foundation (`platform_admins`).
- Protected `/admin` area within `apps/web/src/app/(admin)`.
- Platform admin layout and navigation.
- Platform dashboard summary (Total Users, Active/Suspended, Total Businesses, Active/Suspended).
- User management (paginated list, search by name/email, detail view).
- Business management (paginated list, search, detail view).
- Account and business suspension/restoration logic.
- Administrative audit trail for sensitive actions.
- Secure search, filter, and pagination.
- Admin authorization tests (cross-role security checks).
- Bootstrapping the first admin via trusted database script.

### Out of Scope
- Paystack subscription administration, plan administration.
- AI model administration.
- Invoices, inventory, operational sales, expenses.
- Hard deletion of users.
- Impersonation ("Login as User" or "Impersonate Business").
- Client-controlled admin privileges (no UI to make oneself an admin).
- Admin mobile UI (`apps/mobile`).
- Enquiries management (deferred until Prompt 8 marketing flow builds the backend).

## Data Model Changes

### `platform_admins`
- `id` (uuid, PK)
- `user_id` (uuid, ref auth.users, unique)
- `role` (text: 'super_admin', 'admin', 'support')
- `status` (text: 'active', 'suspended')

### `platform_audit_events`
- `id` (uuid, PK)
- `actor_id` (uuid, ref platform_admins)
- `action` (text, e.g., 'suspend_user', 'restore_business')
- `target_type` (text, e.g., 'user', 'business')
- `target_id` (uuid)
- `reason` (text, required for restrictive actions)
- `metadata` (jsonb)

## Security Boundaries
1. **Server-Side Authorization**: The `(admin)` route group and all its Server Actions must verify that the requester has an active `platform_admins` record.
2. **Service Role Isolation**: Operations that require bypassing RLS (e.g., fetching all users from `auth.users`, updating `account_status`) must be done using a dedicated Server-only Supabase client with the Service Role key. This client must never be exposed to the browser.
3. **RLS**: The `platform_admins` and `platform_audit_events` tables must have strict Row Level Security to prevent regular users from reading or writing.

## Acceptance Criteria
- [ ] Unauthorized users attempting to access `/admin` are redirected.
- [ ] Business Owners attempting to access `/admin` are denied.
- [ ] Active `super_admin` can access the `/admin` dashboard and see real metrics.
- [ ] Admin can view paginated lists of Users and Businesses and search them.
- [ ] Admin can Suspend and Restore a User (with reason). This writes to the audit log.
- [ ] Admin can Suspend and Restore a Business (with reason). This writes to the audit log.
- [ ] A suspended User is blocked from accessing protected business features on both web and mobile.
- [ ] A suspended Business is blocked from regular operational access by its members.
- [ ] The first `super_admin` can be securely bootstrapped.
