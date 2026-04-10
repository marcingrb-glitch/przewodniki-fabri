UPDATE sku_segments
SET regex_pattern = '^P(\d+)([A-D])?$'
WHERE segment_name = 'pillow'
  AND product_type_id = (SELECT id FROM product_types WHERE code = 'naroznik');