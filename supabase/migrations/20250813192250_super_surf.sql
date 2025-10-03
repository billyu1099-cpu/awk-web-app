/*
  # Fix Users table with proper auth_id setup

  1. Table Structure
    - Add auth_id column if it doesn't exist
    - Set up proper constraints and foreign keys
    - Ensure RLS is enabled

  2. Security
    - Add RLS policies for authenticated users
    - Allow users to manage their own records based on auth_id

  3. Data Integrity
    - Add unique constraint on auth_id
    - Add foreign key to auth.users
*/

-- First, check if auth_id column exists and add it if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Users' AND column_name = 'auth_id'
  ) THEN
    ALTER TABLE "Users" ADD COLUMN auth_id uuid;
  END IF;
END $$;

-- Make auth_id NOT NULL and add default
ALTER TABLE "Users" ALTER COLUMN auth_id SET NOT NULL;
ALTER TABLE "Users" ALTER COLUMN auth_id SET DEFAULT gen_random_uuid();

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'Users' AND constraint_name = 'Users_auth_id_unique'
  ) THEN
    ALTER TABLE "Users" ADD CONSTRAINT "Users_auth_id_unique" UNIQUE (auth_id);
  END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'Users' AND constraint_name = 'Users_auth_id_fkey'
  ) THEN
    ALTER TABLE "Users" ADD CONSTRAINT "Users_auth_id_fkey" 
    FOREIGN KEY (auth_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE "Users" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create their own profile" ON "Users";
DROP POLICY IF EXISTS "Users can read their own profile" ON "Users";
DROP POLICY IF EXISTS "Users can update their own profile" ON "Users";
DROP POLICY IF EXISTS "Users can delete their own profile" ON "Users";

-- Create new RLS policies
CREATE POLICY "Users can create their own profile"
  ON "Users"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Users can read their own profile"
  ON "Users"
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_id);

CREATE POLICY "Users can update their own profile"
  ON "Users"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Users can delete their own profile"
  ON "Users"
  FOR DELETE
  TO authenticated
  USING (auth.uid() = auth_id);