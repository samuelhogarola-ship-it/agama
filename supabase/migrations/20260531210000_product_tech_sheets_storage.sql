-- Product technical sheets (PDFs) in Supabase Storage
-- Public bucket because product pages link directly to each PDF.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-tech-sheets',
  'product-tech-sheets',
  true,
  20971520,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can read product tech sheets" ON storage.objects;
CREATE POLICY "Public can read product tech sheets" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'product-tech-sheets');

DROP POLICY IF EXISTS "Authenticated can upload product tech sheets" ON storage.objects;
CREATE POLICY "Authenticated can upload product tech sheets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-tech-sheets'
    AND auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Authenticated can update product tech sheets" ON storage.objects;
CREATE POLICY "Authenticated can update product tech sheets" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'product-tech-sheets'
    AND auth.role() = 'service_role'
  )
  WITH CHECK (
    bucket_id = 'product-tech-sheets'
    AND auth.role() = 'service_role'
  );

DROP POLICY IF EXISTS "Authenticated can delete product tech sheets" ON storage.objects;
CREATE POLICY "Authenticated can delete product tech sheets" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-tech-sheets'
    AND auth.role() = 'service_role'
  );
