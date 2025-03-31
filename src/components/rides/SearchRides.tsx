import React, { useState, useEffect } from 'react';
import { Search, Calendar, MapPin } from 'lucide-react';
import { LiveLocationMap } from '../map/LiveLocationMap';
import { geocodeLocation } from '../../lib/location';

interface SearchRidesProps {
  onSearch: (searchParams: {
    from: string;
    to: string;
    date: string;
  }) => void;
  loading?: boolean;
}

export const SearchRides: React.FC<SearchRidesProps> = ({ onSearch, loading }) => {
  const [searchParams, setSearchParams] = useState({
    from: '',
    to: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [fromLocation, setFromLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [toLocation, setToLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  const handleLocationUpdate = (lat: number, lng: number) => {
    setUserLocation([lat, lng]);
  };

  useEffect(() => {
    const updateLocations = async () => {
      if (searchParams.from) {
        const coords = await geocodeLocation(searchParams.from);
        if (coords) {
          setFromLocation({ ...coords, name: searchParams.from });
        }
      }

      if (searchParams.to) {
        const coords = await geocodeLocation(searchParams.to);
        if (coords) {
          setToLocation({ ...coords, name: searchParams.to });
        }
      }
    };

    updateLocations();
  }, [searchParams.from, searchParams.to]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchParams);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="grid lg:grid-cols-2">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">Search Available Rides</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter city (e.g., Ahmedabad, Vadodara)"
                  value={searchParams.from}
                  onChange={(e) => setSearchParams({...searchParams, from: e.target.value})}
                  list="gujarat-cities"
                />
                <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter city (e.g., Surat, Rajkot)"
                  value={searchParams.to}
                  onChange={(e) => setSearchParams({...searchParams, to: e.target.value})}
                  list="gujarat-cities"
                />
                <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <div className="relative">
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchParams.date}
                  onChange={(e) => setSearchParams({...searchParams, date: e.target.value})}
                />
                <Calendar className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Search className="animate-spin -ml-1 mr-3 h-5 w-5" />
                  Searching...
                </div>
              ) : (
                'Search Rides'
              )}
            </button>
          </form>

          <datalist id="gujarat-cities">
            <option value="Ahmedabad" />
            <option value="Surat" />
            <option value="Vadodara" />
            <option value="Rajkot" />
            <option value="Bhavnagar" />
            <option value="Jamnagar" />
            <option value="Gandhinagar" />
            <option value="Junagadh" />
            <option value="Anand" />
            <option value="Bharuch" />
          </datalist>
        </div>

        <div className="relative h-[400px] lg:h-auto">
          <LiveLocationMap
            center={userLocation || [22.2587, 71.1924]}
            zoom={7}
            fromLocation={fromLocation || undefined}
            toLocation={toLocation || undefined}
            onLocationUpdate={handleLocationUpdate}
          />
        </div>
      </div>
    </div>
  );
};