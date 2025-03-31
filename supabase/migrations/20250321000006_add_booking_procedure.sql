/*
  # Add booking procedure with seat validation

  1. Changes
    - Add create_booking_with_seats_update procedure
    - Handles seat validation and booking atomically
    - Includes proper error handling
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.create_booking_with_seats_update;

-- Create the function with simplified return type
CREATE OR REPLACE FUNCTION public.create_booking_with_seats_update(
  p_passenger_id UUID,
  p_ride_id UUID,
  p_seats_booked INTEGER
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ride rides;
  v_booking bookings;
BEGIN
  -- Lock the ride row for update
  SELECT *
  INTO v_ride
  FROM rides
  WHERE id = p_ride_id
  FOR UPDATE;

  -- Validate ride exists and is active
  IF v_ride IS NULL THEN
    RAISE EXCEPTION 'Ride not found';
  END IF;

  IF v_ride.status != 'active' THEN
    RAISE EXCEPTION 'Ride is not available for booking';
  END IF;

  -- Check if enough seats are available
  IF v_ride.available_seats < p_seats_booked THEN
    RAISE EXCEPTION 'Only % seats available', v_ride.available_seats;
  END IF;

  -- Create the booking
  INSERT INTO bookings (
    ride_id,
    passenger_id,
    seats_booked,
    status,
    request_status
  )
  VALUES (
    p_ride_id,
    p_passenger_id,
    p_seats_booked,
    'pending',
    'pending'
  )
  RETURNING * INTO v_booking;

  -- Update available seats
  UPDATE rides
  SET 
    available_seats = available_seats - p_seats_booked,
    updated_at = NOW()
  WHERE id = p_ride_id;

  -- Return the booking as JSON
  RETURN json_build_object(
    'id', v_booking.id,
    'ride_id', v_booking.ride_id,
    'passenger_id', v_booking.passenger_id,
    'seats_booked', v_booking.seats_booked,
    'status', v_booking.status,
    'request_status', v_booking.request_status,
    'created_at', v_booking.created_at,
    'updated_at', v_booking.updated_at
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Booking failed: %', SQLERRM;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_booking_with_seats_update TO authenticated; 