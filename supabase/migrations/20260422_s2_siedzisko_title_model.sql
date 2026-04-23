-- S2 SIEDZISKO title: dodaj model przed szerokoscia
-- "SIEDZISKO {width}" -> "SIEDZISKO {seat.modelName} {width}"

DO $$
DECLARE
  s2_id uuid;
  siedzisko_sections jsonb;
BEGIN
  SELECT id INTO s2_id FROM public.products WHERE code = 'S2' AND category = 'series';

  SELECT sections INTO siedzisko_sections
  FROM public.label_templates_v2
  WHERE series_id = s2_id AND product_type = 'sofa' AND sheet_name = 'SIEDZISKO';

  UPDATE public.label_templates_v2
  SET sections = jsonb_set(
    siedzisko_sections,
    '{0,title}',
    '"SIEDZISKO {seat.modelName} {width}"'::jsonb
  )
  WHERE series_id = s2_id AND product_type = 'sofa' AND sheet_name = 'SIEDZISKO';

  RAISE NOTICE 'S2 SIEDZISKO title zaktualizowany na: SIEDZISKO {seat.modelName} {width}';
END $$;
