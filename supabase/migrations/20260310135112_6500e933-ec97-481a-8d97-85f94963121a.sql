ALTER TABLE label_templates ALTER COLUMN display_fields DROP DEFAULT;
ALTER TABLE label_templates ALTER COLUMN display_fields TYPE jsonb USING to_jsonb(display_fields);
ALTER TABLE label_templates ALTER COLUMN display_fields SET DEFAULT '[]'::jsonb;