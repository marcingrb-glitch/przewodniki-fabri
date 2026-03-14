-- =============================================================================
-- ETAP 1.1 — Nowe tabele + seed data
-- Migracja: Kobik DB Refactor (Lovable → Moldo Bridge)
-- Data: 2026-03-14
--
-- Tworzy nowy schemat OBOK istniejącego. Żadna istniejąca tabela nie jest
-- modyfikowana ani usuwana. Appka działa dalej na starych tabelach.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. product_types — typy produktów
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sku_prefix TEXT,
  is_standalone BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed: 4 typy produktów
INSERT INTO product_types (code, name, sku_prefix, is_standalone) VALUES
  ('sofa',      'Sofa',      'S', true),
  ('naroznik',  'Narożnik',  'N', true),
  ('pufa',      'Pufa',      NULL, false),
  ('fotel',     'Fotel',     NULL, false);

-- ---------------------------------------------------------------------------
-- 2. products — wszystkie produkty i komponenty (jedna tabela)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  series_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_type_id UUID REFERENCES product_types(id) ON DELETE SET NULL,

  -- Universal properties (JSONB per category)
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Finish/variant controls
  allowed_finishes TEXT[],
  default_finish TEXT,

  -- Colors/variants
  colors JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Scope flags
  is_global BOOLEAN NOT NULL DEFAULT false,

  -- Metadata
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint: code + category + series_id (NULLs for globals)
ALTER TABLE products
  ADD CONSTRAINT uq_products_code_cat_series UNIQUE (code, category, series_id);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_series ON products(series_id) WHERE series_id IS NOT NULL;
CREATE INDEX idx_products_global ON products(is_global) WHERE is_global = true;
CREATE INDEX idx_products_type ON products(product_type_id) WHERE product_type_id IS NOT NULL;

-- Partial unique index for globals (series_id IS NULL)
CREATE UNIQUE INDEX uq_products_global_code_cat
  ON products(code, category)
  WHERE series_id IS NULL;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_products_updated_at();

