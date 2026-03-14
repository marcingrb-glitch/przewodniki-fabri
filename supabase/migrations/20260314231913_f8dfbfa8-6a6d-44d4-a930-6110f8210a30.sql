
ALTER TABLE cheatsheet_sections 
  ADD COLUMN IF NOT EXISTS renderer_type TEXT NOT NULL DEFAULT 'generic_table';
ALTER TABLE cheatsheet_sections 
  ADD COLUMN IF NOT EXISTS renderer_config JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE series_config 
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);

UPDATE series_config sc
SET product_id = p.id
FROM series s
JOIN products p ON p.code = s.code AND p.category = 'series'
WHERE sc.series_id = s.id
  AND sc.product_id IS NULL;
