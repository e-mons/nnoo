-- Migration: 20260811000000_customer_management.sql
-- Description: Create canonical customer management schema and RLS policies

-- 1. Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE RESTRICT,
    customer_type text NOT NULL CHECK (customer_type IN ('individual', 'business')),
    name text NOT NULL,
    company_name text,
    phone text,
    email text,
    address_line_1 text,
    address_line_2 text,
    city text,
    state text,
    country_code text,
    notes text,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    archived_at timestamptz
);

-- 2. Performance indexes
CREATE INDEX idx_customers_business_id ON public.customers(business_id);
CREATE INDEX idx_customers_business_status ON public.customers(business_id, status);
CREATE INDEX idx_customers_business_type ON public.customers(business_id, customer_type);
CREATE INDEX idx_customers_phone ON public.customers(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_customers_email ON public.customers(email) WHERE email IS NOT NULL;

-- 3. RLS enablement
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- SELECT: Active members can view customers of their business
CREATE POLICY "Members can view business customers" ON public.customers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.business_memberships bm
            WHERE bm.business_id = customers.business_id
              AND bm.user_id = auth.uid()
              AND bm.membership_status = 'active'
        )
    );

-- INSERT: owner, business_admin, manager, sales_staff can create customers
CREATE POLICY "Authorized roles can create business customers" ON public.customers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.business_memberships bm
            WHERE bm.business_id = customers.business_id
              AND bm.user_id = auth.uid()
              AND bm.membership_status = 'active'
              AND bm.role IN ('owner', 'business_admin', 'manager', 'sales_staff')
        )
    );

-- UPDATE: owner, business_admin, manager, sales_staff can edit customers
CREATE POLICY "Authorized roles can update business customers" ON public.customers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.business_memberships bm
            WHERE bm.business_id = customers.business_id
              AND bm.user_id = auth.uid()
              AND bm.membership_status = 'active'
              AND bm.role IN ('owner', 'business_admin', 'manager', 'sales_staff')
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.business_memberships bm
            WHERE bm.business_id = customers.business_id
              AND bm.user_id = auth.uid()
              AND bm.membership_status = 'active'
              AND bm.role IN ('owner', 'business_admin', 'manager', 'sales_staff')
        )
    );

-- Trigger to update updated_at automatically
CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION update_customers_updated_at();
