/*
  # Add RLS Policies for Projects and Client Contact Information

  1. Security Policies
    - Allow authenticated users to read all projects and client information
    - Allow authenticated users to insert, update, and delete projects and client information
    - These policies ensure that only logged-in users can access the data

  2. Tables Affected
    - Projects table
    - Client Contact Information table

  3. Policy Types
    - SELECT: Allow reading data
    - INSERT: Allow creating new records
    - UPDATE: Allow modifying existing records
    - DELETE: Allow removing records
*/

-- Policies for Projects table
CREATE POLICY "Authenticated users can read projects"
  ON "Projects"
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert projects"
  ON "Projects"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update projects"
  ON "Projects"
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete projects"
  ON "Projects"
  FOR DELETE
  TO authenticated
  USING (true);

-- Policies for Client Contact Information table
CREATE POLICY "Authenticated users can read client contacts"
  ON "Client Contact Information"
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert client contacts"
  ON "Client Contact Information"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update client contacts"
  ON "Client Contact Information"
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete client contacts"
  ON "Client Contact Information"
  FOR DELETE
  TO authenticated
  USING (true);