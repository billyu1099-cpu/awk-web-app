/*
  # Fix User Registration Database Setup

  1. Database Function
    - Create `handle_new_user()` function to automatically create profile records
    - Uses SECURITY DEFINER to bypass RLS during profile creation
    - Extracts user metadata (first_name, last_name) from auth signup

  2. Database Trigger
    - Create trigger on `auth.users` table
    - Automatically calls `handle_new_user()` after new user insertion
    - Ensures profile is created for every new registration

  3. Security
    - Maintains existing RLS policies on profiles table
    - Function runs with elevated privileges only for profile creation
    - No changes to existing authentication flow
*/

-- Create the function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    'Staff'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger to automatically call the function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS is enabled on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to insert their own profile (needed for the trigger)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Enable insert for service role'
  ) THEN
    CREATE POLICY "Enable insert for service role"
      ON public.profiles
      FOR INSERT
      TO service_role
      WITH CHECK (true);
  END IF;
END $$;