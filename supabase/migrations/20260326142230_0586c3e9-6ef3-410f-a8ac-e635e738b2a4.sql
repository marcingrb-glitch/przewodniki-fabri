DROP POLICY "Users can create orders" ON public.orders;

CREATE POLICY "Authenticated can create orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());