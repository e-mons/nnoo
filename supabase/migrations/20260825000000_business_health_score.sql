-- ==============================================================================
-- Migration: NNOO Business Health Score
-- Description: Stores immutable deterministic health score snapshots, dimension
--              breakdowns, reasons, fingerprints, and optional AI explanations
--              with strict tenant isolation.
-- ==============================================================================

-- 1. Create table for business health score snapshots
CREATE TABLE IF NOT EXISTS public.ai_business_health_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  formula_version text NOT NULL DEFAULT 'business-health-score-v1',
  status text NOT NULL CHECK (status IN ('ready', 'insufficient_data')),
  score integer CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  score_band text CHECK (score_band IS NULL OR score_band IN ('strong', 'good', 'fair', 'needs_attention')),
  data_coverage text NOT NULL CHECK (data_coverage IN ('high', 'medium', 'low', 'insufficient')),
  evaluation_period_start date NOT NULL,
  evaluation_period_end date NOT NULL,
  as_of_timestamp timestamptz NOT NULL DEFAULT now(),
  business_timezone text NOT NULL DEFAULT 'Africa/Lagos',
  currency_code text NOT NULL DEFAULT 'NGN',
  source_fingerprint text NOT NULL,
  applicable_dimension_keys jsonb NOT NULL DEFAULT '[]'::jsonb,
  dimension_results jsonb NOT NULL DEFAULT '[]'::jsonb,
  strength_reason_keys jsonb NOT NULL DEFAULT '[]'::jsonb,
  attention_reason_keys jsonb NOT NULL DEFAULT '[]'::jsonb,
  action_keys jsonb NOT NULL DEFAULT '[]'::jsonb,
  ai_explanation jsonb,
  created_by_user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Indexes for fast lookup, deduplication, and historical timeline
CREATE INDEX IF NOT EXISTS idx_ai_biz_health_lookup
  ON public.ai_business_health_snapshots (business_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_biz_health_fingerprint
  ON public.ai_business_health_snapshots (business_id, formula_version, source_fingerprint);

CREATE INDEX IF NOT EXISTS idx_ai_biz_health_period
  ON public.ai_business_health_snapshots (business_id, evaluation_period_start, evaluation_period_end);

-- 3. Row-Level Security (RLS)
ALTER TABLE public.ai_business_health_snapshots ENABLE ROW LEVEL SECURITY;

-- Allow platform admins full access
CREATE POLICY "Platform admins manage all health snapshots"
  ON public.ai_business_health_snapshots
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE user_id = auth.uid()
    )
  );

-- Allow authorized financial business members to SELECT health snapshots
CREATE POLICY "Authorized business members view health snapshots"
  ON public.ai_business_health_snapshots
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.business_memberships bm
      WHERE bm.business_id = ai_business_health_snapshots.business_id
        AND bm.user_id = auth.uid()
        AND bm.role IN ('owner', 'business_admin', 'manager', 'accountant')
    )
  );

-- Direct client mutations are strictly forbidden; persistence occurs via server services
CREATE POLICY "Deny client direct inserts on health snapshots"
  ON public.ai_business_health_snapshots
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "Deny client direct updates on health snapshots"
  ON public.ai_business_health_snapshots
  FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "Deny client direct deletes on health snapshots"
  ON public.ai_business_health_snapshots
  FOR DELETE
  TO authenticated
  USING (false);
