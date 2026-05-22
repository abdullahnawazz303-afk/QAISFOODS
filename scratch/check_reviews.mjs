import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envPath = '.env';
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`^${name}=(.*)$`, 'm'));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkReviews() {
  console.log("1. Querying reviews table with id, author, role, text, created_at, is_allowed...");
  const { data: data1, error: error1 } = await supabase
    .from('reviews')
    .select('id, author, role, text, created_at, is_allowed')
    .order('created_at', { ascending: false });

  console.log("Query 1 result:", { data1, error1 });

  console.log("\n2. Querying reviews table with id, author, role, text, created_at (NO is_allowed)...");
  const { data: data2, error: error2 } = await supabase
    .from('reviews')
    .select('id, author, role, text, created_at')
    .order('created_at', { ascending: false });

  console.log("Query 2 result:", { data2, error2 });

  console.log("\n3. Querying featured_reviews...");
  const { data: data3, error: error3 } = await supabase
    .from('featured_reviews')
    .select('position, reviews(*)');

  console.log("Featured reviews result:", { data3, error3 });
}

checkReviews();
