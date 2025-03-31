/*
  # Add phone verification support
  
  1. New Tables
    - `phone_verification`
      - `id` (uuid, primary key)
      - `phone_number` (text)
      - `otp` (text)
      - `expires_at` (timestamptz)
      - `created_at` (timestamptz)
  
  2. Changes
    - Add phone verification table
    - Add policies for phone verification
*/

-- Create phone verification table
CREATE TABLE IF NOT EXISTS phone_verification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,
  otp text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE phone_verification ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can insert phone verification"
  ON phone_verification FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can read their own verification"
  ON phone_verification FOR SELECT
  USING (phone_number = current_setting('request.jwt.claims')::json->>'phone');