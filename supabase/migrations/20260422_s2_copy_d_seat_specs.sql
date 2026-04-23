-- S2: skopiuj product_specs z SD{n} do SD{n}D (match po width).
-- Dotyczy tylko produktow D-wariantow ktore nie maja jeszcze zadnych specs.
-- Rule: D = identyczne pianki jak bez D.

DO $$
DECLARE
  s2_id uuid;
  d_seat RECORD;
  source_id uuid;
  base_code text;
  copied_rows int;
BEGIN
  SELECT id INTO s2_id FROM public.products WHERE code = 'S2' AND category = 'series';

  FOR d_seat IN
    SELECT p.id, p.code, COALESCE((p.properties->>'width')::int, 190) AS width
    FROM public.products p
    WHERE p.series_id = s2_id
      AND p.category = 'seat'
      AND p.code LIKE 'SD%D'
      AND NOT EXISTS (
        SELECT 1 FROM public.product_specs ps WHERE ps.product_id = p.id
      )
  LOOP
    -- "SD2D" -> "SD2"
    base_code := substring(d_seat.code FROM 1 FOR length(d_seat.code) - 1);

    SELECT p.id INTO source_id
    FROM public.products p
    WHERE p.series_id = s2_id
      AND p.category = 'seat'
      AND p.code = base_code
      AND COALESCE((p.properties->>'width')::int, 190) = d_seat.width
    LIMIT 1;

    IF source_id IS NULL THEN
      RAISE NOTICE 'SKIP % (% cm): brak zrodla %', d_seat.code, d_seat.width, base_code;
      CONTINUE;
    END IF;

    INSERT INTO public.product_specs (
      product_id, spec_type, position_number, name, material,
      height, width, length, quantity, notes, variant_ref,
      foam_role, foam_section
    )
    SELECT
      d_seat.id, spec_type, position_number, name, material,
      height, width, length, quantity, notes, variant_ref,
      foam_role, foam_section
    FROM public.product_specs
    WHERE product_id = source_id;

    GET DIAGNOSTICS copied_rows = ROW_COUNT;
    RAISE NOTICE 'COPY %->% (% cm): % pianek', base_code, d_seat.code, d_seat.width, copied_rows;
  END LOOP;
END $$;
