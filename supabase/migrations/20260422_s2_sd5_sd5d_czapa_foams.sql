-- S2 SD5 + SD5D: pianki z czapą (wg specki produkcji 25.03.2026).
-- SD5 (Całe)    = czapa pojedyncza (1× pełna dlugość)
-- SD5D (Dzielone) = czapa podwójna  (2× połowki)
-- 200 cm = +10 cm do 'length' (czapa podwojna +5 cm na polowke).
-- Usuwamy copies_from na SD5D (jesli zostal z poprzednich eksperymentow).

DO $$
DECLARE
  s2_id uuid;
  seat RECORD;
  is_d boolean;
  is_200 boolean;
  len_offset int;
  czapa_len numeric;
  czapa_qty int;
BEGIN
  SELECT id INTO s2_id FROM public.products WHERE code = 'S2' AND category = 'series';

  FOR seat IN
    SELECT id, code, properties, COALESCE((properties->>'width')::int, 190) AS width
    FROM public.products
    WHERE series_id = s2_id AND category = 'seat' AND code IN ('SD5', 'SD5D')
  LOOP
    is_d   := (seat.code = 'SD5D');
    is_200 := (seat.width = 200);
    len_offset := CASE WHEN is_200 THEN 10 ELSE 0 END;

    -- czapa: pojedyncza 187+offset / podwojna (187+offset)/2 quantity 2
    IF is_d THEN
      czapa_qty := 2;
      czapa_len := (187 + len_offset) / 2.0;
    ELSE
      czapa_qty := 1;
      czapa_len := 187 + len_offset;
    END IF;

    -- Zdejmij copies_from (SD5D)
    UPDATE public.products
    SET properties = seat.properties - 'copies_from',
        updated_at = now()
    WHERE id = seat.id;

    -- Wywal wszystkie istniejace pianki
    DELETE FROM public.product_specs
    WHERE product_id = seat.id AND spec_type = 'foam';

    -- Insert 3 pianki
    INSERT INTO public.product_specs
      (product_id, spec_type, position_number, name, material, height, width, length, quantity, foam_section)
    VALUES
      (seat.id, 'foam', 1, 'Siedzisko',         'T-35-38', 6, 80, 191 + len_offset, 1,          'seat'),
      (seat.id, 'foam', 2, 'Siedzisko',         'T-35-38', 3, 84, 192 + len_offset, 1,          'seat'),
      (seat.id, 'foam', 3, 'Siedzisko Czapa 3D','T-35-38', 2, 79, czapa_len,        czapa_qty, 'seat');

    RAISE NOTICE 'SET % (% cm): 3 pianki, czapa %x%',
      seat.code, seat.width, czapa_qty, czapa_len;
  END LOOP;
END $$;
