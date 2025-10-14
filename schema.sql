-- Tabela para indexação rápida de músicas
CREATE TABLE IF NOT EXISTS songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artist TEXT NOT NULL,
  title TEXT NOT NULL,
  source TEXT NOT NULL, -- 'letrasmusic', 'local', 'cifraclub', etc
  url TEXT, -- URL original da música
  lyrics_preview TEXT, -- Primeiras 200 chars para preview
  lyrics_length INTEGER, -- Tamanho da letra em caracteres
  storage_path TEXT, -- Caminho no storage para arquivo completo
  metadata JSONB, -- Metadados flexíveis
  search_vector TSVECTOR, -- Vetor de busca para Full-Text Search
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraint para evitar duplicatas
  UNIQUE(artist, title)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist);
CREATE INDEX IF NOT EXISTS idx_songs_source ON songs(source);
CREATE INDEX IF NOT EXISTS idx_songs_created_at ON songs(created_at DESC);

-- Índice GIN para busca de texto rápida
CREATE INDEX IF NOT EXISTS idx_songs_search_vector
ON songs USING GIN (search_vector);

-- Índice adicional para busca simples (fallback)
CREATE INDEX IF NOT EXISTS idx_songs_text_search 
ON songs USING GIN (to_tsvector('portuguese', artist || ' ' || title || ' ' || COALESCE(lyrics_preview, '')));

-- Função para atualizar automaticamente o search_vector
CREATE OR REPLACE FUNCTION update_songs_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('portuguese', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.artist, '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.lyrics_preview, '')), 'C');
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar search_vector automaticamente
DROP TRIGGER IF EXISTS trigger_update_songs_search_vector ON songs;
CREATE TRIGGER trigger_update_songs_search_vector
  BEFORE INSERT OR UPDATE ON songs
  FOR EACH ROW
  EXECUTE FUNCTION update_songs_search_vector();

-- Comentários explicativos
COMMENT ON TABLE songs IS 'Índice rápido de músicas - dados principais ficam aqui, arquivo completo no Storage';
COMMENT ON COLUMN songs.lyrics_preview IS 'Preview das letras para listagem rápida';
COMMENT ON COLUMN songs.storage_path IS 'Caminho no Supabase Storage para arquivo JSON completo';
COMMENT ON COLUMN songs.search_vector IS 'Vetor de busca para Full-Text Search - atualizado automaticamente via trigger';

-- Exemplo de uso da busca por texto:
-- SELECT * FROM songs WHERE search_vector @@ plainto_tsquery('portuguese', 'diante trono');
-- SELECT * FROM songs WHERE search_vector @@ to_tsquery('portuguese', 'diante & trono');
-- Com ranking: SELECT *, ts_rank(search_vector, query) as rank FROM songs, plainto_tsquery('portuguese', 'me ama') query WHERE search_vector @@ query ORDER BY rank DESC;

-- ============================================================================
-- PRESENTATIONS (Service Orders / Worship Sets)
-- ============================================================================

-- Tabela de apresentações (ordem de culto/louvor)
CREATE TABLE IF NOT EXISTS presentations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  date DATE, -- Data prevista para apresentação
  status TEXT DEFAULT 'draft', -- 'draft', 'ready', 'presented', 'archived'
  thumbnail_url TEXT,
  notes JSONB, -- Notas gerais da apresentação
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de itens da apresentação (músicas, versículos, imagens, vídeos, etc)
CREATE TABLE IF NOT EXISTS presentation_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL, -- 'song', 'bible', 'image', 'video', 'text', 'theme'
  item_data JSONB NOT NULL, -- Dados específicos do item (song_id, verse, url, etc)
  order_index INTEGER NOT NULL,
  duration_estimate INTEGER, -- Duração estimada em segundos
  notes TEXT, -- Notas específicas deste item
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(presentation_id, order_index)
);

-- Histórico de apresentações realizadas
CREATE TABLE IF NOT EXISTS presentation_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  presentation_id UUID REFERENCES presentations(id) ON DELETE SET NULL,
  presented_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_seconds INTEGER,
  notes TEXT
);

-- Índices para presentations
CREATE INDEX IF NOT EXISTS idx_presentations_date ON presentations(date DESC);
CREATE INDEX IF NOT EXISTS idx_presentations_status ON presentations(status);
CREATE INDEX IF NOT EXISTS idx_presentations_created_at ON presentations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_presentation_items_presentation ON presentation_items(presentation_id);
CREATE INDEX IF NOT EXISTS idx_presentation_items_order ON presentation_items(presentation_id, order_index);
CREATE INDEX IF NOT EXISTS idx_presentation_history_presentation ON presentation_history(presentation_id);
CREATE INDEX IF NOT EXISTS idx_presentation_history_date ON presentation_history(presented_at DESC);

