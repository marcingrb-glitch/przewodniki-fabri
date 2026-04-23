-- Fotel S1 — BOCZEK dostaje pola jak na etykiecie sofy (side.code + side.name + side.frame_fotel).
-- side.frame_fotel = side.frame z suffix "-FT" (np. "Vamos / Iga-FT").

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
        THEN sec || jsonb_build_object(
          'display_fields', jsonb_build_array(
            jsonb_build_array('side.code', 'side.name'),
            jsonb_build_array('side.frame_fotel')
          )
        )
        ELSE sec
      END
    )
    FROM jsonb_array_elements(sections) AS sec
  )
  WHERE product_type = 'fotel' AND series_id = s1_id;

  RAISE NOTICE 'S1 fotel BOCZEK fields → side.code/name + side.frame_fotel';
END $$;

COMMIT;
