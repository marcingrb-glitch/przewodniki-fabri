DROP POLICY "Users can create orders" ON orders;

CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    (NOT visible_to_workers OR has_role(auth.uid(), 'admin'::app_role))
  );