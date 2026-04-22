-- S2 — identyczny uklad jak S1 (SIEDZISKO + OPARCIE + FOTEL)
-- S2 Elma: collection="Elma", bez backrest.top, bez seat.front, tylko AT1.

DO $$
DECLARE
  s2_id uuid;
BEGIN
  SELECT id INTO s2_id FROM public.products WHERE code = 'S2' AND category = 'series';

  DELETE FROM public.label_templates_v2
  WHERE series_id = s2_id AND product_type IN ('sofa', 'fotel');

  -- SIEDZISKO
  INSERT INTO public.label_templates_v2
    (product_type, series_id, sheet_name, sort_order, header_template, show_meta_row, include_in_v3, sections)
  VALUES
    ('sofa', s2_id, 'SIEDZISKO', 1,
     'SOFA {series.collection} [{series.code}]', false, true,
     jsonb_build_array(
       jsonb_build_object(
         'title', 'SIEDZISKO {width}',
         'component', 'seat',
         'style', 'plain',
         'display_fields', jsonb_build_array(
           jsonb_build_array('seat.code', 'seat.type'),
           jsonb_build_array('seat.frame'),
           jsonb_build_array('seat.springType'),
           jsonb_build_array('automat.code_name'),
           jsonb_build_array('automat.lockBolts')
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
         'title', 'UWAGI',
         'component', 'seat',
         'style', 'plain',
         'display_fields', jsonb_build_array(jsonb_build_array('listwa.label')),
         'condition_field', 'has_special_notes'
       )
     )),
    ('sofa', s2_id, 'OPARCIE', 2,
     'SOFA {series.collection} [{series.code}]', false, true,
     jsonb_build_array(
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
         'title', 'NOGI (komplet)',
         'component', 'legs',
         'style', 'legs_list'
       )
     ));

  INSERT INTO public.label_templates_v2
    (product_type, series_id, sheet_name, sort_order, header_template, show_meta_row, include_in_v3, sections)
  VALUES
    ('fotel', s2_id, 'FOTEL', 1,
     'FOTEL {series.collection} [{series.code}]', false, true,
     jsonb_build_array(
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
         'title', 'NOGI (komplet)',
         'component', 'legs',
         'style', 'legs_list'
       )
     ));

  RAISE NOTICE 'S2 templates mirror S1 — SIEDZISKO + OPARCIE + FOTEL';
END $$;
