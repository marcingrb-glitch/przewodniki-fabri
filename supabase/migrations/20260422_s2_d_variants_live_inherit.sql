-- S2: przelacz D-warianty siedzisk na live-inheritance.
-- Rule: SD{n}D dziedziczy pianki z SD{n} dynamicznie (decoder resolvuje copies_from).
-- 1. Ustaw properties.copies_from = base code
-- 2. Usun wlasne pianki z D (zeby nie bylo confusing duplikatu)

DO $$
DECLARE
  s2_id uuid;
  d_seat RECORD;
  base_code text;
BEGIN
  SELECT id INTO s2_id FROM public.products WHERE code = 'S2' AND category = 'series';

  FOR d_seat IN
    SELECT id, code, properties
    FROM public.products
    WHERE series_id = s2_id
      AND category = 'seat'
      AND code LIKE 'SD%D'
  LOOP
    base_code := substring(d_seat.code FROM 1 FOR length(d_seat.code) - 1);

    UPDATE public.products
    SET properties = jsonb_set(
      COALESCE(d_seat.properties, '{}'::jsonb),
      '{copies_from}',
      to_jsonb(base_code)
    ),
    updated_at = now()
    WHERE id = d_seat.id;

    DELETE FROM public.product_specs
    WHERE product_id = d_seat.id
      AND spec_type = 'foam';

    RAISE NOTICE 'SET %.copies_from = %, wywalone wlasne pianki', d_seat.code, base_code;
  END LOOP;
END $$;
