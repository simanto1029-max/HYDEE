-- ==============================================================================
-- HYDEE LUXURY ATELIER — PRODUCTION SUPABASE SQL SETUP SCRIPT
-- ==============================================================================
-- Run this entire script in Supabase Dashboard -> SQL Editor -> Click 'Run'.
-- It creates all tables with full support for anonymous client-side sync.
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 0. CLEAN RESET: DROP PREVIOUS CONFLICTING UUID TABLES
-- ==============================================================================
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.product_variants CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.delivery_zones CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;

-- 1. CATEGORIES TABLE
CREATE TABLE public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  display_order INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PRODUCTS TABLE
CREATE TABLE public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  category_slug TEXT NOT NULL,
  category_name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  compare_at_price NUMERIC(10, 2),
  cost_price NUMERIC(10, 2),
  stock INT NOT NULL DEFAULT 10,
  description TEXT NOT NULL DEFAULT '',
  short_description TEXT DEFAULT '',
  fabric TEXT DEFAULT '',
  fit TEXT DEFAULT '',
  care TEXT DEFAULT '',
  origin TEXT DEFAULT '',
  craftsmanship_notes TEXT DEFAULT '',
  images TEXT[] NOT NULL DEFAULT '{}',
  variants JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}',
  is_best_seller BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_hanger_featured BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ORDERS TABLE
CREATE TABLE public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  delivery_address TEXT NOT NULL,
  district TEXT NOT NULL,
  zone_id TEXT DEFAULT 'zone-dhaka',
  zone_name TEXT DEFAULT 'Inside Dhaka Metropolitan',
  notes TEXT,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  advance_delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 80,
  discount_amount NUMERIC(10, 2) DEFAULT 0,
  discount_code TEXT,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  remaining_cod_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING_ADVANCE',
  payment_status TEXT NOT NULL DEFAULT 'UNPAID',
  advance_payment_method TEXT,
  transaction_id TEXT,
  verified_at TIMESTAMPTZ,
  courier_name TEXT DEFAULT 'Steadfast',
  courier_tracking_code TEXT,
  is_test_order BOOLEAN DEFAULT FALSE,
  timeline JSONB DEFAULT '[]'::jsonb,
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DELIVERY ZONES TABLE
CREATE TABLE public.delivery_zones (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  advance_fee NUMERIC(10, 2) NOT NULL DEFAULT 80,
  estimated_days TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ENABLE ROW LEVEL SECURITY & GRANT FULL PUBLIC (ANON) ACCESS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

-- Categories RLS Policy (Allow SELECT, INSERT, UPDATE, DELETE for anon)
DROP POLICY IF EXISTS "Allow all for categories" ON public.categories;
CREATE POLICY "Allow all for categories" ON public.categories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Products RLS Policy (Allow SELECT, INSERT, UPDATE, DELETE for anon)
DROP POLICY IF EXISTS "Allow all for products" ON public.products;
CREATE POLICY "Allow all for products" ON public.products FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Orders RLS Policy (Allow SELECT, INSERT, UPDATE, DELETE for anon)
DROP POLICY IF EXISTS "Allow all for orders" ON public.orders;
CREATE POLICY "Allow all for orders" ON public.orders FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Delivery Zones RLS Policy
DROP POLICY IF EXISTS "Allow all for delivery_zones" ON public.delivery_zones;
CREATE POLICY "Allow all for delivery_zones" ON public.delivery_zones FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- 6. INSERT SEED DATA (IF EMPTY)
INSERT INTO public.categories (id, name, slug, description, image_url, display_order)
VALUES (
  'cat-three-piece',
  'Three Piece',
  'three-piece',
  'Bespoke artisanal three-piece ensembles with pure silk, intricate zardozi, and organza dupattas.',
  '/images/editorial-glory-red.jpg',
  1
)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO public.products (
  id, name, slug, sku, category_slug, category_name, price, compare_at_price, cost_price, stock,
  description, short_description, fabric, fit, care, origin, craftsmanship_notes, images, variants, tags, is_best_seller, is_featured
)
VALUES (
  'prod-tp-glory',
  'Glory Red Hand-Embroidered Luxury Three Piece Ensemble',
  'glory-red-hand-embroidered-luxury-three-piece',
  'HYD-3PC-GLORY',
  'three-piece',
  'Three Piece',
  16500,
  19500,
  7200,
  8,
  'Luxury in every fold. Specially designed for fancy gatherings and graceful evenings. Crafted from rich crimson pure silk blend with intricate hand-embroidered neckline, matching bandhani printed organza dupatta, and tailored palazzo trousers.',
  'Luxury in every fold. Crimson silk with intricate hand embroidery & bandhani dupatta.',
  'Pure Silk Kameez, Hand-Embroidered Bandhani Dupatta, Silk Palazzo Trousers',
  'Graceful Long Silhouette with Flared Palazzo',
  'Specialist Dry Clean Only',
  'Dhaka Atelier & Hand-finished in Narayanganj',
  'Over 40 hours of precision needlework and delicate neckline zari.',
  ARRAY['/images/editorial-glory-red.jpg'],
  '[
    {"id": "v-glory-38", "name": "Size 38 (S) / Glory Crimson", "size": "38", "color": "Glory Crimson", "colorHex": "#800000", "sku": "HYD-GLORY-38", "price": 16500, "compareAtPrice": 19500, "stock": 3},
    {"id": "v-glory-40", "name": "Size 40 (M) / Glory Crimson", "size": "40", "color": "Glory Crimson", "colorHex": "#800000", "sku": "HYD-GLORY-40", "price": 16500, "compareAtPrice": 19500, "stock": 3},
    {"id": "v-glory-42", "name": "Size 42 (L) / Glory Crimson", "size": "42", "color": "Glory Crimson", "colorHex": "#800000", "sku": "HYD-GLORY-42", "price": 16500, "compareAtPrice": 19500, "stock": 2}
  ]'::jsonb,
  ARRAY['glory-red', 'three-piece', 'maroon', 'crimson', 'luxury'],
  TRUE,
  TRUE
)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO public.delivery_zones (id, name, advance_fee, estimated_days, is_active)
VALUES
  ('zone-dhaka', 'Inside Dhaka Metropolitan', 80.00, '1 - 2 Business Days', TRUE),
  ('zone-outside-dhaka', 'Outside Dhaka / Nationwide', 150.00, '2 - 4 Business Days', TRUE)
ON CONFLICT (id) DO UPDATE SET advance_fee = EXCLUDED.advance_fee;
