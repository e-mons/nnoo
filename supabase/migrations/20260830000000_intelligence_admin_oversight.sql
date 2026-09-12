-- Migration: 20260830000000_intelligence_admin_oversight.sql
-- Description: NNOO AI, Intelligence & Score Admin Oversight (Tranche 3 Prompt 11)
-- Tables: platform_feature_controls, query performance indexes, RLS policies

-- 1. Table: public.platform_feature_controls
CREATE TABLE IF NOT EXISTS public.platform_feature_controls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT true,
  description text NOT NULL,
  updated_by_admin_id uuid REFERENCES public.platform_admins(id) ON DELETE SET NULL,
  updated_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_platform_feature_key CHECK (feature_key IN (
    'global_ai_enabled',
    'ask_nnoo_enabled',
    'ai_bookkeeper_enabled',
    'business_summaries_enabled',
    'health_score_enabled',
    'credit_passport_enabled',
    'automations_enabled',
    'notifications_enabled',
    'whatsapp_enabled'
  ))
);

COMMENT ON TABLE public.platform_feature_controls IS 'Authoritative operational controls and emergency switches for NNOO intelligence platform features.';

-- Enable RLS
ALTER TABLE public.platform_feature_controls ENABLE ROW LEVEL SECURITY;

-- 1. Platform Admins can view and manage feature controls
CREATE POLICY "Platform admins can view all feature controls"
  ON public.platform_feature_controls
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Platform admins can update feature controls"
  ON public.platform_feature_controls
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE user_id = auth.uid() AND status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- 2. Authenticated business users can read feature controls (to honor platform kill switches)
CREATE POLICY "Authenticated users can read feature controls"
  ON public.platform_feature_controls
  FOR SELECT
  TO authenticated
  USING (true);

-- Seed initial feature controls (all enabled by default)
INSERT INTO public.platform_feature_controls (feature_key, enabled, description)
VALUES
  ('global_ai_enabled', true, 'Master operational kill switch for all Google Gemini AI invocations across the platform.'),
  ('ask_nnoo_enabled', true, 'Operational switch for Ask NNOO conversational assistant and tools.'),
  ('ai_bookkeeper_enabled', true, 'Operational switch for AI Bookkeeper transaction classification.'),
  ('business_summaries_enabled', true, 'Operational switch for Gemini-powered verified business summaries and insights.'),
  ('health_score_enabled', true, 'Operational switch for Business Health Score calculations and refreshes.'),
  ('credit_passport_enabled', true, 'Operational switch for Credit Passport generation and verification.'),
  ('automations_enabled', true, 'Operational switch for background intelligence jobs and automated attention scans.'),
  ('notifications_enabled', true, 'Operational switch for multi-channel business notification fanout.'),
  ('whatsapp_enabled', true, 'Operational switch for WhatsApp Business inbound command handling and outbound alert delivery.')
ON CONFLICT (feature_key) DO NOTHING;

-- 2. Additional Indexes for Admin Analytics and Performance
CREATE INDEX IF NOT EXISTS idx_ai_invocations_created_at ON public.ai_invocations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_invocations_feat_status_created ON public.ai_invocations(feature_key, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intelligence_job_runs_type_status_created ON public.intelligence_job_runs(job_type, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_deliveries_status_created ON public.whatsapp_deliveries(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_deliveries_template_status ON public.whatsapp_deliveries(template_key, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_notifications_cat_created ON public.business_notifications(notification_category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_passport_snapshots_status_created ON public.credit_passport_snapshots(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_business_health_snapshots_status_created ON public.ai_business_health_snapshots(status, created_at DESC);

