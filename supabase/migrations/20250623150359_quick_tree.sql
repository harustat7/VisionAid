/*
  # Create cataract detections table

  This migration creates the main table for storing cataract detection results.

  1. New Tables
    - `cataract_detections`
      - `id` (uuid, primary key)
      - `patient_name` (text) - Patient's name
      - `patient_age` (integer) - Patient's age
      - `image_url` (text) - URL to the uploaded image
      - `detection_result` (enum) - Result: positive, negative, or uncertain
      - `confidence_score` (decimal) - AI confidence score (0-1)
      - `notes` (text, optional) - Additional notes
      - `created_at` (timestamp) - When the detection was performed

  2. Security
    - Enable RLS on `cataract_detections` table
    - Add policy for public read access (for demo purposes)
    - Add policy for public insert access (for demo purposes)

  3. Storage
    - Create storage bucket for cataract images
    - Set public access for image viewing
*/

-- Create enum for detection results
CREATE TYPE detection_result AS ENUM ('positive', 'negative', 'uncertain');

-- Create cataract detections table
CREATE TABLE IF NOT EXISTS cataract_detections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name text NOT NULL,
  patient_age integer NOT NULL CHECK (patient_age > 0 AND patient_age <= 120),
  image_url text NOT NULL,
  detection_result detection_result NOT NULL,
  confidence_score decimal(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE cataract_detections ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for demo purposes)
CREATE POLICY "Allow public read access"
  ON cataract_detections
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access"
  ON cataract_detections
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create storage bucket for cataract images
INSERT INTO storage.buckets (id, name, public)
VALUES ('cataract-images', 'cataract-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to the storage bucket
CREATE POLICY "Allow public read access to cataract images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'cataract-images');

CREATE POLICY "Allow public upload to cataract images"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'cataract-images');

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_cataract_detections_created_at 
  ON cataract_detections(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cataract_detections_result 
  ON cataract_detections(detection_result);