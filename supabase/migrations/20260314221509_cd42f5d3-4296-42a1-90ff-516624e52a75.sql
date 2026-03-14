-- Drop the unique constraint that prevents multiple backrest variants with same code per series
-- This is needed because backrests like OP68 can have multiple production variants 
-- distinguished by model_name (e.g. Modena/Sienna/Porto vs Barga/Ravenna)
ALTER TABLE products DROP CONSTRAINT uq_products_code_cat_series;

-- Re-create a softer unique index that allows duplicates for backrests with different model_names
-- For non-backrest categories, keep uniqueness via application logic

-- Add the two missing OP68 S2 variants
INSERT INTO products (code, name, category, series_id, properties, allowed_finishes, default_finish, is_global)
VALUES (
  'OP68',
  'OP68 (68cm) — Modena/Sienna/Porto',
  'backrest',
  'a20f51be-e14e-41ed-90f7-4297d77dde9d',
  '{"height_cm": "68", "frame": "OP68 [Rama na płasko]", "top": "", "spring_type": "B", "model_name": "Modena, Sienna, Porto"}'::jsonb,
  ARRAY['A','B','C'],
  NULL,
  false
);

INSERT INTO products (code, name, category, series_id, properties, allowed_finishes, default_finish, is_global)
VALUES (
  'OP68',
  'OP68 (68cm) — Barga/Ravenna',
  'backrest',
  'a20f51be-e14e-41ed-90f7-4297d77dde9d',
  '{"height_cm": "68", "frame": "OP68 [Rama na płasko]", "top": "", "spring_type": "54A", "model_name": "Barga, Ravenna"}'::jsonb,
  ARRAY['A','B','C'],
  NULL,
  false
);

-- Fix old backrests table for consistency
UPDATE backrests 
SET model_name = 'Modena, Sienna, Porto'
WHERE code = 'OP68' AND model_name LIKE '%Modena%' AND model_name LIKE '%Ravenna%';

UPDATE backrests 
SET model_name = 'Barga, Ravenna'
WHERE code = 'OP68' AND model_name = 'Barga';