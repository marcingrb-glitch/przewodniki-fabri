
ALTER TABLE public.backrests ADD COLUMN IF NOT EXISTS model_name TEXT;

ALTER TABLE public.product_foams ADD COLUMN IF NOT EXISTS backrest_id UUID REFERENCES public.backrests(id) ON DELETE SET NULL;
