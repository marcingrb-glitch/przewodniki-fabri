-- S2: ujednolicamy stelaż dla wszystkich siedzisk.
-- width null (= 190 backward compat) -> "S2-SD-190"
-- width 200                          -> "S2-SD-200"

DO $$
DECLARE
  s2_id uuid;
  updated_count int;
BEGIN
  SELECT id INTO s2_id FROM public.products WHERE code = 'S2' AND category = 'series';

  UPDATE public.products
  SET properties = jsonb_set(
    COALESCE(properties, '{}'::jsonb),
    '{frame}',
    to_jsonb(
      CASE
        WHEN (properties->>'width')::int = 200 THEN 'S2-SD-200'
        ELSE 'S2-SD-190'
      END
    )
  )
  WHERE series_id = s2_id AND category = 'seat';

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'S2: ujednolicony frame dla % siedzisk (S2-SD-190 / S2-SD-200)', updated_count;
END $$;
