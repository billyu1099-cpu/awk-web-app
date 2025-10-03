/*
  # Add auth_id column to Users table

  1. Changes
    - Add `auth_id` column (uuid, not null) to link with Supabase auth users
    - Add unique constraint on `auth_id` to ensure one-to-one relationship
    - Update RLS policies to use `auth_id` instead of `id`
    - Add foreign key constraint to auth.users

  2. Security
    - Update existing RLS policies to work with auth_id
    - Maintain data integrity with foreign key constraint
*/

-- Add auth_id column to Users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Users' AND column_name = 'auth_id'
  ) THEN
    ALTER TABLE "Users" ADD COLUMN auth_id uuid NOT NULL DEFAULT gen_random_uuid();
  END IF;
END $$;

-- Add unique constraint on auth_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'Users' AND constraint_name = 'Users_auth_id_unique'
  ) THEN
    ALTER TABLE "Users" ADD CONSTRAINT "Users_auth_id_unique" UNIQUE (auth_id);
  END IF;
END $$;

-- Add foreign key constraint to auth.users
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

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can create their own profile" ON "Users";
DROP POLICY IF EXISTS "Users can read their own profile" ON "Users";
DROP POLICY IF EXISTS "Users can update their own profile" ON "Users";
DROP POLICY IF EXISTS "Users can delete their own profile" ON "Users";

-- Create new RLS policies using auth_id
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