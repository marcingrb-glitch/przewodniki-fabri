-- Fix seat regex: N[DB]? → ND? so that SD1NB parses as SD1N + finish B
-- (SD01NB never exists as a product; NB was being greedily captured as code)
UPDATE sku_segments
SET regex_pattern = '^SD(\d+(?:ND?|W|D)?)([A-D])?'
WHERE segment_name = 'seat'
  AND product_type_id = (SELECT id FROM product_types WHERE code = 'sofa');
