
-- Add visible_to_workers column
ALTER TABLE public.orders ADD COLUMN visible_to_workers boolean NOT NULL DEFAULT false;

-- Drop old SELECT policy
DROP POLICY IF EXISTS "Users can view own orders or admin all" ON public.orders;

-- New SELECT policy: admin sees all, workers see own + visible
CREATE POLICY "Users can view orders"
ON public.orders FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR created_by = auth.uid()
  OR visible_to_workers = true
);
