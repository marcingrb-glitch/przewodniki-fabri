-- N2 OPARCIE szezlongu: ustaw finalny stan idempotentnie (niezaleznie od poprzednich migracji).
--   Sekcja 1: "SZEZLONG OPARCIE" (plain) z [chaise.backrestFrame] (bez sprezyny)
--   Sekcja 2: "PIANKI SZEZLONG OPARCIE" (bullet_list_grouped) z BAZA/FRONT/BOCZNE

DO $$
DECLARE
  n2_id uuid;
BEGIN
  SELECT id INTO n2_id FROM public.products WHERE code = 'N2' AND category = 'series';

  UPDATE public.label_templates_v2
  SET sections = jsonb_build_array(
    jsonb_build_object(
      'title', 'SZEZLONG OPARCIE',
      'component', 'chaise_backrest',
      'style', 'plain',
      'display_fields', jsonb_build_array(jsonb_build_array('chaise.backrestFrame'))
    ),
    jsonb_build_object(
      'title', 'PIANKI SZEZLONG OPARCIE',
      'component', 'chaise_backrest',
      'style', 'bullet_list_grouped',
      'groups', jsonb_build_array(
        jsonb_build_object('label', 'BAZA',   'field', 'chaise.backrestFoams_base'),
        jsonb_build_object('label', 'FRONT',  'field', 'chaise.backrestFoams_front'),
        jsonb_build_object('label', 'BOCZNE', 'field', 'chaise.backrestFoams_side')
      )
    )
  )
  WHERE series_id = n2_id
    AND product_type = 'naroznik'
    AND sheet_name = 'OPARCIE szezlongu';

  RAISE NOTICE 'N2 OPARCIE szezlongu: finalny uklad ustawiony';
END $$;
