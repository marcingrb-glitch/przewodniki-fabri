-- Skopiuj wszystkie dane (properties + pianki) z N2-SZ-1 (Modena) do N2-SZ-2 (Ravenna)
-- Zachowaj model_name = 'Ravenna' i copies_from = 'N2-SZ-1' na Ravennie

-- 1. Skopiuj properties z Modena (bez nadpisywania model_name)
UPDATE products ravenna
SET properties =
  (SELECT properties FROM products WHERE code = 'N2-SZ-1' AND category = 'chaise')
  || '{"model_name": "Ravenna", "copies_from": "N2-SZ-1"}'::jsonb,
  updated_at = now()
WHERE ravenna.code = 'N2-SZ-2' AND ravenna.category = 'chaise';

-- 2. Usun wszystkie pianki Ravenny
DELETE FROM product_specs
WHERE product_id = (SELECT id FROM products WHERE code = 'N2-SZ-2' AND category = 'chaise')
  AND spec_type = 'foam';

-- 3. Wstaw kopie pianek z Modena
INSERT INTO product_specs (
  product_id, spec_type, position_number, name, height, width, length,
  material, quantity, foam_role, foam_section, notes
)
SELECT
  (SELECT id FROM products WHERE code = 'N2-SZ-2' AND category = 'chaise'),
  spec_type, position_number, name, height, width, length,
  material, quantity, foam_role, foam_section, notes
FROM product_specs
WHERE product_id = (SELECT id FROM products WHERE code = 'N2-SZ-1' AND category = 'chaise')
  AND spec_type = 'foam';
