DROP POLICY "Admins can delete orders" ON public.orders;

CREATE POLICY "Owner or admin can delete orders"
  ON public.orders FOR DELETE
  TO authenticated
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'));