-- S1 SIEDZISKO: tytuł sekcji pokazuje szerokość — "SIEDZISKO 190 cm"
-- (zmienna {width} w section.title — interpolacja w renderSectionTitle)

DO $$
DECLARE
  s1_id uuid;
BEGIN
  SELECT id INTO s1_id FROM public.products WHERE code = 'S1' AND category = 'series';

  UPDATE public.label_templates_v2
  SET sections = jsonb_build_array(
    jsonb_build_object(
      'title', 'SIEDZISKO {width}',
      'component', 'seat',
      'style', 'plain',
      'display_fields', jsonb_build_array(
        jsonb_build_array('seat.code', 'seat.type'),
        jsonb_build_array('seat.frame'),
        jsonb_build_array('seat.springType')
      )
    ),
    jsonb_build_object(
      'title', 'PIANKI SIEDZISKA',
      'component', 'seat',
      'style', 'bullet_list',
      'display_fields', jsonb_build_array(
        jsonb_build_array('seat.foamsList'),
        jsonb_build_array('seat.midStrip_yn')
      )
    ),
    jsonb_build_object(
      'title', 'AUTOMAT',
      'component', 'automat',
      'style', 'plain',
      'display_fields', jsonb_build_array(
        jsonb_build_array('automat.code_name'),
        jsonb_build_array('automat.lockBolts')
      )
    ),
    jsonb_build_object(
      'title', 'UWAGI',
      'component', 'seat',
      'style', 'plain',
      'display_fields', jsonb_build_array(jsonb_build_array('listwa.label')),
      'condition_field', 'has_special_notes'
    )
  )
  WHERE product_type = 'sofa'
    AND series_id = s1_id
    AND sheet_name = 'SIEDZISKO';

  RAISE NOTICE 'S1 SIEDZISKO title updated to include {width}';
END $$;
