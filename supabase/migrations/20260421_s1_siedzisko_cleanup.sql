-- S1 SIEDZISKO (arkusz 1) — czyszczenie sekcji:
--   • usuwamy seat.front z sekcji SIEDZISKO (dubluje się z PIANKI)
--   • seat.midStrip_yn przenosimy z SIEDZISKO do PIANKI SIEDZISKA (jako bullet z labelem)
--   • header_template bez {sheet_name} — tytuł "SIEDZISKO" pochodzi z section.title
--     Nowy format: "SOFA {series.collection} [{series.code}]" → "SOFA Viena [S1]"

DO $$
DECLARE
  s1_id uuid;
BEGIN
  SELECT id INTO s1_id FROM public.products WHERE code = 'S1' AND category = 'series';

  -- Zmiana sections SIEDZISKO
  UPDATE public.label_templates_v2
  SET sections = jsonb_build_array(
    jsonb_build_object(
      'title', 'SIEDZISKO',
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

  -- Nowy header_template (wspólny dla wszystkich arkuszy S1)
  UPDATE public.label_templates_v2
  SET header_template = 'SOFA {series.collection} [{series.code}]'
  WHERE product_type = 'sofa'
    AND series_id = s1_id;

  RAISE NOTICE 'S1 SIEDZISKO + header_template updated';
END $$;
