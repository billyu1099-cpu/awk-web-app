/*
  # Add columns to Client Contact Information table

  1. New Columns Added
    - `title` (text) - Client title (Mr., Ms., Dr., etc.)
    - `first_name` (text) - Client's first name
    - `middle_name` (text) - Client's middle name (optional)
    - `last_name` (text) - Client's last name
    - `company` (text) - Company name
    - `phone_numbers` (text) - Primary phone number
    - `mobile` (text) - Mobile phone number
    - `email` (text) - Email address
    - `bill_address` (text) - Billing address
    - `ship_address` (text) - Shipping address

  2. Security
    - Maintain existing RLS settings
    - No changes to existing policies

  3. Notes
    - All new columns allow NULL values for flexibility
    - Email field can be used for communication
    - Separate fields for billing and shipping addresses
    - Phone numbers stored as text to handle formatting
*/

-- Add new columns to Client Contact Information table
DO $$
BEGIN
  -- Add title column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Client Contact Information' AND column_name = 'title'
  ) THEN
    ALTER TABLE "Client Contact Information" ADD COLUMN title text;
  END IF;

  -- Add first_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Client Contact Information' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE "Client Contact Information" ADD COLUMN first_name text;
  END IF;

  -- Add middle_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Client Contact Information' AND column_name = 'middle_name'
  ) THEN
    ALTER TABLE "Client Contact Information" ADD COLUMN middle_name text;
  END IF;

  -- Add last_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Client Contact Information' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE "Client Contact Information" ADD COLUMN last_name text;
  END IF;

  -- Add company column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Client Contact Information' AND column_name = 'company'
  ) THEN
    ALTER TABLE "Client Contact Information" ADD COLUMN company text;
  END IF;

  -- Add phone_numbers column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Client Contact Information' AND column_name = 'phone_numbers'
  ) THEN
    ALTER TABLE "Client Contact Information" ADD COLUMN phone_numbers text;
  END IF;

  -- Add mobile column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Client Contact Information' AND column_name = 'mobile'
  ) THEN
    ALTER TABLE "Client Contact Information" ADD COLUMN mobile text;
  END IF;

  -- Add email column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Client Contact Information' AND column_name = 'email'
  ) THEN
    ALTER TABLE "Client Contact Information" ADD COLUMN email text;
  END IF;

  -- Add bill_address column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Client Contact Information' AND column_name = 'bill_address'
  ) THEN
    ALTER TABLE "Client Contact Information" ADD COLUMN bill_address text;
  END IF;

  -- Add ship_address column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Client Contact Information' AND column_name = 'ship_address'
  ) THEN
    ALTER TABLE "Client Contact Information" ADD COLUMN ship_address text;
  END IF;
END $$;