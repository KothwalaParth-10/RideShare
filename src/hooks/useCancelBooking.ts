import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNotification } from '../contexts/NotificationContext';
import type { Database } from '../lib/database.types';

type RideUpdate = Database['public']['Tables']['rides']['Update'];

interface Booking {
  id: string;
  ride_id: string;
  seats_booked: number;
  rides?: {
    id: string;
    available_seats: number;
  };
}

export const useCancelBooking = () => {
  const [loadingBookings, setLoadingBookings] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const { showNotification } = useNotification();

  const cancelBooking = async (bookingId: string) => {
    if (!bookingId) {
      const message = 'Invalid booking ID';
      setError(message);
      showNotification(message, 'error');
      return null;
    }

    try {
      setLoadingBookings(prev => ({ ...prev, [bookingId]: true }));
      setError(null);

      // First get the booking details
      const { data: bookingData, error: fetchError } = await supabase
        .from('bookings')
        .select('*, rides(id, available_seats)')
        .eq('id', bookingId)
        .single();

      if (fetchError || !bookingData) {
        throw new Error('Could not find the booking');
      }

      const booking = bookingData as unknown as Booking;
      if (!booking.rides) {
        throw new Error('Could not find associated ride');
      }

      // Update the ride's available seats first
      const { error: rideError } = await supabase
        .from('rides')
        .update({
          available_seats: booking.rides.available_seats + booking.seats_booked
        } as any)
        .eq('id', booking.ride_id);

      if (rideError) {
        throw new Error('Failed to update ride seat availability');
      }

      // Delete the booking
      const { error: deleteError } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

      if (deleteError) {
        // If deletion fails, revert the seat update
        await supabase
          .from('rides')
          .update({
            available_seats: booking.rides.available_seats
          } as any)
          .eq('id', booking.ride_id);
        throw new Error('Failed to delete booking');
      }

      showNotification('Ride cancelled successfully', 'success');
      return { success: true, bookingId };
    } catch (err) {
      console.error('Cancel booking error:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'An unexpected error occurred while cancelling the ride';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      return null;
    } finally {
      setLoadingBookings(prev => {
        const newState = { ...prev };
        delete newState[bookingId];
        return newState;
      });
    }
  };

  const isLoading = (bookingId: string) => Boolean(loadingBookings[bookingId]);

  return { cancelBooking, isLoading, error };
};