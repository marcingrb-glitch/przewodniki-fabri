-- S2: wywal fotel, zamień NOGI na SKRZYNIA w OPARCIE (tak jak w S1 cut-sheet).
-- S2 ma tylko N4 plastik (brak sekcji nóg), skrzynia trafia tu zamiast na osobny arkusz.

DO $$
DECLARE
  s2_id uuid;
BEGIN
  SELECT id INTO s2_id FROM public.products WHERE code = 'S2' AND category = 'series';

  -- 1. Fotel S2 — wywal całkiem
  DELETE FROM public.label_templates_v2
  WHERE series_id = s2_id AND product_type = 'fotel';

  -- 2. OPARCIE: ostatnia sekcja NOGI → SKRZYNIA
  UPDATE public.label_templates_v2
  SET sections = jsonb_build_array(
    jsonb_build_object(
      'title', 'OPARCIE {backrest.height}',
      'component', 'backrest',
      'style', 'plain',
      'display_fields', jsonb_build_array(
        jsonb_build_array('backrest.frame'),
        jsonb_build_array('backrest.springType')
      )
    ),
    jsonb_build_object(
      'title', 'PIANKI OPARCIA',
      'component', 'backrest',
      'style', 'bullet_list',
      'display_fields', jsonb_build_array(jsonb_build_array('backrest.foamsList'))
    ),
    jsonb_build_object(
      'title', 'SKRZYNIA',
      'component', 'chest',
      'style', 'plain',
      'display_fields', jsonb_build_array(
        jsonb_build_array('chest_automat.label')
      )
    )
  )
  WHERE series_id = s2_id
    AND product_type = 'sofa'
    AND sheet_name = 'OPARCIE';

  RAISE NOTICE 'S2: fotel usunięty, OPARCIE ma SKRZYNIA zamiast NOGI';
END $$;
