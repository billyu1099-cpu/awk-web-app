/*
  # Rename Projects table and create T1 Projects table

  1. Table Changes
    - Rename "Projects" table to "Other than T1 Projects"
    - Create new "T1 Projects" table with specified columns

  2. New Tables
    - `T1 Projects`
      - `id` (bigint, primary key, auto-increment)
      - `client_name` (text)
      - `main_client_folder` (text)
      - `engagement_type` (text)
      - `client_partners` (text)
      - `year_end` (date)
      - `services_required` (json)
      - `date_in` (date)
      - `preparer` (text)
      - `reviewer` (text)
      - `status` (text)
      - `comments` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `created_by` (text)
      - `last_modified_by` (text)

  3. Security
    - Enable RLS on new "T1 Projects" table
    - Add policies for authenticated users to perform CRUD operations
    - Update existing policies for renamed table
*/

-- Rename the existing Projects table
ALTER TABLE "Projects" RENAME TO "Other than T1 Projects";

-- Create the new T1 Projects table
CREATE TABLE IF NOT EXISTS "T1 Projects" (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  client_name text,
  main_client_folder text,
  engagement_type text,
  client_partners text,
  year_end date,
  services_required json,
  date_in date,
  preparer text,
  reviewer text,
  status text DEFAULT 'Not Started',
  comments text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by text NOT NULL DEFAULT 'System',
  last_modified_by text
);

-- Enable RLS on the new T1 Projects table
ALTER TABLE "T1 Projects" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for T1 Projects table
CREATE POLICY "Authenticated users can read T1 projects"
  ON "T1 Projects"
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert T1 projects"
  ON "T1 Projects"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update T1 projects"
  ON "T1 Projects"
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete T1 projects"
  ON "T1 Projects"
  FOR DELETE
  TO authenticated
  USING (true);

-- Update RLS policies for the renamed table (drop old ones and create new ones)
DROP POLICY IF EXISTS "Authenticated users can read projects" ON "Other than T1 Projects";
DROP POLICY IF EXISTS "Authenticated users can insert projects" ON "Other than T1 Projects";
DROP POLICY IF EXISTS "Authenticated users can update projects" ON "Other than T1 Projects";
DROP POLICY IF EXISTS "Authenticated users can delete projects" ON "Other than T1 Projects";

CREATE POLICY "Authenticated users can read other projects"
  ON "Other than T1 Projects"
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert other projects"
  ON "Other than T1 Projects"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update other projects"
  ON "Other than T1 Projects"
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete other projects"
  ON "Other than T1 Projects"
  FOR DELETE
  TO authenticated
  USING (true);