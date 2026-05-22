-- ===========================================
-- VEDANT ACADEMY - SUPABASE SETUP SQL
-- ===========================================
-- Run this in Supabase SQL Editor after creating your project
-- Go to: Supabase Dashboard → SQL Editor → New Query

-- 1. Create storage buckets for PDF files and thumbnails
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pdfs', 'pdfs', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up storage policies for thumbnails (public read)
CREATE POLICY "Thumbnails are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'thumbnails');

-- 3. Set up storage policies for PDFs (authenticated read only via signed URLs)
CREATE POLICY "PDFs can be read via signed URLs"
ON storage.objects FOR SELECT
USING (bucket_id = 'pdfs' AND auth.role() = 'service_role');

-- 4. Allow service role to upload files
CREATE POLICY "Service role can upload PDFs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'pdfs' AND auth.role() = 'service_role');

CREATE POLICY "Service role can upload thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'thumbnails' AND auth.role() = 'service_role');

-- 5. Allow service role to delete files
CREATE POLICY "Service role can delete PDFs"
ON storage.objects FOR DELETE
USING (bucket_id = 'pdfs' AND auth.role() = 'service_role');

CREATE POLICY "Service role can delete thumbnails"
ON storage.objects FOR DELETE
USING (bucket_id = 'thumbnails' AND auth.role() = 'service_role');
