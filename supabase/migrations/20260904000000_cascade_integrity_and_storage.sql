-- Migration: 20260904000000_cascade_integrity_and_storage.sql
-- Description: Enforce cascading delete integrity on business-owned entities (customers, suppliers, billing)
--              and provision credit-passport-artifacts storage bucket with strict RLS policies.

-- 1. Cascade constraints for Customers
ALTER TABLE public.customers
  DROP CONSTRAINT IF EXISTS customers_business_id_fkey,
  ADD CONSTRAINT customers_business_id_fkey
    FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;

-- 2. Cascade constraints for Suppliers
ALTER TABLE public.suppliers
  DROP CONSTRAINT IF EXISTS suppliers_business_id_fkey,
  ADD CONSTRAINT suppliers_business_id_fkey
    FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;

-- 3. Cascade constraints for Billing Subscriptions
ALTER TABLE public.business_subscriptions
  DROP CONSTRAINT IF EXISTS business_subscriptions_business_id_fkey,
  ADD CONSTRAINT business_subscriptions_business_id_fkey
    FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;

-- 4. Cascade constraints for Business Billing Customers
ALTER TABLE public.business_billing_customers
  DROP CONSTRAINT IF EXISTS business_billing_customers_business_id_fkey,
  ADD CONSTRAINT business_billing_customers_business_id_fkey
    FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;

-- 5. Cascade constraints for Business Billing Access Overrides
ALTER TABLE public.business_billing_access_overrides
  DROP CONSTRAINT IF EXISTS business_billing_access_overrides_business_id_fkey,
  ADD CONSTRAINT business_billing_access_overrides_business_id_fkey
    FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;

-- 6. Cascade constraints for Billing Transactions
ALTER TABLE public.billing_transactions
  DROP CONSTRAINT IF EXISTS billing_transactions_business_id_fkey,
  ADD CONSTRAINT billing_transactions_business_id_fkey
    FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;

ALTER TABLE public.billing_transactions
  DROP CONSTRAINT IF EXISTS billing_transactions_business_subscription_id_fkey,
  ADD CONSTRAINT billing_transactions_business_subscription_id_fkey
    FOREIGN KEY (business_subscription_id) REFERENCES public.business_subscriptions(id) ON DELETE SET NULL;

-- 7. Cascade constraints for Billing Plan Provider Mappings
ALTER TABLE public.billing_plan_provider_mappings
  DROP CONSTRAINT IF EXISTS billing_plan_provider_mappings_billing_plan_id_fkey,
  ADD CONSTRAINT billing_plan_provider_mappings_billing_plan_id_fkey
    FOREIGN KEY (billing_plan_id) REFERENCES public.billing_plans(id) ON DELETE CASCADE;

-- 8. Storage bucket provisioning: credit-passport-artifacts
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'credit-passport-artifacts',
  'credit-passport-artifacts',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf']::text[];

-- 9. Storage RLS policies for credit-passport-artifacts
DROP POLICY IF EXISTS "Allow business members to view credit passport artifacts" ON storage.objects;
CREATE POLICY "Allow business members to view credit passport artifacts"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'credit-passport-artifacts' AND
    (storage.foldername(name))[1] = 'businesses' AND
    public.has_business_role(((storage.foldername(name))[2])::uuid, ARRAY['owner', 'business_admin', 'manager', 'accountant', 'read_only'])
  );

DROP POLICY IF EXISTS "Allow owners and admins to upload credit passport artifacts" ON storage.objects;
CREATE POLICY "Allow owners and admins to upload credit passport artifacts"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'credit-passport-artifacts' AND
    (storage.foldername(name))[1] = 'businesses' AND
    public.has_business_role(((storage.foldername(name))[2])::uuid, ARRAY['owner', 'business_admin'])
  );

DROP POLICY IF EXISTS "Allow owners and admins to delete credit passport artifacts" ON storage.objects;
CREATE POLICY "Allow owners and admins to delete credit passport artifacts"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'credit-passport-artifacts' AND
    (storage.foldername(name))[1] = 'businesses' AND
    public.has_business_role(((storage.foldername(name))[2])::uuid, ARRAY['owner', 'business_admin'])
  );
