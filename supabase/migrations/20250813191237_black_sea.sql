/*
  # Add RLS policies for Users table

  1. Security
    - Add INSERT policy for authenticated users to create their own profile
    - Add SELECT policy for authenticated users to read their own data
    - Add UPDATE policy for authenticated users to update their own data
    - Add DELETE policy for authenticated users to delete their own data

  2. Changes
    - Users can only insert/read/update/delete their own records based on auth.uid()
*/

-- Create policy for INSERT operations
CREATE POLICY "Users can create their own profile"
  ON "Users"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = id::text);

-- Create policy for SELECT operations
CREATE POLICY "Users can read their own profile"
  ON "Users"
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

-- Create policy for UPDATE operations
CREATE POLICY "Users can update their own profile"
  ON "Users"
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- Create policy for DELETE operations
CREATE POLICY "Users can delete their own profile"
  ON "Users"
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = id::text);