-- ==============================================================================
-- Tranche 3 — Prompt 1: Production AI & Intelligence Foundation
-- Table: public.ai_invocations
-- Purpose: Diagnostic metadata and audit logging for AI requests.
-- Strictly NO full raw prompts or private business responses stored by default.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.ai_invocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  feature_key TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  response_schema_version TEXT NOT NULL,
  model_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'blocked', 'timeout', 'rate_limited')),
  provider_request_id TEXT,
  input_tokens INTEGER CHECK (input_tokens >= 0),
  output_tokens INTEGER CHECK (output_tokens >= 0),
  total_tokens INTEGER CHECK (total_tokens >= 0),
  latency_ms INTEGER CHECK (latency_ms >= 0),
  error_code TEXT,
  request_fingerprint TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

COMMENT ON TABLE public.ai_invocations IS 'Append-only audit and diagnostic metadata for AI feature invocations. Raw prompts and outputs excluded by default for data minimization.';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_invocations_business_created ON public.ai_invocations(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_invocations_feature_created ON public.ai_invocations(feature_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_invocations_status ON public.ai_invocations(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_invocations_user ON public.ai_invocations(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.ai_invocations ENABLE ROW LEVEL SECURITY;

-- 1. Platform Admins can view all AI invocations
CREATE POLICY "Platform admins can view all ai_invocations"
  ON public.ai_invocations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- 2. Business Members can view their own business AI invocations (read-only)
CREATE POLICY "Business members can view own business ai_invocations"
  ON public.ai_invocations
  FOR SELECT
  TO authenticated
  USING (
    business_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.business_memberships bm
      WHERE bm.business_id = ai_invocations.business_id
        AND bm.user_id = auth.uid()
    )
  );

-- Note: Normal authenticated users CANNOT INSERT, UPDATE, or DELETE from ai_invocations.
-- Invocations are recorded strictly server-side by trusted service-role or RPC operations.
