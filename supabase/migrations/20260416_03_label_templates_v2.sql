-- =============================================================================
-- label_templates_v2: nowy system dużych etykiet 100×150mm z pełnym briefem
-- dla tapicera (pianki, stelaż, automat, śruby). Zostaje obok V1 — zero regresji.
--
-- Trzy tryby drukowania (obsługa po stronie generatora):
--   V1 — istniejące małe 100×30mm (label_templates, bez zmian)
--   V2 — duże 100×150mm z sekcjami (ta tabela)
--   V3 — hybrid: V2 (include_in_v3=true) + V1 fallback dla niepokrytych komponentów
--
-- Per-seria filtrowanie: series_id NULL = global, inaczej per konkretną serię
-- (S1 Sofa Mar, S2 Sofa Elma, N2 Narożnik Elma).
-- =============================================================================

CREATE TABLE public.label_templates_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type text NOT NULL,              -- "sofa" | "naroznik" | "pufa" | "fotel"
  series_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  sheet_name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_conditional boolean NOT NULL DEFAULT false,
  condition_field text,                    -- reuse checkDecodedCondition()
  header_template text,                    -- np. "{sheet_name} · {series.code}"
  show_meta_row boolean NOT NULL DEFAULT true,
  include_in_v3 boolean NOT NULL DEFAULT false,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  /*
    sections = [
      {
        title?: string,                    -- nagłówek sekcji (opcjonalny)
        component: string,                 -- reuse ComponentSelector options
        style: "plain" | "bullet_list" | "table" | "diagram_box",
        display_fields?: string[][],       -- dla plain/bullet/table (flat lines)
        fields?: {                         -- tylko dla diagram_box (pufa)
          top: string, bottom: string,
          left: string, right: string,
          center: string
        },
        box_size_mm?: number,              -- dla diagram_box, default 50
        condition_field?: string           -- warunek per sekcja (ukryj gdy puste)
      }, ...
    ]
  */
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX label_templates_v2_product_series_idx
  ON public.label_templates_v2 (product_type, series_id);

CREATE INDEX label_templates_v2_sort_idx
  ON public.label_templates_v2 (product_type, series_id, sort_order);

ALTER TABLE public.label_templates_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read label_templates_v2"
  ON public.label_templates_v2 FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can insert label_templates_v2"
  ON public.label_templates_v2 FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update label_templates_v2"
  ON public.label_templates_v2 FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete label_templates_v2"
  ON public.label_templates_v2 FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================================================
-- SEED: 11 szablonów zgodnie z planem (docs: .claude/plans/mossy-riding-bear.md)
-- =============================================================================

-- helper: series IDs (resolved by code from products where category='series')
-- S1, S2, N2 — using DO block for readability
DO $$
DECLARE
  s1_id uuid;
  s2_id uuid;
  n2_id uuid;
