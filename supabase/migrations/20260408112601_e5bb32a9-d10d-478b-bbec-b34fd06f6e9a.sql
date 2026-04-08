ALTER TABLE product_specs
ADD COLUMN IF NOT EXISTS foam_section text NOT NULL DEFAULT 'seat';

UPDATE product_specs
SET foam_section = 'backrest'
WHERE spec_type = 'foam' AND position_number >= 10;

WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY product_id
    ORDER BY position_number
  ) AS new_pos
  FROM product_specs
  WHERE spec_type = 'foam' AND foam_section = 'backrest'
)
UPDATE product_specs
SET position_number = numbered.new_pos
FROM numbered
WHERE product_specs.id = numbered.id;