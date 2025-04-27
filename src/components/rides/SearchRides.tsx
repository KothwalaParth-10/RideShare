import React, { useState, useEffect } from 'react';
import { Search, Calendar, MapPin } from 'lucide-react';
import { LiveLocationMap } from '../map/LiveLocationMap';
import { geocodeLocation } from '../../lib/location';

interface SearchParams {
  from: string;
  to: string;
  date: string;
}

interface SearchRidesProps {
  onSearch: (params: {
    from: string;
    to: string;
    date: string;
    fromLocation: { lat: number; lng: number; name: string } | null;
    toLocation: { lat: number; lng: number; name: string } | null;
  }) => void;
  loading?: boolean;
}

export const SearchRides: React.FC<SearchRidesProps> = ({ onSearch }) => {
  const [searchParams, setSearchParams] = useState<SearchParams>({
    from: '',
    to: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [fromLocation, setFromLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [toLocation, setToLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Update user's location
  const handleLocationUpdate = (lat: number, lng: number) => {
    console.log('User location updated:', { lat, lng });
    setUserLocation({ lat, lng });
  };

  // Update locations when search params change
  const updateLocations = async () => {
    if (!searchParams.from || !searchParams.to) return;

    setIsLoading(true);
    try {
      console.log('Updating locations for:', searchParams);
      
      // Geocode from location
      const fromCoords = await geocodeLocation(searchParams.from);
      if (fromCoords) {
        console.log('Found from location:', fromCoords);
        setFromLocation(fromCoords);
      }

      // Geocode to location
      const toCoords = await geocodeLocation(searchParams.to);
      if (toCoords) {
        console.log('Found to location:', toCoords);
        setToLocation(toCoords);
      }
    } catch (error) {
      console.error('Error updating locations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update locations when search params change
  useEffect(() => {
    const timeoutId = setTimeout(updateLocations, 500);
    return () => clearTimeout(timeoutId);
  }, [searchParams.from, searchParams.to]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromLocation || !toLocation) {
      console.error('Locations not found');
      return;
    }
    console.log('Submitting search with params:', {
      ...searchParams,
      fromLocation,
      toLocation
    });
    onSearch({
      ...searchParams,
      fromLocation,
      toLocation
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="from" className="block text-sm font-medium text-gray-700">
              From
            </label>
            <input
              type="text"
              id="from"
              value={searchParams.from}
              onChange={(e) => setSearchParams({ ...searchParams, from: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Enter city name"
              required
            />
          </div>
          <div>
            <label htmlFor="to" className="block text-sm font-medium text-gray-700">
              To
            </label>
            <input
              type="text"
              id="to"
              value={searchParams.to}
              onChange={(e) => setSearchParams({ ...searchParams, to: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Enter city name"
              required
            />
          </div>
        </div>
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
            Date
          </label>
          <input
            type="date"
            id="date"
            value={searchParams.date}
            onChange={(e) => setSearchParams({ ...searchParams, date: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !fromLocation || !toLocation}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Searching...' : 'Search Rides'}
        </button>
      </form>
    </div>
  );
};