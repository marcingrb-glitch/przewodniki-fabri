
-- ETAP 1.1 część 2: RLS + seed SKU segments + storage

-- RLS
ALTER TABLE product_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sku_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE workstations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cheatsheet_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path TO 'public';

-- product_types policies
CREATE POLICY "product_types: authenticated read"
  ON product_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "product_types: admin write"
  ON product_types FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- products policies
CREATE POLICY "products: authenticated read"
  ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "products: admin insert"
  ON products FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "products: admin update"
  ON products FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "products: admin delete"
  ON products FOR DELETE TO authenticated USING (is_admin());

-- product_specs policies
CREATE POLICY "product_specs: authenticated read"
  ON product_specs FOR SELECT TO authenticated USING (true);
CREATE POLICY "product_specs: admin insert"
  ON product_specs FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "product_specs: admin update"
  ON product_specs FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "product_specs: admin delete"
  ON product_specs FOR DELETE TO authenticated USING (is_admin());

-- product_relations policies
CREATE POLICY "product_relations: authenticated read"
  ON product_relations FOR SELECT TO authenticated USING (true);
CREATE POLICY "product_relations: admin insert"
  ON product_relations FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "product_relations: admin update"
  ON product_relations FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "product_relations: admin delete"
  ON product_relations FOR DELETE TO authenticated USING (is_admin());

-- sku_segments policies
CREATE POLICY "sku_segments: authenticated read"
  ON sku_segments FOR SELECT TO authenticated USING (true);
CREATE POLICY "sku_segments: admin write"
  ON sku_segments FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- workstations policies
CREATE POLICY "workstations: authenticated read"
  ON workstations FOR SELECT TO authenticated USING (true);
CREATE POLICY "workstations: admin write"
  ON workstations FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- cheatsheet_sections policies
CREATE POLICY "cheatsheet_sections: authenticated read"
  ON cheatsheet_sections FOR SELECT TO authenticated USING (true);
CREATE POLICY "cheatsheet_sections: admin write"
  ON cheatsheet_sections FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- documents policies
CREATE POLICY "documents: authenticated read"
  ON documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "documents: admin insert"
  ON documents FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "documents: admin update"
  ON documents FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "documents: admin delete"
  ON documents FOR DELETE TO authenticated USING (is_admin());

-- Storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-docs', 'product-docs', false, 52428800,
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'model/step', 'model/stl']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "product-docs: authenticated read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'product-docs');
CREATE POLICY "product-docs: admin upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-docs' AND is_admin());
CREATE POLICY "product-docs: admin update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-docs' AND is_admin())
  WITH CHECK (bucket_id = 'product-docs' AND is_admin());
CREATE POLICY "product-docs: admin delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-docs' AND is_admin());

