-- =============================================================================
-- N2 NAROŻNIK — SQL SEED
-- =============================================================================

-- 1. SERIA N2
INSERT INTO products (code, name, category, product_type_id, properties, is_global, sort_order)
VALUES (
  'N2',
  'Narożnik Elma',
  'series',
  (SELECT id FROM product_types WHERE code = 'naroznik'),
  jsonb_build_object(
    'collection', 'Elma',
    'parent_series_id', 'a20f51be-e14e-41ed-90f7-4297d77dde9d',
    'widths', ARRAY[130, 190],
    'default_width', 190,
    'seat_leg_type', 'from_sku',
    'seat_leg_height_cm', 2.5,
    'seat_leg_count', 2
  ),
  false,
  3
);

-- 2. FIX SKU_SEGMENTS NAROŻNIKA
UPDATE sku_segments
SET position = 1
WHERE product_type_id = (SELECT id FROM product_types WHERE code = 'naroznik')
  AND segment_name = 'fabric';

UPDATE sku_segments
SET position = 2
WHERE product_type_id = (SELECT id FROM product_types WHERE code = 'naroznik')
  AND segment_name = 'width';

INSERT INTO sku_segments (product_type_id, segment_name, position, prefix, regex_pattern, capture_groups, is_optional, category, has_finish_suffix, zero_padded, notes)
VALUES
  (
    (SELECT id FROM product_types WHERE code = 'naroznik'),
    'jasiek', 9, 'J',
    '^J(\d+)([A-D])?',
    '{"code": 1, "finish": 2}'::jsonb,
    true, 'jasiek', true, false,
    'Jasiek (opcjonalny), np. J1'
  ),
  (
    (SELECT id FROM product_types WHERE code = 'naroznik'),
    'walek', 10, 'W',
    '^W(\d+)([A-D])?',
    '{"code": 1, "finish": 2}'::jsonb,
    true, 'walek', true, false,
    'Wałek (opcjonalny), np. W1'
  );

-- 3. SIEDZISKA 130
INSERT INTO products (code, name, category, series_id, properties, allowed_finishes, default_finish, is_global, sort_order)
VALUES
  ('SD1', 'Luma (130)', 'seat',
   (SELECT id FROM products WHERE code = 'N2' AND category = 'series'),
   jsonb_build_object('seat_type','Gładkie','center_strip',false,'model_name','Modena','commercial_name','Luma','front','2× ćwierćwałek drewniany, przerwa 1.5cm','spring_type','B','frame','N2-SD-130 [Elma]','width',130),
   ARRAY['D'], 'D', false, 1),
  ('SD2', 'Nova (130)', 'seat',
   (SELECT id FROM products WHERE code = 'N2' AND category = 'series'),
   jsonb_build_object('seat_type','Gładkie','center_strip',false,'model_name','Ravenna','commercial_name','Nova','front','2× ćwierćwałek drewniany, przerwa 1.5cm','spring_type','B','frame','N2-SD-130 [Elma]','width',130),
   ARRAY['A'], 'A', false, 2),
  ('SD3', 'Sola (130)', 'seat',
   (SELECT id FROM products WHERE code = 'N2' AND category = 'series'),
   jsonb_build_object('seat_type','Gładkie','center_strip',false,'model_name','Sienna','commercial_name','Sola','front','2× ćwierćwałek drewniany, przerwa 1.5cm','spring_type','B','frame','N2-SD-130 [Elma]','width',130),
   ARRAY['A'], 'A', false, 3),
  ('SD4', 'Nora (130)', 'seat',
   (SELECT id FROM products WHERE code = 'N2' AND category = 'series'),
   jsonb_build_object('seat_type','Gładkie','center_strip',false,'model_name','Porto','commercial_name','Nora','front','2× listewka drewniana 1.5×2cm','spring_type','B','frame','N2-SD-130 [Elma]','width',130),
   ARRAY['A','B'], 'A', false, 4),
  ('SD5', 'Vero (130)', 'seat',
   (SELECT id FROM products WHERE code = 'N2' AND category = 'series'),
   jsonb_build_object('seat_type','Gładkie','center_strip',false,'model_name','Barga','commercial_name','Vero','front','2× listewka 2×2.5cm, przerwa 1.5cm','spring_type','63A','frame','N2-SD-130 [Elma]','width',130),
   ARRAY['A'], 'A', false, 5);

