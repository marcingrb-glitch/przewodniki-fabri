-- Nowy arkusz V2 dla FOTELA S1 (100×150mm).
-- Fotel komponuje się z części sofy (seat, backrest, side), własne tylko nóżki.
-- 1 arkusz z sekcjami: FOTEL, PIANKI SIEDZISKA, OPARCIE, PIANKI OPARCIA, NOGI.

DO $$
DECLARE
  s1_id uuid;
BEGIN
  SELECT id INTO s1_id FROM public.products WHERE code = 'S1' AND category = 'series';

  -- Upsert: jeśli już istnieje to nadpisz
  DELETE FROM public.label_templates_v2
  WHERE product_type = 'fotel' AND series_id = s1_id;

  INSERT INTO public.label_templates_v2
    (product_type, series_id, sheet_name, sort_order, header_template, show_meta_row, include_in_v3, sections)
  VALUES
    ('fotel', s1_id, 'FOTEL', 1,
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
           jsonb_build_array('backrest.code'),
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
     )
    );

  RAISE NOTICE 'S1 FOTEL V2 sheet created';
END $$;
