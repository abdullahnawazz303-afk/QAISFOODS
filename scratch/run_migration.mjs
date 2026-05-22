/**
 * QAIS Foods — Database Migration Runner
 * =======================================
 * Runs the reviews schema fix via the Supabase Management API.
 *
 * USAGE:
 *   node scratch/run_migration.mjs <YOUR_SUPABASE_PAT>
 *
 * Get your Personal Access Token (PAT) from:
 *   https://supabase.com/dashboard/account/tokens
 *
 * The token is a read/write token that allows executing SQL against your project.
 */

import fs from 'fs';

const PROJECT_REF = 'elfnxgojpdtoqhzreupk';
const PAT = process.argv[2];

if (!PAT) {
  console.error('\n❌  No Personal Access Token provided!\n');
  console.error('USAGE: node scratch/run_migration.mjs <YOUR_SUPABASE_PAT>\n');
  console.error('Get your PAT from: https://supabase.com/dashboard/account/tokens\n');
  process.exit(1);
}

const SQL = `
-- ============================================================
-- QAIS Foods — Customer Reviews Schema and Policy Fix
-- ============================================================

-- 1. Add missing columns if they don't exist
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_allowed BOOLEAN DEFAULT true;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;

-- 2. Drop ALL existing RLS policies on reviews (clean slate)
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'reviews' AND schemaname = 'public' LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.reviews';
  END LOOP;
END $$;

-- 3. Ensure RLS is enabled on reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 4. Create correct RLS policies on reviews
-- Anyone (anon + authenticated) can read ALL reviews
CREATE POLICY "public_read_reviews" ON public.reviews
  FOR SELECT TO anon, authenticated
  USING (true);

-- Authenticated users can insert reviews
CREATE POLICY "authenticated_insert_reviews" ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Authenticated users can update reviews
CREATE POLICY "authenticated_update_reviews" ON public.reviews
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users can delete reviews
CREATE POLICY "authenticated_delete_reviews" ON public.reviews
  FOR DELETE TO authenticated
  USING (true);

-- 5. Drop ALL existing RLS policies on featured_reviews (clean slate)
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'featured_reviews' AND schemaname = 'public' LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.featured_reviews';
  END LOOP;
END $$;

-- 6. Ensure RLS is enabled on featured_reviews
ALTER TABLE public.featured_reviews ENABLE ROW LEVEL SECURITY;

-- 7. Create correct RLS policies on featured_reviews
-- Anyone can read featured reviews
CREATE POLICY "public_read_featured_reviews" ON public.featured_reviews
  FOR SELECT TO anon, authenticated
  USING (true);

-- Authenticated users can manage featured reviews
CREATE POLICY "authenticated_manage_featured_reviews" ON public.featured_reviews
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 8. Mark existing reviews as allowed (so they show up immediately)
UPDATE public.reviews SET is_allowed = true WHERE is_allowed IS NULL;
`;

async function runMigration() {
  console.log('\n🚀  Running QAIS Foods reviews schema migration...\n');
  console.log(`📦  Project: ${PROJECT_REF}`);
  console.log(`🔑  Token: ${PAT.slice(0, 8)}...[hidden]\n`);

  try {
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAT}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: SQL }),
      }
    );

    const text = await response.text();
    let result;
    try { result = JSON.parse(text); } catch { result = text; }

    if (!response.ok) {
      console.error('❌  Migration FAILED!');
      console.error('HTTP Status:', response.status);
      console.error('Response:', JSON.stringify(result, null, 2));
      process.exit(1);
    }

    console.log('✅  Migration completed successfully!\n');
    console.log('Result:', JSON.stringify(result, null, 2));
    console.log('\n🎉  Reviews table now has correct schema and RLS policies.');
    console.log('    Customers can now submit reviews from the Customer Portal!');

  } catch (err) {
    console.error('❌  Network error running migration:', err.message);
    console.error('\nAlternative: Copy the SQL below and paste it into:');
    console.error('  Supabase Dashboard → SQL Editor → New query → Paste → Run\n');
    console.error(SQL);
    process.exit(1);
  }
}

runMigration();
