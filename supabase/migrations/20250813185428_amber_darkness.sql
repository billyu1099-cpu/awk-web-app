/*
  # Add user profile columns to Users table

  1. Changes
    - Add `first_name` column (text, nullable)
    - Add `last_name` column (text, nullable) 
    - Add `email` column (text, nullable)

  2. Notes
    - These columns will store basic user profile information
    - All columns are nullable to allow gradual data population
*/

DO $$
BEGIN
  -- Add first_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Users' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE "Users" ADD COLUMN first_name text;
  END IF;

  -- Add last_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Users' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE "Users" ADD COLUMN last_name text;
  END IF;

  -- Add email column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Users' AND column_name = 'email'
  ) THEN
    ALTER TABLE "Users" ADD COLUMN email text;
  END IF;
END $$;