-- ============================================================
-- QAIS Foods — Ultimate Customer Reviews Schema and Policy Fix
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE 'Starting QAIS Foods Reviews Table Migration...';
  
  -- 1. Ensure columns exist on public.reviews
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
    RAISE NOTICE 'Table "public.reviews" exists. Checking columns...';
    
    -- Add is_allowed
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'is_allowed') THEN
      ALTER TABLE public.reviews ADD COLUMN is_allowed BOOLEAN DEFAULT false;
      RAISE NOTICE 'Added "is_allowed" column to "public.reviews".';
    ELSE
      RAISE NOTICE '"is_allowed" column already exists.';
    END IF;

    -- Add customer_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'customer_id') THEN
      ALTER TABLE public.reviews ADD COLUMN customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;
      RAISE NOTICE 'Added "customer_id" column to "public.reviews".';
    ELSE
      RAISE NOTICE '"customer_id" column already exists.';
    END IF;
  ELSE
    RAISE NOTICE 'Table "public.reviews" does not exist. Creating it...';
    CREATE TABLE public.reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      text TEXT NOT NULL,
      author VARCHAR(255) NOT NULL,
      role VARCHAR(255) NOT NULL DEFAULT 'Customer',
      is_allowed BOOLEAN DEFAULT false,
      customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
    RAISE NOTICE 'Table "public.reviews" created successfully.';
  END IF;

  -- 2. Ensure public.featured_reviews table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'featured_reviews') THEN
    RAISE NOTICE 'Creating "public.featured_reviews" table...';
    CREATE TABLE public.featured_reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
      position INT NOT NULL CHECK (position >= 1 AND position <= 3),
      UNIQUE (position)
    );
    RAISE NOTICE '"public.featured_reviews" table created.';
  ELSE
    RAISE NOTICE '"public.featured_reviews" table already exists.';
  END IF;
END $$;

-- 3. Explicitly grant permissions to Postgres roles
-- This ensures that anonymous and authenticated users have permission to query/insert at table-level!
GRANT ALL ON TABLE public.reviews TO postgres, service_role, authenticated, anon;
GRANT ALL ON TABLE public.featured_reviews TO postgres, service_role, authenticated, anon;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_reviews ENABLE ROW LEVEL SECURITY;

-- 5. Drop ALL existing policies to ensure clean state
DROP POLICY IF EXISTS admin_manage_reviews ON public.reviews;
DROP POLICY IF EXISTS public_read_reviews ON public.reviews;
DROP POLICY IF EXISTS "Public can read approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated customers can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated manage reviews" ON public.reviews;

DROP POLICY IF EXISTS admin_manage_featured ON public.featured_reviews;
DROP POLICY IF EXISTS public_read_featured ON public.featured_reviews;
DROP POLICY IF EXISTS "Public read featured reviews" ON public.featured_reviews;
DROP POLICY IF EXISTS "Authenticated manage featured reviews" ON public.featured_reviews;

-- 6. Create clean, permissive RLS Policies on reviews
-- Anyone (anon + authenticated) can read approved reviews
CREATE POLICY "Public can read approved reviews" ON public.reviews
  FOR SELECT TO anon, authenticated
  USING (is_allowed = true);

-- Authenticated users (customers/admins/staff) can INSERT reviews
CREATE POLICY "Authenticated customers can insert reviews" ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Authenticated users can UPDATE, SELECT, DELETE reviews
CREATE POLICY "Authenticated manage reviews" ON public.reviews
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 7. Create clean, permissive RLS Policies on featured_reviews
-- Anyone can read featured reviews
CREATE POLICY "Public read featured reviews" ON public.featured_reviews
  FOR SELECT TO anon, authenticated
  USING (true);

-- Authenticated users can manage featured reviews
CREATE POLICY "Authenticated manage featured reviews" ON public.featured_reviews
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 8. Mark any existing reviews as approved so they show up immediately
UPDATE public.reviews SET is_allowed = true WHERE is_allowed IS NULL;

-- 9. Refresh schemas cache by notifying PostgREST
NOTIFY pgrst, 'reload schema';
