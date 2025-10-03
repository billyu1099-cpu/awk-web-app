/*
  # Add Admin role to role_type enum

  1. Changes
    - Add "Admin" to the existing role_type enum values
    - This allows users to be assigned the Admin role in addition to Partner, Manager, Senior, and Staff
*/

DO $$
BEGIN
  -- Add Admin to the role_type enum if it doesn't already exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'Admin' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'role_type')
  ) THEN
    ALTER TYPE role_type ADD VALUE 'Admin';
  END IF;
END $$;