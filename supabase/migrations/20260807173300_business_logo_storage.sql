-- Insert business-logos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-logos', 'business-logos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for business-logos
-- Anyone can view logos if they are public, but we can make it public bucket.

-- Allow uploading if user is owner of the business (path must match business ID)
-- Assuming path structure: business_id/filename.ext
CREATE POLICY "Owners can upload logos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'business-logos' AND
    EXISTS (
      SELECT 1 FROM public.business_memberships
      WHERE business_memberships.business_id::text = (string_to_array(name, '/'))[1]
      AND business_memberships.user_id = auth.uid()
      AND business_memberships.role = 'owner'
    )
  );

CREATE POLICY "Owners can update logos" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'business-logos' AND
    EXISTS (
      SELECT 1 FROM public.business_memberships
      WHERE business_memberships.business_id::text = (string_to_array(name, '/'))[1]
      AND business_memberships.user_id = auth.uid()
      AND business_memberships.role = 'owner'
    )
  );

CREATE POLICY "Owners can delete logos" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'business-logos' AND
    EXISTS (
      SELECT 1 FROM public.business_memberships
      WHERE business_memberships.business_id::text = (string_to_array(name, '/'))[1]
      AND business_memberships.user_id = auth.uid()
      AND business_memberships.role = 'owner'
    )
  );

CREATE POLICY "Public read access for logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'business-logos');
