BEGIN;

-- Load pgTAP
CREATE EXTENSION IF NOT EXISTS pgtap;

-- Plan the tests (we have a good amount of them)
SELECT plan(19);

-- 1. Setup Test Users and Roles
-- Create two businesses
INSERT INTO public.businesses (id, name, industry) VALUES 
('00000000-0000-0000-0000-000000000001', 'Test Biz 1', 'retail'),
('00000000-0000-0000-0000-000000000002', 'Test Biz 2', 'retail')
ON CONFLICT DO NOTHING;

-- Create test categories
INSERT INTO public.product_categories (id, business_id, name) VALUES 
('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Drinks'),
('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000002', 'Services')
ON CONFLICT DO NOTHING;

-- ==========================================
-- TEST 1: Constraints
-- ==========================================

-- 1.1 Service cannot track inventory
SELECT throws_ok(
  $$ INSERT INTO public.catalog_items (business_id, item_type, name, unit_code, selling_price_minor, currency_code, track_inventory)
     VALUES ('00000000-0000-0000-0000-000000000001', 'service', 'Consulting', 'hr', 1000, 'NGN', true) $$,
  23514,
  'new row for relation "catalog_items" violates check constraint "service_cannot_track_inventory"',
  'A service cannot have track_inventory = true'
);

SELECT lives_ok(
  $$ INSERT INTO public.catalog_items (business_id, item_type, name, unit_code, selling_price_minor, currency_code, track_inventory)
     VALUES ('00000000-0000-0000-0000-000000000001', 'service', 'Consulting', 'hr', 1000, 'NGN', false) $$,
  'A service CAN have track_inventory = false'
);

SELECT lives_ok(
  $$ INSERT INTO public.catalog_items (business_id, item_type, name, unit_code, selling_price_minor, currency_code, track_inventory)
     VALUES ('00000000-0000-0000-0000-000000000001', 'product', 'Coke', 'bottle', 150, 'NGN', true) $$,
  'A product CAN have track_inventory = true'
);

-- 1.2 Uniqueness rules
-- SKU unique in Biz 1
SELECT lives_ok(
  $$ INSERT INTO public.catalog_items (business_id, item_type, name, unit_code, selling_price_minor, currency_code, sku)
     VALUES ('00000000-0000-0000-0000-000000000001', 'product', 'Pepsi', 'bottle', 150, 'NGN', 'SKU-001') $$,
  'Can insert SKU-001 in Biz 1'
);

SELECT throws_ok(
  $$ INSERT INTO public.catalog_items (business_id, item_type, name, unit_code, selling_price_minor, currency_code, sku)
     VALUES ('00000000-0000-0000-0000-000000000001', 'product', 'Fanta', 'bottle', 150, 'NGN', 'SKU-001') $$,
  23505,
  NULL,
  'Cannot insert duplicate SKU-001 in Biz 1'
);

SELECT lives_ok(
  $$ INSERT INTO public.catalog_items (business_id, item_type, name, unit_code, selling_price_minor, currency_code, sku)
     VALUES ('00000000-0000-0000-0000-000000000002', 'product', 'Sprite', 'bottle', 150, 'NGN', 'SKU-001') $$,
  'Can insert SKU-001 in Biz 2 (business scoped uniqueness)'
);

-- ==========================================
-- TEST 2: Schema validation
-- ==========================================
SELECT has_table('public', 'product_categories', 'product_categories table exists');
SELECT has_table('public', 'catalog_items', 'catalog_items table exists');

SELECT has_column('public', 'catalog_items', 'selling_price_minor', 'selling_price_minor exists');
SELECT has_column('public', 'catalog_items', 'cost_price_minor', 'cost_price_minor exists');

SELECT col_type_is('public', 'catalog_items', 'selling_price_minor', 'bigint', 'selling_price is bigint');
SELECT col_type_is('public', 'catalog_items', 'cost_price_minor', 'bigint', 'cost_price is bigint');

-- ==========================================
-- TEST 3: Basic Data Setup for RLS
-- ==========================================
-- Create test users
INSERT INTO auth.users (id, email) VALUES 
('40000000-0000-0000-0000-000000000001', 'owner1_catalog@nnoo.test'),
('40000000-0000-0000-0000-000000000002', 'staff1_catalog@nnoo.test'),
('50000000-0000-0000-0000-000000000001', 'owner2_catalog@nnoo.test')
ON CONFLICT DO NOTHING;

INSERT INTO public.profiles (id, first_name, last_name) VALUES 
('40000000-0000-0000-0000-000000000001', 'Owner', 'One'),
('40000000-0000-0000-0000-000000000002', 'Staff', 'One'),
('50000000-0000-0000-0000-000000000001', 'Owner', 'Two')
ON CONFLICT DO NOTHING;

-- Create memberships
INSERT INTO public.business_memberships (business_id, user_id, role, membership_status) VALUES
('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'owner', 'active'),
('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 'sales_staff', 'active'),
('00000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', 'owner', 'active')
ON CONFLICT DO NOTHING;

-- ==========================================
-- TEST 4: RLS Policies
-- ==========================================

-- Switch to Owner 1
SET request.jwt.claim.sub = '40000000-0000-0000-0000-000000000001';
SET role authenticated;

SELECT results_eq(
  $$ SELECT count(*)::int FROM public.catalog_items $$,
  ARRAY[3],
  'Owner 1 can see Biz 1 items (3 items)'
);

SELECT lives_ok(
  $$ INSERT INTO public.catalog_items (business_id, item_type, name, unit_code, selling_price_minor, currency_code)
     VALUES ('00000000-0000-0000-0000-000000000001', 'product', 'Water', 'bottle', 100, 'NGN') $$,
  'Owner 1 CAN insert into Biz 1'
);

SELECT throws_ok(
  $$ INSERT INTO public.catalog_items (business_id, item_type, name, unit_code, selling_price_minor, currency_code)
     VALUES ('00000000-0000-0000-0000-000000000002', 'product', 'Secret', 'bottle', 100, 'NGN') $$,
  42501,
  'new row violates row-level security policy for table "catalog_items"',
  'Owner 1 CANNOT insert into Biz 2'
);

-- Switch to Sales Staff 1
SET request.jwt.claim.sub = '40000000-0000-0000-0000-000000000002';

SELECT results_eq(
  $$ SELECT count(*)::int FROM public.catalog_items $$,
  ARRAY[4],
  'Sales Staff 1 can see Biz 1 items'
);

SELECT throws_ok(
  $$ INSERT INTO public.catalog_items (business_id, item_type, name, unit_code, selling_price_minor, currency_code)
     VALUES ('00000000-0000-0000-0000-000000000001', 'product', 'Juice', 'bottle', 200, 'NGN') $$,
  42501,
  'new row violates row-level security policy for table "catalog_items"',
  'Sales Staff 1 CANNOT insert into Biz 1 (denied by policy)'
);

-- Reset privileges
RESET role;
SET request.jwt.claim.sub = '';

SELECT * FROM finish();
ROLLBACK;
