
-- 10A: Delete N2 sewing_variant (will be inherited from S2)
DELETE FROM product_relations
WHERE series_id = (SELECT id FROM products WHERE code = 'N2' AND category = 'series')
  AND relation_type = 'sewing_variant';

-- 10B: Add insert_type to existing S1/S2 seat_pillow_map
UPDATE product_relations
SET properties = properties || '{"insert_type": "dinaro_xl"}'::jsonb
WHERE relation_type = 'seat_pillow_map'
  AND series_id IN (
    SELECT id FROM products WHERE code IN ('S1', 'S2') AND category = 'series'
  );

-- 10C: Seat_pillow_map for N2 130cm seats
-- SD1 (Modena) → P2, finish D→D
INSERT INTO product_relations (series_id, relation_type, source_product_id, target_product_id, properties)
VALUES (
  (SELECT id FROM products WHERE code='N2' AND category='series'),
  'seat_pillow_map',
  (SELECT id FROM products WHERE code='SD1' AND category='seat' AND series_id=(SELECT id FROM products WHERE code='N2' AND category='series')),
  (SELECT id FROM products WHERE code='P2' AND category='pillow' AND is_global=true),
  '{"pillow_finish_rules": [{"seat_finish": "D", "pillow_finish": "D"}], "insert_type": "dinaro_130"}'::jsonb
);

-- SD2 (Ravenna) → P3, finish A→A
INSERT INTO product_relations (series_id, relation_type, source_product_id, target_product_id, properties)
VALUES (
  (SELECT id FROM products WHERE code='N2' AND category='series'),
  'seat_pillow_map',
  (SELECT id FROM products WHERE code='SD2' AND category='seat' AND series_id=(SELECT id FROM products WHERE code='N2' AND category='series')),
  (SELECT id FROM products WHERE code='P3' AND category='pillow' AND is_global=true),
  '{"pillow_finish_rules": [{"seat_finish": "A", "pillow_finish": "A"}], "insert_type": "dinaro_130"}'::jsonb
);

-- SD3 (Sienna) → P2, finish A→A
INSERT INTO product_relations (series_id, relation_type, source_product_id, target_product_id, properties)
VALUES (
  (SELECT id FROM products WHERE code='N2' AND category='series'),
  'seat_pillow_map',
  (SELECT id FROM products WHERE code='SD3' AND category='seat' AND series_id=(SELECT id FROM products WHERE code='N2' AND category='series')),
  (SELECT id FROM products WHERE code='P2' AND category='pillow' AND is_global=true),
  '{"pillow_finish_rules": [{"seat_finish": "A", "pillow_finish": "A"}], "insert_type": "dinaro_130"}'::jsonb
);

-- SD4 (Porto) → P1, finish A→A, B→B
INSERT INTO product_relations (series_id, relation_type, source_product_id, target_product_id, properties)
VALUES (
  (SELECT id FROM products WHERE code='N2' AND category='series'),
  'seat_pillow_map',
  (SELECT id FROM products WHERE code='SD4' AND category='seat' AND series_id=(SELECT id FROM products WHERE code='N2' AND category='series')),
  (SELECT id FROM products WHERE code='P1' AND category='pillow' AND is_global=true),
  '{"pillow_finish_rules": [{"seat_finish": "A", "pillow_finish": "A"}, {"seat_finish": "B", "pillow_finish": "B"}], "insert_type": "dinaro_130"}'::jsonb
);

-- SD5 (Barga) → P3, finish A→A
INSERT INTO product_relations (series_id, relation_type, source_product_id, target_product_id, properties)
VALUES (
  (SELECT id FROM products WHERE code='N2' AND category='series'),
  'seat_pillow_map',
  (SELECT id FROM products WHERE code='SD5' AND category='seat' AND series_id=(SELECT id FROM products WHERE code='N2' AND category='series')),
  (SELECT id FROM products WHERE code='P3' AND category='pillow' AND is_global=true),
  '{"pillow_finish_rules": [{"seat_finish": "A", "pillow_finish": "A"}], "insert_type": "dinaro_130"}'::jsonb
);
