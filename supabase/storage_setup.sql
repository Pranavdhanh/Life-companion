-- Run this in your Supabase SQL Editor to create the Storage bucket for photos and audio

-- Create a new bucket called 'life-stories'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('life-stories', 'life-stories', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to life-stories (since it's a public bucket, or we can enforce RLS)
-- For this prototype, we'll make it public so the Next.js frontend can easily render <img src="..." />
-- But we restrict UPLOADS to authenticated users only.

CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'life-stories');

CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'life-stories' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow users to delete their own uploads" ON storage.objects
FOR DELETE USING (
  bucket_id = 'life-stories' AND 
  auth.uid() = owner
);
