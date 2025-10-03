/*
  # Revert table changes

  1. Rename "Other than T1 Projects" back to "Projects"
  2. Drop the "T1 Projects" table
  3. Update RLS policies accordingly

  This reverts the previous changes and restores the original structure.
*/

-- Rename "Other than T1 Projects" back to "Projects"
ALTER TABLE "Other than T1 Projects" RENAME TO "Projects";

-- Drop the T1 Projects table
DROP TABLE IF EXISTS "T1 Projects";

-- Update RLS policies for the renamed table
DROP POLICY IF EXISTS "Authenticated users can read other projects" ON "Projects";
DROP POLICY IF EXISTS "Authenticated users can insert other projects" ON "Projects";
DROP POLICY IF EXISTS "Authenticated users can update other projects" ON "Projects";
DROP POLICY IF EXISTS "Authenticated users can delete other projects" ON "Projects";

-- Recreate policies with correct names
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