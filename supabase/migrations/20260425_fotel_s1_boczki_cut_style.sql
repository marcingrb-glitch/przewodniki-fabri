-- Fotel S1 — zamienia styl BOCZEK z plain na cut_with_header.
-- Po cięciu każdy BOCZEK dostaje własny mini-header (order# + "FOTEL Viena [S1]").

BEGIN;

DO $$
DECLARE
  s1_id uuid;
BEGIN
  SELECT id INTO s1_id FROM public.products
    WHERE code = 'S1' AND category = 'series';

  UPDATE public.label_templates_v2
  SET sections = (
    SELECT jsonb_agg(
      CASE
        WHEN sec->>'title' = 'BOCZEK'
        THEN sec || jsonb_build_object('style', 'cut_with_header')
        ELSE sec
      END
    )
    FROM jsonb_array_elements(sections) AS sec
  )
  WHERE product_type = 'fotel' AND series_id = s1_id;

  RAISE NOTICE 'S1 fotel BOCZEK style → cut_with_header';
END $$;

COMMIT;
