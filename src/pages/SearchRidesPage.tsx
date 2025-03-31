import React, { useState, useEffect } from 'react';
import { searchRides } from '../lib/rides';
import { DatePicker } from '../components/DatePicker';
import { format } from 'date-fns';
import { useNotification } from '../contexts/NotificationContext';

export const SearchRidesPage: React.FC = () => {
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rides, setRides] = useState<any[]>([]);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { showNotification } = useNotification();

  // Clear location error when either location changes
  useEffect(() => {
    if (fromLocation && toLocation) {
      validateLocations(fromLocation, toLocation);
    } else {
      setLocationError(null);
      setError(null);
    }
  }, [fromLocation, toLocation]);

  const validateLocations = (from: string, to: string): boolean => {
    // Convert to lowercase and trim for case-insensitive comparison
    const normalizedFrom = from.toLowerCase().trim();
    const normalizedTo = to.toLowerCase().trim();

    if (normalizedFrom === normalizedTo && normalizedFrom !== '') {
      const errorMessage = `Pickup location "${from}" and drop-off location cannot be the same. Please choose different locations.`;
      setLocationError(errorMessage);
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      return false;
    }
    setLocationError(null);
    setError(null);
    return true;
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate locations before proceeding
    if (!validateLocations(fromLocation, toLocation)) {
      return;
    }

    setLoading(true);

    try {
      const { rides: searchResults, error: searchError } = await searchRides(
        fromLocation,
        toLocation,
        date
      );

      if (searchError) throw searchError;
      setRides(searchResults || []);

      // Show "no rides found" message as an error if no results
      if (searchResults?.length === 0) {
        const noRidesMessage = `No rides found from ${fromLocation} to ${toLocation} on ${format(new Date(date), 'PPP')}`;
        setError(noRidesMessage);
        showNotification(noRidesMessage, 'info');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search rides';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = (value: string, type: 'from' | 'to') => {
    if (type === 'from') {
      setFromLocation(value);
    } else {
      setToLocation(value);
    }
    
    // Validate immediately if both fields have values
    if (type === 'from' && toLocation) {
      validateLocations(value, toLocation);
    } else if (type === 'to' && fromLocation) {
      validateLocations(fromLocation, value);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Find a Ride</h1>
      
      <form onSubmit={handleSearch} className="space-y-4 max-w-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From
          </label>
          <input
            type="text"
            value={fromLocation}
            onChange={(e) => handleLocationChange(e.target.value, 'from')}
            placeholder="Enter pickup location"
            required
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              locationError ? 'border-red-500' : ''
            }`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To
          </label>
          <input
            type="text"
            value={toLocation}
            onChange={(e) => handleLocationChange(e.target.value, 'to')}
            placeholder="Enter destination"
            required
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              locationError ? 'border-red-500' : ''
            }`}
          />
        </div>

        {locationError && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <p>{locationError}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <DatePicker
            selectedDate={date}
            onChange={setDate}
            className="w-full"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !!locationError}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search Rides'}
        </button>
      </form>

      {error && !locationError && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
          {error}
        </div>
      )}

      <div className="mt-8">
        {rides.length === 0 ? (
          <p className="text-gray-600">
            {loading ? 'Searching for rides...' : null}
          </p>
        ) : (
          <div className="space-y-4">
            {rides.map((ride) => (
              <div
                key={ride.id}
                className="bg-white rounded-lg shadow-md p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {ride.from_location} → {ride.to_location}
                    </h3>
                    <p className="text-gray-600">
                      {format(new Date(`${ride.departure_date}T${ride.departure_time}`), 'PPp')}
                    </p>
                    <p className="text-gray-600">
                      Available seats: {ride.available_seats}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-blue-600">
                      ${ride.price}
                    </p>
                    <button
                      onClick={() => {/* Handle booking */}}
                      className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 