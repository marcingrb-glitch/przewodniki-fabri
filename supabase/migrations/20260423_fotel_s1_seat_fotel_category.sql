-- ============================================================================
-- Fotel S1 — osobna specyfikacja (nowa kategoria `seat_fotel`)
--
-- Fotel ma:
--  - własny stelaż S1-SD-FT (z listwą 3cm [Góra])
--  - własną sprężynę 48B
--  - własną piankę bazy 14 × 64 × 60 (rola: base)
--  - oklejkę 1 cm (oparcie/tył/bok, zintegrowane z bazą) — rola: back
--  - FRONT (półwałek) dziedziczy z sofa-seat per wariant SD (SD2 → SD02)
--    decoder merguje runtime — nie zapisujemy jako product_specs
--  - boczki + nóżki shared z sofa (bez zmian w DB)
--
-- Etykieta: 1 arkusz z sekcjami "Fotel korpus" + "PIANKI" + 2× BOCZEK (cut)
-- Renderowanie BOCZEK — kod (V2 cut-sheet S1), nie przez label_templates_v2.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Produkt S1-SD-FT w kategorii seat_fotel
-- ----------------------------------------------------------------------------
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

  -- Idempotent: remove any previous fotel seat product for S1
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
      'frame', 'S1-SD-FT',
      'frame_modification', 'listwa 3 cm wysokości [Góra]',
      'spring_type', '48B',
      'side_frame_suffix', '-FT'   -- displayed on BOCZEK label in fotel context
    ),
    false,
    10,
    true
  ) RETURNING id INTO fotel_seat_id;

  -- --------------------------------------------------------------------------
  -- 2. Pianki fotela (product_specs)
  --    - position 1: baza 14 × 64 × 60 (rola: base)
  --    - position 2: oklejka 1 cm (rola: back; opis: oparcie/tył/bok)
  -- Front (półwałek SD*) NIE jest zapisany — decoder mergeuje z sofa-seat
  -- runtime (role='front' z sofa seat foams).
  -- --------------------------------------------------------------------------
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

  RAISE NOTICE 'S1 fotel seat_fotel product created: %', fotel_seat_id;
END $$;

-- ----------------------------------------------------------------------------
-- 3. Rewrite label_templates_v2 dla fotel S1
--    - header: "FOTEL Viena [S1]"
--    - 1 arkusz, 2 sekcje: "Fotel korpus" + "PIANKI"
--    - BOCZEK ×2 doklejane runtime przez renderFotelCutSheet (code)
-- ----------------------------------------------------------------------------
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
        'title', 'Fotel korpus',
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

  RAISE NOTICE 'S1 fotel label_templates_v2 rewritten';
END $$;

COMMIT;

-- ============================================================================
-- VERIFICATION (odpal po migracji):
-- SELECT code, name, category, properties FROM products WHERE code='S1-SD-FT';
-- SELECT position_number, name, height, width, length, foam_role
--   FROM product_specs ps JOIN products p ON p.id=ps.product_id
--   WHERE p.code='S1-SD-FT' ORDER BY position_number;
-- SELECT sheet_name, jsonb_array_length(sections) AS sec_count
--   FROM label_templates_v2 lt JOIN products s ON s.id=lt.series_id
--   WHERE s.code='S1' AND product_type='fotel';
-- ============================================================================