BEGIN
  SELECT id INTO s1_id FROM public.products WHERE code = 'S1' AND category = 'series';
  SELECT id INTO s2_id FROM public.products WHERE code = 'S2' AND category = 'series';
  SELECT id INTO n2_id FROM public.products WHERE code = 'N2' AND category = 'series';

  -- ---------- S1 Sofa Mar (2 szablony) ----------
  INSERT INTO public.label_templates_v2
    (product_type, series_id, sheet_name, sort_order, header_template, show_meta_row, include_in_v3, sections)
  VALUES
    ('sofa', s1_id, 'SIEDZISKO', 1, '{sheet_name}        {series.code} · {series.name}', true, true,
     jsonb_build_array(
       jsonb_build_object(
         'title', 'SIEDZISKO',
         'component', 'seat',
         'style', 'plain',
         'display_fields', jsonb_build_array(
           jsonb_build_array('seat.code', 'seat.type'),
           jsonb_build_array('seat.frame'),
           jsonb_build_array('seat.front'),
           jsonb_build_array('seat.midStrip_yn'),
           jsonb_build_array('seat.springType')
         )
       ),
       jsonb_build_object(
         'title', 'PIANKI SIEDZISKA',
         'component', 'seat',
         'style', 'bullet_list',
         'display_fields', jsonb_build_array(jsonb_build_array('seat.foamsList'))
       ),
       jsonb_build_object(
         'title', 'AUTOMAT',
         'component', 'automat',
         'style', 'plain',
         'display_fields', jsonb_build_array(
           jsonb_build_array('automat.code_name'),
           jsonb_build_array('automat.lockBolts')
         )
       ),
       jsonb_build_object(
         'title', 'UWAGI',
         'component', 'seat',
         'style', 'plain',
         'display_fields', jsonb_build_array(jsonb_build_array('listwa.label')),
         'condition_field', 'has_special_notes'
       )
     )
    ),
    ('sofa', s1_id, 'OPARCIE', 2, '{sheet_name}        {series.code} · {series.name}', true, true,
     jsonb_build_array(
       jsonb_build_object(
         'title', 'OPARCIE',
         'component', 'backrest',
         'style', 'plain',
         'display_fields', jsonb_build_array(
           jsonb_build_array('backrest.code', 'backrest.height'),
           jsonb_build_array('backrest.frame'),
           jsonb_build_array('backrest.springType'),
           jsonb_build_array('backrest.top')
         )
       ),
       jsonb_build_object(
         'title', 'PIANKI OPARCIA',
         'component', 'backrest',
         'style', 'bullet_list',
         'display_fields', jsonb_build_array(jsonb_build_array('backrest.foamsList'))
       )
     )
    );

  -- ---------- S2 Sofa Elma (2 szablony — bez seat.front, jak w planie) ----------
  INSERT INTO public.label_templates_v2
    (product_type, series_id, sheet_name, sort_order, header_template, show_meta_row, include_in_v3, sections)
  VALUES
    ('sofa', s2_id, 'SIEDZISKO', 1, '{sheet_name}        {series.code} · {series.name}', true, true,
     jsonb_build_array(
       jsonb_build_object(
         'title', 'SIEDZISKO',
         'component', 'seat',
         'style', 'plain',
         'display_fields', jsonb_build_array(
           jsonb_build_array('seat.code', 'seat.type'),
           jsonb_build_array('seat.frame'),
           jsonb_build_array('seat.midStrip_yn'),
           jsonb_build_array('seat.springType')
         )
       ),
       jsonb_build_object(
         'title', 'PIANKI SIEDZISKA',
         'component', 'seat',
         'style', 'bullet_list',
         'display_fields', jsonb_build_array(jsonb_build_array('seat.foamsList'))
       ),
       jsonb_build_object(
         'title', 'AUTOMAT',
         'component', 'automat',
         'style', 'plain',
         'display_fields', jsonb_build_array(
           jsonb_build_array('automat.code_name'),
           jsonb_build_array('automat.lockBolts')
         )
       ),
       jsonb_build_object(
         'title', 'UWAGI',
         'component', 'seat',
         'style', 'plain',
         'display_fields', jsonb_build_array(jsonb_build_array('listwa.label')),
         'condition_field', 'has_special_notes'
       )
     )
    ),
    ('sofa', s2_id, 'OPARCIE', 2, '{sheet_name}        {series.code} · {series.name}', true, true,
     jsonb_build_array(
       jsonb_build_object(
         'title', 'OPARCIE',
         'component', 'backrest',
         'style', 'plain',
         'display_fields', jsonb_build_array(
           jsonb_build_array('backrest.code', 'backrest.height'),
           jsonb_build_array('backrest.frame'),
           jsonb_build_array('backrest.springType')
         )
       ),
       jsonb_build_object(
         'title', 'PIANKI OPARCIA',
         'component', 'backrest',
         'style', 'bullet_list',
         'display_fields', jsonb_build_array(jsonb_build_array('backrest.foamsList'))
       )
     )
    );

  -- ---------- N2 Narożnik (4 szablony: 2 siedziska + 2 oparcia) ----------
  INSERT INTO public.label_templates_v2
    (product_type, series_id, sheet_name, sort_order, header_template, show_meta_row, include_in_v3, sections)
  VALUES
    ('naroznik', n2_id, 'SIEDZISKO sofy', 1, '{sheet_name}  {series.code}·{series.name} ({orientation})', true, true,
     jsonb_build_array(
       jsonb_build_object(
         'title', 'SIEDZISKO',
         'component', 'seat',
         'style', 'plain',
         'display_fields', jsonb_build_array(
           jsonb_build_array('seat.code', 'seat.type'),
           jsonb_build_array('seat.frame'),
           jsonb_build_array('seat.midStrip_yn'),
           jsonb_build_array('seat.springType')
         )
       ),
       jsonb_build_object(
         'title', 'PIANKI SIEDZISKA',
         'component', 'seat',
         'style', 'bullet_list',
         'display_fields', jsonb_build_array(jsonb_build_array('seat.foamsList'))
       ),
       jsonb_build_object(
         'title', 'AUTOMAT',
         'component', 'automat',
         'style', 'plain',
         'display_fields', jsonb_build_array(
           jsonb_build_array('automat.code_name'),
           jsonb_build_array('automat.lockBolts')
         )
       )
     )
    ),
    ('naroznik', n2_id, 'SIEDZISKO szezlongu', 2, '{sheet_name}  {series.code}·{series.name} ({orientation})', true, true,
     jsonb_build_array(
       jsonb_build_object(
         'title', 'SZEZLONG',
         'component', 'chaise',
         'style', 'plain',
         'display_fields', jsonb_build_array(
           jsonb_build_array('chaise.code', 'chaise.modelName'),
           jsonb_build_array('chaise.frame'),
           jsonb_build_array('chaise.frameModification'),
           jsonb_build_array('chaise.springType')
         )
       ),
       jsonb_build_object(
         'title', 'PIANKI SIEDZISKA szezlongu',
         'component', 'chaise_seat',
         'style', 'bullet_list',
         'display_fields', jsonb_build_array(jsonb_build_array('chaise.seatFoams_summary'))
       )
     )
    ),
    ('naroznik', n2_id, 'OPARCIE sofy', 3, '{sheet_name}  {series.code}·{series.name} ({orientation})', true, true,
     jsonb_build_array(
       jsonb_build_object(
         'title', 'OPARCIE',
         'component', 'backrest',
         'style', 'plain',
         'display_fields', jsonb_build_array(
           jsonb_build_array('backrest.code', 'backrest.height'),
           jsonb_build_array('backrest.frame'),
           jsonb_build_array('backrest.springType')
         )
       ),
       jsonb_build_object(
         'title', 'PIANKI OPARCIA',
         'component', 'backrest',
         'style', 'bullet_list',
         'display_fields', jsonb_build_array(jsonb_build_array('backrest.foamsList'))
       )
     )
    ),
    ('naroznik', n2_id, 'OPARCIE szezlongu', 4, '{sheet_name}  {series.code}·{series.name} ({orientation})', true, true,
     jsonb_build_array(
       jsonb_build_object(
         'title', 'OPARCIE szezlongu',
         'component', 'chaise_backrest',
         'style', 'plain',
         'display_fields', jsonb_build_array(
           jsonb_build_array('chaise.backrestFrame'),
           jsonb_build_array('chaise.backrestHasSprings')
         )
       ),
       jsonb_build_object(
         'title', 'PIANKI OPARCIA szezlongu',
         'component', 'chaise_backrest',
         'style', 'bullet_list',
         'display_fields', jsonb_build_array(jsonb_build_array('chaise.backrestFoams_summary'))
       )
     )
    );

  -- ---------- Pufa (1 szablon globalny — rzut z góry z kwadratem) ----------
  INSERT INTO public.label_templates_v2
    (product_type, series_id, sheet_name, sort_order, header_template, show_meta_row, include_in_v3, is_conditional, condition_field, sections)
  VALUES
    ('pufa', NULL, 'PUFA', 1, '{sheet_name}        {series.code} · {series.name}', true, true, false, NULL,
     jsonb_build_array(
       jsonb_build_object(
         'title', 'RZUT PUFY Z GÓRY',
         'component', 'pufa_seat',
         'style', 'diagram_box',
         'fields', jsonb_build_object(
           'top',    'pufaSeat.frontBack',
           'bottom', 'pufaSeat.frontBack',
           'left',   'pufaSeat.sides',
           'right',  'pufaSeat.sides',
           'center', 'pufaSeat.foam'
         ),
         'box_size_mm', 50
       ),
       jsonb_build_object(
         'title', 'SKRZYNKA',
         'component', 'pufa_seat',
         'style', 'plain',
         'display_fields', jsonb_build_array(jsonb_build_array('pufaSeat.box'))
       )
     )
    );

  -- Dla sofy: etykieta pufy też musi się pojawić (warunkowo gdy PF w SKU).
  -- Kopiujemy globalny szablon jako warunkowy per product_type='sofa' i 'naroznik'.
  INSERT INTO public.label_templates_v2
    (product_type, series_id, sheet_name, sort_order, header_template, show_meta_row, include_in_v3, is_conditional, condition_field, sections)
  VALUES
    ('sofa', NULL, 'PUFA (do sofy)', 99, 'PUFA — {series.code} · {series.name}', true, true, true, 'extras_pufa_fotel',
     (SELECT sections FROM public.label_templates_v2 WHERE product_type = 'pufa' AND series_id IS NULL LIMIT 1)),
    ('naroznik', NULL, 'PUFA (do narożnika)', 99, 'PUFA — {series.code} · {series.name}', true, true, true, 'extras_pufa_fotel',
     (SELECT sections FROM public.label_templates_v2 WHERE product_type = 'pufa' AND series_id IS NULL LIMIT 1));

  RAISE NOTICE 'label_templates_v2 seeded: S1=2, S2=2, N2=4, Pufa=1 + 2 conditional copies';
END $$;
