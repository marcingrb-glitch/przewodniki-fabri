-- S2 OPARCIE: sekcja SKRZYNIA dostaje styl 'cut_with_header' (cut line + full header).
-- Dzieki temu odciety kawalek papieru ze skrzynia ma swoj wlasny naglowek.

DO $$
DECLARE
  s2_id uuid;
  sec jsonb;
  new_sections jsonb;
  i int;
  row_val jsonb;
BEGIN
  SELECT id INTO s2_id FROM public.products WHERE code = 'S2' AND category = 'series';

  SELECT sections INTO sec
  FROM public.label_templates_v2
  WHERE series_id = s2_id AND product_type = 'sofa' AND sheet_name = 'OPARCIE';

  new_sections := '[]'::jsonb;
  FOR i IN 0..jsonb_array_length(sec) - 1 LOOP
    row_val := sec->i;
    IF row_val->>'title' = 'SKRZYNIA' THEN
      row_val := jsonb_set(row_val, '{style}', '"cut_with_header"'::jsonb);
    END IF;
    new_sections := new_sections || jsonb_build_array(row_val);
  END LOOP;

  UPDATE public.label_templates_v2
  SET sections = new_sections
  WHERE series_id = s2_id AND product_type = 'sofa' AND sheet_name = 'OPARCIE';

  RAISE NOTICE 'S2 OPARCIE SKRZYNIA: style=cut_with_header';
END $$;
