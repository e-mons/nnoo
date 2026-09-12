-- Migration: 20260827000000_intelligence_automation_foundation.sql
-- Description: Production Intelligence Jobs & Automation Foundation (Tranche 3 Prompt 8)
-- Tables: business_automations, intelligence_job_runs, business_attention_events

-- 1. Table: public.business_automations
CREATE TABLE IF NOT EXISTS public.business_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  automation_type text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  frequency text NOT NULL DEFAULT 'off',
  schedule_local_time text NOT NULL DEFAULT '08:00',
  schedule_weekday smallint,
  schedule_monthday smallint,
  config_version integer NOT NULL DEFAULT 1,
  created_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_business_automations_type UNIQUE (business_id, automation_type),
  CONSTRAINT chk_business_automations_type CHECK (automation_type IN ('business_summary', 'health_score_refresh', 'attention_scan')),
  CONSTRAINT chk_business_automations_frequency CHECK (frequency IN ('daily', 'weekly', 'monthly', 'off')),
  CONSTRAINT chk_business_automations_time CHECK (schedule_local_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  CONSTRAINT chk_business_automations_weekday CHECK (frequency <> 'weekly' OR (schedule_weekday IS NOT NULL AND schedule_weekday BETWEEN 1 AND 7)),
  CONSTRAINT chk_business_automations_monthday CHECK (frequency <> 'monthly' OR (schedule_monthday IS NOT NULL AND schedule_monthday BETWEEN 1 AND 31))
);

CREATE INDEX IF NOT EXISTS idx_business_automations_lookup ON public.business_automations(business_id, automation_type);
CREATE INDEX IF NOT EXISTS idx_business_automations_enabled ON public.business_automations(enabled, automation_type);

-- 2. Table: public.intelligence_job_runs
CREATE TABLE IF NOT EXISTS public.intelligence_job_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  automation_id uuid REFERENCES public.business_automations(id) ON DELETE SET NULL,
  job_type text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  status text NOT NULL,
  scheduled_for timestamptz,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  attempt_count integer NOT NULL DEFAULT 1,
  source_fingerprint text,
  result_type text,
  result_id text,
  provider_invocation_id uuid REFERENCES public.ai_invocations(id) ON DELETE SET NULL,
  error_code text,
  skip_reason text,
  correlation_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_intelligence_job_runs_status CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'skipped', 'cancelled')),
  CONSTRAINT chk_intelligence_job_runs_type CHECK (job_type IN ('scheduled_business_summary', 'scheduled_health_refresh', 'scheduled_attention_scan', 'manual_business_summary', 'manual_health_refresh', 'manual_attention_scan'))
);

CREATE INDEX IF NOT EXISTS idx_intelligence_job_runs_biz ON public.intelligence_job_runs(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intelligence_job_runs_idemp ON public.intelligence_job_runs(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_intelligence_job_runs_status ON public.intelligence_job_runs(status, created_at);

-- 3. Table: public.business_attention_events
CREATE TABLE IF NOT EXISTS public.business_attention_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  type text NOT NULL,
  category text NOT NULL,
  dedupe_key text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  severity text NOT NULL DEFAULT 'info',
  first_detected_at timestamptz NOT NULL DEFAULT now(),
  last_detected_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  source_type text NOT NULL,
  source_reference text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_business_attention_status CHECK (status IN ('active', 'resolved', 'dismissed')),
  CONSTRAINT chk_business_attention_category CHECK (category IN ('STATEFUL', 'OCCURRENCE')),
  CONSTRAINT chk_business_attention_severity CHECK (severity IN ('info', 'attention', 'important')),
  CONSTRAINT chk_business_attention_type CHECK (type IN ('LOW_STOCK_PRESENT', 'OUT_OF_STOCK_PRESENT', 'OVERDUE_INVOICES_PRESENT', 'BOOKKEEPER_REVIEW_PENDING', 'CREDIT_PASSPORT_STALE', 'HEALTH_SCORE_CHANGED', 'AUTOMATION_JOB_FAILED'))
);

CREATE INDEX IF NOT EXISTS idx_business_attention_biz_status ON public.business_attention_events(business_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_attention_dedupe ON public.business_attention_events(business_id, dedupe_key, status);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.business_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intelligence_job_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_attention_events ENABLE ROW LEVEL SECURITY;

-- 5. Multi-tenant RLS Policies
-- business_automations
CREATE POLICY business_automations_tenant_select ON public.business_automations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.business_memberships bm
      WHERE bm.business_id = business_automations.business_id
        AND bm.user_id = auth.uid()
        AND bm.membership_status = 'active'
    )
  );

CREATE POLICY business_automations_tenant_write ON public.business_automations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.business_memberships bm
      WHERE bm.business_id = business_automations.business_id
        AND bm.user_id = auth.uid()
        AND bm.membership_status = 'active'
        AND bm.role IN ('owner', 'business_admin', 'manager', 'accountant')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_memberships bm
      WHERE bm.business_id = business_automations.business_id
        AND bm.user_id = auth.uid()
        AND bm.membership_status = 'active'
        AND bm.role IN ('owner', 'business_admin', 'manager', 'accountant')
    )
  );

-- intelligence_job_runs
CREATE POLICY intelligence_job_runs_tenant_select ON public.intelligence_job_runs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.business_memberships bm
      WHERE bm.business_id = intelligence_job_runs.business_id
        AND bm.user_id = auth.uid()
        AND bm.membership_status = 'active'
    )
  );

-- business_attention_events
CREATE POLICY business_attention_events_tenant_select ON public.business_attention_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.business_memberships bm
      WHERE bm.business_id = business_attention_events.business_id
        AND bm.user_id = auth.uid()
        AND bm.membership_status = 'active'
    )
  );
