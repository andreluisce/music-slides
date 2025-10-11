// Script to create default beautiful themes
const { createClient } = require('@supabase/supabase-js');

// Load env vars
require('dotenv').config({ path: './renderer/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const themes = [
  {
    name: 'Neon Glow',
    font_family: 'Montserrat',
    font_size: 72,
    font_weight: 700,
    text_color: '#00F0FF',
    text_shadow: '0 0 20px rgba(0, 240, 255, 0.8), 0 0 40px rgba(0, 240, 255, 0.5), 2px 2px 4px rgba(0, 0, 0, 0.8)',
    text_outline: 'none',
    background_position: 'center',
    animation_type: 'fade',
    is_default: false,
  },
  {
    name: 'Elegant Gold',
    font_family: 'Georgia',
    font_size: 64,
    font_weight: 600,
    text_color: '#FFD700',
    text_shadow: '2px 2px 8px rgba(0, 0, 0, 0.9), 0 0 30px rgba(255, 215, 0, 0.3)',
    text_outline: 'none',
    background_position: 'center',
    animation_type: 'slide',
    is_default: false,
  },
  {
    name: 'Bold Impact',
    font_family: 'Bebas Neue',
    font_size: 96,
    font_weight: 900,
    text_color: '#FFFFFF',
    text_shadow: '4px 4px 0px #FF1493, 8px 8px 0px #8B00FF, 12px 12px 20px rgba(0, 0, 0, 0.5)',
    text_outline: 'none',
    background_position: 'center',
    animation_type: 'zoom',
    is_default: false,
  },
];

async function createThemes() {
  console.log('🎨 Creating default themes...\n');

  for (const theme of themes) {
    try {
      const { data, error } = await supabase
        .from('themes')
        .insert([theme])
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating theme "${theme.name}":`, error.message);
      } else {
        console.log(`✅ Created theme: ${theme.name}`);
        console.log(`   Font: ${theme.font_family} ${theme.font_size}px`);
        console.log(`   Color: ${theme.text_color}`);
        console.log(`   Animation: ${theme.animation_type}\n`);
      }
    } catch (error) {
      console.error(`❌ Exception creating theme "${theme.name}":`, error.message);
    }
  }

  console.log('🎉 Done!');
}

createThemes();
