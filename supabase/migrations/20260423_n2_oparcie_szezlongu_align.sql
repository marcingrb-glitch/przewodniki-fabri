-- N2 OPARCIE szezlongu:
-- Tytul sekcji 1: "SZEZLONG OPARCIE"
-- Tytul sekcji 2: "PIANKI SZEZLONG OPARCIE"
-- Wywal sprezyne (chaise.backrestHasSprings)

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
  WHERE series_id = n2_id AND product_type = 'naroznik' AND sheet_name = 'OPARCIE szezlongu';

  new_sections := '[]'::jsonb;
  FOR i IN 0..jsonb_array_length(sec) - 1 LOOP
    s := sec->i;
    IF s->>'title' = 'OPARCIE szezlongu' THEN
      s := jsonb_set(s, '{title}', '"SZEZLONG OPARCIE"'::jsonb);
      s := jsonb_set(s, '{display_fields}', '[["chaise.backrestFrame"]]'::jsonb);
    ELSIF s->>'title' = 'PIANKI OPARCIA szezlongu' THEN
      s := jsonb_set(s, '{title}', '"PIANKI SZEZLONG OPARCIE"'::jsonb);
    END IF;
    new_sections := new_sections || jsonb_build_array(s);
  END LOOP;

  UPDATE public.label_templates_v2
  SET sections = new_sections
  WHERE series_id = n2_id AND product_type = 'naroznik' AND sheet_name = 'OPARCIE szezlongu';

  RAISE NOTICE 'N2 OPARCIE szezlongu: tytuly + usunieta sprezyna';
END $$;
