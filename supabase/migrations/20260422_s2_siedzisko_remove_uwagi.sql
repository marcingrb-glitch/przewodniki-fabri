-- S2 SIEDZISKO: wywal sekcje UWAGI (na dole).
-- Powod: modyfikacja stelaza jest juz jako osobny wiersz w sekcji SIEDZISKO,
-- wiec UWAGI z listwa.label sa niepotrzebne.

DO $$
DECLARE
  s2_id uuid;
  sec jsonb;
  new_sec jsonb;
BEGIN
  SELECT id INTO s2_id FROM public.products WHERE code = 'S2' AND category = 'series';

  SELECT sections INTO sec
  FROM public.label_templates_v2
  WHERE series_id = s2_id AND product_type = 'sofa' AND sheet_name = 'SIEDZISKO';

  -- Zostaw tylko sekcje ktorych title nie jest "UWAGI"
  new_sec := (
    SELECT jsonb_agg(s)
    FROM jsonb_array_elements(sec) s
    WHERE s->>'title' <> 'UWAGI'
  );

  UPDATE public.label_templates_v2
  SET sections = new_sec
  WHERE series_id = s2_id AND product_type = 'sofa' AND sheet_name = 'SIEDZISKO';

  RAISE NOTICE 'S2 SIEDZISKO: sekcja UWAGI usunieta';
END $$;
