-- Remove permissive upload policy for authenticated users
DROP POLICY IF EXISTS "Authenticated can upload order files" ON storage.objects;

-- Only service role (edge functions) can upload to order-files bucket
CREATE POLICY "Only service role can upload order files"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'order-files');

-- Keep existing SELECT/DELETE policies for signed URLs
-- Authenticated users can still read via signed URLs (handled by Supabase internally)