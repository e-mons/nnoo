-- ==============================================================================
-- Migration: Verified Business Summaries & Smart Insights
-- Description: Stores deterministic fact snapshots, fingerprints, and generated
--              business summary narrative artifacts with strict tenant isolation.
-- ==============================================================================

-- 1. Create table for verified business summaries
CREATE TABLE IF NOT EXISTS public.ai_business_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  requested_by_user_id uuid NOT NULL REFERENCES auth.users(id),
  summary_type text NOT NULL CHECK (summary_type IN ('today', 'this_week', 'this_month', 'custom')),
  period_start date NOT NULL,
  period_end date NOT NULL,
  as_of_timestamp timestamptz NOT NULL DEFAULT now(),
  business_timezone text NOT NULL DEFAULT 'Africa/Lagos',
  currency_code text NOT NULL DEFAULT 'NGN',
  source_fact_schema_version text NOT NULL DEFAULT '1.0.0',
  source_fingerprint text NOT NULL,
  permission_scope_fingerprint text NOT NULL,
  headline text NOT NULL,
  overview text NOT NULL,
  selected_highlight_signal_keys jsonb NOT NULL DEFAULT '[]'::jsonb,
  selected_attention_signal_keys jsonb NOT NULL DEFAULT '[]'::jsonb,
  selected_action_keys jsonb NOT NULL DEFAULT '[]'::jsonb,
  verified_fact_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  prompt_version text NOT NULL DEFAULT '1.0.0',
  response_schema_version text NOT NULL DEFAULT '1.0.0',
  model_id text NOT NULL DEFAULT 'gemini-2.5-flash',
  ai_invocation_id uuid REFERENCES public.ai_invocations(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'ready' CHECK (status IN ('ready', 'failed', 'superseded')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Performance and lookup indexes
CREATE INDEX IF NOT EXISTS idx_ai_biz_summaries_lookup
  ON public.ai_business_summaries (business_id, requested_by_user_id, summary_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_biz_summaries_fingerprint
  ON public.ai_business_summaries (business_id, requested_by_user_id, source_fingerprint, status);

CREATE INDEX IF NOT EXISTS idx_ai_biz_summaries_period
  ON public.ai_business_summaries (business_id, summary_type, period_start, period_end);

-- 3. Row-Level Security (RLS)
ALTER TABLE public.ai_business_summaries ENABLE ROW LEVEL SECURITY;

-- Allow platform admins full access
CREATE POLICY "Platform admins manage all business summaries"
  ON public.ai_business_summaries
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE user_id = auth.uid()
    )
  );

-- Allow tenant members to SELECT permitted business summaries
CREATE POLICY "Business members view permitted business summaries"
  ON public.ai_business_summaries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.business_memberships bm
      WHERE bm.business_id = ai_business_summaries.business_id
        AND bm.user_id = auth.uid()
    )
    AND (
      requested_by_user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.business_memberships bm
        WHERE bm.business_id = ai_business_summaries.business_id
          AND bm.user_id = auth.uid()
          AND bm.role IN ('owner', 'business_admin', 'manager', 'accountant')
      )
    )
  );

-- Direct client mutations are strictly forbidden; summary persistence occurs via server services
CREATE POLICY "Deny client direct inserts on business summaries"
  ON public.ai_business_summaries
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "Deny client direct updates on business summaries"
  ON public.ai_business_summaries
  FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "Deny client direct deletes on business summaries"
  ON public.ai_business_summaries
  FOR DELETE
  TO authenticated
  USING (false);
