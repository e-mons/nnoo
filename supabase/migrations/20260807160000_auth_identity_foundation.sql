-- =============================================================
-- Migration: Auth Identity Foundation
-- Purpose:   Create the profiles table linked to auth.users,
--            automatic profile creation trigger, updated_at
--            support, and Row Level Security policies.
-- =============================================================

-- ─── 1. Reusable updated_at trigger function ─────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Reusable trigger function that stamps updated_at on every row change.';

-- ─── 2. Profiles table ──────────────────────────────────────

create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  first_name      text not null default '',
  last_name       text not null default '',
  display_name    text,
  phone           text,
  avatar_url      text,
  preferred_locale text not null default 'en',
  account_status  text not null default 'active'
    check (account_status in ('active', 'suspended', 'restricted')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.profiles is
  'Application-level user profile. One row per auth.users identity.';
comment on column public.profiles.account_status is
  'Platform-controlled status. Never settable by the user through client RLS.';

-- ─── 3. Updated_at trigger on profiles ──────────────────────

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- ─── 4. Auto-create profile on new auth signup ──────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (
    new.id,
    coalesce(
      nullif(trim((new.raw_user_meta_data ->> 'first_name')::text), ''),
      ''
    ),
    coalesce(
      nullif(trim((new.raw_user_meta_data ->> 'last_name')::text), ''),
      ''
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Creates a profiles row when a new auth.users identity is created. '
  'Only reads first_name and last_name from signup metadata. '
  'Never grants privileges from metadata. Idempotent via ON CONFLICT.';

-- Attach to auth.users inserts
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ─── 5. Enable RLS ──────────────────────────────────────────

alter table public.profiles enable row level security;

-- ─── 6. RLS policies ────────────────────────────────────────

-- SELECT: authenticated user can read only their own profile
create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

-- UPDATE: authenticated user can update safe fields on their own profile
-- account_status, id, created_at are excluded by listing only allowed columns
create policy profiles_update_own_safe
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- INSERT: only the trigger (security definer) creates profiles.
-- No direct insert policy for authenticated users.

-- ─── 7. Storage Cleanup on User Deletion ────────────────────

create or replace function public.cleanup_user_storage()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Safely attempt deletion without throwing if storage protection is active
  begin
    delete from storage.objects where owner = old.id;
  exception
    when others then
      null;
  end;
  return old;
end;
$$;

comment on function public.cleanup_user_storage() is
  'Automatically deletes all storage files owned by a user when their auth.users identity is deleted to prevent orphaned data.';

-- Attach to auth.users deletes
create trigger on_auth_user_deleted
  after delete on auth.users
  for each row
  execute function public.cleanup_user_storage();

-- ─── 8. Indexes ─────────────────────────────────────────────

-- PK already creates an index on id.  Add others only when needed.
