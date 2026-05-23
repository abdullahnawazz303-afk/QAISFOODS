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

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env vars in .env!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const updates = [
  {
    name: "دال چنا باریک",
    english_name: "Premium Split Chickpeas (Fine)",
    category: "dal",
    image_url: "https://images.unsplash.com/photo-1547825407-2d060104b7f8?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "دال چنا موٹی",
    english_name: "Premium Split Chickpeas (Coarse)",
    category: "dal",
    image_url: "https://images.unsplash.com/photo-1547825407-2d060104b7f8?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "دال مسور",
    english_name: "Split Red Lentils (Grade A)",
    category: "dal",
    image_url: "https://images.unsplash.com/photo-1505253758473-96b7015fcd40?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "دال مسور (B)",
    english_name: "Split Red Lentils (Grade B)",
    category: "dal",
    image_url: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "سوی ماس",
    english_name: "Premium Split Black Gram",
    category: "dal",
    image_url: "https://images.unsplash.com/photo-1515942400420-2b98fed1f515?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "چاول 386",
    english_name: "Super Basmati Rice 386",
    category: "chawal",
    image_url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "باش سلاچی",
    english_name: "Premium Salachi Basmati Rice",
    category: "chawal",
    image_url: "https://images.unsplash.com/photo-1591814468924-caf88d1232e1?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "باش چاول چین",
    english_name: "Imported Chinese Basmati Rice",
    category: "chawal",
    image_url: "https://images.unsplash.com/photo-1536304997881-a372c179924b?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "سوی چنا",
    english_name: "Sui Premium Desi Chickpeas",
    category: "channe",
    image_url: "https://images.unsplash.com/photo-1533612861530-d022b7c46132?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "کالا چنا موٹا",
    english_name: "Premium Large Black Chickpeas",
    category: "channe",
    image_url: "https://images.unsplash.com/photo-1585993003615-5e6080931215?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "کالا چنا باریک",
    english_name: "Premium Fine Black Chickpeas",
    category: "channe",
    image_url: "https://images.unsplash.com/photo-1585993003615-5e6080931215?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "سفید چنا چکنا (B90)",
    english_name: "Kabuli Chickpeas Chakna B90",
    category: "channe",
    image_url: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "سفید چنا موٹا (10mm)",
    english_name: "Premium White Chickpeas (10mm Jumbo)",
    category: "channe",
    image_url: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "سرخ لوبیا",
    english_name: "Premium Red Kidney Beans",
    category: "lobiya",
    image_url: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "سرخ لوبیا چکول",
    english_name: "Red Kidney Beans (Chakol Special)",
    category: "lobiya",
    image_url: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "سفید لوبیا",
    english_name: "Premium White Kidney Beans",
    category: "lobiya",
    image_url: "https://images.unsplash.com/photo-1536510233921-8e5043fce771?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "باجرہ کالا",
    english_name: "Black Pearl Millet (Premium Bajra)",
    category: "bajra",
    image_url: "https://images.unsplash.com/photo-1608797178974-15b35a61d121?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "سورج مکھی (B)",
    english_name: "Organic Sunflower Seeds (Grade B)",
    category: "others",
    image_url: "https://images.unsplash.com/photo-1598965402089-897ce52e8355?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "سورج مکھی دال (M)",
    english_name: "Sunflower Seed Kernels (Grade A)",
    category: "others",
    image_url: "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "dalya",
    english_name: "Premium Cracked Wheat (Dalia)",
    category: "others",
    image_url: "https://images.unsplash.com/photo-1608797178974-15b35a61d121?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "تیس خاص",
    english_name: "Premium Mix Spice Grains",
    category: "others",
    image_url: "https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "چھٹکی",
    english_name: "Cracked Broken Grains",
    category: "others",
    image_url: "https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "کھوکی",
    english_name: "Premium Wheat Husk / Bran",
    category: "others",
    image_url: "https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "ردی موٹا",
    english_name: "Coarse Waste Husk Grains",
    category: "others",
    image_url: "https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?auto=format&fit=crop&w=600&q=80"
  },
  {
    name: "ردی کم",
    english_name: "Fine Waste Grains",
    category: "others",
    image_url: "https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?auto=format&fit=crop&w=600&q=80"
  }
];

async function main() {
  console.log("Starting Supabase database metadata modernization...");
  
  for (const item of updates) {
    const { data, error } = await supabase
      .from('item_names')
      .update({
        english_name: item.english_name,
        category: item.category,
        image_url: item.image_url
      })
      .eq('name', item.name);
      
    if (error) {
      console.error(`Failed to update ${item.name}:`, error);
    } else {
      console.log(`Successfully updated: "${item.name}" -> English: "${item.english_name}", Category: "${item.category}"`);
    }
  }

  // Handle special 'dalya' name case where the name itself is lowercase english
  const { error: dalyaError } = await supabase
    .from('item_names')
    .update({
      english_name: "Premium Cracked Wheat (Dalia)",
      category: "others",
      image_url: "https://images.unsplash.com/photo-1608797178974-15b35a61d121?auto=format&fit=crop&w=600&q=80"
    })
    .eq('name', 'dalya');
  if (dalyaError) {
    console.error("Failed to update dalya:", dalyaError);
  } else {
    console.log("Successfully updated 'dalya' case.");
  }
  
  console.log("Database metadata modernization completed successfully!");
}

main();
