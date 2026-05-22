-- Create table for customer reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  author varchar(255) NOT NULL,
  role varchar(255) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Admin can manage reviews (adjust role function as per your auth setup)
CREATE POLICY admin_manage_reviews ON public.reviews
  FOR ALL TO authenticated
  USING (auth.role() = 'admin')
  WITH CHECK (auth.role() = 'admin');

-- Public can read reviews
CREATE POLICY public_read_reviews ON public.reviews
  FOR SELECT TO authenticated
  USING (true);

-- Table linking featured reviews (max 3)
CREATE TABLE IF NOT EXISTS public.featured_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  position int NOT NULL CHECK (position >= 1 AND position <= 3),
  UNIQUE (position)
);

ALTER TABLE public.featured_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_manage_featured ON public.featured_reviews
  FOR ALL TO authenticated
  USING (auth.role() = 'admin')
  WITH CHECK (auth.role() = 'admin');

CREATE POLICY public_read_featured ON public.featured_reviews
  FOR SELECT TO authenticated
  USING (true);
