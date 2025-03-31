import { supabase } from './supabase';
import { sendEmail } from './email';
import type { Database } from './database.types';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';

type Tables = Database['public']['Tables'];
type Booking = Tables['bookings']['Row'];
type BookingInsert = Tables['bookings']['Insert'];
type BookingUpdate = Tables['bookings']['Update'];
type Ride = Tables['rides']['Row'];
type RideUpdate = Tables['rides']['Update'];

// Define valid booking statuses
type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

// Type for booking updates - only allow status updates
type BookingUpdatePayload = {
  status: BookingStatus;
};

type BookingWithRide = Booking & {
  rides: Pick<Ride, 'id' | 'driver_id' | 'available_seats'>;
};

type CreateBookingParams = {
  ride_id: string;
  passenger_id: string;
  seats_booked: number;
};

type BookingWithRelations = Booking & {
  rides: Ride & {
    profiles: {
      name: string;
      avatar_url: string | null;
    };
  };
  profiles: {
    name: string;
    avatar_url: string | null;
  };
};

type BookingResponse = {
  id: string;
  ride_id: string;
  passenger_id: string;
  seats_booked: number;
  status: string;
  created_at: string;
  updated_at: string;
};

export const createBooking = async (params: CreateBookingParams) => {
  try {
    // First verify the ride exists and has enough seats
    const rideResponse: PostgrestSingleResponse<Pick<Ride, 'available_seats' | 'status'>> = await supabase
      .from('rides')
      .select('available_seats, status')
      .eq('id', params.ride_id)
      .single();

    if (rideResponse.error) {
      throw new Error('Failed to verify ride availability');
    }

    const ride = rideResponse.data;
    if (!ride) {
      throw new Error('Ride not found');
    }

    if (ride.status !== 'active') {
      throw new Error('This ride is no longer available for booking');
    }

    if (ride.available_seats < params.seats_booked) {
      throw new Error(`Only ${ride.available_seats} seats available`);
    }

    // Create the booking
    const newBooking: BookingInsert = {
      ride_id: params.ride_id,
      passenger_id: params.passenger_id,
      seats_booked: params.seats_booked,
      status: 'pending'
    };

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([newBooking])
      .select(`
        *,
        rides (
          *,
          profiles (
            name,
            avatar_url
          )
        ),
        profiles (
          name,
          avatar_url
        )
      `)
      .single();

    if (bookingError) {
      throw new Error('Failed to create booking');
    }

    if (!booking) {
      throw new Error('Failed to create booking');
    }

    // Update available seats
    const rideUpdate: RideUpdate = {
      available_seats: ride.available_seats - params.seats_booked
    };

    const { error: updateError } = await supabase
      .from('rides')
      .update(rideUpdate)
      .eq('id', params.ride_id)
      .eq('available_seats', ride.available_seats); // Optimistic concurrency control

    if (updateError) {
      // If update fails, delete the booking to maintain consistency
      if (booking.id) {
        await supabase
          .from('bookings')
          .delete()
          .eq('id', booking.id);
      }
      
      throw new Error('Failed to update seat availability. Please try again.');
    }

    return { booking, error: null };
  } catch (error) {
    console.error('Booking error:', error);
    return { 
      booking: null, 
      error: error instanceof Error ? error : new Error('An unexpected error occurred') 
    };
  }
};

export const handleBookingRequest = async (
  bookingId: string,
  status: 'approved' | 'rejected'
) => {
  try {
    // Convert approval status to booking status
    const bookingStatus: BookingStatus = status === 'approved' ? 'confirmed' : 'cancelled';
    
    // Update booking status
    const updateData: BookingUpdate = { status: bookingStatus };
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId)
      .select(`
        *,
        rides (
          id,
          driver_id,
          available_seats
        )
      `)
      .single();

    if (updateError) throw updateError;
    if (!updatedBooking) throw new Error('Booking not found');

    const booking = updatedBooking as unknown as BookingWithRide;

    // If approved, update the ride's available seats
    if (status === 'approved' && booking.rides) {
      const { error: seatsError } = await supabase
        .rpc('update_ride_seats', {
          p_ride_id: booking.rides.id,
          p_seats_booked: booking.seats_booked
        });

      if (seatsError) throw seatsError;
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error handling booking request:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to handle booking request' 
    };
  }
};

export const getPendingRequests = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        rides (
          *,
          profiles (
            name,
            avatar_url
          )
        ),
        profiles!bookings_passenger_id_fkey (
          name,
          avatar_url
        )
      `)
      .eq('rides.driver_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { requests: data, error: null };
  } catch (error) {
    console.error('Error getting pending requests:', error);
    return { 
      requests: null, 
      error: error instanceof Error ? error.message : 'Failed to get pending requests' 
    };
  }
};

export const getUserBookings = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        rides (
          *,
          profiles (
            name,
            avatar_url
          )
        )
      `)
      .eq('passenger_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { bookings: data, error: null };
  } catch (error) {
    console.error('Error getting user bookings:', error);
    return { 
      bookings: null, 
      error: error instanceof Error ? error.message : 'Failed to get user bookings' 
    };
  }
};

export const updateBookingStatus = async (
  bookingId: string,
  status: BookingStatus
) => {
  try {
    // First get the booking details with all necessary relations
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select(`
        *,
        rides (
          id,
          available_seats,
          status
        )
      `)
      .eq('id', bookingId)
      .single();

    if (fetchError) {
      console.error('Error fetching booking:', fetchError);
      throw new Error('Could not find the booking');
    }
    if (!booking) {
      throw new Error('Booking not found');
    }
    if (!booking.rides) {
      throw new Error('Associated ride not found');
    }

    // If canceling, first update the ride's available seats
    if (status === 'cancelled') {
      const newAvailableSeats = (booking.rides.available_seats || 0) + booking.seats_booked;
      
      // Update ride seats without requesting a return value
      const { error: rideError } = await supabase
        .from('rides')
        .update({ 
          available_seats: newAvailableSeats,
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.ride_id);

      if (rideError) {
        console.error('Error updating ride seats:', rideError);
        throw new Error('Failed to update ride seat availability');
      }
    }

    // Then update the booking status
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating booking:', updateError);
      throw new Error('Failed to update booking status');
    }

    if (!updatedBooking) {
      throw new Error('Failed to update booking');
    }

    // Fetch the updated booking with all relations
    const { data: finalBooking, error: finalError } = await supabase
      .from('bookings')
      .select(`
        *,
        rides (
          id,
          available_seats,
          status,
          profiles (
            name,
            avatar_url
          )
        ),
        profiles (
          name,
          avatar_url
        )
      `)
      .eq('id', bookingId)
      .single();

    if (finalError) {
      console.error('Error fetching updated booking:', finalError);
      throw new Error('Failed to fetch updated booking details');
    }

    return { booking: finalBooking, error: null };
  } catch (err) {
    console.error('Error in updateBookingStatus:', err);
    return { 
      booking: null, 
      error: err instanceof Error ? err : new Error('Failed to update booking status')
    };
  }
};