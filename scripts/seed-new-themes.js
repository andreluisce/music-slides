const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load env vars from the root .env.local
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Make sure SUPABASE_URL and SUPABASE_ANON_KEY are in your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const themesToSeed = [
  {
    name: 'Padrão (Escuro)',
    is_default: true,
    properties: {
      fontFamily: 'Inter, sans-serif',
      fontSize: 72,
      fontWeight: 700,
      textColor: '#FFFFFF',
      backgroundColor: '#000000',
      textAlign: 'center',
      textShadow: '2px 2px 8px rgba(0,0,0,0.7)',
      transition: { type: 'fade', duration: 300 },
    }
  },
  {
    name: 'Cinético: Fluxo Vibrante',
    is_default: false,
    properties: {
      kinetic: {
        preset: 'vibrant-flow',
        speed: 1,
        intensity: 1,
        blur: 4,
      }
    }
  },
  {
    name: 'Cinético: Nebulosa',
    is_default: false,
    properties: {
      kinetic: {
        preset: 'nebula-fade',
        speed: 1,
        intensity: 1,
        blur: 0,
      }
    }
  },
  {
    name: 'Blocos Elétricos',
    is_default: false,
    properties: {
      kinetic: {
        preset: 'electric-blocks',
        speed: 1,
        intensity: 1,
        blur: 0,
      }
    }
  }
];

async function seedThemes() {
  console.log('🎨 Seeding new themes with JSONB structure...');

  const { data: existingThemes, error: fetchError } = await supabase.from('themes').select('name');
  if (fetchError) {
    console.error('❌ Error fetching existing themes:', fetchError.message);
    return;
  }
  const existingThemeNames = existingThemes.map(t => t.name);

  for (const theme of themesToSeed) {
    if (existingThemeNames.includes(theme.name)) {
      console.log(`🟡 Theme "${theme.name}" already exists. Skipping.`);
      continue;
    }

    const { data, error } = await supabase
      .from('themes')
      .insert(theme)
      .select()
      .single();

    if (error) {
      console.error(`❌ Error creating theme "${theme.name}":`, error.message);
    } else {
      console.log(`✅ Created theme: ${data.name}`);
    }
  }

  console.log('\n🎉 Done!');
}

seedThemes();
