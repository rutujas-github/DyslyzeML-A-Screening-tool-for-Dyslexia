/*
  # Add handwriting image path column

  1. Changes
    - Add `handwriting_image_path` column to screenies table to store the path of uploaded handwriting images
    - Column is nullable as not all assessments will have been completed

  2. Notes
    - Uses IF NOT EXISTS to prevent errors if column already exists
    - Default value is NULL
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'screenies' AND column_name = 'handwriting_image_path'
  ) THEN
    ALTER TABLE screenies ADD COLUMN handwriting_image_path text;
  END IF;
END $$;
