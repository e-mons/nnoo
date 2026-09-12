-- Migration: 20260903000000_ai_intelligence_rls_policies.sql
-- Description: Unblocks authorized business members from creating Ask NNOO conversations/messages,
-- generating Health Score snapshots, creating Credit Passport snapshots & shares, and Smart Insights.

-- 1. Ask NNOO: ai_conversations
DROP POLICY IF EXISTS "Deny client direct inserts on ai_conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Deny client direct updates on ai_conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Deny client direct deletes on ai_conversations" ON public.ai_conversations;

CREATE POLICY "Authorized business members can insert ai_conversations"
  ON public.ai_conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_user_id = auth.uid()
    AND public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'accountant', 'sales_staff', 'inventory_staff', 'read_only'])
  );

CREATE POLICY "Authorized business members can update ai_conversations"
  ON public.ai_conversations
  FOR UPDATE
  TO authenticated
  USING (
    owner_user_id = auth.uid()
    AND public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'accountant', 'sales_staff', 'inventory_staff', 'read_only'])
  )
  WITH CHECK (
    owner_user_id = auth.uid()
    AND public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'accountant', 'sales_staff', 'inventory_staff', 'read_only'])
  );

CREATE POLICY "Authorized business members can delete ai_conversations"
  ON public.ai_conversations
  FOR DELETE
  TO authenticated
  USING (
    owner_user_id = auth.uid()
    AND public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'accountant', 'sales_staff', 'inventory_staff', 'read_only'])
  );

-- 2. Ask NNOO: ai_messages
DROP POLICY IF EXISTS "Deny client direct inserts on ai_messages" ON public.ai_messages;
DROP POLICY IF EXISTS "Deny client direct updates on ai_messages" ON public.ai_messages;
DROP POLICY IF EXISTS "Deny client direct deletes on ai_messages" ON public.ai_messages;

CREATE POLICY "Authorized business members can insert ai_messages"
  ON public.ai_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_user_id = auth.uid()
    AND public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'accountant', 'sales_staff', 'inventory_staff', 'read_only'])
  );

-- 3. Business Health Score: ai_business_health_snapshots
DROP POLICY IF EXISTS "Deny client direct inserts on health snapshots" ON public.ai_business_health_snapshots;
DROP POLICY IF EXISTS "Deny client direct updates on health snapshots" ON public.ai_business_health_snapshots;
DROP POLICY IF EXISTS "Deny client direct deletes on health snapshots" ON public.ai_business_health_snapshots;

CREATE POLICY "Authorized business members can insert health snapshots"
  ON public.ai_business_health_snapshots
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'accountant'])
  );

CREATE POLICY "Authorized business members can update health snapshots"
  ON public.ai_business_health_snapshots
  FOR UPDATE
  TO authenticated
  USING (
    public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'accountant'])
  )
  WITH CHECK (
    public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'accountant'])
  );

-- 4. Credit Passport: credit_passport_snapshots
DROP POLICY IF EXISTS "Authorized business members can insert credit_passport_snapshots" ON public.credit_passport_snapshots;

CREATE POLICY "Authorized business members can insert credit_passport_snapshots"
  ON public.credit_passport_snapshots
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'accountant'])
  );

-- 5. Credit Passport Shares: credit_passport_shares
DROP POLICY IF EXISTS "Authorized business members can insert credit_passport_shares" ON public.credit_passport_shares;
DROP POLICY IF EXISTS "Authorized business members can delete credit_passport_shares" ON public.credit_passport_shares;

CREATE POLICY "Authorized business members can insert credit_passport_shares"
  ON public.credit_passport_shares
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_business_role(business_id, ARRAY['owner', 'business_admin'])
  );

CREATE POLICY "Authorized business members can delete credit_passport_shares"
  ON public.credit_passport_shares
  FOR DELETE
  TO authenticated
  USING (
    public.has_business_role(business_id, ARRAY['owner', 'business_admin'])
  );

-- 6. Smart Insights: ai_business_summaries
DROP POLICY IF EXISTS "Deny client direct inserts on business summaries" ON public.ai_business_summaries;
DROP POLICY IF EXISTS "Deny client direct updates on business summaries" ON public.ai_business_summaries;
DROP POLICY IF EXISTS "Deny client direct deletes on business summaries" ON public.ai_business_summaries;

CREATE POLICY "Authorized business members can insert business summaries"
  ON public.ai_business_summaries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'accountant'])
  );

CREATE POLICY "Authorized business members can update business summaries"
  ON public.ai_business_summaries
  FOR UPDATE
  TO authenticated
  USING (
    public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'accountant'])
  )
  WITH CHECK (
    public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'accountant'])
  );
