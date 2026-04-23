-- S2 SD5D: cofnij zmiany z live-inherit, SD5D ma miec wlasne pianki.
-- 1. Usun properties.copies_from z SD5D (oba widths)
-- 2. Przywroc pianki z SD5 (match po width) bo poprzednia migracja je skasowala

DO $$
DECLARE
  s2_id uuid;
  d_seat RECORD;
  source_id uuid;
  copied_rows int;
  props jsonb;
BEGIN
  SELECT id INTO s2_id FROM public.products WHERE code = 'S2' AND category = 'series';

  FOR d_seat IN
    SELECT p.id, p.properties, COALESCE((p.properties->>'width')::int, 190) AS width
    FROM public.products p
    WHERE p.series_id = s2_id AND p.category = 'seat' AND p.code = 'SD5D'
  LOOP
    props := d_seat.properties - 'copies_from';
    UPDATE public.products
    SET properties = props, updated_at = now()
    WHERE id = d_seat.id;

    SELECT p.id INTO source_id
    FROM public.products p
    WHERE p.series_id = s2_id
      AND p.category = 'seat'
      AND p.code = 'SD5'
      AND COALESCE((p.properties->>'width')::int, 190) = d_seat.width
    LIMIT 1;

    IF source_id IS NULL THEN
      RAISE NOTICE 'SKIP SD5D (% cm): brak SD5', d_seat.width;
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
    WHERE product_id = source_id AND spec_type = 'foam';

    GET DIAGNOSTICS copied_rows = ROW_COUNT;
    RAISE NOTICE 'RESTORE SD5D (% cm): % pianek z SD5', d_seat.width, copied_rows;
  END LOOP;
END $$;
