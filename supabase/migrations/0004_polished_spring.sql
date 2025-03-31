/*
  # Add email column to profiles table
  
  1. Changes
    - Add email column to profiles table
    - Make email unique and not null
    - Add index on email for faster lookups
*/

-- Add email column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email TEXT NOT NULL;

-- Add unique constraint to email
ALTER TABLE profiles
ADD CONSTRAINT profiles_email_key UNIQUE (email);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles (email);