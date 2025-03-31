import { useState } from 'react';
import { searchRides } from '../lib/rides';
import type { Database } from '../lib/database.types';

type Ride = Database['public']['Tables']['rides']['Row'] & {
  profiles: { name: string; avatar_url: string | null }
};

export const useSearchRides = () => {
  const [rides, setRides] = useState<Ride[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchForRides = async (
    fromLocation: string,
    toLocation: string,
    date: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      const { rides: foundRides, error: searchError } = await searchRides(
        fromLocation,
        toLocation,
        date
      );
      
      if (searchError) throw searchError;
      setRides(foundRides);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search rides');
    } finally {
      setLoading(false);
    }
  };

  return { rides, loading, error, searchForRides };
};