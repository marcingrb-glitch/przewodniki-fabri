-- ============================================================================
-- S1 (Sofa Mar) / S2 (Sofa Elma) — wariant 200cm szerokie
-- Default (brak W200 w SKU) = 190cm (backward compat)
--
-- Kopiuje siedziska + oparcia + skrzynie + seat_pillow_map
-- Poduszki (P1/P2/P3) pozostają te same — mapowania 200 celują w te same
-- rekordy poduszek co 190.
--
-- Pianki (product_specs): +10cm do wymiaru długościowego (L) z wyjątkami:
--   L >= 180           → +10   (190→200, 187→197, 191→201, 192→202)
--   90 <= L < 100      → +5    (SD5D czapa dzielone ×2 — połowa z 187→197)
--   L < 90             → bez zmian (ćwierćwałek doklejany z boku, L=44)
-- Wysokość (H), szerokość (W), materiał, ilość, nazwa, notes — 1:1.
--
-- UUID serii (z DB):
--   S1 = 26b3c83b-7612-462f-a6b6-f11dd31f849a
--   S2 = a20f51be-e14e-41ed-90f7-4297d77dde9d
--
-- Oczekiwane liczby po migracji:
--   Siedziska 200cm: S1=8, S2=9 (razem 17)
--   Oparcia 200cm:   S1=2 (OP62/OP68), S2=3 (OP68 ×3 warianty model_name)
--   product_specs:   ~46 (16 dla S1 + 30 dla S2); puste dla SD01ND, SD02ND,
--                    SD2D, SD3D, SD4D — user wypełni w AdminPanelu
--   seat_pillow_map: kopia istniejących mapowań z source → nowe siedzisko 200
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. SKU_SEGMENTS — fix walek (zabezpieczenie przed kolizją z W200)
--    + nowy opcjonalny segment 'width' dla sofy
-- ============================================================================

-- Walek miał ^W(\d+)([A-D])? — matchował również "W200". Ograniczamy do 1-2 cyfr.
UPDATE sku_segments
SET regex_pattern = '^W(\d{1,2})([A-D])?$'
WHERE segment_name = 'walek'
  AND product_type_id = (SELECT id FROM product_types WHERE code = 'sofa');

-- Nowy segment width — opcjonalny, tylko "W200" lub "W190"
INSERT INTO sku_segments (
  product_type_id, segment_name, position, prefix,
  regex_pattern, capture_groups,
  is_optional, category, has_finish_suffix, zero_padded, notes
)
VALUES (
  (SELECT id FROM product_types WHERE code = 'sofa'),
  'width', 12, 'W',
  '^W(200|190)$',
  '{"width": 1}'::jsonb,
  true, 'dimension', false, false,
  'Szerokość sofy (opcjonalna). Brak = 190cm. W200 = 200cm szerokie.'
);

-- ============================================================================
-- 2. SIEDZISKA 200 — S1 (8 modeli) i S2 (9 modeli)
-- ============================================================================
INSERT INTO products (
  code, name, category, series_id, product_type_id,
  properties, allowed_finishes, default_finish, colors,
  is_global, sort_order, active
)
SELECT
  s.code,
  CASE
    WHEN s.name LIKE '%190%' THEN replace(s.name, '190', '200')
    ELSE s.name || ' (200cm)'
  END,
  'seat',
  s.series_id,
  s.product_type_id,
  s.properties || jsonb_build_object(
    'width', 200,
    'frame', CASE
      WHEN s.properties->>'frame' LIKE '%190%'
        THEN regexp_replace(s.properties->>'frame', '190', '200', 'g')
      ELSE s.properties->>'frame'
    END
  ),
  s.allowed_finishes,
  s.default_finish,
  s.colors,
  false,
  s.sort_order + 100,
  s.active
FROM products s
WHERE s.category = 'seat'
  AND s.series_id IN (
    '26b3c83b-7612-462f-a6b6-f11dd31f849a',  -- S1
    'a20f51be-e14e-41ed-90f7-4297d77dde9d'   -- S2
  )
  AND (s.properties->>'width') IS NULL;

-- ============================================================================
-- 3. OPARCIA 200 — S1 (OP62, OP68) i S2 (OP68 ×3 warianty)
-- ============================================================================
INSERT INTO products (
  code, name, category, series_id, product_type_id,
  properties, allowed_finishes, default_finish, colors,
  is_global, sort_order, active
)
SELECT
  b.code,
  CASE
    WHEN b.name LIKE '%190%' THEN replace(b.name, '190', '200')
    ELSE b.name || ' (200cm)'
  END,
  'backrest',
  b.series_id,
  b.product_type_id,
  b.properties || jsonb_build_object(
    'width', 200,
    'frame', CASE
      WHEN b.properties->>'frame' LIKE '%190%'
        THEN regexp_replace(b.properties->>'frame', '190', '200', 'g')
      ELSE b.properties->>'frame'
    END
  ),
  b.allowed_finishes,
  b.default_finish,
  b.colors,
  false,
  b.sort_order + 100,
  b.active
