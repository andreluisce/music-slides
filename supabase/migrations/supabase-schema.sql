-- Schema para o banco de dados Supabase
-- Execute este SQL no SQL Editor do Supabase

-- Tabela de músicas
CREATE TABLE songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  lyrics TEXT[] NOT NULL,
  is_local BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices para busca rápida
CREATE INDEX idx_songs_title ON songs(title);
CREATE INDEX idx_songs_artist ON songs(artist);
CREATE INDEX idx_songs_is_local ON songs(is_local);

-- Tabela de vídeos de fundo
CREATE TABLE video_backgrounds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela de temas/estilos
CREATE TABLE themes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  font_family TEXT DEFAULT 'Montserrat',
  font_size INTEGER DEFAULT 48,
  font_weight INTEGER DEFAULT 600,
  text_color TEXT DEFAULT '#FFFFFF',
  text_shadow TEXT DEFAULT '2px 2px 4px rgba(0,0,0,0.5)',
  text_outline TEXT DEFAULT 'none',
  background_position TEXT DEFAULT 'center',
  animation_type TEXT DEFAULT 'fade',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at na tabela songs
CREATE TRIGGER update_songs_updated_at BEFORE UPDATE ON songs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_backgrounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público (ajuste conforme necessário)
CREATE POLICY "Enable read access for all users" ON songs FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON songs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON songs FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON songs FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON video_backgrounds FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON video_backgrounds FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON video_backgrounds FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON video_backgrounds FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON themes FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON themes FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON themes FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON themes FOR DELETE USING (true);

-- Inserir tema padrão
INSERT INTO themes (name, is_default) VALUES ('Padrão', true);
