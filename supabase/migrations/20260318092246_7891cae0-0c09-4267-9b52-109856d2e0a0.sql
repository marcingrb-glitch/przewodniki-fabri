
-- Etap 3 Krok C — DROP starych tabel (22 tabel)
-- Kolejność: najpierw tabele z FK do innych, potem reszta. CASCADE usuwa constrainty i policies.

-- Tabele z FK do innych starych tabel
DROP TABLE IF EXISTS public.product_foams CASCADE;
DROP TABLE IF EXISTS public.sewing_variants CASCADE;
DROP TABLE IF EXISTS public.series_automats CASCADE;
DROP TABLE IF EXISTS public.seat_side_compatibility CASCADE;
DROP TABLE IF EXISTS public.seat_pillow_mapping CASCADE;
DROP TABLE IF EXISTS public.side_exceptions CASCADE;
DROP TABLE IF EXISTS public.series_config CASCADE;
DROP TABLE IF EXISTS public.sku_parse_rules CASCADE;

-- Tabele komponentów (per seria)
DROP TABLE IF EXISTS public.seats_sofa CASCADE;
DROP TABLE IF EXISTS public.seats_pufa CASCADE;
DROP TABLE IF EXISTS public.backrests CASCADE;
DROP TABLE IF EXISTS public.sides CASCADE;
DROP TABLE IF EXISTS public.extras CASCADE;

-- Tabele globalne
DROP TABLE IF EXISTS public.chests CASCADE;
DROP TABLE IF EXISTS public.automats CASCADE;
DROP TABLE IF EXISTS public.legs CASCADE;
DROP TABLE IF EXISTS public.pillows CASCADE;
DROP TABLE IF EXISTS public.jaskis CASCADE;
DROP TABLE IF EXISTS public.waleks CASCADE;
DROP TABLE IF EXISTS public.fabrics CASCADE;
DROP TABLE IF EXISTS public.finishes CASCADE;

-- Tabele pomocnicze
DROP TABLE IF EXISTS public.seat_types CASCADE;

-- Seria — na końcu
DROP TABLE IF EXISTS public.series CASCADE;
