/*
  # Update booking and ride status flow

  1. Changes
    - Update rides table to support pending status
    - Update bookings table with request status
    - Add triggers for status management
    - Add functions for booking approval
*/

-- Update rides table status to include 'pending'
ALTER TABLE rides 
DROP CONSTRAINT rides_status_check;

ALTER TABLE rides 
ADD CONSTRAINT rides_status_check 
CHECK (status IN ('pending', 'active', 'completed', 'cancelled'));

-- Update bookings table with request status
ALTER TABLE bookings 
ADD COLUMN request_status text DEFAULT 'pending' 
CHECK (request_status IN ('pending', 'approved', 'rejected', 'cancelled'));

-- Function to handle booking approval
CREATE OR REPLACE FUNCTION handle_booking_approval(
  p_booking_id UUID,
  p_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ride_id UUID;
  v_approved_seats INTEGER;
BEGIN
  -- Get ride_id and seats from the booking
  SELECT ride_id, seats_booked INTO v_ride_id, v_approved_seats
  FROM bookings
  WHERE id = p_booking_id;

  -- Start transaction
  BEGIN
    -- Update booking status
    UPDATE bookings
    SET request_status = p_status,
        status = CASE 
          WHEN p_status = 'approved' THEN 'confirmed'
          WHEN p_status = 'rejected' THEN 'cancelled'
          ELSE status
        END
    WHERE id = p_booking_id;

    -- If approved, update ride status and cancel other requests
    IF p_status = 'approved' THEN
      -- Update ride status to active
      UPDATE rides
      SET status = 'active'
      WHERE id = v_ride_id;

      -- Cancel all other pending requests for this ride
      UPDATE bookings
      SET request_status = 'cancelled',
          status = 'cancelled'
      WHERE ride_id = v_ride_id
      AND id != p_booking_id
      AND request_status = 'pending';
    END IF;
  END;
END;
$$;

-- Function to handle ride cancellation
CREATE OR REPLACE FUNCTION handle_ride_cancellation(
  p_ride_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Cancel all pending bookings for this ride
  UPDATE bookings
  SET request_status = 'cancelled',
      status = 'cancelled'
  WHERE ride_id = p_ride_id
  AND request_status = 'pending';

  -- Update ride status
  UPDATE rides
  SET status = 'cancelled'
  WHERE id = p_ride_id;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_booking_approval TO authenticated;
GRANT EXECUTE ON FUNCTION handle_ride_cancellation TO authenticated; 