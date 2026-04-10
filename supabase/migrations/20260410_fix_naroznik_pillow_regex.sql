-- Fix: regex poduszki dla narozniki lapal (P\d+) jako code, a parser doklejal
-- drugie "P" dajac "PP3". Nowy regex lapie tylko cyfry (jak sofa).

UPDATE sku_segments
SET pattern = '^P(\d+)([A-D])?'
WHERE segment_name = 'pillow'
  AND product_type_id = (SELECT id FROM product_types WHERE code = 'naroznik');
