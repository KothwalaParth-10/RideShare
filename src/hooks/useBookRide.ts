// import { useState, useRef } from 'react';
// import { createBooking } from '../lib/bookings';
// import { useNotification } from '../contexts/NotificationContext';
// import { useNavigate } from 'react-router-dom';

// export const useBookRide = () => {
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const { showNotification } = useNotification();
//   const navigate = useNavigate();
//   const bookingInProgress = useRef(false);

//   const bookRide = async (rideId: string, passengerId: string, seatsToBook: number) => {
//     // Prevent multiple simultaneous booking requests
//     if (bookingInProgress.current) {
//       return null;
//     }

//     try {
//       bookingInProgress.current = true;
//       setLoading(true);
//       setError(null);

//       const { booking, error: bookingError } = await createBooking({
//         ride_id: rideId,
//         passenger_id: passengerId,
//         seats_booked: seatsToBook,
//       });

//       if (bookingError) throw bookingError;
//       if (!booking) throw new Error('Failed to create booking');

//       showNotification('Ride booked successfully!', 'success');
//       navigate('/my-rides');
//       return booking;
//     } catch (err) {
//       const errorMessage = err instanceof Error ? err.message : 'Failed to book ride';
//       setError(errorMessage);
//       showNotification(errorMessage, 'error');
//       return null;
//     } finally {
//       setLoading(false);
//       bookingInProgress.current = false;
//     }
//   };

//   return { bookRide, loading, error };
// };

import { useState } from 'react';
import { createBooking } from '../lib/bookings';
import { useNotification } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

export const useBookRide = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const bookRide = async (rideId: string, passengerId: string, seatsToBook: number) => {
    try {
      setLoading(true);
      setError(null);

      const { booking, error: bookingError } = await createBooking({
        ride_id: rideId,
        passenger_id: passengerId,
        seats_booked: seatsToBook,
      });

      if (bookingError) throw bookingError;

      showNotification('Ride booked successfully!', 'success');
      navigate('/my-rides');
      return booking;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to book ride';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return { bookRide, loading, error };
};