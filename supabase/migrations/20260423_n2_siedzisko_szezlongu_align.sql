-- N2 SIEDZISKO szezlongu: wyrownaj do S2 SIEDZISKO.
-- Tytul sekcji 1: "SZEZLONG SIEDZISKO"
-- Tytul sekcji 2: "PIANKI SZEZLONG SIEDZISKO"
-- Pierwszy wiersz pol: [chaise.code, chaise.modelName] -> [chaise.modelName]

DO $$
DECLARE
  n2_id uuid;
  sec jsonb;
  new_sections jsonb;
  i int;
  s jsonb;
BEGIN
  SELECT id INTO n2_id FROM public.products WHERE code = 'N2' AND category = 'series';

  SELECT sections INTO sec
  FROM public.label_templates_v2
  WHERE series_id = n2_id AND product_type = 'naroznik' AND sheet_name = 'SIEDZISKO szezlongu';

  new_sections := '[]'::jsonb;
  FOR i IN 0..jsonb_array_length(sec) - 1 LOOP
    s := sec->i;
    IF s->>'title' = 'SZEZLONG' THEN
      s := jsonb_set(s, '{title}', '"SZEZLONG SIEDZISKO"'::jsonb);
      s := jsonb_set(s, '{display_fields,0}', '["chaise.modelName"]'::jsonb);
    ELSIF s->>'title' = 'PIANKI SIEDZISKA szezlongu' THEN
      s := jsonb_set(s, '{title}', '"PIANKI SZEZLONG SIEDZISKO"'::jsonb);
    END IF;
    new_sections := new_sections || jsonb_build_array(s);
  END LOOP;

  UPDATE public.label_templates_v2
  SET sections = new_sections
  WHERE series_id = n2_id AND product_type = 'naroznik' AND sheet_name = 'SIEDZISKO szezlongu';

  RAISE NOTICE 'N2 SIEDZISKO szezlongu: tytuly zaktualizowane, pierwszy wiersz = chaise.modelName';
END $$;
