-- ==============================================================================
-- Migration: Products & Services Catalogue
-- Description: Creates the canonical product/service catalogue for businesses.
-- ==============================================================================

-- 1. Product Categories Table
CREATE TABLE public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- Category names should be unique per business
  UNIQUE (business_id, name)
);

-- Triggers for updated_at
CREATE TRIGGER set_product_categories_updated_at
  BEFORE UPDATE ON public.product_categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2. Catalog Items Table
CREATE TABLE public.catalog_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('product', 'service')),
  name text NOT NULL,
  description text,
  category_id uuid REFERENCES public.product_categories(id) ON DELETE SET NULL,
  unit_code text NOT NULL,
  sku text,
  barcode text,
  selling_price_minor bigint NOT NULL CHECK (selling_price_minor >= 0),
  cost_price_minor bigint CHECK (cost_price_minor >= 0),
  currency_code text NOT NULL,
  track_inventory boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  image_path text,
  created_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Constraint: Track inventory must be false for services
ALTER TABLE public.catalog_items ADD CONSTRAINT service_cannot_track_inventory 
CHECK (NOT (item_type = 'service' AND track_inventory = true));

-- Constraints: SKU and Barcode are unique per business (if provided)
CREATE UNIQUE INDEX idx_catalog_items_business_sku ON public.catalog_items(business_id, sku) WHERE sku IS NOT NULL;
CREATE UNIQUE INDEX idx_catalog_items_business_barcode ON public.catalog_items(business_id, barcode) WHERE barcode IS NOT NULL;

-- Triggers for updated_at
CREATE TRIGGER set_catalog_items_updated_at
  BEFORE UPDATE ON public.catalog_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- Row Level Security (RLS)
-- ==============================================================================

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

-- 1. Product Categories RLS
-- READ: Anyone with a valid business role can view categories.
CREATE POLICY "Authorized members can view product categories"
ON public.product_categories
FOR SELECT
TO authenticated
USING (
  public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'sales_staff', 'inventory_staff', 'accountant', 'read_only'])
);

-- MUTATE: Allowed roles can create/update/archive categories.
CREATE POLICY "Authorized members can mutate product categories"
ON public.product_categories
FOR ALL
TO authenticated
USING (
  public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'inventory_staff'])
)
WITH CHECK (
  public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'inventory_staff'])
);


-- 2. Catalog Items RLS
-- READ: Anyone with a valid business role can view items.
CREATE POLICY "Authorized members can view catalog items"
ON public.catalog_items
FOR SELECT
TO authenticated
USING (
  public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'sales_staff', 'inventory_staff', 'accountant', 'read_only'])
);

-- MUTATE: Allowed roles can create/update/archive items.
-- NOTE: We allow standard INSERT/UPDATE. The Next.js server actions validate payload contents.
-- Direct DB mutation through Supabase REST is also restricted to these roles.
CREATE POLICY "Authorized members can mutate catalog items"
ON public.catalog_items
FOR ALL
TO authenticated
USING (
  public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'inventory_staff'])
)
WITH CHECK (
  public.has_business_role(business_id, ARRAY['owner', 'business_admin', 'manager', 'inventory_staff'])
);