-- ---------------------------------------------------------------------------
-- 3. product_specs — specyfikacje techniczne (pianki, wymiary, materiały)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  spec_type TEXT NOT NULL,
  position_number INT NOT NULL DEFAULT 1,
  name TEXT,
  material TEXT,
  height NUMERIC,
  width NUMERIC,
  length NUMERIC,
  quantity INT NOT NULL DEFAULT 1,
  notes TEXT,

  -- Optional link to specific variant (e.g. backrest model)
  variant_ref UUID REFERENCES products(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_specs_product ON product_specs(product_id);
CREATE INDEX idx_specs_type ON product_specs(spec_type);

CREATE TRIGGER trg_product_specs_updated_at
  BEFORE UPDATE ON product_specs
  FOR EACH ROW
  EXECUTE FUNCTION update_products_updated_at();

-- ---------------------------------------------------------------------------
-- 4. product_relations — powiązania między komponentami
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL,
  source_product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  target_product_id UUID REFERENCES products(id) ON DELETE CASCADE,

  properties JSONB NOT NULL DEFAULT '{}'::jsonb,

  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE product_relations
  ADD CONSTRAINT uq_relations_full
  UNIQUE (series_id, relation_type, source_product_id, target_product_id);

CREATE INDEX idx_relations_series ON product_relations(series_id);
CREATE INDEX idx_relations_type ON product_relations(relation_type);
CREATE INDEX idx_relations_source ON product_relations(source_product_id) WHERE source_product_id IS NOT NULL;
CREATE INDEX idx_relations_target ON product_relations(target_product_id) WHERE target_product_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 5. sku_segments — konfiguracja parsowania SKU (per product_type)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sku_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type_id UUID NOT NULL REFERENCES product_types(id) ON DELETE CASCADE,
  segment_name TEXT NOT NULL,
  position INT NOT NULL,
  prefix TEXT,
  regex_pattern TEXT NOT NULL,
  capture_groups JSONB NOT NULL,
  is_optional BOOLEAN NOT NULL DEFAULT false,
  category TEXT NOT NULL,
  has_finish_suffix BOOLEAN NOT NULL DEFAULT false,
  zero_padded BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sku_segments_type ON sku_segments(product_type_id, position);

-- Seed: SKU segments for SOFA
INSERT INTO sku_segments (product_type_id, segment_name, position, prefix, regex_pattern, capture_groups, is_optional, category, has_finish_suffix, zero_padded, notes)
VALUES
  (
    (SELECT id FROM product_types WHERE code = 'sofa'),
    'series', 0, NULL,
    '^(S\d+)',
    '{"code": 1}'::jsonb,
    false, 'series', false, true,
    'Seria sofy, np. S1, S2'
  ),
  (
    (SELECT id FROM product_types WHERE code = 'sofa'),
    'fabric', 1, 'T',
    '^T(\d+)([A-F])',
    '{"code": 1, "color": 2}'::jsonb,
    false, 'fabric', false, true,
    'Tkanina + kolor, np. T3D, T13C'
  ),
  (
    (SELECT id FROM product_types WHERE code = 'sofa'),
    'seat', 2, 'SD',
    '^SD(\d+(?:N[DB]?|W|D)?)([A-D])?',
    '{"code": 1, "finish": 2}'::jsonb,
    false, 'seat', true, true,
    'Siedzisko + opcjonalne wykończenie, np. SD01NA, SD2W'
  ),
  (
    (SELECT id FROM product_types WHERE code = 'sofa'),
    'side', 3, 'B',
    '^B(\d+[A-Za-z]?)([A-D])?',
    '{"code": 1, "finish": 2}'::jsonb,
    false, 'side', true, true,
    'Boczek + opcjonalne wykończenie, np. B8C, B5B'
  ),
  (
    (SELECT id FROM product_types WHERE code = 'sofa'),
    'backrest', 4, 'OP',
    '^OP(\d{2})([A-D])',
    '{"code": 1, "finish": 2}'::jsonb,
    false, 'backrest', true, true,
    'Oparcie + wykończenie, np. OP62A, OP68A'
  ),
  (
    (SELECT id FROM product_types WHERE code = 'sofa'),
    'chest', 5, 'SK',
    '^SK(\d{2})',
    '{"code": 1}'::jsonb,
    false, 'chest', false, true,
    'Skrzynia, np. SK15, SK23'
  ),
  (
    (SELECT id FROM product_types WHERE code = 'sofa'),
    'automat', 6, 'AT',
    '^AT([12])',
    '{"code": 1}'::jsonb,
    false, 'automat', false, false,
    'Automat, np. AT1, AT2'
  ),
  (
    (SELECT id FROM product_types WHERE code = 'sofa'),
    'leg', 7, 'N',
    '^N(\d+)([A-F])?',
    '{"code": 1, "color": 2}'::jsonb,
    false, 'leg', false, false,
    'Nóżka + opcjonalny kolor, np. N5A, N1B'
  ),
  (
    (SELECT id FROM product_types WHERE code = 'sofa'),
    'pillow', 8, 'P',
    '^P(\d+)([A-D])?',
    '{"code": 1, "finish": 2}'::jsonb,
    true, 'pillow', true, false,
    'Poduszka (opcjonalna), np. P1, P1A'
  ),
  (
    (SELECT id FROM product_types WHERE code = 'sofa'),
    'jasiek', 9, 'J',
    '^J(\d+)([A-D])?',
    '{"code": 1, "finish": 2}'::jsonb,
    true, 'jasiek', true, false,
    'Jasiek (opcjonalny), np. J1'
  ),
  (
    (SELECT id FROM product_types WHERE code = 'sofa'),
    'walek', 10, 'W',
    '^W(\d+)([A-D])?',
    '{"code": 1, "finish": 2}'::jsonb,
    true, 'walek', true, false,
    'Wałek (opcjonalny), np. W1'
  ),
  (
    (SELECT id FROM product_types WHERE code = 'sofa'),
    'extra', 11, NULL,
    '^(PF|PFO|FT)',
    '{"code": 1}'::jsonb,
    true, 'extra', false, false,
    'Extra (opcjonalny): PF=pufa, PFO=pufa otwierana, FT=fotel'
  );

-- Seed: SKU segments for NAROŻNIK
INSERT INTO sku_segments (product_type_id, segment_name, position, prefix, regex_pattern, capture_groups, is_optional, category, has_finish_suffix, zero_padded, notes)
VALUES
  (
    (SELECT id FROM product_types WHERE code = 'naroznik'),
    'series', 0, NULL,
    '^(N\d+)',
    '{"code": 1}'::jsonb,
    false, 'series', false, true,
    'Seria narożnika, np. N2'
  ),
  (
    (SELECT id FROM product_types WHERE code = 'naroznik'),
    'width', 1, NULL,
    '^(\d{3})(L|P)',
    '{"width": 1, "orientation": 2}'::jsonb,
    false, 'dimension', false, false,
    'Szerokość + orientacja, np. 130P, 190L'
  ),
  (
    (SELECT id FROM product_types WHERE code = 'naroznik'),
    'fabric', 2, 'T',
    '^T(\d+)([A-F])',
    '{"code": 1, "color": 2}'::jsonb,
    false, 'fabric', false, true,
    'Tkanina + kolor'
  ),
  (
    (SELECT id FROM product_types WHERE code = 'naroznik'),
    'seat', 3, 'SD',
    '^SD(\d+[A-Za-z]*)([A-D])?',
    '{"code": 1, "finish": 2}'::jsonb,
    false, 'seat', true, true,
    'Siedzisko + wykończenie'
  ),
  (
    (SELECT id FROM product_types WHERE code = 'naroznik'),
    'side', 4, 'B',
    '^B(\d+[A-Za-z]?)([A-D])?',
    '{"code": 1, "finish": 2}'::jsonb,
    false, 'side', true, true,
    'Boczek + wykończenie'
  ),
  (
    (SELECT id FROM product_types WHERE code = 'naroznik'),
    'backrest', 5, 'OP',
    '^OP(\d{2})([A-D])',
    '{"code": 1, "finish": 2}'::jsonb,
    false, 'backrest', true, true,
    'Oparcie + wykończenie'
  ),
  (
    (SELECT id FROM product_types WHERE code = 'naroznik'),
    'chest', 6, 'SK',
    '^SK(\d{2})',
    '{"code": 1}'::jsonb,
    false, 'chest', false, true,
    'Skrzynia'
  ),
  (
    (SELECT id FROM product_types WHERE code = 'naroznik'),
    'automat', 7, 'AT',
    '^AT([12])',
    '{"code": 1}'::jsonb,
    false, 'automat', false, false,
    'Automat'
  ),
  (
    (SELECT id FROM product_types WHERE code = 'naroznik'),
    'pillow', 8, 'P',
    '^(P\d+)([A-D])?',
    '{"code": 1, "finish": 2}'::jsonb,
    true, 'pillow', true, false,
    'Poduszka (opcjonalna)'
  );

-- ---------------------------------------------------------------------------
-- 6. workstations — stanowiska produkcyjne
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workstations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed: 7 stanowisk
INSERT INTO workstations (code, name, icon, sort_order) VALUES
  ('magazyn',     'Magazyn stolarki i pianek', '📦', 1),
  ('piankarnia',  'Piankarnia',                '🧽', 2),
  ('stolarnia',   'Stolarnia',                 '🪵', 3),
  ('krojownia',   'Krojownia',                 '✂️',  4),
  ('tapicernia',  'Tapicernia',                '🪡', 5),
  ('pakowanie',   'Pakowanie',                 '📤', 6),
  ('nozki',       'Nóżki',                     '🦶', 7);

-- ---------------------------------------------------------------------------
-- 7. cheatsheet_sections — sekcje ściągawek (puste, config later)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cheatsheet_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workstation_id UUID NOT NULL REFERENCES workstations(id) ON DELETE CASCADE,
  product_type_id UUID REFERENCES product_types(id) ON DELETE SET NULL,
  section_name TEXT NOT NULL,
  data_source TEXT NOT NULL,
  columns JSONB NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INT NOT NULL DEFAULT 0,
  show_specs BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cheatsheet_workstation ON cheatsheet_sections(workstation_id);
CREATE INDEX idx_cheatsheet_type ON cheatsheet_sections(product_type_id) WHERE product_type_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 8. documents — dokumentacja 3D / PDF (rysunki Shapr3D)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  workstation_id UUID REFERENCES workstations(id) ON DELETE SET NULL,
  doc_type TEXT NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size_bytes INT,
  mime_type TEXT,
  version INT NOT NULL DEFAULT 1,
  notes TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_product ON documents(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX idx_documents_workstation ON documents(workstation_id) WHERE workstation_id IS NOT NULL;
CREATE INDEX idx_documents_type ON documents(doc_type);

-- ---------------------------------------------------------------------------
-- 9. Storage bucket: product-docs
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-docs',
  'product-docs',
  false,
  52428800,
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'model/step', 'model/stl']
)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 10. RLS Policies
-- ---------------------------------------------------------------------------

