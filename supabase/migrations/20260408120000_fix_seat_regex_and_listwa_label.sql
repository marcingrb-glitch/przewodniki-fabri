-- Fix seat regex: N[DB]? → ND? so that SD1NB parses as SD1N + finish B
-- (SD01NB never exists as a product; NB was being greedily captured as code)
UPDATE sku_segments
SET regex_pattern = '^SD(\d+(?:ND?|W|D)?)([A-D])?'
WHERE segment_name = 'seat'
  AND product_type_id = (SELECT id FROM product_types WHERE code = 'sofa');

-- Add conditional label template for listwa (SD01N + B9B exception)
INSERT INTO label_templates (product_type, label_name, component, display_fields, quantity, sort_order, is_conditional, condition_field, series_id)
VALUES (
  'sofa',
  'LISTWA — opiankowanie',
  'listwa',
  '[["seat.code_finish", "side.code_finish"]]'::jsonb,
  1,
  99,
  true,
  'has_special_notes',
  (SELECT id FROM products WHERE code = 'S1' AND category = 'series')
);
