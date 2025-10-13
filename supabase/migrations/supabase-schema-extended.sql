-- Schema Estendido para Sistema Completo
-- Execute este SQL no SQL Editor do Supabase DEPOIS de executar o supabase-schema.sql

-- ==================================
-- TABELA DE APRESENTAÇÕES
-- ==================================
CREATE TABLE IF NOT EXISTS presentations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==================================
-- ITENS DA APRESENTAÇÃO
-- ==================================
CREATE TABLE IF NOT EXISTS presentation_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('song', 'custom_slide', 'image', 'video')),
  song_id UUID REFERENCES songs(id) ON DELETE SET NULL,
  custom_slide_id UUID REFERENCES custom_slides(id) ON DELETE SET NULL,
  theme_id UUID REFERENCES themes(id) ON DELETE SET NULL,
  video_id UUID REFERENCES video_backgrounds(id) ON DELETE SET NULL,
  order_index INTEGER NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==================================
-- SLIDES PERSONALIZADOS
-- ==================================
CREATE TABLE IF NOT EXISTS custom_slides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  content TEXT NOT NULL,
  slide_type TEXT DEFAULT 'text' CHECK (slide_type IN ('text', 'image', 'announcement')),
  background_color TEXT DEFAULT '#000000',
  background_image_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==================================
-- TAGS
-- ==================================
CREATE TABLE IF NOT EXISTS tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#8B5CF6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==================================
-- RELAÇÃO MÚSICAS E TAGS
-- ==================================
CREATE TABLE IF NOT EXISTS song_tags (
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (song_id, tag_id)
);

-- ==================================
-- FAVORITOS
-- ==================================
CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_type TEXT NOT NULL CHECK (item_type IN ('song', 'presentation', 'theme', 'video')),
  item_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(item_type, item_id)
);

-- ==================================
-- HISTÓRICO DE APRESENTAÇÕES
-- ==================================
CREATE TABLE IF NOT EXISTS presentation_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  presentation_id UUID REFERENCES presentations(id) ON DELETE SET NULL,
  presented_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  duration_seconds INTEGER,
  notes TEXT
);

-- ==================================
-- ÍNDICES
-- ==================================
CREATE INDEX idx_presentation_items_presentation_id ON presentation_items(presentation_id);
CREATE INDEX idx_presentation_items_order ON presentation_items(presentation_id, order_index);
CREATE INDEX idx_song_tags_song_id ON song_tags(song_id);
CREATE INDEX idx_song_tags_tag_id ON song_tags(tag_id);
CREATE INDEX idx_favorites_item_type_id ON favorites(item_type, item_id);
CREATE INDEX idx_presentation_history_date ON presentation_history(presented_at DESC);

-- ==================================
-- TRIGGERS PARA UPDATED_AT
-- ==================================
CREATE TRIGGER update_presentations_updated_at
  BEFORE UPDATE ON presentations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_slides_updated_at
  BEFORE UPDATE ON custom_slides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==================================
-- ROW LEVEL SECURITY
-- ==================================
ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentation_history ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público (ajuste conforme necessário)
CREATE POLICY "Enable all access for presentations" ON presentations FOR ALL USING (true);
CREATE POLICY "Enable all access for presentation_items" ON presentation_items FOR ALL USING (true);
CREATE POLICY "Enable all access for custom_slides" ON custom_slides FOR ALL USING (true);
CREATE POLICY "Enable all access for tags" ON tags FOR ALL USING (true);
CREATE POLICY "Enable all access for song_tags" ON song_tags FOR ALL USING (true);
CREATE POLICY "Enable all access for favorites" ON favorites FOR ALL USING (true);
CREATE POLICY "Enable all access for presentation_history" ON presentation_history FOR ALL USING (true);

-- ==================================
-- DADOS INICIAIS
-- ==================================

-- Tags padrão
INSERT INTO tags (name, color) VALUES
  ('Louvor', '#8B5CF6'),
  ('Adoração', '#EC4899'),
  ('Jovens', '#06B6D4'),
  ('Infantil', '#F59E0B'),
  ('Natal', '#EF4444'),
  ('Páscoa', '#10B981')
ON CONFLICT (name) DO NOTHING;

-- Apresentação de exemplo (opcional)
INSERT INTO presentations (name, description) VALUES
  ('Culto de Domingo - Exemplo', 'Apresentação de exemplo para começar')
ON CONFLICT DO NOTHING;