-- 3b. SPECS SIEDZISK 130
INSERT INTO product_specs (product_id, spec_type, position_number, name, height, width, length, material, quantity, foam_role)
VALUES
  ((SELECT id FROM products WHERE code='SD1' AND category='seat' AND series_id=(SELECT id FROM products WHERE code='N2' AND category='series')),
   'foam', 1, 'Pianka siedziska', 6, 78.5, 130, 'T-35-38', 1, 'base'),
  ((SELECT id FROM products WHERE code='SD1' AND category='seat' AND series_id=(SELECT id FROM products WHERE code='N2' AND category='series')),
   'foam', 2, 'Pianka nakrywkowa', 3, 118, 130, 'T-35-38', 1, 'base'),
  ((SELECT id FROM products WHERE code='SD2' AND category='seat' AND series_id=(SELECT id FROM products WHERE code='N2' AND category='series')),
   'foam', 1, 'Pianka siedziska', 6, 78.5, 130, 'T-35-38', 1, 'base'),
  ((SELECT id FROM products WHERE code='SD2' AND category='seat' AND series_id=(SELECT id FROM products WHERE code='N2' AND category='series')),
   'foam', 2, 'Pianka nakrywkowa', 3, 118, 130, 'T-35-38', 1, 'base'),
  ((SELECT id FROM products WHERE code='SD3' AND category='seat' AND series_id=(SELECT id FROM products WHERE code='N2' AND category='series')),
   'foam', 1, 'Pianka siedziska', 6, 78.5, 130, 'T-35-38', 1, 'base'),
  ((SELECT id FROM products WHERE code='SD3' AND category='seat' AND series_id=(SELECT id FROM products WHERE code='N2' AND category='series')),
   'foam', 2, 'Pianka nakrywkowa', 3, 118, 130, 'T-35-38', 1, 'base'),
  ((SELECT id FROM products WHERE code='SD4' AND category='seat' AND series_id=(SELECT id FROM products WHERE code='N2' AND category='series')),
   'foam', 1, 'Pianka siedziska', 9, 80.5, 130, 'T-35-38', 1, 'base'),
  ((SELECT id FROM products WHERE code='SD5' AND category='seat' AND series_id=(SELECT id FROM products WHERE code='N2' AND category='series')),
   'foam', 1, 'Pianka siedziska', 6, 80, 131, 'T-35-38', 1, 'base'),
  ((SELECT id FROM products WHERE code='SD5' AND category='seat' AND series_id=(SELECT id FROM products WHERE code='N2' AND category='series')),
   'foam', 2, 'Pianka nakrywkowa', 3, 84, 132, 'T-35-38', 1, 'base'),
  ((SELECT id FROM products WHERE code='SD5' AND category='seat' AND series_id=(SELECT id FROM products WHERE code='N2' AND category='series')),
   'foam', 3, 'Front', 3, 33.5, 130, 'T-21-35', 1, 'front'),
  ((SELECT id FROM products WHERE code='SD5' AND category='seat' AND series_id=(SELECT id FROM products WHERE code='N2' AND category='series')),
   'foam', 4, 'Front', 2, 20, 130, 'T-21-35', 1, 'front'),
  ((SELECT id FROM products WHERE code='SD5' AND category='seat' AND series_id=(SELECT id FROM products WHERE code='N2' AND category='series')),
   'foam', 5, 'Czapa siedziska 3D', 2, 79, 127, 'T-35-38', 1, 'base');

