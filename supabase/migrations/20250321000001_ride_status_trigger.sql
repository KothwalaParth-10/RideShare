/*
  # Add trigger for ride status

  1. Changes
    - Add trigger to ensure status is 'active' on ride creation
*/

-- Create function to set default status
CREATE OR REPLACE FUNCTION set_ride_status_active()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS NULL THEN
    NEW.status := 'active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS ensure_ride_status_active ON rides;
CREATE TRIGGER ensure_ride_status_active
  BEFORE INSERT ON rides
  FOR EACH ROW
  EXECUTE FUNCTION set_ride_status_active(); 