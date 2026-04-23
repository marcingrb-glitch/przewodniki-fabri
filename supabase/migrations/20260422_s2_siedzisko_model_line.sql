-- S2 SIEDZISKO:
--   tytul: "SIEDZISKO {seat.modelName} {width}" -> "SIEDZISKO {width}"
--   pierwsza linia pol: [seat.code, seat.type] -> [seat.modelName, seat.type]

DO $$
DECLARE
  s2_id uuid;
  siedzisko_sections jsonb;
  updated_sections jsonb;
BEGIN
  SELECT id INTO s2_id FROM public.products WHERE code = 'S2' AND category = 'series';

  SELECT sections INTO siedzisko_sections
  FROM public.label_templates_v2
  WHERE series_id = s2_id AND product_type = 'sofa' AND sheet_name = 'SIEDZISKO';

  updated_sections := jsonb_set(
    siedzisko_sections,
    '{0,title}',
    '"SIEDZISKO {width}"'::jsonb
  );

  updated_sections := jsonb_set(
    updated_sections,
    '{0,display_fields,0}',
    '["seat.modelName", "seat.type"]'::jsonb
  );

  UPDATE public.label_templates_v2
  SET sections = updated_sections
  WHERE series_id = s2_id AND product_type = 'sofa' AND sheet_name = 'SIEDZISKO';

  RAISE NOTICE 'S2 SIEDZISKO: title=SIEDZISKO {width}, pierwsza linia=model+typ';
END $$;
