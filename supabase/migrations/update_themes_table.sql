ALTER TABLE themes
RENAME COLUMN font_family TO body_font_family;

ALTER TABLE themes
ADD COLUMN title_font_family TEXT;
