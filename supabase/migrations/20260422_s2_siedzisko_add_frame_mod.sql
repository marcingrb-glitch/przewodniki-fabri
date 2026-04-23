-- S2 SIEDZISKO: pod seat.frame dodaj wiersz z seat.frameModification.
-- Pusty frameModification (wiekszosc siedzisk) zostanie pominiety na etykiecie.

DO $$
DECLARE
  s2_id uuid;
  sec jsonb;
  fields jsonb;
  new_fields jsonb;
BEGIN
  SELECT id INTO s2_id FROM public.products WHERE code = 'S2' AND category = 'series';

  SELECT sections INTO sec
  FROM public.label_templates_v2
  WHERE series_id = s2_id AND product_type = 'sofa' AND sheet_name = 'SIEDZISKO';

  fields := sec->0->'display_fields';

  -- Indeks wiersza z seat.frame (1-based)
  -- Wstaw ["seat.frameModification"] bezposrednio po nim.
  new_fields := '[]'::jsonb;
  FOR i IN 0..jsonb_array_length(fields) - 1 LOOP
    new_fields := new_fields || jsonb_build_array(fields->i);
    IF fields->i = '["seat.frame"]'::jsonb THEN
      new_fields := new_fields || '[["seat.frameModification"]]'::jsonb;
    END IF;
  END LOOP;

  UPDATE public.label_templates_v2
  SET sections = jsonb_set(sec, '{0,display_fields}', new_fields)
  WHERE series_id = s2_id AND product_type = 'sofa' AND sheet_name = 'SIEDZISKO';

  RAISE NOTICE 'S2 SIEDZISKO: dodany wiersz seat.frameModification pod seat.frame';
END $$;
