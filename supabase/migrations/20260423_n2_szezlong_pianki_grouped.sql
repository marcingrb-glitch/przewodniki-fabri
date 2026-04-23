-- N2 szezlong:
--   SIEDZISKO szezlongu PIANKI -> jedna sekcja, wszystkie pianki (fallback po poprzedniej probie)
--   OPARCIE szezlongu PIANKI  -> styl bullet_list_grouped (title zostaje, sub-naglowki BAZA/FRONT/BOCZNE bez kresek)

DO $$
DECLARE
  n2_id uuid;
  sec jsonb;
  new_sections jsonb;
  i int;
  s jsonb;
  replaced boolean;
BEGIN
  SELECT id INTO n2_id FROM public.products WHERE code = 'N2' AND category = 'series';

  ---------------------------------------------------------------------------
  -- 1. SIEDZISKO szezlongu: cofnij do pojedynczej sekcji PIANKI (jezeli wczesniej podzielone)
  ---------------------------------------------------------------------------
  SELECT sections INTO sec
  FROM public.label_templates_v2
  WHERE series_id = n2_id AND product_type = 'naroznik' AND sheet_name = 'SIEDZISKO szezlongu';

  new_sections := '[]'::jsonb;
  replaced := false;
  FOR i IN 0..jsonb_array_length(sec) - 1 LOOP
    s := sec->i;
    IF s->>'title' IN ('BAZA', 'FRONT', 'BOCZNE') THEN
      IF NOT replaced THEN
        new_sections := new_sections || jsonb_build_array(jsonb_build_object(
          'title', 'PIANKI SZEZLONG SIEDZISKO',
          'component', 'chaise_seat',
          'style', 'bullet_list',
          'display_fields', jsonb_build_array(jsonb_build_array('chaise.seatFoams_summary'))
        ));
        replaced := true;
      END IF;
    ELSE
      new_sections := new_sections || jsonb_build_array(s);
    END IF;
  END LOOP;

  UPDATE public.label_templates_v2
  SET sections = new_sections
  WHERE series_id = n2_id AND product_type = 'naroznik' AND sheet_name = 'SIEDZISKO szezlongu';

  ---------------------------------------------------------------------------
  -- 2. OPARCIE szezlongu: PIANKI -> bullet_list_grouped z 3 rolami
  ---------------------------------------------------------------------------
  SELECT sections INTO sec
  FROM public.label_templates_v2
  WHERE series_id = n2_id AND product_type = 'naroznik' AND sheet_name = 'OPARCIE szezlongu';

  new_sections := '[]'::jsonb;
  FOR i IN 0..jsonb_array_length(sec) - 1 LOOP
    s := sec->i;
    IF s->>'title' = 'PIANKI SZEZLONG OPARCIE' THEN
      s := jsonb_build_object(
        'title', 'PIANKI SZEZLONG OPARCIE',
        'component', 'chaise_backrest',
        'style', 'bullet_list_grouped',
        'groups', jsonb_build_array(
          jsonb_build_object('label', 'BAZA',    'field', 'chaise.backrestFoams_base'),
          jsonb_build_object('label', 'FRONT',   'field', 'chaise.backrestFoams_front'),
          jsonb_build_object('label', 'BOCZNE',  'field', 'chaise.backrestFoams_side')
        )
      );
    END IF;
    new_sections := new_sections || jsonb_build_array(s);
  END LOOP;

  UPDATE public.label_templates_v2
  SET sections = new_sections
  WHERE series_id = n2_id AND product_type = 'naroznik' AND sheet_name = 'OPARCIE szezlongu';

  RAISE NOTICE 'N2: SIEDZISKO szezlongu -> pojedyncza PIANKI; OPARCIE szezlongu -> bullet_list_grouped';
END $$;