ALTER TABLE product_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sku_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE workstations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cheatsheet_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  );
END;
$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- product_types
CREATE POLICY "product_types: authenticated read"
  ON product_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "product_types: admin write"
  ON product_types FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- products
CREATE POLICY "products: authenticated read"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "products: admin insert"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "products: admin update"
  ON products FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "products: admin delete"
  ON products FOR DELETE
  TO authenticated
  USING (is_admin());

-- product_specs
CREATE POLICY "product_specs: authenticated read"
  ON product_specs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "product_specs: admin insert"
  ON product_specs FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "product_specs: admin update"
  ON product_specs FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "product_specs: admin delete"
  ON product_specs FOR DELETE
  TO authenticated
  USING (is_admin());

-- product_relations
CREATE POLICY "product_relations: authenticated read"
  ON product_relations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "product_relations: admin insert"
  ON product_relations FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "product_relations: admin update"
  ON product_relations FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "product_relations: admin delete"
  ON product_relations FOR DELETE
  TO authenticated
  USING (is_admin());

-- sku_segments
CREATE POLICY "sku_segments: authenticated read"
  ON sku_segments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "sku_segments: admin write"
  ON sku_segments FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- workstations
CREATE POLICY "workstations: authenticated read"
  ON workstations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "workstations: admin write"
  ON workstations FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- cheatsheet_sections
CREATE POLICY "cheatsheet_sections: authenticated read"
  ON cheatsheet_sections FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "cheatsheet_sections: admin write"
  ON cheatsheet_sections FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- documents
CREATE POLICY "documents: authenticated read"
  ON documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "documents: admin insert"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "documents: admin update"
  ON documents FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "documents: admin delete"
  ON documents FOR DELETE
  TO authenticated
  USING (is_admin());

-- Storage: product-docs bucket
CREATE POLICY "product-docs: authenticated read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'product-docs');

CREATE POLICY "product-docs: admin upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-docs' AND is_admin());

CREATE POLICY "product-docs: admin update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-docs' AND is_admin())
  WITH CHECK (bucket_id = 'product-docs' AND is_admin());

CREATE POLICY "product-docs: admin delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-docs' AND is_admin());
