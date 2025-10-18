-- supabase/seed.sql
-- This script is used to populate the database with initial data.
-- It's automatically run by `supabase db reset`.

INSERT INTO public.themes (name, is_default, properties) VALUES
(
  'Padrão (Escuro)',
  true,
  '{
    "fontFamily": "Inter, sans-serif",
    "fontSize": 72,
    "fontWeight": 700,
    "textColor": "#FFFFFF",
    "backgroundColor": "#000000",
    "textAlign": "center",
    "textShadow": "2px 2px 8px rgba(0,0,0,0.7)",
    "transition": { "type": "fade", "duration": 300 }
  }'::jsonb
),
(
  'Cinético: Fluxo Vibrante',
  false,
  '{
    "kinetic": {
      "preset": "vibrant-flow",
      "speed": 1,
      "intensity": 1,
      "blur": 4
    }
  }'::jsonb
),
(
  'Cinético: Nebulosa',
  false,
  '{
    "kinetic": {
      "preset": "nebula-fade",
      "speed": 1,
      "intensity": 1,
      "blur": 0
    }
  }'::jsonb
),
(
  'Blocos Elétricos',
  false,
  '{
    "kinetic": {
      "preset": "electric-blocks",
      "speed": 1,
      "intensity": 1,
      "blur": 0
    }
  }'::jsonb
)
ON CONFLICT (name) DO NOTHING;
