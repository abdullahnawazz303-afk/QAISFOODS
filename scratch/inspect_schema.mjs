import fs from 'fs';

const envPath = '.env';
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`^${name}=(.*)$`, 'm'));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

async function inspectSchema() {
  console.log("Fetching schema from Supabase REST API...");
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    if (!res.ok) {
      console.error("HTTP error:", res.status, res.statusText);
      return;
    }
    const data = await res.json();
    console.log("Successfully fetched schema metadata!");
    console.log("Exposed Tables/Views:");
    const tables = Object.keys(data.definitions || {});
    console.log(tables);

    if (data.definitions && data.definitions.reviews) {
      console.log("\nColumns in 'reviews' table:");
      console.log(JSON.stringify(data.definitions.reviews.properties, null, 2));
    } else {
      console.log("\n'reviews' table NOT found in exposed definitions.");
    }

    if (data.definitions && data.definitions.featured_reviews) {
      console.log("\nColumns in 'featured_reviews' table:");
      console.log(JSON.stringify(data.definitions.featured_reviews.properties, null, 2));
    } else {
      console.log("\n'featured_reviews' table NOT found in exposed definitions.");
    }
  } catch (error) {
    console.error("Error inspecting schema:", error);
  }
}

inspectSchema();
