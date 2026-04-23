-- N2: kolejnosc arkuszy = sofa (siedzisko, oparcie) -> szezlong (siedzisko, oparcie)

UPDATE public.label_templates_v2 t
SET sort_order = CASE t.sheet_name
  WHEN 'SIEDZISKO sofy'       THEN 1
  WHEN 'OPARCIE sofy'         THEN 2
  WHEN 'SIEDZISKO szezlongu'  THEN 3
  WHEN 'OPARCIE szezlongu'    THEN 4
END
FROM public.products p
WHERE p.id = t.series_id
  AND p.code = 'N2'
  AND t.product_type = 'naroznik';
