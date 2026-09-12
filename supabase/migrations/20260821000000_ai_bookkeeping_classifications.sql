-- Tranche 3 Prompt 2: AI Bookkeeper — Transaction Understanding & Classification
-- Persistent suggestions table for AI Bookkeeper analysis results.
-- Represents a structured AI suggestion ONLY; NOT an accounting transaction, journal entry, or posted record.

CREATE TABLE IF NOT EXISTS public.ai_bookkeeping_classifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  requested_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_kind TEXT NOT NULL DEFAULT 'manual_input',
  source_record_type TEXT,
  source_record_id UUID,
  description TEXT NOT NULL,
  amount_minor BIGINT,
  currency_code TEXT NOT NULL DEFAULT 'NGN',
  transaction_direction TEXT,
  transaction_date DATE,
  payment_method TEXT,
  reference_text TEXT,
  counterparty_text TEXT,
  input_fingerprint TEXT NOT NULL,
  idempotency_key TEXT,
  operation_kind TEXT NOT NULL,
  confidence_band TEXT NOT NULL,
  expense_category_candidate_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  supplier_candidate_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  customer_candidate_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  possible_duplicate_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  missing_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  warning_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  short_explanation TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  response_schema_version TEXT NOT NULL,
  model_id TEXT NOT NULL,
  ai_invocation_id UUID REFERENCES public.ai_invocations(id) ON DELETE SET NULL,
  classification_status TEXT NOT NULL DEFAULT 'pending_review',
  superseded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.ai_bookkeeping_classifications IS 'Persistent AI Bookkeeper classification suggestions pending human review. Zero accounting or financial journal authority.';

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_ai_bookkeeping_classifications_biz_created 
  ON public.ai_bookkeeping_classifications(business_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_bookkeeping_classifications_biz_status 
  ON public.ai_bookkeeping_classifications(business_id, classification_status);

CREATE INDEX IF NOT EXISTS idx_ai_bookkeeping_classifications_biz_fingerprint 
  ON public.ai_bookkeeping_classifications(business_id, input_fingerprint);

CREATE INDEX IF NOT EXISTS idx_ai_bookkeeping_classifications_biz_idempotency 
  ON public.ai_bookkeeping_classifications(business_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ai_bookkeeping_classifications_invocation 
  ON public.ai_bookkeeping_classifications(ai_invocation_id);

-- Enable Row Level Security
ALTER TABLE public.ai_bookkeeping_classifications ENABLE ROW LEVEL SECURITY;

-- 1. Platform Admins can read all classification records
CREATE POLICY "Platform admins can view all ai classifications"
  ON public.ai_bookkeeping_classifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE user_id = auth.uid()
        AND status = 'active'
    )
  );

-- 2. Business Members can read only their own business classification suggestions
CREATE POLICY "Business members can view their own business ai classifications"
  ON public.ai_bookkeeping_classifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.business_memberships
      WHERE business_id = ai_bookkeeping_classifications.business_id
        AND user_id = auth.uid()
    )
  );
