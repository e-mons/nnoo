-- Migration: 20260902000000_ai_bookkeeper_rls_policies.sql
-- Description: Adds missing INSERT and UPDATE RLS policies on ai_bookkeeping_classifications,
-- ai_bookkeeping_reviews, and ai_bookkeeping_applications for authorized business members and platform admins.

-- 1. ai_bookkeeping_classifications
CREATE POLICY "Authorized business members can insert ai_bookkeeping_classifications"
  ON public.ai_bookkeeping_classifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'accountant', 'sales_staff', 'inventory_staff'])
    AND requested_by_user_id = auth.uid()
  );

CREATE POLICY "Authorized business members can update ai_bookkeeping_classifications"
  ON public.ai_bookkeeping_classifications
  FOR UPDATE
  TO authenticated
  USING (
    public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'accountant', 'sales_staff', 'inventory_staff'])
  )
  WITH CHECK (
    public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'accountant', 'sales_staff', 'inventory_staff'])
  );

CREATE POLICY "Platform admins can manage all ai_bookkeeping_classifications"
  ON public.ai_bookkeeping_classifications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins pa
      WHERE pa.user_id = auth.uid()
      AND pa.status = 'active'
    )
  );

-- 2. ai_bookkeeping_reviews
CREATE POLICY "Authorized business members can insert ai_bookkeeping_reviews"
  ON public.ai_bookkeeping_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'accountant', 'sales_staff', 'inventory_staff'])
    AND reviewer_user_id = auth.uid()
  );

CREATE POLICY "Platform admins can manage all ai_bookkeeping_reviews"
  ON public.ai_bookkeeping_reviews
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins pa
      WHERE pa.user_id = auth.uid()
      AND pa.status = 'active'
    )
  );

-- 3. ai_bookkeeping_applications
CREATE POLICY "Authorized business members can insert ai_bookkeeping_applications"
  ON public.ai_bookkeeping_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'accountant', 'sales_staff', 'inventory_staff'])
    AND applied_by_user_id = auth.uid()
  );

CREATE POLICY "Platform admins can manage all ai_bookkeeping_applications"
  ON public.ai_bookkeeping_applications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins pa
      WHERE pa.user_id = auth.uid()
      AND pa.status = 'active'
    )
  );