-- 4. OPARCIA SOFY 130
INSERT INTO products (code, name, category, series_id, properties, allowed_finishes, default_finish, is_global, sort_order)
VALUES
  ('OP68', 'OP68 (68cm) 130 — Modena/Sienna/Porto', 'backrest',
   (SELECT id FROM products WHERE code = 'N2' AND category = 'series'),
   jsonb_build_object('height_cm','68','frame','N2-OP68-130 [Rama na płasko]','spring_type','B','model_name','Modena, Sienna, Porto','width',130),
   ARRAY['A','B','C'], NULL, false, 1),
  ('OP68', 'OP68 (68cm) 130 — Ravenna', 'backrest',
   (SELECT id FROM products WHERE code = 'N2' AND category = 'series'),
   jsonb_build_object('height_cm','68','frame','N2-OP68-130 [Rama na płasko]','spring_type','B','model_name','Ravenna','width',130),
   ARRAY['A','B','C'], NULL, false, 2),
  ('OP68', 'OP68 (68cm) 130 — Barga', 'backrest',
   (SELECT id FROM products WHERE code = 'N2' AND category = 'series'),
   jsonb_build_object('height_cm','68','frame','N2-OP68-130 [Rama na płasko]','spring_type','63A','model_name','Barga','width',130),
   ARRAY['A','B','C'], NULL, false, 3);

-- 4b. SPECS OPARĆ 130
INSERT INTO product_specs (product_id, spec_type, position_number, name, height, width, length, material, quantity, foam_role)
VALUES
  ((SELECT id FROM products WHERE code='OP68' AND category='backrest' AND series_id=(SELECT id FROM products WHERE code='N2' AND category='series') AND name LIKE '%Modena/Sienna/Porto%'),
   'foam', 1, 'Pianka oparcia', 9, 68, 130, 'T-35-38', 1, 'base'),
  ((SELECT id FROM products WHERE code='OP68' AND category='backrest' AND series_id=(SELECT id FROM products WHERE code='N2' AND category='series') AND name LIKE '%Ravenna%'),
   'foam', 1, 'Pianka oparcia', 9, 68, 130, 'T-35-38', 1, 'base'),
  ((SELECT id FROM products WHERE code='OP68' AND category='backrest' AND series_id=(SELECT id FROM products WHERE code='N2' AND category='series') AND name LIKE '%Barga%'),
   'foam', 1, 'Pianka oparcia', 6, 68, 131, 'T-35-38', 1, 'base'),
  ((SELECT id FROM products WHERE code='OP68' AND category='backrest' AND series_id=(SELECT id FROM products WHERE code='N2' AND category='series') AND name LIKE '%Barga%'),
   'foam', 2, 'Pianka nakrywkowa', 3, 69, 132, 'T-35-38', 1, 'base'),
  ((SELECT id FROM products WHERE code='OP68' AND category='backrest' AND series_id=(SELECT id FROM products WHERE code='N2' AND category='series') AND name LIKE '%Barga%'),
   'foam', 3, 'Czapa oparcia 3D', 2, 64, 127, 'T-35-38', 1, 'base');

