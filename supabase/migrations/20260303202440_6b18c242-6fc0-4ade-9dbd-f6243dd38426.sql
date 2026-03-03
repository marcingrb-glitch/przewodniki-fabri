
ALTER TABLE seats_sofa ADD COLUMN IF NOT EXISTS type_name TEXT;

UPDATE seats_sofa SET type_name = 'Niskie' WHERE type = 'N';
UPDATE seats_sofa SET type_name = 'Niskie dzielone' WHERE type = 'ND';
UPDATE seats_sofa SET type_name = 'Niskie oba półwałki' WHERE type = 'NB';
UPDATE seats_sofa SET type_name = 'Wysokie' WHERE type = 'W';
UPDATE seats_sofa SET type_name = 'Zwykły' WHERE type = 'D';
UPDATE seats_sofa SET type_name = 'Standardowe' WHERE type IS NULL OR type = '';
