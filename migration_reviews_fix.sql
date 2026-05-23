-- ============================================================
-- QAIS Foods — Customer Reviews Schema and Policy Fix Migration
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Add missing columns to public.reviews table
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_allowed BOOLEAN DEFAULT false;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;

-- 2. Drop existing RLS policies on reviews to start clean
DROP POLICY IF EXISTS admin_manage_reviews ON public.reviews;
DROP POLICY IF EXISTS public_read_reviews ON public.reviews;
DROP POLICY IF EXISTS "Public can read approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated customers can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated manage reviews" ON public.reviews;

-- 3. Create fresh, correct RLS policies on reviews
-- Anyone (including non-logged-in visitors) can select approved reviews
CREATE POLICY "Public can read approved reviews" ON public.reviews
  FOR SELECT
  USING (is_allowed = true);

-- Authenticated users (customers/admins/staff) can INSERT reviews
CREATE POLICY "Authenticated customers can insert reviews" ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Authenticated users can manage (select, update, delete) reviews
CREATE POLICY "Authenticated manage reviews" ON public.reviews
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Drop existing RLS policies on featured_reviews to start clean
DROP POLICY IF EXISTS admin_manage_featured ON public.featured_reviews;
DROP POLICY IF EXISTS public_read_featured ON public.featured_reviews;
DROP POLICY IF EXISTS "Public read featured reviews" ON public.featured_reviews;
DROP POLICY IF EXISTS "Authenticated manage featured reviews" ON public.featured_reviews;

-- 5. Create fresh, correct RLS policies on featured_reviews
-- Anyone can read featured reviews
CREATE POLICY "Public read featured reviews" ON public.featured_reviews
  FOR SELECT
  USING (true);

-- Authenticated users can manage featured reviews
CREATE POLICY "Authenticated manage featured reviews" ON public.featured_reviews
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
