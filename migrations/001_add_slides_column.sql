-- Migration: Add slides column to songs table
-- This allows storing lyrics as structured slides array while maintaining backwards compatibility

-- Step 1: Add new slides column (JSONB for flexibility and PostgreSQL performance)
ALTER TABLE songs
ADD COLUMN IF NOT EXISTS slides JSONB;

-- Step 2: Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_songs_slides ON songs USING GIN (slides);

-- Step 3: Add check constraint to ensure either lyrics OR slides is present
-- (We keep both for backwards compatibility during migration period)
ALTER TABLE songs
DROP CONSTRAINT IF EXISTS songs_content_check;

ALTER TABLE songs
ADD CONSTRAINT songs_content_check
CHECK (
  lyrics IS NOT NULL OR
  slides IS NOT NULL
);

-- Step 4: Create a function to auto-convert lyrics to slides on insert/update
CREATE OR REPLACE FUNCTION auto_generate_slides()
RETURNS TRIGGER AS $$
BEGIN
  -- If slides is NULL but lyrics exists, auto-generate slides
  IF NEW.slides IS NULL AND NEW.lyrics IS NOT NULL THEN
    NEW.slides = (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', 'slide-' || row_number,
          'content', line,
          'type', 'verse',
          'order', row_number - 1
        )
      )
      FROM (
        SELECT
          ROW_NUMBER() OVER () as row_number,
          regexp_split_to_table(NEW.lyrics, E'\\n') as line
      ) lines
      WHERE line IS NOT NULL AND trim(line) != ''
    );
  END IF;

  -- If lyrics is NULL but slides exists, auto-generate lyrics
  IF NEW.lyrics IS NULL AND NEW.slides IS NOT NULL THEN
    NEW.lyrics = (
      SELECT string_agg(slide->>'content', E'\\n' ORDER BY (slide->>'order')::int)
      FROM jsonb_array_elements(NEW.slides) as slide
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger to auto-sync lyrics <-> slides
DROP TRIGGER IF EXISTS songs_auto_generate_slides_trigger ON songs;

CREATE TRIGGER songs_auto_generate_slides_trigger
  BEFORE INSERT OR UPDATE ON songs
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_slides();

-- Step 6: Backfill existing songs with slides
-- (Run this manually when ready to migrate)
-- UPDATE songs
-- SET slides = (
--   SELECT jsonb_agg(
--     jsonb_build_object(
--       'id', 'slide-' || row_number,
--       'content', line,
--       'type', 'verse',
--       'order', row_number - 1
--     )
--   )
--   FROM (
--     SELECT
--       ROW_NUMBER() OVER () as row_number,
--       regexp_split_to_table(lyrics, E'\\n') as line
--   ) lines
--   WHERE line IS NOT NULL AND trim(line) != ''
-- )
-- WHERE slides IS NULL AND lyrics IS NOT NULL;

-- Step 7: Add helpful views for querying
CREATE OR REPLACE VIEW songs_with_slide_count AS
SELECT
  id,
  artist,
  title,
  lyrics IS NOT NULL as has_lyrics,
  slides IS NOT NULL as has_slides,
  CASE
    WHEN slides IS NOT NULL THEN jsonb_array_length(slides)
    ELSE NULL
  END as slide_count,
  created_at,
  updated_at
FROM songs;

-- Step 8: Add comment for documentation
COMMENT ON COLUMN songs.slides IS 'Structured lyrics as array of slide objects. Format: [{id, content, type, order, metadata}]';
COMMENT ON COLUMN songs.lyrics IS 'Legacy format: plain text lyrics string. Kept for backwards compatibility.';
