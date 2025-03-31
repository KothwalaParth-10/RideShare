import { useState } from 'react';
import { updateBookingStatus } from '../lib/bookings';
import { useNotification } from '../contexts/NotificationContext';

export const useCancelBooking = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showNotification } = useNotification();

  const cancelBooking = async (bookingId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { booking, error: cancelError } = await updateBookingStatus(bookingId, 'cancelled');
      
      if (cancelError) throw cancelError;
      
      showNotification('Ride cancelled successfully', 'success');
      return booking;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel booking';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return { cancelBooking, loading, error };
};