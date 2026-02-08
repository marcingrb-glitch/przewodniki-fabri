
-- 1. Make order-files bucket private
UPDATE storage.buckets SET public = false WHERE id = 'order-files';

-- 2. Drop existing permissive storage policies
DROP POLICY IF EXISTS "Anyone can read order files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload order files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update order files" ON storage.objects;

-- 3. Create authenticated-only storage policies
CREATE POLICY "Authenticated can read order files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'order-files');

CREATE POLICY "Authenticated can upload order files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'order-files');

CREATE POLICY "Authenticated can update order files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'order-files');

CREATE POLICY "Admins can delete order files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'order-files' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- 4. Fix order_files table RLS: restrict reads to order owner or admin
DROP POLICY IF EXISTS "Authenticated can read order_files" ON public.order_files;

CREATE POLICY "Users can read own order files"
  ON public.order_files FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_files.order_id
      AND (o.created_by = auth.uid() OR o.visible_to_workers = true)
    )
  );

-- 5. Fix order_files INSERT to tie to user's own orders
DROP POLICY IF EXISTS "Authenticated can insert order_files" ON public.order_files;

CREATE POLICY "Users can insert own order files"
  ON public.order_files FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_files.order_id
      AND o.created_by = auth.uid()
    )
  );
