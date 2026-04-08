-- Set frame_modification on SD01N for admin panel visibility
-- Decoder conditionally shows this only for B9B combinations
UPDATE products
SET properties = jsonb_set(
  COALESCE(properties, '{}'::jsonb),
  '{frame_modification}',
  '"Listwa Vienna przykręcana (tylko z B9B)"'
)
WHERE code = 'SD01N' AND category = 'seat';
