
ALTER TABLE public.label_templates 
  ADD COLUMN series_id uuid REFERENCES public.series(id) ON DELETE CASCADE,
  ADD COLUMN display_fields text[] NOT NULL DEFAULT '{}';

-- Migrate existing content_template data to display_fields where possible
-- Sofa templates
UPDATE public.label_templates SET display_fields = ARRAY['seat.code', 'automat.code'] WHERE product_type = 'sofa' AND component = 'seat';
UPDATE public.label_templates SET display_fields = ARRAY['backrest.code', 'backrest.finish'] WHERE product_type = 'sofa' AND component = 'backrest';
UPDATE public.label_templates SET display_fields = ARRAY['side.code', 'side.finish'] WHERE product_type = 'sofa' AND component = 'side';
UPDATE public.label_templates SET display_fields = ARRAY['chest.code', 'automat.code'] WHERE product_type = 'sofa' AND component = 'chest';
UPDATE public.label_templates SET display_fields = ARRAY['leg.code', 'leg.height', 'leg.count'] WHERE product_type = 'sofa' AND component = 'leg_chest';
UPDATE public.label_templates SET display_fields = ARRAY['leg.code', 'leg.height', 'leg.count'] WHERE product_type = 'sofa' AND component = 'leg_seat';

-- Pufa templates
UPDATE public.label_templates SET display_fields = ARRAY['seat.code', 'pufaSeat.foam'] WHERE product_type = 'pufa' AND component = 'seat';
UPDATE public.label_templates SET display_fields = ARRAY['pufaSeat.box'] WHERE product_type = 'pufa' AND component = 'chest';
UPDATE public.label_templates SET display_fields = ARRAY['leg.code', 'leg.height', 'leg.count'] WHERE product_type = 'pufa' AND component = 'leg';

-- Fotel templates
UPDATE public.label_templates SET display_fields = ARRAY['seat.code'] WHERE product_type = 'fotel' AND component = 'seat';
UPDATE public.label_templates SET display_fields = ARRAY['side.code', 'side.finish'] WHERE product_type = 'fotel' AND component = 'side';
UPDATE public.label_templates SET display_fields = ARRAY['leg.code', 'leg.height', 'leg.count'] WHERE product_type = 'fotel' AND component = 'leg';
