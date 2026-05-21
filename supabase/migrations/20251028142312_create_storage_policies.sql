/*
  # Create storage policies for assessments bucket

  1. Storage Setup
    - Create storage policies for the assessments bucket
    - Allow authenticated users to upload their own assessment files
    - Allow authenticated users to view their own assessment files

  2. Security
    - Users can only upload files to their own user path
    - Users can only access their own files
*/

CREATE POLICY "Users can upload own assessments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'assessments' AND (storage.foldername(name))[1] = 'handwriting');

CREATE POLICY "Users can view own assessments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'assessments');

CREATE POLICY "Users can delete own assessments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'assessments' AND (storage.foldername(name))[1] = 'handwriting');
