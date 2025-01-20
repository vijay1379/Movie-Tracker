/*
  # Fix users table RLS policies

  1. Changes
    - Add policy for inserting new users during signup
    - Add policy for updating user's own data
    - Add policy for authenticated users to read their own data

  2. Security
    - Ensures users can only access their own data
    - Allows new user creation during signup
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own data" ON users;

-- Create new policies
CREATE POLICY "Enable insert for authentication" ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable read access for users" ON public.users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Enable update for users" ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);