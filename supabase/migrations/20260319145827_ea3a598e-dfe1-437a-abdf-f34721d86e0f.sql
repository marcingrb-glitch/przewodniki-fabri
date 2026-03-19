
-- 1. Add sewing_technique on pillows
UPDATE products
SET properties = COALESCE(properties, '{}'::jsonb) || '{"sewing_technique": "pikowana"}'::jsonb
WHERE code = 'P1' AND category = 'pillow' AND is_global = true;

UPDATE products
SET properties = COALESCE(properties, '{}'::jsonb) || '{"sewing_technique": "wciąg"}'::jsonb
WHERE code = 'P2' AND category = 'pillow' AND is_global = true;

UPDATE products
SET properties = COALESCE(properties, '{}'::jsonb) || '{"sewing_technique": "gładka"}'::jsonb
WHERE code = 'P3' AND category = 'pillow' AND is_global = true;

-- 2. Add notes on B7 side in S1
UPDATE products
SET properties = COALESCE(properties, '{}'::jsonb) || '{"production_notes": "sztanga doszywana"}'::jsonb
WHERE code = 'B7' AND category = 'side'
  AND series_id = (SELECT id FROM products WHERE code = 'S1' AND category = 'series');

-- 3. Fix cheatsheet_sections columns for krojownia
-- 3A. Wykończenia siedzisk - remove Domyślne, add Typ
UPDATE cheatsheet_sections
SET columns = '[{"key":"code","label":"Kod","mono":true},{"key":"properties.seat_type","label":"Typ"},{"key":"allowed_finishes","label":"Dozwolone"}]'::jsonb
WHERE section_name = 'Wykończenia siedzisk'
  AND workstation_id = (SELECT id FROM workstations WHERE code = 'krojownia');

-- 3B. Wykończenia boczków - remove Domyślne, add Uwagi
UPDATE cheatsheet_sections
SET columns = '[{"key":"code","label":"Kod","mono":true},{"key":"name","label":"Nazwa"},{"key":"allowed_finishes","label":"Dozwolone"},{"key":"properties.production_notes","label":"Uwagi"}]'::jsonb
WHERE section_name = 'Wykończenia boczków'
  AND workstation_id = (SELECT id FROM workstations WHERE code = 'krojownia');

-- 3C. Wykończenia oparć - remove Domyślne
UPDATE cheatsheet_sections
SET columns = '[{"key":"code","label":"Kod","mono":true},{"key":"properties.model_name","label":"Model"},{"key":"allowed_finishes","label":"Dozwolone"}]'::jsonb
WHERE section_name = 'Wykończenia oparć'
  AND workstation_id = (SELECT id FROM workstations WHERE code = 'krojownia');

-- 3D. Deactivate sewing variants section
UPDATE cheatsheet_sections
SET active = false
WHERE section_name = 'Warianty szycia oparcia'
  AND workstation_id = (SELECT id FROM workstations WHERE code = 'krojownia');
