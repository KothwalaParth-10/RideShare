import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { createRide } from '../lib/rides';

export const useRideForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateRide = async (rideData: {
    from_location: string;
    to_location: string;
    departure_date: string;
    departure_time: string;
    available_seats: number;
    price: number;
    car_model?: string;
    description?: string;
  }) => {
    if (!user) {
      setError('You must be logged in to offer a ride');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { ride, error: rideError } = await createRide({
        ...rideData,
        driver_id: user.id,
        status: 'active'
      });

      if (rideError) throw rideError;
      if (ride) {
        showNotification('Ride created successfully!', 'success');
        navigate('/my-rides', { replace: true });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create ride';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, handleCreateRide };
};