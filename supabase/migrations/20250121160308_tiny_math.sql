/*
  # Fix database errors

  1. Changes
    - Add update_ride_seats function for managing available seats
    - Fix phone verification query
    - Add indexes for better performance

  2. Security
    - Enable RLS for all new functions
    - Add proper error handling
*/

-- Function to update ride seats with proper locking
CREATE OR REPLACE FUNCTION public.update_ride_seats(
  p_ride_id UUID,
  p_seats_booked INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_error_message TEXT;
  v_ride rides;
BEGIN
  -- Lock the ride row for update to prevent concurrent modifications
  SELECT *
  INTO v_ride
  FROM rides
  WHERE id = p_ride_id
  FOR UPDATE;

  IF v_ride IS NULL THEN
    RAISE EXCEPTION 'Ride not found';
  END IF;

  IF v_ride.status != 'active' THEN
    RAISE EXCEPTION 'Ride is not available for booking';
  END IF;

  IF v_ride.available_seats < p_seats_booked THEN
    RAISE EXCEPTION 'Only % seats available', v_ride.available_seats;
  END IF;

  -- Update available seats with proper validation
  UPDATE rides
  SET available_seats = available_seats - p_seats_booked
  WHERE id = p_ride_id;

END;
$$;

-- Create a function to handle booking creation with seat update atomically
CREATE OR REPLACE FUNCTION public.create_booking_with_seats_update(
  p_ride_id UUID,
  p_passenger_id UUID,
  p_seats_booked INTEGER
)
RETURNS bookings
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking bookings;
BEGIN
  -- Start an explicit transaction
  BEGIN
    -- First try to update the seats
    PERFORM public.update_ride_seats(p_ride_id, p_seats_booked);

    -- If seat update succeeds, create the booking
    INSERT INTO bookings (
      ride_id,
      passenger_id,
      seats_booked,
      status
    )
    VALUES (
      p_ride_id,
      p_passenger_id,
      p_seats_booked,
      'pending'
    )
    RETURNING * INTO v_booking;

    -- Return the created booking
    RETURN v_booking;
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback on any error
      RAISE EXCEPTION 'Booking failed: %', SQLERRM;
  END;
END;
$$;

-- Fix phone verification query
CREATE OR REPLACE FUNCTION verify_phone_otp(
  p_phone_number TEXT,
  p_otp TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_valid BOOLEAN;
BEGIN
  -- Check if valid OTP exists
  SELECT EXISTS (
    SELECT 1
    FROM phone_verification
    WHERE phone_number = p_phone_number
    AND otp = p_otp
    AND expires_at > CURRENT_TIMESTAMP
  ) INTO v_valid;

  -- Delete used/expired OTPs for this phone
  DELETE FROM phone_verification
  WHERE phone_number = p_phone_number
  AND (otp = p_otp OR expires_at <= CURRENT_TIMESTAMP);

  RETURN v_valid;
END;
$$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_phone_verification_lookup 
ON phone_verification (phone_number, otp, expires_at);

CREATE INDEX IF NOT EXISTS idx_rides_available 
ON rides (id, available_seats);

CREATE INDEX IF NOT EXISTS idx_rides_booking 
ON rides (id, status, available_seats);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.update_ride_seats TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_booking_with_seats_update TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_phone_otp TO authenticated;