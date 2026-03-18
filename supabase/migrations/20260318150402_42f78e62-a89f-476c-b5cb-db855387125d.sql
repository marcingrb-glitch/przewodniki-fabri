
ALTER TABLE label_settings
ADD COLUMN IF NOT EXISTS left_zone_font_size numeric DEFAULT 18;

UPDATE label_settings
SET left_zone_font_size = GREATEST(
  COALESCE(series_code_size, 18),
  COALESCE(series_name_size, 9),
  COALESCE(series_collection_size, 7)
);

ALTER TABLE label_settings DROP COLUMN IF EXISTS series_code_size;
ALTER TABLE label_settings DROP COLUMN IF EXISTS series_name_size;
ALTER TABLE label_settings DROP COLUMN IF EXISTS series_collection_size;
ALTER TABLE label_settings DROP COLUMN IF EXISTS header_font_size;
