
-- ETAP 1.1 — Nowe tabele + seed data (część 1: tabele)

CREATE TABLE IF NOT EXISTS product_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sku_prefix TEXT,
  is_standalone BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO product_types (code, name, sku_prefix, is_standalone) VALUES
  ('sofa',      'Sofa',      'S', true),
  ('naroznik',  'Narożnik',  'N', true),
  ('pufa',      'Pufa',      NULL, false),
  ('fotel',     'Fotel',     NULL, false);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  series_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_type_id UUID REFERENCES product_types(id) ON DELETE SET NULL,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  allowed_finishes TEXT[],
  default_finish TEXT,
  colors JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_global BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE products
  ADD CONSTRAINT uq_products_code_cat_series UNIQUE (code, category, series_id);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_series ON products(series_id) WHERE series_id IS NOT NULL;
CREATE INDEX idx_products_global ON products(is_global) WHERE is_global = true;
CREATE INDEX idx_products_type ON products(product_type_id) WHERE product_type_id IS NOT NULL;

CREATE UNIQUE INDEX uq_products_global_code_cat
  ON products(code, category)
  WHERE series_id IS NULL;

CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_products_updated_at();

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

CREATE TABLE IF NOT EXISTS workstations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO workstations (code, name, icon, sort_order) VALUES
  ('magazyn',     'Magazyn stolarki i pianek', '📦', 1),
  ('piankarnia',  'Piankarnia',                '🧽', 2),
  ('stolarnia',   'Stolarnia',                 '🪵', 3),
  ('krojownia',   'Krojownia',                 '✂️',  4),
  ('tapicernia',  'Tapicernia',                '🪡', 5),
  ('pakowanie',   'Pakowanie',                 '📤', 6),
  ('nozki',       'Nóżki',                     '🦶', 7);

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
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_product ON documents(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX idx_documents_workstation ON documents(workstation_id) WHERE workstation_id IS NOT NULL;
CREATE INDEX idx_documents_type ON documents(doc_type);
