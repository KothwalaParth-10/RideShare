/*
  # Fix booking approval process

  1. Changes
    - Update handle_booking_approval function to properly handle status updates
    - Add function to update available seats
    - Add function to handle booking notifications
*/

-- Function to update available seats
CREATE OR REPLACE FUNCTION update_ride_seats(
  p_ride_id UUID,
  p_seats_booked INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE rides
  SET available_seats = available_seats - p_seats_booked
  WHERE id = p_ride_id
  AND available_seats >= p_seats_booked;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not enough available seats';
  END IF;
END;
$$;

-- Function to handle booking notifications
CREATE OR REPLACE FUNCTION handle_booking_notifications(
  p_booking_id UUID,
  p_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking RECORD;
BEGIN
  -- Get booking details
  SELECT 
    b.*,
    r.driver_id,
    r.from_location,
    r.to_location,
    r.departure_date,
    r.departure_time,
    p.name as passenger_name,
    p.email as passenger_email
  INTO v_booking
  FROM bookings b
  JOIN rides r ON b.ride_id = r.id
  JOIN profiles p ON b.passenger_id = p.id
  WHERE b.id = p_booking_id;

  -- Send notifications based on status
  IF p_status = 'approved' THEN
    -- Send approval notification to passenger
    PERFORM send_email(
      'booking_approved',
      v_booking.passenger_id,
      v_booking.ride_id,
      v_booking.id
    );
  ELSIF p_status = 'rejected' THEN
    -- Send rejection notification to passenger
    PERFORM send_email(
      'booking_rejected',
      v_booking.passenger_id,
      v_booking.ride_id,
      v_booking.id
    );
  END IF;
END;
$$;

-- Update the booking approval function
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
  v_seats_booked INTEGER;
  v_driver_id UUID;
BEGIN
  -- Get booking details
  SELECT 
    ride_id,
    seats_booked,
    r.driver_id
  INTO 
    v_ride_id,
    v_seats_booked,
    v_driver_id
  FROM bookings b
  JOIN rides r ON b.ride_id = r.id
  WHERE b.id = p_booking_id;

  -- Start transaction
  BEGIN
    -- Update booking status
    UPDATE bookings
    SET 
      request_status = p_status,
      status = CASE 
        WHEN p_status = 'approved' THEN 'confirmed'
        WHEN p_status = 'rejected' THEN 'cancelled'
        ELSE status
      END
    WHERE id = p_booking_id;

    -- If approved, handle additional updates
    IF p_status = 'approved' THEN
      -- Update ride status and available seats
      UPDATE rides
      SET 
        status = 'approved',
        available_seats = available_seats - v_seats_booked
      WHERE id = v_ride_id;

      -- Cancel all other pending requests for this ride
      UPDATE bookings
      SET 
        request_status = 'cancelled',
        status = 'cancelled'
      WHERE ride_id = v_ride_id
      AND id != p_booking_id
      AND request_status = 'pending';

      -- Send notifications
      PERFORM handle_booking_notifications(p_booking_id, 'approved');
    ELSIF p_status = 'rejected' THEN
      -- Send rejection notification
      PERFORM handle_booking_notifications(p_booking_id, 'rejected');
    END IF;
  END;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_ride_seats TO authenticated;
GRANT EXECUTE ON FUNCTION handle_booking_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION handle_booking_approval TO authenticated; 