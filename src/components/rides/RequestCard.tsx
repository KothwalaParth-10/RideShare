import React from 'react';
import { Check, X, User, Calendar, MapPin, Users } from 'lucide-react';
import type { Database } from '../../lib/database.types';

type Request = Database['public']['Tables']['bookings']['Row'] & {
  profiles: {
    name: string;
    avatar_url: string | null;
  } | null;
  rides: {
    from_location: string;
    to_location: string;
    departure_date: string;
    departure_time: string;
  } | null;
};

interface RequestCardProps {
  request: Request;
  onApprove: () => void;
  onReject: () => void;
  loading?: boolean;
}

export const RequestCard: React.FC<RequestCardProps> = ({
  request,
  onApprove,
  onReject,
  loading
}) => {
  if (!request.profiles || !request.rides) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-gray-500">
          Request data is incomplete
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img
            src={request.profiles.avatar_url || `https://ui-avatars.com/api/?name=${request.profiles.name}&background=random`}
            alt={request.profiles.name}
            className="h-12 w-12 rounded-full"
          />
          <div>
            <h3 className="text-lg font-semibold">{request.profiles.name}</h3>
            <span className="text-sm text-gray-500">
              {request.seats_booked} seat{request.seats_booked > 1 ? 's' : ''} requested
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onApprove}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition disabled:opacity-50"
          >
            <Check className="h-5 w-5" />
          </button>
          <button
            onClick={onReject}
            disabled={loading}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2 text-gray-600">
          <MapPin className="h-5 w-5" />
          <span>{request.rides.from_location} → {request.rides.to_location}</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-600">
          <Calendar className="h-5 w-5" />
          <span>
            {new Date(request.rides.departure_date).toLocaleDateString()} at{' '}
            {request.rides.departure_time}
          </span>
        </div>
      </div>
    </div>
  );
};