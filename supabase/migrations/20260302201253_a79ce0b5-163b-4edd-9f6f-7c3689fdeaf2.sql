
-- 1. Dodaj series_id
ALTER TABLE automats ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES series(id) ON DELETE CASCADE;

-- 2. Przypisz istniejące automaty do S1
UPDATE automats SET series_id = (SELECT id FROM series WHERE code = 'S1') WHERE series_id IS NULL;

-- 3. Usuń stary unique constraint na code PRZED insertem
ALTER TABLE automats DROP CONSTRAINT IF EXISTS automats_code_key;

-- 4. Dodaj automaty dla S2
INSERT INTO automats (code, name, type, has_seat_legs, seat_leg_height_cm, seat_leg_count, series_id)
VALUES 
  ('AT1', 'Zwykły', 'Automat zwykły', true, 2.5, 2, (SELECT id FROM series WHERE code = 'S2')),
  ('AT2', 'Wyrzutkowy', 'Automat z nóżką', true, 2.5, 2, (SELECT id FROM series WHERE code = 'S2'));

-- 5. Upewnij się że S1 AT1 ma poprawne wartości
UPDATE automats SET seat_leg_height_cm = 16, seat_leg_count = 2 
WHERE code = 'AT1' AND series_id = (SELECT id FROM series WHERE code = 'S1');

-- 6. S1 AT2 — brak nóżek
UPDATE automats SET seat_leg_height_cm = 0, seat_leg_count = 0 
WHERE code = 'AT2' AND series_id = (SELECT id FROM series WHERE code = 'S1');

-- 7. Ustaw NOT NULL
ALTER TABLE automats ALTER COLUMN series_id SET NOT NULL;

-- 8. Dodaj nowy unique constraint
ALTER TABLE automats ADD CONSTRAINT automats_code_series_unique UNIQUE(code, series_id);

-- 9. Usuń kolumny seat_leg z series
ALTER TABLE series DROP COLUMN IF EXISTS seat_leg_default;
ALTER TABLE series DROP COLUMN IF EXISTS seat_leg_height_cm;
ALTER TABLE series DROP COLUMN IF EXISTS seat_leg_count;
