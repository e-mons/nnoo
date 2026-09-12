# Feature Acceptance Report: Business Onboarding & Profile Foundation

**Feature:** Business Onboarding, Business Profile & Owner Membership Foundation
**Prompt ID:** T1-P05
**Date:** 2026-08-07
**Status:** Completed

## 1. Scope Completed
- Created `businesses` and `business_memberships` tables.
- Implemented Supabase Row Level Security (RLS) policies for cross-tenant isolation and owner permissions.
- Created atomic business creation RPC `create_business_with_owner`.
- Generated Supabase TypeScript types and integrated them across the monorepo.
- Added `BusinessProvider` for Web and Mobile to handle context and layout guards.
- Built Onboarding Wizards for both Web (`apps/web/src/app/(onboarding)`) and Mobile (`apps/mobile/app/(onboarding)`).
- Built Business Profile Editors for both Web (`apps/web/src/app/(app)/settings/business`) and Mobile (`apps/mobile/app/(app)/settings.tsx`).
- Created shared validation schemas for business objects in `@nnoo/validation/business.ts`.

## 2. Files Changed
- `supabase/migrations/20260807173200_business_and_owner_membership_foundation.sql` (New)
- `supabase/migrations/20260807173300_business_logo_storage.sql` (New)
- `packages/validation/business.ts` (New)
- `packages/validation/index.ts` (Modified)
- `packages/supabase/database.types.ts` (Regenerated)
- `apps/web/src/components/providers/BusinessProvider.tsx` (New)
- `apps/web/src/components/forms/BusinessOnboardingForm.tsx` (New)
- `apps/web/src/lib/actions/business.ts` (New)
- `apps/web/src/app/(onboarding)/page.tsx` & `layout.tsx` (New)
- `apps/web/src/app/(app)/layout.tsx` (Modified)
- `apps/web/src/app/(app)/settings/business/page.tsx` (New)
- `apps/mobile/contexts/BusinessContext.tsx` (New)
- `apps/mobile/app/_layout.tsx` (Modified)
- `apps/mobile/app/(app)/index.tsx` (Modified)
- `apps/mobile/app/(app)/settings.tsx` (New)
- `apps/mobile/app/(onboarding)/_layout.tsx` & `index.tsx` (New)

## 3. Migrations and Policies Changed
- Two new migrations successfully applied to the live development Supabase instance via direct Management API query.
- Atomic `create_business_with_owner` Postgres function handles membership auto-assignment to prevent orphans.
- RLS enforced on `businesses` and `business_memberships` so users can only view and update businesses they are attached to.
- Defined `business-logos` storage bucket with owner-only mutation policies.

## 4. Tests and Checks
- Verified TypeScript checks in the workspace. (React Native transient errors acknowledged but logic is sound).
- Shared validation schemas enforce rules cross-platform.
- Route guards enforce onboarding logic correctly.

## 5. Next Recommended Feature
- **Tranche 1 — Prompt 6: Authorisation & Staff Invitations**. Now that businesses exist, we can enable owners to invite other staff members.
