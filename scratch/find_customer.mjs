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

async function findCustomer() {
  console.log("Fetching a customer user profile...");
  const { data, error } = await supabase
    .from('users')
    .select('email, role, customer_id')
    .eq('role', 'customer')
    .limit(1);

  if (error) {
    console.error("Error:", error);
    return;
  }
  console.log("Customer found:", data);
}

findCustomer();
