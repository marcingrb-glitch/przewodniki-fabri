
-- Allow deleting order_files records (needed for order deletion)
CREATE POLICY "Anyone can delete order files metadata"
ON public.order_files
FOR DELETE
USING (true);
