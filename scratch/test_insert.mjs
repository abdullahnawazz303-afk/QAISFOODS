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

async function testInsert() {
  console.log("Attempting full insert with customer_id and is_allowed...");
  const { data: data1, error: error1 } = await supabase
    .from('reviews')
    .insert({
      author: 'Test Author',
      text: 'Test review content',
      role: 'Customer',
      is_allowed: false,
      customer_id: 'd3b07384-d113-4ec5-a5d7-ee962f48f072' // a dummy uuid
    })
    .select('id');

  console.log("Full insert result:", { data1, error1 });

  console.log("\nAttempting minimal insert (only author and text)...");
  const { data: data2, error: error2 } = await supabase
    .from('reviews')
    .insert({
      author: 'Test Author',
      text: 'Test review content',
      role: 'Customer'
    })
    .select('id');

  console.log("Minimal insert result:", { data2, error2 });
}

testInsert();
