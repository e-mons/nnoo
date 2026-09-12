-- ==============================================================================
-- NNOO Tranche 3 Prompt 7: Production NNOO Credit Passport Migration
-- ==============================================================================
-- Purpose:
-- 1. Create table public.credit_passport_snapshots for immutable business credit profiles.
-- 2. Create table public.credit_passport_shares for revocable, expiring external access tokens.
-- 3. Enforce strict Multi-Tenant Row Level Security (RLS) and indexing.
-- ==============================================================================

-- 1. Credit Passport Snapshots Table
create table if not exists public.credit_passport_snapshots (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  passport_code text not null unique,
  passport_version integer not null default 1,
  passport_schema_version text not null default '1.0.0',
  status text not null default 'ready' check (status in ('ready', 'limited_history', 'insufficient_data', 'revoked')),
  period_start text not null,
  period_end text not null,
  as_of_timestamp timestamptz not null default now(),
  generated_by_user_id uuid not null references auth.users(id) on delete cascade,
  source_fingerprint text not null,
  artifact_hash text not null,
  data_coverage text not null check (data_coverage in ('high', 'medium', 'low', 'insufficient')),
  snapshot_payload jsonb not null,
  health_score_snapshot_id uuid references public.ai_business_health_snapshots(id) on delete set null,
  ai_explanation jsonb,
  created_at timestamptz not null default now(),
  constraint uq_credit_passport_business_version unique (business_id, passport_version)
);

-- Indexes on credit_passport_snapshots
create index if not exists idx_credit_passport_lookup 
  on public.credit_passport_snapshots (business_id, created_at desc);

create index if not exists idx_credit_passport_code 
  on public.credit_passport_snapshots (passport_code);

create index if not exists idx_credit_passport_fingerprint 
  on public.credit_passport_snapshots (business_id, source_fingerprint);

-- Enable RLS
alter table public.credit_passport_snapshots enable row level security;

-- Select Policy for Snapshots (Active business members can read their own business passports)
create policy credit_passport_tenant_select
  on public.credit_passport_snapshots
  for select
  using (
    exists (
      select 1 from public.business_memberships bm
      where bm.business_id = credit_passport_snapshots.business_id
        and bm.user_id = auth.uid()
        and bm.membership_status = 'active'
    )
  );

-- 2. Credit Passport Shares Table
create table if not exists public.credit_passport_shares (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  passport_snapshot_id uuid not null references public.credit_passport_snapshots(id) on delete cascade,
  token_hash text not null unique,
  created_by_user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  last_accessed_at timestamptz,
  access_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- Indexes on credit_passport_shares
create index if not exists idx_credit_passport_shares_token 
  on public.credit_passport_shares (token_hash);

create index if not exists idx_credit_passport_shares_lookup 
  on public.credit_passport_shares (business_id, passport_snapshot_id, created_at desc);

-- Enable RLS
alter table public.credit_passport_shares enable row level security;

-- Select Policy for Shares (Active business members can view shares for their business)
create policy credit_passport_shares_tenant_select
  on public.credit_passport_shares
  for select
  using (
    exists (
      select 1 from public.business_memberships bm
      where bm.business_id = credit_passport_shares.business_id
        and bm.user_id = auth.uid()
        and bm.membership_status = 'active'
    )
  );
