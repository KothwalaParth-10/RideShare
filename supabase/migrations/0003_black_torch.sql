/*
  # Fix profile policies

  1. Changes
    - Add policy to allow users to insert their own profile during signup
    - Add policy to allow users to update their own profile
    - Add policy to allow public read access to profiles

  2. Security
    - Maintains RLS while allowing necessary profile operations
    - Ensures users can only modify their own profiles
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;

-- Recreate policies with correct permissions
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);