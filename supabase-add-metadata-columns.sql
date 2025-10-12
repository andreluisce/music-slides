-- Script para adicionar colunas de metadados à tabela songs existente
-- Execute este SQL no SQL Editor do Supabase

-- Adicionar colunas de metadados básicos
ALTER TABLE songs ADD COLUMN IF NOT EXISTS album TEXT;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS year INTEGER;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS genre TEXT DEFAULT 'Gospel';
ALTER TABLE songs ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'pt-BR';

-- Adicionar coluna JSON para metadados avançados
ALTER TABLE songs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Adicionar coluna para análise de IA
ALTER TABLE songs ADD COLUMN IF NOT EXISTS ai_analysis JSONB DEFAULT NULL;

-- Adicionar campos para search otimizado
ALTER TABLE songs ADD COLUMN IF NOT EXISTS search_terms TEXT;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS cache_version TEXT DEFAULT '1.0';

-- Alterar coluna lyrics de TEXT[] para TEXT (para compatibilidade)
ALTER TABLE songs ALTER COLUMN lyrics TYPE TEXT;

-- Criar índices para busca otimizada
CREATE INDEX IF NOT EXISTS idx_songs_genre ON songs(genre);
CREATE INDEX IF NOT EXISTS idx_songs_language ON songs(language);
CREATE INDEX IF NOT EXISTS idx_songs_search_terms ON songs USING gin(to_tsvector('english', search_terms));
CREATE INDEX IF NOT EXISTS idx_songs_metadata ON songs USING gin(metadata);
CREATE INDEX IF NOT EXISTS idx_songs_ai_analysis ON songs USING gin(ai_analysis);

-- Criar índices para full-text search
CREATE INDEX IF NOT EXISTS idx_songs_title_search ON songs USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_songs_artist_search ON songs USING gin(to_tsvector('english', artist));
CREATE INDEX IF NOT EXISTS idx_songs_lyrics_search ON songs USING gin(to_tsvector('english', lyrics));

-- Função para atualizar search_terms automaticamente
CREATE OR REPLACE FUNCTION update_search_terms()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_terms = LOWER(COALESCE(NEW.artist, '') || ' ' || COALESCE(NEW.title, ''));
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar search_terms automaticamente
DROP TRIGGER IF EXISTS update_songs_search_terms ON songs;
CREATE TRIGGER update_songs_search_terms 
  BEFORE INSERT OR UPDATE ON songs
  FOR EACH ROW EXECUTE FUNCTION update_search_terms();

-- Atualizar search_terms para registros existentes
UPDATE songs SET search_terms = LOWER(COALESCE(artist, '') || ' ' || COALESCE(title, '')) WHERE search_terms IS NULL;