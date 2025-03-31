import { supabase } from './supabase';
import { sendEmail } from './email';
import type { Database } from './database.types';

type Request = Database['public']['Tables']['bookings']['Row'] & {
  profiles: {
    name: string;
    avatar_url: string | null;
  };
  rides: {
    from_location: string;
    to_location: string;
    departure_date: string;
    departure_time: string;
    driver_id: string;
  };
};

export const getPendingRequests = async (driverId: string) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        profiles:passenger_id (
          name,
          avatar_url
        ),
        rides (
          from_location,
          to_location,
          departure_date,
          departure_time,
          driver_id
        )
      `)
      .eq('status', 'pending')
      .eq('rides.driver_id', driverId);

    if (error) throw error;

    if (!data) {
      return { requests: null, error: null };
    }

    // Validate that each request has the required data
    const validRequests = data.filter(request => 
      request.profiles && 
      request.rides && 
      request.rides.from_location && 
      request.rides.to_location
    );

    return { requests: validRequests as Request[] | null, error: null };
  } catch (error) {
    console.error('Error getting pending requests:', error);
    return { 
      requests: null, 
      error: error instanceof Error ? error.message : 'Failed to get pending requests' 
    };
  }
};

export const handleRequest = async (
  bookingId: string,
  status: 'approved' | 'rejected'
) => {
  try {
    // Start a transaction to update both statuses
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .update({ 
        status: status === 'approved' ? 'confirmed' : 'cancelled'
      })
      .eq('id', bookingId)
      .select(`
        *,
        rides (
          driver_id,
          from_location,
          to_location,
          departure_date,
          departure_time
        ),
        profiles!bookings_passenger_id_fkey (
          name,
          email
        )
      `)
      .single();

    if (bookingError) throw bookingError;

    if (!booking) throw new Error('Booking not found');

    // If approved, update the ride's available seats
    if (status === 'approved') {
      const { error: rideError } = await supabase
        .rpc('update_ride_seats', {
          p_ride_id: booking.ride_id,
          p_seats_booked: booking.seats_booked
        });

      if (rideError) throw rideError;

      // Send confirmation email to passenger
      await sendEmail('ride_booked', booking.passenger_id, undefined, booking.id);

      // Send notification email to driver
      await sendEmail('ride_booked', booking.rides.driver_id, undefined, booking.id);
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error handling request:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to handle request' 
    };
  }
};