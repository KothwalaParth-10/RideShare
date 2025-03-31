import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Users, Car, DollarSign } from 'lucide-react';

interface FindRideCardProps {
  ride: {
    id: string;
    driver_id: string;
    from_location: string;
    to_location: string;
    departure_date: string;
    departure_time: string;
    available_seats: number;
    price: number;
    car_model: string | null;
    profiles: {
      name: string;
    }
  };
  onBook: () => void;
  loading?: boolean;
}

export const FindRideCard: React.FC<FindRideCardProps> = ({ ride, onBook, loading }) => {
  const initials = ride.profiles.name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-semibold">{initials}</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold">{ride.profiles.name}</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {ride.available_seats} seat{ride.available_seats > 1 ? 's' : ''} available
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-gray-600">
              <Calendar className="h-5 w-5 text-gray-400" />
              <span>{new Date(ride.departure_date).toLocaleDateString()}</span>
            </div>

            <div className="flex items-center space-x-2 text-gray-600">
              <Clock className="h-5 w-5 text-gray-400" />
              <span>{ride.departure_time}</span>
            </div>

            <div className="flex items-center space-x-2 text-gray-600">
              <MapPin className="h-5 w-5 text-gray-400" />
              <div>
                <p>From: {ride.from_location}</p>
                <p>To: {ride.to_location}</p>
              </div>
            </div>

            {ride.car_model && (
              <div className="flex items-center space-x-2 text-gray-600">
                <Car className="h-5 w-5 text-gray-400" />
                <span>{ride.car_model}</span>
              </div>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center justify-end space-x-1">
            <DollarSign className="h-5 w-5 text-blue-600" />
            <span className="text-2xl font-bold text-blue-600">{ride.price}</span>
            <span className="text-sm text-gray-500">/seat</span>
          </div>

          <button
            onClick={onBook}
            disabled={loading}
            className="mt-4 w-full bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Booking...' : 'Book Now'}
          </button>
        </div>
      </div>
    </div>
  );
};