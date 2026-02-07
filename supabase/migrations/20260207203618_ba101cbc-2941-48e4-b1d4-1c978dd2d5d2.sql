
-- Create storage bucket for order files
INSERT INTO storage.buckets (id, name, public) VALUES ('order-files', 'order-files', true);

-- Storage policies
CREATE POLICY "Anyone can read order files" ON storage.objects FOR SELECT USING (bucket_id = 'order-files');
CREATE POLICY "Anyone can upload order files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'order-files');
CREATE POLICY "Anyone can update order files" ON storage.objects FOR UPDATE USING (bucket_id = 'order-files');

-- Order files metadata table
CREATE TABLE public.order_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.order_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read order files metadata" ON public.order_files FOR SELECT USING (true);
CREATE POLICY "Anyone can insert order files metadata" ON public.order_files FOR INSERT WITH CHECK (true);
