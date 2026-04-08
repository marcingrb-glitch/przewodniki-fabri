INSERT INTO label_templates (product_type, label_name, component, display_fields, quantity, sort_order, is_conditional, condition_field, series_id, content_template)
VALUES (
  'sofa',
  'Siedzisko',
  'seat',
  '[["listwa.label"]]'::jsonb,
  1,
  99,
  true,
  'has_special_notes',
  (SELECT id FROM products WHERE code = 'S1' AND category = 'series'),
  ''
);