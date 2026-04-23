-- N2 naroznik: arkusze 'SIEDZISKO sofy' i 'OPARCIE sofy' dostaja identyczne
-- sections jak odpowiadajace arkusze S2 (uklad + pola).
-- Szezlong arkusze (SIEDZISKO szezlongu / OPARCIE szezlongu) zostaja bez zmian.
-- header_template N2 zostaje (zawiera orientation).

DO $$
DECLARE
  s2_id uuid;
  n2_id uuid;
  s2_siedzisko jsonb;
  s2_oparcie jsonb;
BEGIN
  SELECT id INTO s2_id FROM public.products WHERE code = 'S2' AND category = 'series';
  SELECT id INTO n2_id FROM public.products WHERE code = 'N2' AND category = 'series';

  SELECT sections INTO s2_siedzisko
  FROM public.label_templates_v2
  WHERE series_id = s2_id AND product_type = 'sofa' AND sheet_name = 'SIEDZISKO';

  SELECT sections INTO s2_oparcie
  FROM public.label_templates_v2
  WHERE series_id = s2_id AND product_type = 'sofa' AND sheet_name = 'OPARCIE';

  UPDATE public.label_templates_v2
  SET sections = s2_siedzisko
  WHERE series_id = n2_id AND product_type = 'naroznik' AND sheet_name = 'SIEDZISKO sofy';

  UPDATE public.label_templates_v2
  SET sections = s2_oparcie
  WHERE series_id = n2_id AND product_type = 'naroznik' AND sheet_name = 'OPARCIE sofy';

  RAISE NOTICE 'N2 sofa-part: sections skopiowane z S2 (SIEDZISKO sofy + OPARCIE sofy)';
END $$;
