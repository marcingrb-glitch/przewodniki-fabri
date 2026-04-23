-- ============================================================================
-- Fotel S1 — final state (konsolidacja poprzednich migracji + user tweaks).
--
-- Zmienia vs 20260423_fotel_s1_seat_fotel_category.sql:
--   - frame: 'S1-SD-FT' → 'S1-FT'
--   - frame_modification: 'listwa 3 cm wysokości [Góra]' → 'listwa 3 cm [Góra]'
-- Sekcja ma od razu tytuł 'Korpus' (bez kroku rename).
-- Side_frame_suffix '-FT' zachowany (BOCZEK fotela).
--
-- Bezpiecznie można puścić wielokrotnie — DELETE + INSERT.
-- ============================================================================

BEGIN;

-- 1. Produkt seat_fotel S1-SD-FT (code pozostaje, frame display zmieniony)
DO $$
DECLARE
  s1_id uuid;
  sofa_pt_id uuid;
  fotel_seat_id uuid;
BEGIN
  SELECT id INTO s1_id FROM public.products
    WHERE code = 'S1' AND category = 'series';
  SELECT id INTO sofa_pt_id FROM public.product_types WHERE code = 'sofa';

  IF s1_id IS NULL THEN
    RAISE EXCEPTION 'S1 series not found';
  END IF;

  DELETE FROM public.product_specs
    WHERE product_id IN (
      SELECT id FROM public.products
       WHERE category = 'seat_fotel' AND series_id = s1_id
    );
  DELETE FROM public.products
    WHERE category = 'seat_fotel' AND series_id = s1_id;

  INSERT INTO public.products (
    code, name, category, series_id, product_type_id,
    properties, is_global, sort_order, active
  ) VALUES (
    'S1-SD-FT',
    'Korpus fotela S1',
    'seat_fotel',
    s1_id,
    sofa_pt_id,
    jsonb_build_object(
      'frame', 'S1-FT',
      'frame_modification', 'listwa 3 cm [Góra]',
      'spring_type', '48B',
      'side_frame_suffix', '-FT'
    ),
    false,
    10,
    true
  ) RETURNING id INTO fotel_seat_id;

  -- Pianki fotela
  INSERT INTO public.product_specs (
    product_id, spec_type, position_number,
    name, material, height, width, length, quantity, notes,
    foam_role, foam_section
  ) VALUES
    (fotel_seat_id, 'foam', 1,
     'Baza fotela', 'T3035', 14, 64, 60, 1, NULL,
     'base', 'seat'),
    (fotel_seat_id, 'foam', 2,
     'Oklejka (oparcie/tył/bok)', 'T3035', 1, NULL, NULL, 1,
     'zintegrowane z bazą, wszystkie 3 strony',
     'back', 'seat');

  RAISE NOTICE 'S1 fotel seat_fotel product (re)created: %', fotel_seat_id;
END $$;

-- 2. Label template dla fotel S1 — sekcja od razu 'Korpus'
DO $$
DECLARE
  s1_id uuid;
BEGIN
  SELECT id INTO s1_id FROM public.products
    WHERE code = 'S1' AND category = 'series';

  DELETE FROM public.label_templates_v2
    WHERE product_type = 'fotel' AND series_id = s1_id;

  INSERT INTO public.label_templates_v2
    (product_type, series_id, sheet_name, sort_order,
     header_template, show_meta_row, include_in_v3, sections)
  VALUES (
    'fotel', s1_id, 'FOTEL', 1,
    'FOTEL {series.collection} [{series.code}]',
    false, true,
    jsonb_build_array(
      jsonb_build_object(
        'title', 'Korpus',
        'component', 'fotel.seat',
        'style', 'plain',
        'display_fields', jsonb_build_array(
          jsonb_build_array('fotel.seat.frame'),
          jsonb_build_array('fotel.seat.frameModification'),
          jsonb_build_array('fotel.seat.springType')
        )
      ),
      jsonb_build_object(
        'title', 'PIANKI',
        'component', 'fotel.seat',
        'style', 'bullet_list',
        'display_fields', jsonb_build_array(
          jsonb_build_array('fotel.seat.foamsList')
        )
      )
    )
  );

  RAISE NOTICE 'S1 fotel label_templates_v2 rewritten (Korpus + PIANKI)';
END $$;

COMMIT;

-- ============================================================================
-- VERIFY
-- SELECT code, name, category, properties FROM products WHERE code='S1-SD-FT';
-- SELECT position_number, name, height, width, length, foam_role FROM product_specs ps
--   JOIN products p ON p.id=ps.product_id WHERE p.code='S1-SD-FT' ORDER BY position_number;
-- SELECT sheet_name, sections FROM label_templates_v2 lt JOIN products s ON s.id=lt.series_id
--   WHERE s.code='S1' AND product_type='fotel';
-- ============================================================================
