INSERT INTO workstations (code, name, sort_order)
VALUES ('boczki', 'Boczki', 5);

INSERT INTO cheatsheet_sections (workstation_id, section_name, renderer_type, sort_order, active, columns, data_source)
SELECT id, 'Boczki', 'sides_full', 1, true, '[]'::jsonb, 'sides'
FROM workstations WHERE code = 'boczki';