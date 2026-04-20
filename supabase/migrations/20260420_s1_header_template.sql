-- S1: zmiana header_template na "{sheet_name} SOFA {series.collection} [{series.code}]"
-- Przykład rozwinięcia: "SIEDZISKO SOFA Viena [S1]"

DO $$
DECLARE
  s1_id uuid;
BEGIN
  SELECT id INTO s1_id FROM public.products WHERE code = 'S1' AND category = 'series';

  UPDATE public.label_templates_v2
  SET header_template = '{sheet_name} SOFA {series.collection} [{series.code}]'
  WHERE product_type = 'sofa'
    AND series_id = s1_id;

  RAISE NOTICE 'S1 header_template updated';
END $$;
