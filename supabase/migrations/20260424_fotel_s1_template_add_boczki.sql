-- Fotel S1 — dopisuje 2× BOCZEK jako sekcje cut_with_header do label_templates_v2.
-- Po tej migracji jeden arkusz fotela (100×150mm) zawiera: Korpus + PIANKI + BOCZEK + BOCZEK.
-- renderFotelCutSheet (osobna strona) zostaje usunięty po stronie kodu.

BEGIN;

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
      ),
      jsonb_build_object(
        'title', 'BOCZEK',
        'component', 'side',
        'style', 'plain',
        'display_fields', jsonb_build_array(
          jsonb_build_array('side.code_finish'),
          jsonb_build_array('side.frame_fotel')
        )
      ),
      jsonb_build_object(
        'title', 'BOCZEK',
        'component', 'side',
        'style', 'plain',
        'display_fields', jsonb_build_array(
          jsonb_build_array('side.code_finish'),
          jsonb_build_array('side.frame_fotel')
        )
      )
    )
  );

  RAISE NOTICE 'S1 fotel template: 4 sections (Korpus + PIANKI + BOCZEK × 2)';
END $$;

COMMIT;