FROM products b
WHERE b.category = 'backrest'
  AND b.series_id IN (
    '26b3c83b-7612-462f-a6b6-f11dd31f849a',
    'a20f51be-e14e-41ed-90f7-4297d77dde9d'
  )
  AND (b.properties->>'width') IS NULL;

-- ============================================================================
-- 4. SKRZYNIE 200 — globalne (SK15, SK17, SK23 itp.)
--    Pomijamy SK15 z width=130 (istniejący wariant dla N2 narożnika)
-- ============================================================================
INSERT INTO products (
  code, name, category, series_id, product_type_id,
  properties, allowed_finishes, default_finish, colors,
  is_global, sort_order, active
)
SELECT
  c.code,
  CASE
    WHEN c.name LIKE '%190%' THEN replace(c.name, '190', '200')
    ELSE c.name || ' (200cm)'
  END,
  'chest',
  c.series_id,
  c.product_type_id,
  c.properties || jsonb_build_object('width', 200),
  c.allowed_finishes,
  c.default_finish,
  c.colors,
  true,
  c.sort_order + 200,
  c.active
FROM products c
WHERE c.category = 'chest'
  AND c.is_global = true
  AND (c.properties->>'width') IS NULL;

-- ============================================================================
-- 5. PRODUCT_SPECS (pianki) — kopia z 190 z transformacją L
-- JOIN po code + category + series_id + model_name (żeby rozróżnić
-- 3 warianty OP68 w S2 z różnymi model_name).
-- ============================================================================
INSERT INTO product_specs (
  product_id, spec_type, position_number,
  name, material, height, width, length, quantity, notes, variant_ref
)
SELECT
  new_p.id,
  ps.spec_type,
  ps.position_number,
  ps.name,
  ps.material,
  ps.height,
  ps.width,
  CASE
    WHEN ps.length >= 180 THEN ps.length + 10
    WHEN ps.length >= 90 AND ps.length < 100 THEN ps.length + 5
    ELSE ps.length
  END,
  ps.quantity,
  ps.notes,
  ps.variant_ref
FROM products old_p
JOIN product_specs ps
  ON ps.product_id = old_p.id
  AND ps.spec_type = 'foam'
JOIN products new_p
  ON new_p.code = old_p.code
  AND new_p.category = old_p.category
  AND new_p.series_id = old_p.series_id
  AND (new_p.properties->>'width')::int = 200
  AND COALESCE(new_p.properties->>'model_name', '') =
      COALESCE(old_p.properties->>'model_name', '')
WHERE old_p.category IN ('seat', 'backrest')
  AND old_p.series_id IN (
    '26b3c83b-7612-462f-a6b6-f11dd31f849a',
    'a20f51be-e14e-41ed-90f7-4297d77dde9d'
  )
  AND (old_p.properties->>'width') IS NULL;

-- ============================================================================
-- 6. SEAT_PILLOW_MAP — kopia mapowań dla nowych siedzisk 200
--    target_product_id = te same poduszki (standardowe 190)
--    insert_type / pillow_finish_rules skopiowane 1:1
-- ============================================================================
INSERT INTO product_relations (
  series_id, relation_type, source_product_id, target_product_id,
  properties, active
)
SELECT
  pr.series_id,
  pr.relation_type,
  new_seat.id,
  pr.target_product_id,
  pr.properties,
  pr.active
FROM product_relations pr
JOIN products old_seat
  ON old_seat.id = pr.source_product_id
JOIN products new_seat
  ON new_seat.code = old_seat.code
  AND new_seat.category = 'seat'
  AND new_seat.series_id = old_seat.series_id
  AND (new_seat.properties->>'width')::int = 200
  AND COALESCE(new_seat.properties->>'model_name', '') =
      COALESCE(old_seat.properties->>'model_name', '')
WHERE pr.relation_type = 'seat_pillow_map'
  AND pr.series_id IN (
    '26b3c83b-7612-462f-a6b6-f11dd31f849a',
    'a20f51be-e14e-41ed-90f7-4297d77dde9d'
  )
  AND (old_seat.properties->>'width') IS NULL;

COMMIT;

-- ============================================================================
-- VERIFICATION — uruchom po migracji:
-- ============================================================================
-- SELECT s.code AS series, COUNT(*) AS cnt
-- FROM products p JOIN products s ON s.id = p.series_id
-- WHERE p.category='seat' AND p.properties->>'width'='200'
--   AND s.code IN ('S1','S2')
-- GROUP BY s.code;
-- -- Oczekiwane: S1=8, S2=9
--
-- SELECT p.code, p.name, COUNT(ps.id) AS foam_count
-- FROM products p
-- LEFT JOIN product_specs ps ON ps.product_id = p.id AND ps.spec_type='foam'
-- WHERE p.properties->>'width'='200' AND p.category IN ('seat','backrest')
-- GROUP BY p.code, p.name ORDER BY p.code;
--
-- SELECT COUNT(*) FROM product_relations pr
-- JOIN products p ON p.id = pr.source_product_id
-- WHERE pr.relation_type='seat_pillow_map'
--   AND p.properties->>'width'='200';
-- -- Oczekiwane: tyle ile istniejących mapowań 190 (dla S1 + S2)
