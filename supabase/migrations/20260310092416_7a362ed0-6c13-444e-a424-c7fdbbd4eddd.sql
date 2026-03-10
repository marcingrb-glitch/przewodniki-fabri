
-- Add backrest_id column to sewing_variants
ALTER TABLE public.sewing_variants ADD COLUMN backrest_id uuid REFERENCES public.backrests(id) ON DELETE CASCADE;

-- Migrate existing data: link variants to backrests by matching component_code = code AND series_id
UPDATE public.sewing_variants sv
SET backrest_id = (
  SELECT b.id FROM public.backrests b
  WHERE b.code = sv.component_code
    AND b.series_id = sv.series_id
    AND (
      -- Match by model overlap
      b.model_name IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM unnest(sv.models) m
        WHERE b.model_name ILIKE '%' || m || '%'
      )
    )
  LIMIT 1
)
WHERE sv.component_type = 'backrest' AND sv.backrest_id IS NULL;

-- For any remaining unlinked variants (models=[]), link to first backrest with same code
UPDATE public.sewing_variants sv
SET backrest_id = (
  SELECT b.id FROM public.backrests b
  WHERE b.code = sv.component_code
    AND b.series_id = sv.series_id
  ORDER BY b.created_at
  LIMIT 1
)
WHERE sv.component_type = 'backrest' AND sv.backrest_id IS NULL;
