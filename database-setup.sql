-- DyslyzeML Database Schema
-- Run this SQL in your Supabase SQL Editor to set up the database

-- Create screenies table
CREATE TABLE IF NOT EXISTS screenies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  age integer NOT NULL,
  grade text NOT NULL,
  parent_guardian text NOT NULL,
  contact_number text NOT NULL,
  reading_test_completed boolean DEFAULT false,
  handwriting_test_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE screenies ENABLE ROW LEVEL SECURITY;

-- Create policies for screenies table
CREATE POLICY "Users can view own screenies"
  ON screenies FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own screenies"
  ON screenies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own screenies"
  ON screenies FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own screenies"
  ON screenies FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster queries 
CREATE INDEX IF NOT EXISTS screenies_user_id_idx ON screenies(user_id);
CREATE INDEX IF NOT EXISTS screenies_created_at_idx ON screenies(created_at DESC);