-- Trigger para atualizar updated_at em presentations
CREATE OR REPLACE FUNCTION update_presentations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_presentations_updated_at ON presentations;
CREATE TRIGGER trigger_update_presentations_updated_at
  BEFORE UPDATE ON presentations
  FOR EACH ROW
  EXECUTE FUNCTION update_presentations_updated_at();

-- ============================================================================
-- PLAYLISTS (Music Collections)
-- ============================================================================

-- Tabela de playlists (coleções de músicas)
CREATE TABLE IF NOT EXISTS playlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  is_smart BOOLEAN DEFAULT FALSE, -- Se é uma playlist inteligente (baseada em filtros)
  smart_filters JSONB, -- Filtros para playlists inteligentes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de relação entre playlists e músicas
CREATE TABLE IF NOT EXISTS playlist_songs (
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (playlist_id, song_id)
);

-- Índices para playlists
CREATE INDEX IF NOT EXISTS idx_playlists_created_at ON playlists(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_playlist_songs_playlist_id ON playlist_songs(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_songs_order ON playlist_songs(playlist_id, order_index);

-- Trigger para atualizar updated_at em playlists
CREATE OR REPLACE FUNCTION update_playlists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_playlists_updated_at ON playlists;
CREATE TRIGGER trigger_update_playlists_updated_at
  BEFORE UPDATE ON playlists
  FOR EACH ROW
  EXECUTE FUNCTION update_playlists_updated_at();

-- ============================================================================
-- TAGS PARA PLAYLISTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS playlist_tags (
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (playlist_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_playlist_tags_playlist ON playlist_tags(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tags_tag ON playlist_tags(tag_id);

-- ============================================================================
-- COMMAND PALETTE HISTORY
-- ============================================================================

-- Histórico de comandos usados (para priorizar comandos frequentes)
CREATE TABLE IF NOT EXISTS command_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  command_id TEXT NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  execution_time_ms INTEGER, -- Tempo de execução
  success BOOLEAN DEFAULT TRUE
);

-- Índice para buscar comandos recentes e mais usados
CREATE INDEX IF NOT EXISTS idx_command_history_command_id ON command_history(command_id);
CREATE INDEX IF NOT EXISTS idx_command_history_executed_at ON command_history(executed_at DESC);

-- View para comandos mais usados
CREATE OR REPLACE VIEW command_usage_stats AS
SELECT
  command_id,
  COUNT(*) as usage_count,
  MAX(executed_at) as last_used,
  AVG(execution_time_ms) as avg_execution_time,
  SUM(CASE WHEN success THEN 1 ELSE 0 END)::FLOAT / COUNT(*) as success_rate
FROM command_history
WHERE executed_at > NOW() - INTERVAL '30 days'
GROUP BY command_id
ORDER BY usage_count DESC;

-- ============================================================================
-- SYNC METADATA
-- ============================================================================

-- Metadados de sincronização por entidade
CREATE TABLE IF NOT EXISTS sync_metadata (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL, -- 'song', 'playlist', 'presentation', etc
  entity_id UUID NOT NULL,
  device_id TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  checksum TEXT, -- Hash para detectar mudanças
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_to_cloud BOOLEAN DEFAULT FALSE,
  conflict_detected BOOLEAN DEFAULT FALSE,
  UNIQUE(entity_type, entity_id, device_id)
);

-- Índices para sync
CREATE INDEX IF NOT EXISTS idx_sync_entity ON sync_metadata(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sync_device ON sync_metadata(device_id);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts ON sync_metadata(conflict_detected) WHERE conflict_detected = TRUE;
CREATE INDEX IF NOT EXISTS idx_sync_pending ON sync_metadata(synced_to_cloud) WHERE synced_to_cloud = FALSE;

-- ============================================================================
-- SONG ANALYTICS
-- ============================================================================

-- Estatísticas de uso de músicas
CREATE TABLE IF NOT EXISTS song_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  presentation_id UUID REFERENCES presentations(id) ON DELETE SET NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_seconds INTEGER
);

CREATE INDEX IF NOT EXISTS idx_song_usage_song ON song_usage(song_id);
CREATE INDEX IF NOT EXISTS idx_song_usage_date ON song_usage(used_at DESC);

-- View para estatísticas de músicas
CREATE OR REPLACE VIEW song_stats AS
SELECT
  s.id,
  s.title,
  s.artist,
  COUNT(su.id) as usage_count,
  MAX(su.used_at) as last_used,
  SUM(su.duration_seconds) as total_presentation_time,
  AVG(su.duration_seconds) as avg_presentation_time
FROM songs s
LEFT JOIN song_usage su ON s.id = su.song_id
GROUP BY s.id, s.title, s.artist;

-- ============================================================================
-- PRESENTATION ANALYTICS
-- ============================================================================

-- View para estatísticas gerais
CREATE OR REPLACE VIEW presentation_stats AS
SELECT
  DATE_TRUNC('day', ph.presented_at) as date,
  COUNT(DISTINCT ph.id) as presentations_count,
  COUNT(DISTINCT ph.presentation_id) as unique_presentations,
  SUM(ph.duration_seconds) as total_duration,
  AVG(ph.duration_seconds) as avg_duration
FROM presentation_history ph
WHERE ph.presented_at > NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', ph.presented_at)
ORDER BY date DESC;

-- ============================================================================
-- SEARCH HISTORY
-- ============================================================================

-- Histórico de buscas (para melhorar sugestões)
CREATE TABLE IF NOT EXISTS search_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL,
  result_count INTEGER,
  clicked_result_id UUID, -- ID do resultado que foi clicado
  clicked_result_type TEXT, -- 'song', 'presentation', 'playlist', etc
  searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_history_date ON search_history(searched_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_query ON search_history(query);

-- View para queries mais populares
CREATE OR REPLACE VIEW popular_searches AS
SELECT
  query,
  COUNT(*) as search_count,
  MAX(searched_at) as last_searched,
  AVG(result_count) as avg_results
FROM search_history
WHERE searched_at > NOW() - INTERVAL '30 days'
GROUP BY query
ORDER BY search_count DESC
LIMIT 100;

-- ============================================================================
-- USER PREFERENCES
-- ============================================================================

-- Preferências do usuário (para sincronizar entre dispositivos)
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(device_id, key)
);

CREATE INDEX IF NOT EXISTS idx_user_prefs_device ON user_preferences(device_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER trigger_update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();

-- ============================================================================
-- KEYBOARD SHORTCUTS
-- ============================================================================

-- Atalhos de teclado customizados
CREATE TABLE IF NOT EXISTS keyboard_shortcuts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  shortcut_id TEXT NOT NULL, -- ID do atalho no código
  key_combination TEXT NOT NULL, -- e.g., "Cmd+K", "Ctrl+Shift+P"
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(device_id, shortcut_id)
);

CREATE INDEX IF NOT EXISTS idx_shortcuts_device ON keyboard_shortcuts(device_id);

-- ============================================================================
-- IMPORT/EXPORT LOG
-- ============================================================================

-- Log de importações e exportações
CREATE TABLE IF NOT EXISTS import_export_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  operation_type TEXT NOT NULL, -- 'import' ou 'export'
  format TEXT NOT NULL, -- 'json', 'csv', 'propresenter', etc
  entity_type TEXT NOT NULL, -- 'songs', 'presentations', 'playlists', etc
  entity_count INTEGER NOT NULL,
  success_count INTEGER NOT NULL,
  failed_count INTEGER NOT NULL,
  file_path TEXT,
  errors JSONB, -- Array de erros, se houver
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_import_export_log_date ON import_export_log(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_import_export_log_type ON import_export_log(operation_type, entity_type);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE playlists IS 'Playlists de músicas - podem ser manuais ou inteligentes (baseadas em filtros)';
COMMENT ON TABLE playlist_songs IS 'Relação entre playlists e músicas com ordem definida';
COMMENT ON TABLE command_history IS 'Histórico de comandos executados no Command Palette';
COMMENT ON TABLE sync_metadata IS 'Metadados de sincronização para controle de versão e conflitos';
COMMENT ON TABLE song_usage IS 'Registro de uso de músicas em apresentações para analytics';
COMMENT ON TABLE search_history IS 'Histórico de buscas para melhorar sugestões';
COMMENT ON TABLE user_preferences IS 'Preferências do usuário sincronizadas entre dispositivos';
COMMENT ON TABLE keyboard_shortcuts IS 'Atalhos de teclado customizados por dispositivo';
COMMENT ON TABLE import_export_log IS 'Log de operações de importação e exportação';
