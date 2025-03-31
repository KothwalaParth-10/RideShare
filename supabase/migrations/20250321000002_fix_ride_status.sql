/*
  # Fix ride status default value and existing records

  1. Changes
    - Update rides table to ensure status defaults to 'active'
    - Update any existing rides with incorrect status
    - Add constraint to prevent invalid status values
*/

-- First, update any existing rides with 'pending' status to 'active'
UPDATE rides
SET status = 'active'
WHERE status = 'pending';

-- Drop the existing status column
ALTER TABLE rides DROP COLUMN status;

-- Recreate the status column with the correct default and constraints
ALTER TABLE rides 
ADD COLUMN status text NOT NULL DEFAULT 'active' 
CHECK (status IN ('active', 'completed', 'cancelled'));

-- Create a function to ensure status is always 'active' on insert
CREATE OR REPLACE FUNCTION ensure_ride_status_active()
RETURNS TRIGGER AS $$
BEGIN
  -- Always set status to 'active' on insert
  NEW.status := 'active';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS ensure_ride_status_active ON rides;

-- Create the trigger
CREATE TRIGGER ensure_ride_status_active
  BEFORE INSERT ON rides
  FOR EACH ROW
  EXECUTE FUNCTION ensure_ride_status_active();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION ensure_ride_status_active TO authenticated; 