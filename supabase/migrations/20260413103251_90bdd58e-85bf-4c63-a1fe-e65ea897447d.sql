ALTER TABLE orders ADD COLUMN mimeeq_data jsonb DEFAULT NULL;

COMMENT ON COLUMN orders.mimeeq_data IS 'Full Mimeeq get-product-info response';