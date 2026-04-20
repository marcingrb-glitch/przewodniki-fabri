-- S1 OPARCIE: dokładamy sekcję "NOGI (komplet)" z linią odcięcia.
-- Cut sheet S1 traci sekcję NOGI (pozostają 3: Boczek L/P, Skrzynia — powiększone w kodzie).

DO $$
DECLARE
  s1_id uuid;
BEGIN
  SELECT id INTO s1_id FROM public.products WHERE code = 'S1' AND category = 'series';

  UPDATE public.label_templates_v2
  SET sections = jsonb_build_array(
    jsonb_build_object(
      'title', 'OPARCIE',
      'component', 'backrest',
      'style', 'plain',
      'display_fields', jsonb_build_array(
        jsonb_build_array('backrest.code', 'backrest.height'),
        jsonb_build_array('backrest.frame'),
        jsonb_build_array('backrest.springType'),
        jsonb_build_array('backrest.top')
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
  WHERE product_type = 'sofa'
    AND series_id = s1_id
    AND sheet_name = 'OPARCIE';

  RAISE NOTICE 'S1 OPARCIE: added legs_list section';
END $$;
