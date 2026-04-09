-- Dodaj szezlong Ravenna (N2-SZ-2) jako kopie Modena (N2-SZ-1)
-- Ravenna ma identyczne pianki i stelaze jak Modena

-- 1. Produkt
INSERT INTO products (code, name, category, series_id, properties, is_global, sort_order, active)
SELECT
  'N2-SZ-2',
  'Szezlong Ravenna',
  'chaise',
  series_id,
  jsonb_build_object(
    'model_name', 'Ravenna',
    'frame', 'N2-SZ-SD',
    'backrest_frame', 'N2-SZ-OP16',
    'spring_type', 'B',
    'backrest_has_springs', false
  ),
  false,
  2,
  true
FROM products
WHERE code = 'N2-SZ-1' AND category = 'chaise'
ON CONFLICT (code, category, COALESCE(series_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;

-- 2. Pianki siedziskowe (kopia z N2-SZ-1)
INSERT INTO product_specs (product_id, spec_type, position_number, name, height, width, length, material, quantity, foam_role, foam_section)
SELECT
  (SELECT id FROM products WHERE code = 'N2-SZ-2' AND category = 'chaise'),
  spec_type, position_number, name, height, width, length, material, quantity, foam_role, foam_section
FROM product_specs
WHERE product_id = (SELECT id FROM products WHERE code = 'N2-SZ-1' AND category = 'chaise')
  AND spec_type = 'foam'
  AND foam_section = 'seat'
  AND NOT EXISTS (
    SELECT 1 FROM product_specs ps2
    WHERE ps2.product_id = (SELECT id FROM products WHERE code = 'N2-SZ-2' AND category = 'chaise')
      AND ps2.spec_type = 'foam' AND ps2.foam_section = 'seat'
  );

-- 3. Pianki oparcia (kopia z N2-SZ-1)
INSERT INTO product_specs (product_id, spec_type, position_number, name, height, width, length, material, quantity, foam_role, foam_section)
SELECT
  (SELECT id FROM products WHERE code = 'N2-SZ-2' AND category = 'chaise'),
  spec_type, position_number, name, height, width, length, material, quantity, foam_role, foam_section
FROM product_specs
WHERE product_id = (SELECT id FROM products WHERE code = 'N2-SZ-1' AND category = 'chaise')
  AND spec_type = 'foam'
  AND foam_section = 'backrest'
  AND NOT EXISTS (
    SELECT 1 FROM product_specs ps2
    WHERE ps2.product_id = (SELECT id FROM products WHERE code = 'N2-SZ-2' AND category = 'chaise')
      AND ps2.spec_type = 'foam' AND ps2.foam_section = 'backrest'
  );
