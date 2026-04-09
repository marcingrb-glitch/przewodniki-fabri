DROP INDEX IF EXISTS uq_products_global_code_cat;

CREATE UNIQUE INDEX uq_products_global_code_cat
  ON products(code, category, COALESCE(properties->>'width', ''))
  WHERE series_id IS NULL;