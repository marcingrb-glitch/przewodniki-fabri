-- ============================================================================
-- Fix: poprzednia migracja zamieniała "190"→"200" tylko w properties.frame.
-- Inne pola stringowe (front, top itp.) zachowały wymiar "190" w tekście.
-- Tu zamieniamy WSZYSTKIE wystąpienia "190" → "200" w properties
-- dla nowo utworzonych wariantów 200cm (siedziska i oparcia S1/S2).
--
-- Bezpieczne: liczbowa wartość properties.width = 200 (int) nie jest
-- zapisana jako "190" w jsonb::text (JSON liczbowy bez cudzysłowów),
-- więc nie zostanie złapana przez replace na stringu.
-- ============================================================================

BEGIN;

UPDATE products
SET properties = replace(properties::text, '190', '200')::jsonb
WHERE (properties->>'width') = '200'
  AND category IN ('seat', 'backrest')
  AND properties::text LIKE '%190%';

COMMIT;
