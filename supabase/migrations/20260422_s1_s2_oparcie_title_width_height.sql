-- S1 + S2 OPARCIE title: "OPARCIE {backrest.height}" -> "OPARCIE {width_raw} x {backrest.height_raw} cm"

DO $$
DECLARE
  tpl RECORD;
BEGIN
  FOR tpl IN
    SELECT t.id, t.sections
    FROM public.label_templates_v2 t
    JOIN public.products p ON p.id = t.series_id
    WHERE t.product_type = 'sofa'
      AND t.sheet_name = 'OPARCIE'
      AND p.code IN ('S1', 'S2')
  LOOP
    UPDATE public.label_templates_v2
    SET sections = jsonb_set(
      tpl.sections,
      '{0,title}',
      '"OPARCIE {width_raw} x {backrest.height_raw} cm"'::jsonb
    )
    WHERE id = tpl.id;
  END LOOP;

  RAISE NOTICE 'S1+S2 OPARCIE title: OPARCIE {width_raw} x {backrest.height_raw} cm';
END $$;