-- 4c. SEWING VARIANTS DLA OPARĆ 130
INSERT INTO product_relations (series_id, relation_type, source_product_id, target_product_id, properties)
VALUES
  ((SELECT id FROM products WHERE code='N2' AND category='series'),
   'sewing_variant',
   (SELECT id FROM products WHERE code='OP68' AND category='backrest' AND series_id=(SELECT id FROM products WHERE code='N2' AND category='series') AND name LIKE '%Modena/Sienna/Porto%'),
   (SELECT id FROM products WHERE code='OP68' AND category='backrest' AND series_id=(SELECT id FROM products WHERE code='N2' AND category='series') AND name LIKE '%Modena/Sienna/Porto%'),
   '{"finish": "A", "sewing_description": "Przewinięte"}'::jsonb),
  ((SELECT id FROM products WHERE code='N2' AND category='series'),
   'sewing_variant',
   (SELECT id FROM products WHERE code='OP68' AND category='backrest' AND series_id=(SELECT id FROM products WHERE code='N2' AND category='series') AND name LIKE '%Ravenna%'),
   (SELECT id FROM products WHERE code='OP68' AND category='backrest' AND series_id=(SELECT id FROM products WHERE code='N2' AND category='series') AND name LIKE '%Ravenna%'),
   '{"finish": "A", "sewing_description": "Bodno na górze"}'::jsonb),
  ((SELECT id FROM products WHERE code='N2' AND category='series'),
   'sewing_variant',
   (SELECT id FROM products WHERE code='OP68' AND category='backrest' AND series_id=(SELECT id FROM products WHERE code='N2' AND category='series') AND name LIKE '%Barga%'),
   (SELECT id FROM products WHERE code='OP68' AND category='backrest' AND series_id=(SELECT id FROM products WHERE code='N2' AND category='series') AND name LIKE '%Barga%'),
   '{"finish": "A", "sewing_description": "Bodno na górze"}'::jsonb);

-- 5. SZEZLONGI
INSERT INTO products (code, name, category, series_id, properties, is_global, sort_order)
VALUES
  ('SZ1', 'Szezlong Modena', 'chaise',
   (SELECT id FROM products WHERE code='N2' AND category='series'),
   jsonb_build_object('model_name','Modena','frame','Szezlong 124.2×79×26 cm','spring_type','B','backrest_has_springs',false),
   false, 1),
  ('SZ2', 'Szezlong Ravenna', 'chaise',
   (SELECT id FROM products WHERE code='N2' AND category='series'),
   jsonb_build_object('model_name','Ravenna','frame','Szezlong 124.2×79×26 cm','spring_type','B','backrest_has_springs',false),
   false, 2),
  ('SZ3', 'Szezlong Sienna', 'chaise',
   (SELECT id FROM products WHERE code='N2' AND category='series'),
   jsonb_build_object('model_name','Sienna','frame','Szezlong 124.2×79×26 cm','spring_type','B','backrest_has_springs',false),
   false, 3),
  ('SZ4', 'Szezlong Porto', 'chaise',
   (SELECT id FROM products WHERE code='N2' AND category='series'),
   jsonb_build_object('model_name','Porto','frame','Szezlong 124.2×79×26 cm','spring_type','B','backrest_has_springs',false),
   false, 4),
  ('SZ5', 'Szezlong Barga', 'chaise',
   (SELECT id FROM products WHERE code='N2' AND category='series'),
   jsonb_build_object('model_name','Barga','frame','Szezlong 124.2×79×26 cm','spring_type','63A','backrest_has_springs',false),
   false, 5);

