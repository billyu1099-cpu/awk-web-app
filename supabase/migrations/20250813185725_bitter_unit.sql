/*
  # Add password and role columns to Users table

  1. New Columns
    - `password` (text, nullable) - User password hash
    - `role` (enum) - User role with values: Partner, Manager, Senior, Staff
  
  2. Changes
    - Create role_type enum if it doesn't exist
    - Add password column to users table
    - Add role column to users table with default value 'Staff'
  
  3. Security
    - No RLS changes needed as table already has RLS enabled
*/

-- Create enum type for user roles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_type') THEN
    CREATE TYPE role_type AS ENUM ('Partner', 'Manager', 'Senior', 'Staff');
  END IF;
END $$;

-- Add password column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Users' AND column_name = 'password'
  ) THEN
    ALTER TABLE "Users" ADD COLUMN password text;
  END IF;
END $$;

-- Add role column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Users' AND column_name = 'role'
  ) THEN
    ALTER TABLE "Users" ADD COLUMN role role_type DEFAULT 'Staff';
  END IF;
END $$;