-- 1. Add cv_url column to job_applications
ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS cv_url text;

-- 2. Create private storage bucket for CVs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cvs',
  'cvs',
  false,
  5242880,  -- 5 MB limit
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Allow authenticated and anon uploads (applicants are not logged in)
CREATE POLICY "Allow anon CV uploads" ON storage.objects
  FOR INSERT TO anon
  WITH CHECK (bucket_id = 'cvs');

-- 4. Allow service role to read CVs (for internal review)
CREATE POLICY "Allow service role to read CVs" ON storage.objects
  FOR SELECT TO service_role
  USING (bucket_id = 'cvs');
