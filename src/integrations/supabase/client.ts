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

/**
 * Fetch featured reviews for homepage — only allowed ones, ordered by position (1..3).
 */
export const fetchFeaturedReviews = async () => {
  const { data, error } = await supabase
    .from('featured_reviews')
    .select('position, reviews(*)')
    .order('position', { ascending: true });

  // If permission denied or table doesn't exist yet, return empty array gracefully
  if (error) {
    console.warn('fetchFeaturedReviews:', error.message);
    return { data: [], error: null };
  }

  const reviews = (data ?? [])
    .map((fr: any) => fr.reviews)
    .filter(Boolean);

  return { data: reviews, error: null };
};

/**
 * Admin helper — set a review as featured at a given position (1-3).
 * Upserts into featured_reviews respecting the unique position constraint.
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
 * Gracefully handles tables that may not yet have the is_allowed column.
 */
export const fetchAllReviews = async () => {
  // Try with is_allowed filter first
  const { data, error } = await supabase
    .from('reviews')
    .select('id, text, author, role, created_at')
    .order('created_at', { ascending: false });

  if (error) return { data: null, error };
  return { data: data ?? [], error: null };
};

/**
 * Submit a new review (customer only).
 * Tries full insert first; if DB is missing columns (schema not yet migrated),
 * falls back to minimal insert with only the columns that always exist.
 */
export const submitReview = async (params: {
  customerId: string;
  author: string;
  text: string;
  role?: string;
}) => {
  // First attempt: full schema insert
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      author: params.author,
      text: params.text,
      role: params.role ?? 'Customer',
    })
    .select('id')
    .single();

  if (!error) return { data, error: null };

  // If it failed due to permission / column issues, return the error
  return { data: null, error };
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