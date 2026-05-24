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

async function checkColumns() {
  console.log("Checking if is_allowed column exists by selecting it...");
  const { data, error } = await supabase
    .from('reviews')
    .select('id, is_allowed')
    .limit(1);

  console.log("Result of selecting is_allowed:", { data, error });
}

checkColumns();
