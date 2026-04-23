-- S2: zmiany w SIEDZISKO + OPARCIE
-- 1. SIEDZISKO display_fields: [automat.code_name] -> [automat.name_code]  (Nazwa + Kod)
-- 2. OPARCIE SKRZYNIA section: chest_automat.label -> [[chest.name], [automat.name_code]]
--    (SK23 - 190 + Automat: Zwykly + AT1)

DO $$
DECLARE
  s2_id uuid;
  sec jsonb;
  fields jsonb;
  new_fields jsonb;
  new_sections jsonb;
  i int;
  row_val jsonb;
BEGIN
  SELECT id INTO s2_id FROM public.products WHERE code = 'S2' AND category = 'series';

  -- SIEDZISKO: podmien automat.code_name -> automat.name_code
  SELECT sections INTO sec
  FROM public.label_templates_v2
  WHERE series_id = s2_id AND product_type = 'sofa' AND sheet_name = 'SIEDZISKO';

  fields := sec->0->'display_fields';
  new_fields := '[]'::jsonb;
  FOR i IN 0..jsonb_array_length(fields) - 1 LOOP
    row_val := fields->i;
    IF row_val = '["automat.code_name"]'::jsonb THEN
      new_fields := new_fields || '[["automat.name_code"]]'::jsonb;
    ELSE
      new_fields := new_fields || jsonb_build_array(row_val);
    END IF;
  END LOOP;

  UPDATE public.label_templates_v2
  SET sections = jsonb_set(sec, '{0,display_fields}', new_fields)
  WHERE series_id = s2_id AND product_type = 'sofa' AND sheet_name = 'SIEDZISKO';

  -- OPARCIE: przebuduj SKRZYNIA section z 2 wierszami
  SELECT sections INTO sec
  FROM public.label_templates_v2
  WHERE series_id = s2_id AND product_type = 'sofa' AND sheet_name = 'OPARCIE';

  new_sections := '[]'::jsonb;
  FOR i IN 0..jsonb_array_length(sec) - 1 LOOP
    row_val := sec->i;
    IF row_val->>'title' = 'SKRZYNIA' THEN
      row_val := jsonb_set(
        row_val,
        '{display_fields}',
        '[["chest.name"], ["automat.name_code"]]'::jsonb
      );
    END IF;
    new_sections := new_sections || jsonb_build_array(row_val);
  END LOOP;

  UPDATE public.label_templates_v2
  SET sections = new_sections
  WHERE series_id = s2_id AND product_type = 'sofa' AND sheet_name = 'OPARCIE';

  RAISE NOTICE 'S2: SIEDZISKO automat->name_code, OPARCIE SKRZYNIA=[chest.name, automat.name_code]';
END $$;
