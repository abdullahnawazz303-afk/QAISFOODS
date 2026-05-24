import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase environment variables are not set. Authentication and data features will not work until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are configured.')
}

// Prevent multiple GoTrueClient instances under Hot Module Replacement (HMR)
const globalSupabase = (globalThis as any).supabaseClient;

export const supabase = globalSupabase || createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
    }
  }
);

if (!globalSupabase) {
  (globalThis as any).supabaseClient = supabase;
}

type ReviewRow = {
  id: string;
  text: string;
  author: string;
  role: string | null;
  created_at: string;
};

/** Set after admin successfully loads reviews with `is_allowed` column — clears any stale cache. */
export function markReviewsApprovalColumnAvailable() {
  sessionStorage.setItem('qais_reviews_use_is_allowed', '1');
}

/**
 * Fetch up to 3 approved reviews for the homepage.
 * Tries featured_reviews first (admin curated), then falls back to latest 3 approved reviews.
 * Always clears stale pre-migration caches before attempting.
 */
export const fetchFeaturedReviews = async () => {
  // Clear any stale "unavailable" flag set before the DB migration was applied
  sessionStorage.removeItem('qais_reviews_remote_unavailable');

  // Try featured_reviews (admin-curated list) first
  const { data: featData, error: featError } = await supabase
    .from('featured_reviews')
    .select('position, reviews(*)')
    .order('position', { ascending: true });

  if (!featError && featData?.length) {
    const reviews = featData
      .map((fr: any) => fr.reviews)
      .filter(Boolean)
      .slice(0, 3);
    if (reviews.length) return { data: reviews, error: null };
  }

  // Fallback: latest 3 approved reviews directly from reviews table
  const { data, error } = await supabase
    .from('reviews')
    .select('id, text, author, role, created_at')
    .eq('is_allowed', true)
    .order('created_at', { ascending: false })
    .limit(3);

  if (!error) return { data: data ?? [], error: null };

  // Last fallback: no filter (for pre-migration state where is_allowed column may not exist)
  const { data: raw } = await supabase
    .from('reviews')
    .select('id, text, author, role, created_at')
    .order('created_at', { ascending: false })
    .limit(3);

  return { data: raw ?? [], error: null };
};

/**
 * Admin helper — set a review as featured at a given position (1-3).
 */
export const setFeaturedReview = async (reviewId: string, position: number) => {
  const { data, error } = await supabase
    .from('featured_reviews')
    .upsert({ review_id: reviewId, position }, { onConflict: 'position' });
  return { data, error };
};

/**
 * Admin helper — remove a review from featured positions.
 */
export const unsetFeaturedReview = async (reviewId: string) => {
  const { error } = await supabase
    .from('featured_reviews')
    .delete()
    .eq('review_id', reviewId);
  return { error };
};

/**
 * Fetch ALL approved reviews ordered by newest first (for the public reviews page).
 * Always clears stale caches before attempting — works even after DB migration.
 */
export const fetchAllReviews = async () => {
  // Clear any stale "unavailable" flag that may have been set before DB migration was applied
  sessionStorage.removeItem('qais_reviews_remote_unavailable');

  // Fetch approved reviews (is_allowed = true)
  const { data, error } = await supabase
    .from('reviews')
    .select('id, text, author, role, created_at')
    .eq('is_allowed', true)
    .order('created_at', { ascending: false });

  if (!error) return { data: data ?? [], error: null };

  // Fallback: column may not exist yet — fetch without is_allowed filter
  const { data: raw, error: rawError } = await supabase
    .from('reviews')
    .select('id, text, author, role, created_at')
    .order('created_at', { ascending: false });

  return { data: raw ?? [], error: rawError };
};

/**
 * Submit a new review (customer only).
 * Tries full insert first with customer_id and is_allowed; if DB is missing columns,
 * falls back to minimal insert with only the columns that always exist.
 */
export const submitReview = async (params: {
  customerId: string;
  author: string;
  text: string;
  role?: string;
}) => {
  // First attempt: full schema insert with customer_id and is_allowed = false (pending approval)
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      customer_id: params.customerId,
      author: params.author,
      text: params.text,
      role: params.role ?? 'Customer',
      is_allowed: false, // starts as pending approval
    })
    .select('id')
    .single();

  if (!error) return { data, error: null };

  // Fallback: If database is missing columns, try a minimal insert
  const { data: fallbackData, error: fallbackError } = await supabase
    .from('reviews')
    .insert({
      author: params.author,
      text: params.text,
      role: params.role ?? 'Customer',
    })
    .select('id')
    .single();

  return { data: fallbackData, error: fallbackError };
};

/**
 * Admin helper — delete a review.
 */
export const deleteReview = async (reviewId: string) => {
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId);
  return { error };
};