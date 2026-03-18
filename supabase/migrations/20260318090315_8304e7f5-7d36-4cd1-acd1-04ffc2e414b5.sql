
-- 1. Drop old FKs FIRST (before updating values)
ALTER TABLE guide_sections DROP CONSTRAINT IF EXISTS guide_sections_series_id_fkey;
ALTER TABLE label_templates DROP CONSTRAINT IF EXISTS label_templates_series_id_fkey;

-- 2. guide_sections: update series_id values (old series.id → products.id)
UPDATE guide_sections gs
SET series_id = p.id
FROM series s
JOIN products p ON p.code = s.code AND p.category = 'series'
WHERE gs.series_id = s.id
  AND gs.series_id IS NOT NULL
  AND gs.series_id != p.id;

-- 3. label_templates: update series_id values
UPDATE label_templates lt
SET series_id = p.id
FROM series s
JOIN products p ON p.code = s.code AND p.category = 'series'
WHERE lt.series_id = s.id
  AND lt.series_id IS NOT NULL
  AND lt.series_id != p.id;

-- 4. Add new FKs pointing to products
ALTER TABLE guide_sections 
  ADD CONSTRAINT guide_sections_series_id_fkey 
  FOREIGN KEY (series_id) REFERENCES products(id) ON DELETE SET NULL;

ALTER TABLE label_templates 
  ADD CONSTRAINT label_templates_series_id_fkey 
  FOREIGN KEY (series_id) REFERENCES products(id) ON DELETE SET NULL;
