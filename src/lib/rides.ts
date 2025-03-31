import { supabase } from './supabase';
import { sendEmail } from './email';
import type { Database } from './database.types';

type Ride = Database['public']['Tables']['rides']['Row'];
type NewRide = Database['public']['Tables']['rides']['Insert'];

export const createRide = async (rideData: NewRide) => {
  try {
    // Ensure status is set to 'active' for new rides
    const { status, ...rideDataWithoutStatus } = rideData;
    const rideWithStatus = {
      ...rideDataWithoutStatus,
      status: 'active' // New rides start as active
    };

    const { data, error } = await supabase
      .from('rides')
      .insert([rideWithStatus])
      .select()
      .single();

    if (error) throw error;

    // Send confirmation email to ride provider
    try {
      await sendEmail('ride_offered', rideData.driver_id, data.id);
    } catch (emailError) {
      console.error('Failed to send ride offer email:', emailError);
      // Continue with ride creation even if email fails
    }

    return { ride: data, error: null };
  } catch (error) {
    console.error('Error creating ride:', error);
    return { 
      ride: null, 
      error: error instanceof Error ? error : new Error('Failed to create ride') 
    };
  }
};

export const searchRides = async (
  fromLocation: string,
  toLocation: string,
  date: string
) => {
  try {
    // Get current date at start of day for comparison
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const currentDate = now.toISOString().split('T')[0];

    // Validate search date is not in the past
    const searchDate = new Date(date);
    searchDate.setHours(0, 0, 0, 0);
    if (searchDate < now) {
      throw new Error('Cannot search for rides in the past');
    }

    const { data, error } = await supabase
      .from('rides')
      .select(`
        *,
        profiles (
          name,
          avatar_url
        )
      `)
      .eq('status', 'active')
      .eq('departure_date', date) // Exact date match
      .ilike('from_location', `%${fromLocation}%`)
      .ilike('to_location', `%${toLocation}%`)
      .gte('available_seats', 1)
      .order('departure_time', { ascending: true });

    if (error) throw error;

    // Filter rides based on time if searching for current date
    const filteredRides = date === currentDate 
      ? data?.filter(ride => {
          const rideDateTime = new Date(`${ride.departure_date}T${ride.departure_time}`);
          return rideDateTime > new Date();
        })
      : data;

    return { rides: filteredRides || [], error: null };
  } catch (error) {
    console.error('Error searching rides:', error);
    return { 
      rides: null, 
      error: error instanceof Error ? error.message : 'Failed to search rides' 
    };
  }
};

export const handleBookingRequest = async (
  bookingId: string,
  status: 'approved' | 'rejected'
) => {
  try {
    const { error } = await supabase
      .rpc('handle_booking_approval', {
        p_booking_id: bookingId,
        p_status: status
      });

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error handling booking request:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to handle booking request' 
    };
  }
};

export const cancelRide = async (rideId: string) => {
  try {
    const { error } = await supabase
      .rpc('handle_ride_cancellation', {
        p_ride_id: rideId
      });

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error cancelling ride:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to cancel ride' 
    };
  }
};

export const getUserRides = async (userId: string) => {
  // Get current date and time
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().split(' ')[0];

  const { data: offeredRides, error: offeredError } = await supabase
    .from('rides')
    .select('*, profiles(name, avatar_url)')
    .eq('driver_id', userId)
    .order('departure_date', { ascending: true });

  // Update status for expired rides
  if (offeredRides) {
    for (const ride of offeredRides) {
      if (
        ride.status === 'active' &&
        (ride.departure_date < currentDate ||
          (ride.departure_date === currentDate && ride.departure_time < currentTime))
      ) {
        await supabase
          .from('rides')
          .update({ status: 'completed' })
          .eq('id', ride.id);
        
        ride.status = 'completed';
      }
    }
  }

  const { data: bookedRides, error: bookedError } = await supabase
    .from('bookings')
    .select('*, rides(*, profiles(name, avatar_url))')
    .eq('passenger_id', userId)
    .order('created_at', { ascending: false });

  return {
    offered: offeredRides,
    booked: bookedRides,
    error: offeredError || bookedError
  };
};

export const updateRideStatus = async (rideId: string, status: 'active' | 'completed' | 'cancelled') => {
  if (status === 'cancelled') {
    // First delete all bookings for this ride
    await supabase
      .from('bookings')
      .delete()
      .eq('ride_id', rideId);

    // Then delete the ride
    const { error } = await supabase
      .from('rides')
      .delete()
      .eq('id', rideId);

    return { ride: null, error };
  } else {
    const { data, error } = await supabase
      .from('rides')
      .update({ status })
      .eq('id', rideId)
      .select()
      .single();

    return { ride: data, error };
  }
};

export const getRideTimeInfo = (departureDate: string, departureTime: string) => {
  const now = new Date();
  const rideDateTime = new Date(`${departureDate}T${departureTime}`);
  const diffHours = Math.round((rideDateTime.getTime() - now.getTime()) / (1000 * 60 * 60));
  
  if (diffHours < 0) {
    return {
      isExpired: true,
      timeLeft: 'Expired',
      color: 'text-red-600'
    };
  } else if (diffHours === 0) {
    return {
      isExpired: false,
      timeLeft: 'Less than an hour',
      color: 'text-orange-600'
    };
  } else if (diffHours < 24) {
    return {
      isExpired: false,
      timeLeft: `${diffHours} hour${diffHours > 1 ? 's' : ''} left`,
      color: 'text-blue-600'
    };
  } else {
    const days = Math.floor(diffHours / 24);
    return {
      isExpired: false,
      timeLeft: `${days} day${days > 1 ? 's' : ''} left`,
      color: 'text-green-600'
    };
  }
};