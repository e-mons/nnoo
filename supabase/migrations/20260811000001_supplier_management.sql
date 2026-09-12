-- Migration: 20260811000001_supplier_management.sql
-- Description: Create canonical supplier management schema and RLS policies

-- 1. Create suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE RESTRICT,
    supplier_type text NOT NULL CHECK (supplier_type IN ('individual', 'business')),
    name text NOT NULL,
    company_name text,
    contact_person text,
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
CREATE INDEX idx_suppliers_business_id ON public.suppliers(business_id);
CREATE INDEX idx_suppliers_business_status ON public.suppliers(business_id, status);
CREATE INDEX idx_suppliers_business_type ON public.suppliers(business_id, supplier_type);
CREATE INDEX idx_suppliers_phone ON public.suppliers(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_suppliers_email ON public.suppliers(email) WHERE email IS NOT NULL;

-- 3. RLS enablement
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- SELECT: Active members can view suppliers of their business
CREATE POLICY "Members can view business suppliers" ON public.suppliers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.business_memberships bm
            WHERE bm.business_id = suppliers.business_id
              AND bm.user_id = auth.uid()
              AND bm.membership_status = 'active'
        )
    );

-- INSERT: owner, business_admin, manager, inventory_staff, accountant can create suppliers
CREATE POLICY "Authorized roles can create business suppliers" ON public.suppliers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.business_memberships bm
            WHERE bm.business_id = suppliers.business_id
              AND bm.user_id = auth.uid()
              AND bm.membership_status = 'active'
              AND bm.role IN ('owner', 'business_admin', 'manager', 'inventory_staff', 'accountant')
        )
    );

-- UPDATE: owner, business_admin, manager, inventory_staff, accountant can edit suppliers
CREATE POLICY "Authorized roles can update business suppliers" ON public.suppliers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.business_memberships bm
            WHERE bm.business_id = suppliers.business_id
              AND bm.user_id = auth.uid()
              AND bm.membership_status = 'active'
              AND bm.role IN ('owner', 'business_admin', 'manager', 'inventory_staff', 'accountant')
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.business_memberships bm
            WHERE bm.business_id = suppliers.business_id
              AND bm.user_id = auth.uid()
              AND bm.membership_status = 'active'
              AND bm.role IN ('owner', 'business_admin', 'manager', 'inventory_staff', 'accountant')
        )
    );

-- 5. Trigger to update updated_at automatically
CREATE OR REPLACE FUNCTION update_suppliers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW
EXECUTE FUNCTION update_suppliers_updated_at();
