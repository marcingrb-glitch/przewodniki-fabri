UPDATE cheatsheet_sections
SET columns = REPLACE(columns::text, '"label":"Dozwolone"', '"label":"Dozwolone szwy"')::jsonb
WHERE workstation_id = (SELECT id FROM workstations WHERE code = 'krojownia')
  AND renderer_type = 'finishes_table';