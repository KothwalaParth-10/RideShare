/*
  # Update profiles table policies
  
  1. Changes
    - Add policy to allow profile creation during signup
    - Keep existing policies for profile viewing and updates
*/

-- Allow insert during signup
CREATE POLICY "Users can create their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);