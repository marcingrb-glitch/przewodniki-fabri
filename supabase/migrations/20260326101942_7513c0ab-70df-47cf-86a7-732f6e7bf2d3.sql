DROP POLICY "Admins can update orders" ON public.orders;

CREATE POLICY "Authenticated can update orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (true);