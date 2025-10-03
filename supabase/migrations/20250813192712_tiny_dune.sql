/*
  # Drop Users table

  1. Changes
    - Drop the Users table completely since it's not needed for authentication
    - Supabase auth handles user management automatically

  2. Notes
    - This will remove all user profile data stored in the Users table
    - Authentication will continue to work through Supabase's built-in auth.users table
*/

DROP TABLE IF EXISTS "Users" CASCADE;