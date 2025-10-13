-- Create app_settings table for storing application settings
CREATE TABLE IF NOT EXISTS app_settings (
  id BIGSERIAL PRIMARY KEY,
  language TEXT NOT NULL DEFAULT 'pt-BR',
  use24hour BOOLEAN NOT NULL DEFAULT false,
  data_path TEXT NOT NULL DEFAULT 'Documents/LyricsShow',
  lyrics_path TEXT NOT NULL DEFAULT 'Documents/LyricsShow/songs',
  images_path TEXT NOT NULL DEFAULT 'Documents/LyricsShow/images',
  videos_path TEXT NOT NULL DEFAULT 'Documents/LyricsShow/videos',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on id for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_settings_id ON app_settings(id);

-- Add RLS (Row Level Security) policies
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON app_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert default settings if table is empty
INSERT INTO app_settings (language, use24hour, data_path, lyrics_path, images_path, videos_path)
SELECT 'pt-BR', false, 'Documents/LyricsShow', 'Documents/LyricsShow/songs', 'Documents/LyricsShow/images', 'Documents/LyricsShow/videos'
WHERE NOT EXISTS (SELECT 1 FROM app_settings);
