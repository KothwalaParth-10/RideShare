import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserRides } from '../lib/rides';
import type { Database } from '../lib/database.types';

type Ride = Database['public']['Tables']['rides']['Row'];
type Booking = Database['public']['Tables']['bookings']['Row'];

interface RidesData {
  offered: (Ride & { profiles: { name: string; avatar_url: string | null } })[] | null;
  booked: (Booking & { 
    rides: Ride & { 
      profiles: { name: string; avatar_url: string | null } 
    } 
  })[] | null;
}

export const useRides = () => {
  const { user } = useAuth();
  const [rides, setRides] = useState<RidesData>({ offered: null, booked: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRides = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { offered, booked, error: ridesError } = await getUserRides(user.id);
      if (ridesError) throw ridesError;
      
      setRides({ offered, booked });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rides');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadRides();
    }
  }, [user?.id]);

  return { rides, loading, error, refreshRides: loadRides };
};