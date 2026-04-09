-- Allow multiple global products with same code+category when they differ by width
-- (needed for chest width variants: SK23-190 vs SK23-130)
-- Old constraint: UNIQUE(code, category) WHERE series_id IS NULL
-- New constraint: UNIQUE(code, category, COALESCE(properties->>'width', '')) WHERE series_id IS NULL

DROP INDEX IF EXISTS uq_products_global_code_cat;

CREATE UNIQUE INDEX uq_products_global_code_cat
  ON products(code, category, COALESCE(properties->>'width', ''))
  WHERE series_id IS NULL;
