-- SQL COMPLETO para atualizar a tabela songs com todas as colunas necessárias
-- Execute este SQL no SQL Editor do Supabase Dashboard

-- ==========================================
-- PARTE 1: ADICIONAR NOVAS COLUNAS
-- ==========================================

-- Colunas básicas de metadados
ALTER TABLE songs ADD COLUMN IF NOT EXISTS album TEXT;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS year INTEGER;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS genre TEXT DEFAULT 'Gospel';
ALTER TABLE songs ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'pt-BR';

-- Coluna para metadados estruturados (JSON)
ALTER TABLE songs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Coluna para análise avançada de IA (usado pelo sistema de metadados)
ALTER TABLE songs ADD COLUMN IF NOT EXISTS ai_analysis JSONB DEFAULT NULL;

-- Campos para otimização de busca
ALTER TABLE songs ADD COLUMN IF NOT EXISTS search_terms TEXT;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS cache_version TEXT DEFAULT '1.0';

-- ==========================================
-- PARTE 2: MODIFICAR COLUNA EXISTENTE
-- ==========================================

-- Alterar lyrics de TEXT[] para TEXT (para compatibilidade com sistema de metadados)
ALTER TABLE songs ALTER COLUMN lyrics TYPE TEXT;

-- ==========================================
-- PARTE 3: CRIAR ÍNDICES OTIMIZADOS
-- ==========================================

-- Índices básicos para metadados
CREATE INDEX IF NOT EXISTS idx_songs_album ON songs(album);
CREATE INDEX IF NOT EXISTS idx_songs_year ON songs(year);
CREATE INDEX IF NOT EXISTS idx_songs_genre ON songs(genre);
CREATE INDEX IF NOT EXISTS idx_songs_language ON songs(language);
CREATE INDEX IF NOT EXISTS idx_songs_provider ON songs(provider);

-- Índices GIN para busca em JSON
CREATE INDEX IF NOT EXISTS idx_songs_metadata ON songs USING gin(metadata);
CREATE INDEX IF NOT EXISTS idx_songs_ai_analysis ON songs USING gin(ai_analysis);

-- Índices para full-text search
CREATE INDEX IF NOT EXISTS idx_songs_search_terms ON songs USING gin(to_tsvector('english', COALESCE(search_terms, '')));
CREATE INDEX IF NOT EXISTS idx_songs_title_search ON songs USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_songs_artist_search ON songs USING gin(to_tsvector('english', artist));
CREATE INDEX IF NOT EXISTS idx_songs_lyrics_search ON songs USING gin(to_tsvector('english', COALESCE(lyrics, '')));

-- Índices compostos para buscas otimizadas
CREATE INDEX IF NOT EXISTS idx_songs_artist_title ON songs(artist, title);
CREATE INDEX IF NOT EXISTS idx_songs_genre_language ON songs(genre, language);

-- ==========================================
-- PARTE 4: FUNÇÕES E TRIGGERS AUTOMÁTICOS
-- ==========================================

-- Função para atualizar search_terms automaticamente
CREATE OR REPLACE FUNCTION update_search_terms()
RETURNS TRIGGER AS $$
BEGIN
  -- Combinar artist, title e album para criar search terms
  NEW.search_terms = LOWER(
    COALESCE(NEW.artist, '') || ' ' || 
    COALESCE(NEW.title, '') || ' ' || 
    COALESCE(NEW.album, '')
  );
  -- Remover espaços extras
  NEW.search_terms = TRIM(regexp_replace(NEW.search_terms, '\s+', ' ', 'g'));
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS update_songs_search_terms ON songs;

-- Criar trigger para atualizar search_terms automaticamente
CREATE TRIGGER update_songs_search_terms 
  BEFORE INSERT OR UPDATE ON songs
  FOR EACH ROW 
  EXECUTE FUNCTION update_search_terms();

-- ==========================================
-- PARTE 5: ATUALIZAR DADOS EXISTENTES
-- ==========================================

-- Atualizar search_terms para registros existentes
UPDATE songs 
SET search_terms = LOWER(
  TRIM(
    regexp_replace(
      COALESCE(artist, '') || ' ' || COALESCE(title, '') || ' ' || COALESCE(album, ''), 
      '\s+', ' ', 'g'
    )
  )
) 
WHERE search_terms IS NULL OR search_terms = '';

-- Definir valores padrão para registros existentes
UPDATE songs 
SET 
  genre = COALESCE(genre, 'Gospel'),
  language = COALESCE(language, 'pt-BR'),
  cache_version = COALESCE(cache_version, '1.0'),
  metadata = COALESCE(metadata, '{}')
WHERE 
  genre IS NULL OR 
  language IS NULL OR 
  cache_version IS NULL OR 
  metadata IS NULL;

-- ==========================================
-- PARTE 6: VERIFICAÇÃO FINAL
-- ==========================================

-- Comando para verificar a estrutura da tabela após as alterações
-- (Remova o comentário e execute separadamente para ver o resultado)
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'songs' AND table_schema = 'public'
-- ORDER BY ordinal_position;