-- 5b. SPECS SZEZLONGÓW — SIEDZISKOWE
INSERT INTO product_specs (product_id, spec_type, position_number, name, height, width, length, material, quantity, foam_role)
VALUES
  ((SELECT id FROM products WHERE code='SZ1' AND category='chaise'), 'foam', 1, 'Szezlong baza', 6, 79.5, 125, 'T-35-38', 1, 'base'),
  ((SELECT id FROM products WHERE code='SZ1' AND category='chaise'), 'foam', 2, 'Szezlong nakrywkowa', 3, 79.5, 165, 'T-35-38', 1, 'base'),
  ((SELECT id FROM products WHERE code='SZ2' AND category='chaise'), 'foam', 1, 'Szezlong baza', 6, 79.5, 125, 'T-35-38', 1, 'base'),
  ((SELECT id FROM products WHERE code='SZ2' AND category='chaise'), 'foam', 2, 'Szezlong nakrywkowa', 3, 79.5, 165, 'T-35-38', 1, 'base'),
  ((SELECT id FROM products WHERE code='SZ3' AND category='chaise'), 'foam', 1, 'Szezlong baza', 6, 79.5, 125, 'T-35-38', 1, 'base'),
  ((SELECT id FROM products WHERE code='SZ3' AND category='chaise'), 'foam', 2, 'Szezlong nakrywkowa', 3, 79.5, 165, 'T-35-38', 1, 'base'),
  ((SELECT id FROM products WHERE code='SZ4' AND category='chaise'), 'foam', 1, 'Szezlong', 9, 79.5, 127.5, 'T-35-38', 1, 'base'),
  ((SELECT id FROM products WHERE code='SZ5' AND category='chaise'), 'foam', 1, 'Szezlong baza', 7, 79, 127.5, 'T-35-38', 1, 'base'),
  ((SELECT id FROM products WHERE code='SZ5' AND category='chaise'), 'foam', 2, 'Szezlong front', 3, 34.5, 79, 'T-21-35', 1, 'front'),
  ((SELECT id FROM products WHERE code='SZ5' AND category='chaise'), 'foam', 3, 'Szezlong front', 2, 20, 79, 'T-21-35', 1, 'front'),
  ((SELECT id FROM products WHERE code='SZ5' AND category='chaise'), 'foam', 4, 'Szezlong boki', 1, 40, 60, 'T-21-35', 2, 'front'),
  ((SELECT id FROM products WHERE code='SZ5' AND category='chaise'), 'foam', 5, 'Szezlong nakrywkowa', 3, 80, 129, 'T-35-38', 1, 'base'),
  ((SELECT id FROM products WHERE code='SZ5' AND category='chaise'), 'foam', 6, 'Szezlong czapa 3D', 2, 75, 126.5, 'T-35-38', 1, 'base');

-- 5c. SPECS SZEZLONGÓW — OPARCIA
INSERT INTO product_specs (product_id, spec_type, position_number, name, height, width, length, material, quantity, foam_role)
VALUES
  ((SELECT id FROM products WHERE code='SZ1' AND category='chaise'), 'foam', 10, 'Oparcie szezlonga boczna', 1, 16.3, 67.8, 'T-21-35', 2, 'base'),
  ((SELECT id FROM products WHERE code='SZ1' AND category='chaise'), 'foam', 11, 'Oparcie szezlonga tylna', 2, 79, 67.8, 'T-21-35', 1, 'base'),
  ((SELECT id FROM products WHERE code='SZ2' AND category='chaise'), 'foam', 10, 'Oparcie szezlonga boczna', 1, 16.3, 67.8, 'T-21-35', 2, 'base'),
  ((SELECT id FROM products WHERE code='SZ2' AND category='chaise'), 'foam', 11, 'Oparcie szezlonga tylna', 2, 79, 67.8, 'T-21-35', 1, 'base'),
  ((SELECT id FROM products WHERE code='SZ3' AND category='chaise'), 'foam', 10, 'Oparcie szezlonga boczna', 1, 16.3, 67.8, 'T-21-35', 2, 'base'),
  ((SELECT id FROM products WHERE code='SZ3' AND category='chaise'), 'foam', 11, 'Oparcie szezlonga tylna', 2, 79, 67.8, 'T-21-35', 1, 'base'),
  ((SELECT id FROM products WHERE code='SZ4' AND category='chaise'), 'foam', 10, 'Oparcie szezlonga boczna', 1, 16.3, 67.8, 'T-21-35', 2, 'base'),
  ((SELECT id FROM products WHERE code='SZ4' AND category='chaise'), 'foam', 11, 'Oparcie szezlonga tylna', 2, 79, 67.8, 'T-21-35', 1, 'base'),
  ((SELECT id FROM products WHERE code='SZ5' AND category='chaise'), 'foam', 10, 'Oparcie szezlonga boczna', NULL, NULL, NULL, 'T-21-35', 2, 'base'),
  ((SELECT id FROM products WHERE code='SZ5' AND category='chaise'), 'foam', 11, 'Oparcie szezlonga tylna', NULL, NULL, NULL, 'T-21-35', 1, 'base');