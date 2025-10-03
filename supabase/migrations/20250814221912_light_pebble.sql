/*
  # Add status column to clients table

  1. Changes
    - Add `status` column to `clients` table with default value 'Active'
    - Column allows values: 'Active', 'Inactive', 'Archived'
    - Set default value to 'Active' for existing records

  2. Security
    - No RLS changes needed as existing policies cover the new column
*/

-- Add status column to clients table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'status'
  ) THEN
    ALTER TABLE clients ADD COLUMN status text DEFAULT 'Active';
  END IF;
END $$;