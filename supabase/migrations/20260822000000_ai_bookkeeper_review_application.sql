-- Migration: 20260822000000_ai_bookkeeper_review_application.sql
-- Purpose: Schema for AI Bookkeeper Human Review, Audit, and Canonical Application Links
-- Governance: Tranche 3 Prompt 3

-- 1. Update check constraint on public.ai_bookkeeping_classifications to support full lifecycle
ALTER TABLE public.ai_bookkeeping_classifications
  DROP CONSTRAINT IF EXISTS ai_bookkeeping_classifications_classification_status_check;

ALTER TABLE public.ai_bookkeeping_classifications
  ADD CONSTRAINT ai_bookkeeping_classifications_classification_status_check
  CHECK (classification_status IN ('pending_review', 'applied', 'rejected', 'superseded', 'analysis_failed'));

-- 2. Create public.ai_bookkeeping_reviews
CREATE TABLE IF NOT EXISTS public.ai_bookkeeping_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  classification_id uuid NOT NULL REFERENCES public.ai_bookkeeping_classifications(id) ON DELETE CASCADE,
  reviewer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  review_action text NOT NULL CHECK (review_action IN ('confirmed', 'corrected', 'rejected', 'reclassified')),
  ai_operation_kind text NOT NULL,
  final_operation_kind text NOT NULL CHECK (final_operation_kind IN ('OPERATING_EXPENSE', 'STOCK_PURCHASE', 'CUSTOMER_PAYMENT', 'SUPPLIER_PAYMENT', 'SALE', 'REFUND', 'REJECTED')),
  category_correction_state text NOT NULL DEFAULT 'not_applicable' CHECK (category_correction_state IN ('accepted', 'corrected', 'cleared', 'not_applicable')),
  counterparty_correction_state text NOT NULL DEFAULT 'not_applicable' CHECK (counterparty_correction_state IN ('accepted', 'corrected', 'cleared', 'not_applicable')),
  duplicate_warning_state text NOT NULL DEFAULT 'none' CHECK (duplicate_warning_state IN ('none', 'acknowledged', 'confirmed_duplicate', 'not_duplicate')),
  review_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Create public.ai_bookkeeping_applications
CREATE TABLE IF NOT EXISTS public.ai_bookkeeping_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  classification_id uuid NOT NULL REFERENCES public.ai_bookkeeping_classifications(id) ON DELETE CASCADE,
  review_id uuid REFERENCES public.ai_bookkeeping_reviews(id) ON DELETE SET NULL,
  application_kind text NOT NULL CHECK (application_kind IN ('OPERATING_EXPENSE', 'STOCK_PURCHASE', 'CUSTOMER_PAYMENT', 'SUPPLIER_PAYMENT', 'SALE', 'REFUND')),
  canonical_target_type text NOT NULL CHECK (canonical_target_type IN ('EXPENSE', 'STOCK_RECEIPT', 'SALE_PAYMENT', 'EXPENSE_PAYMENT', 'STOCK_RECEIPT_PAYMENT', 'SALE', 'SALE_REFUND')),
  canonical_target_id uuid NOT NULL,
  expense_id uuid REFERENCES public.expenses(id) ON DELETE SET NULL,
  stock_receipt_id uuid REFERENCES public.stock_receipts(id) ON DELETE SET NULL,
  sale_id uuid REFERENCES public.sales(id) ON DELETE SET NULL,
  sale_payment_id uuid REFERENCES public.sale_payments(id) ON DELETE SET NULL,
  expense_payment_id uuid REFERENCES public.expense_payments(id) ON DELETE SET NULL,
  stock_receipt_payment_id uuid REFERENCES public.stock_receipt_payments(id) ON DELETE SET NULL,
  sale_refund_id uuid REFERENCES public.sale_refunds(id) ON DELETE SET NULL,
  applied_by_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idempotency_key text NOT NULL,
  payload_fingerprint text NOT NULL,
  status text NOT NULL DEFAULT 'succeeded' CHECK (status IN ('pending', 'succeeded', 'failed')),
  error_code text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  applied_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Indexes & Unique Invariants
CREATE INDEX IF NOT EXISTS idx_ai_bookkeeping_reviews_business_created
  ON public.ai_bookkeeping_reviews(business_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_bookkeeping_reviews_classification
  ON public.ai_bookkeeping_reviews(classification_id);

CREATE INDEX IF NOT EXISTS idx_ai_bookkeeping_applications_business_created
  ON public.ai_bookkeeping_applications(business_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_bookkeeping_applications_classification
  ON public.ai_bookkeeping_applications(classification_id);

CREATE INDEX IF NOT EXISTS idx_ai_bookkeeping_applications_idempotency
  ON public.ai_bookkeeping_applications(business_id, idempotency_key);

CREATE INDEX IF NOT EXISTS idx_ai_bookkeeping_applications_target
  ON public.ai_bookkeeping_applications(canonical_target_type, canonical_target_id);

-- Enforce exactly one successful application per classification
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_succeeded_ai_bookkeeping_app
  ON public.ai_bookkeeping_applications(business_id, classification_id)
  WHERE status = 'succeeded';

-- 5. Row Level Security (RLS)
ALTER TABLE public.ai_bookkeeping_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_bookkeeping_applications ENABLE ROW LEVEL SECURITY;

-- Platform Admin Policies
CREATE POLICY "Platform admins can view all ai_bookkeeping_reviews"
  ON public.ai_bookkeeping_reviews
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins pa
      WHERE pa.user_id = auth.uid()
      AND pa.status = 'active'
    )
  );

CREATE POLICY "Platform admins can view all ai_bookkeeping_applications"
  ON public.ai_bookkeeping_applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins pa
      WHERE pa.user_id = auth.uid()
      AND pa.status = 'active'
    )
  );

-- Business Member Policies (Tenant Isolation)
CREATE POLICY "Business members can view their ai_bookkeeping_reviews"
  ON public.ai_bookkeeping_reviews
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.business_memberships bm
      WHERE bm.business_id = ai_bookkeeping_reviews.business_id
      AND bm.user_id = auth.uid()
    )
  );

CREATE POLICY "Business members can view their ai_bookkeeping_applications"
  ON public.ai_bookkeeping_applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.business_memberships bm
      WHERE bm.business_id = ai_bookkeeping_applications.business_id
      AND bm.user_id = auth.uid()
    )
  );
