/*
  # Add ride request functionality

  1. Changes
    - Add request_status to bookings table
    - Add notifications table for request updates
    - Add functions for request handling
*/

-- Add request_status to bookings if not exists
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS request_status text DEFAULT 'pending' 
CHECK (request_status IN ('pending', 'approved', 'rejected'));

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Function to handle ride requests
CREATE OR REPLACE FUNCTION handle_ride_request(
  p_booking_id UUID,
  p_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update booking status
  UPDATE bookings
  SET request_status = p_status
  WHERE id = p_booking_id;

  -- Create notifications
  INSERT INTO notifications (user_id, title, message, type)
  SELECT 
    CASE 
      WHEN p_status = 'approved' THEN b.passenger_id
      WHEN p_status = 'rejected' THEN b.passenger_id
    END,
    CASE 
      WHEN p_status = 'approved' THEN 'Ride Request Approved'
      WHEN p_status = 'rejected' THEN 'Ride Request Rejected'
    END,
    CASE 
      WHEN p_status = 'approved' THEN 'Your ride request has been approved!'
      WHEN p_status = 'rejected' THEN 'Your ride request has been rejected.'
    END,
    p_status
  FROM bookings b
  WHERE b.id = p_booking_id;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_ride_request TO authenticated;