-- Seed: SKU segments for SOFA
INSERT INTO sku_segments (product_type_id, segment_name, position, prefix, regex_pattern, capture_groups, is_optional, category, has_finish_suffix, zero_padded, notes) VALUES
  ((SELECT id FROM product_types WHERE code = 'sofa'), 'series', 0, NULL, '^(S\d+)', '{"code": 1}'::jsonb, false, 'series', false, true, 'Seria sofy'),
  ((SELECT id FROM product_types WHERE code = 'sofa'), 'fabric', 1, 'T', '^T(\d+)([A-F])', '{"code": 1, "color": 2}'::jsonb, false, 'fabric', false, true, 'Tkanina + kolor'),
  ((SELECT id FROM product_types WHERE code = 'sofa'), 'seat', 2, 'SD', '^SD(\d+(?:N[DB]?|W|D)?)([A-D])?', '{"code": 1, "finish": 2}'::jsonb, false, 'seat', true, true, 'Siedzisko'),
  ((SELECT id FROM product_types WHERE code = 'sofa'), 'side', 3, 'B', '^B(\d+[A-Za-z]?)([A-D])?', '{"code": 1, "finish": 2}'::jsonb, false, 'side', true, true, 'Boczek'),
  ((SELECT id FROM product_types WHERE code = 'sofa'), 'backrest', 4, 'OP', '^OP(\d{2})([A-D])', '{"code": 1, "finish": 2}'::jsonb, false, 'backrest', true, true, 'Oparcie'),
  ((SELECT id FROM product_types WHERE code = 'sofa'), 'chest', 5, 'SK', '^SK(\d{2})', '{"code": 1}'::jsonb, false, 'chest', false, true, 'Skrzynia'),
  ((SELECT id FROM product_types WHERE code = 'sofa'), 'automat', 6, 'AT', '^AT([12])', '{"code": 1}'::jsonb, false, 'automat', false, false, 'Automat'),
  ((SELECT id FROM product_types WHERE code = 'sofa'), 'leg', 7, 'N', '^N(\d+)([A-F])?', '{"code": 1, "color": 2}'::jsonb, false, 'leg', false, false, 'Nóżka'),
  ((SELECT id FROM product_types WHERE code = 'sofa'), 'pillow', 8, 'P', '^P(\d+)([A-D])?', '{"code": 1, "finish": 2}'::jsonb, true, 'pillow', true, false, 'Poduszka'),
  ((SELECT id FROM product_types WHERE code = 'sofa'), 'jasiek', 9, 'J', '^J(\d+)([A-D])?', '{"code": 1, "finish": 2}'::jsonb, true, 'jasiek', true, false, 'Jasiek'),
  ((SELECT id FROM product_types WHERE code = 'sofa'), 'walek', 10, 'W', '^W(\d+)([A-D])?', '{"code": 1, "finish": 2}'::jsonb, true, 'walek', true, false, 'Wałek'),
  ((SELECT id FROM product_types WHERE code = 'sofa'), 'extra', 11, NULL, '^(PF|PFO|FT)', '{"code": 1}'::jsonb, true, 'extra', false, false, 'Extra');

-- Seed: SKU segments for NAROŻNIK
INSERT INTO sku_segments (product_type_id, segment_name, position, prefix, regex_pattern, capture_groups, is_optional, category, has_finish_suffix, zero_padded, notes) VALUES
  ((SELECT id FROM product_types WHERE code = 'naroznik'), 'series', 0, NULL, '^(N\d+)', '{"code": 1}'::jsonb, false, 'series', false, true, 'Seria narożnika'),
  ((SELECT id FROM product_types WHERE code = 'naroznik'), 'width', 1, NULL, '^(\d{3})(L|P)', '{"width": 1, "orientation": 2}'::jsonb, false, 'dimension', false, false, 'Szerokość + orientacja'),
  ((SELECT id FROM product_types WHERE code = 'naroznik'), 'fabric', 2, 'T', '^T(\d+)([A-F])', '{"code": 1, "color": 2}'::jsonb, false, 'fabric', false, true, 'Tkanina + kolor'),
  ((SELECT id FROM product_types WHERE code = 'naroznik'), 'seat', 3, 'SD', '^SD(\d+[A-Za-z]*)([A-D])?', '{"code": 1, "finish": 2}'::jsonb, false, 'seat', true, true, 'Siedzisko'),
  ((SELECT id FROM product_types WHERE code = 'naroznik'), 'side', 4, 'B', '^B(\d+[A-Za-z]?)([A-D])?', '{"code": 1, "finish": 2}'::jsonb, false, 'side', true, true, 'Boczek'),
  ((SELECT id FROM product_types WHERE code = 'naroznik'), 'backrest', 5, 'OP', '^OP(\d{2})([A-D])', '{"code": 1, "finish": 2}'::jsonb, false, 'backrest', true, true, 'Oparcie'),
  ((SELECT id FROM product_types WHERE code = 'naroznik'), 'chest', 6, 'SK', '^SK(\d{2})', '{"code": 1}'::jsonb, false, 'chest', false, true, 'Skrzynia'),
  ((SELECT id FROM product_types WHERE code = 'naroznik'), 'automat', 7, 'AT', '^AT([12])', '{"code": 1}'::jsonb, false, 'automat', false, false, 'Automat'),
  ((SELECT id FROM product_types WHERE code = 'naroznik'), 'pillow', 8, 'P', '^(P\d+)([A-D])?', '{"code": 1, "finish": 2}'::jsonb, true, 'pillow', true, false, 'Poduszka');
