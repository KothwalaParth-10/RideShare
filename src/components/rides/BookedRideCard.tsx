import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Users, Car, MessageSquare } from 'lucide-react';
import type { Database } from '../../lib/database.types';
import { ChatWindow } from '../chat/ChatWindow';

type BookedRide = Database['public']['Tables']['bookings']['Row'] & {
  rides: Database['public']['Tables']['rides']['Row'] & {
    profiles: { name: string; avatar_url: string | null }
  }
};

interface BookedRideCardProps {
  booking: BookedRide;
  onCancel: () => void;
  loading?: boolean;
}

export const BookedRideCard: React.FC<BookedRideCardProps> = ({ booking, onCancel, loading }) => {
  const [showChat, setShowChat] = useState(false);
  const ride = booking.rides;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-4 mb-4">
            <img
              className="h-12 w-12 rounded-full"
              src={ride.profiles.avatar_url || `https://ui-avatars.com/api/?name=${ride.profiles.name}&background=random`}
              alt={ride.profiles.name}
            />
            <div>
              <h3 className="text-lg font-medium">{ride.profiles.name}</h3>
              <span className={`inline-block px-2 py-1 rounded-full text-sm ${
                booking.status === 'confirmed'
                  ? 'bg-green-100 text-green-800'
                  : booking.status === 'cancelled'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <span>{new Date(ride.departure_date).toLocaleDateString()}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-gray-400" />
              <span>{ride.departure_time}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-gray-400" />
              <div>
                <p>From: {ride.from_location}</p>
                <p>To: {ride.to_location}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-gray-400" />
              <span>{booking.seats_booked} seats booked</span>
            </div>

            {ride.car_model && (
              <div className="flex items-center space-x-2">
                <Car className="h-5 w-5 text-gray-400" />
                <span>{ride.car_model}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="text-right">
          <span className="text-2xl font-bold text-blue-600">
            ${ride.price * booking.seats_booked}
          </span>
          <div className="space-y-2 mt-4">
            {booking.status !== 'cancelled' && (
              <>
                <button
                  onClick={() => setShowChat(!showChat)}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>{showChat ? 'Close Chat' : 'Chat with Driver'}</span>
                </button>
                <button
                  onClick={onCancel}
                  disabled={loading}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Cancelling...' : 'Cancel Ride'}
                </button>
              </>
            )}
            {booking.status === 'cancelled' && (
              <div className="w-full text-center py-2 bg-gray-100 text-gray-600 rounded-md">
                Cancelled
              </div>
            )}
          </div>
        </div>
      </div>

      {showChat && (
        <div className="mt-6">
          <ChatWindow
            bookingId={booking.id}
            recipientId={ride.driver_id}
            recipientName={ride.profiles.name}
          />
        </div>
      )}
    </div>
  );
};