-- Create 130cm chest variants
-- Existing 190cm chests (SK15, SK17, SK23) stay as-is (no width property = default/190)
-- New 130cm variants get explicit width property for decoder matching
INSERT INTO products (code, name, category, properties, is_global, sort_order)
VALUES
  ('SK15', 'SK15 - 130', 'chest',
   jsonb_build_object('leg_height_cm', 10, 'leg_count', 4, 'width', 130),
   true, 4),
  ('SK17', 'SK17 - 130', 'chest',
   jsonb_build_object('leg_height_cm', 8, 'leg_count', 4, 'width', 130),
   true, 5),
  ('SK23', 'SK23 - 130', 'chest',
   jsonb_build_object('leg_height_cm', 2.5, 'leg_count', 4, 'override_leg', 'N4', 'width', 130),
   true, 6);
