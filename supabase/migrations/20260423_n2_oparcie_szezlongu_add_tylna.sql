-- N2 OPARCIE szezlongu PIANKI: dodaj grupe TYLNA (rola 'back')

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
    IF s->>'title' = 'PIANKI SZEZLONG OPARCIE' THEN
      s := jsonb_set(
        s,
        '{groups}',
        jsonb_build_array(
          jsonb_build_object('label', 'BAZA',   'field', 'chaise.backrestFoams_base'),
          jsonb_build_object('label', 'FRONT',  'field', 'chaise.backrestFoams_front'),
          jsonb_build_object('label', 'BOCZNE', 'field', 'chaise.backrestFoams_side'),
          jsonb_build_object('label', 'TYLNA',  'field', 'chaise.backrestFoams_back')
        )
      );
    END IF;
    new_sections := new_sections || jsonb_build_array(s);
  END LOOP;

  UPDATE public.label_templates_v2
  SET sections = new_sections
  WHERE series_id = n2_id AND product_type = 'naroznik' AND sheet_name = 'OPARCIE szezlongu';

  RAISE NOTICE 'N2 OPARCIE szezlongu: dodano grupe TYLNA';
END $$;
