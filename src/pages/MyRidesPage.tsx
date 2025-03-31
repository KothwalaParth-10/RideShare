import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Clock, Loader, Car as CarIcon, MessageSquare, AlertTriangle } from 'lucide-react';
import { useRides } from '../hooks/useRides';
import { useCancelBooking } from '../hooks/useCancelBooking';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { BookedRideCard } from '../components/rides/BookedRideCard';
import { ChatWindow } from '../components/chat/ChatWindow';
import { updateRideStatus } from '../lib/rides';
import { RequestCard } from '../components/rides/RequestCard';
import { getPendingRequests, handleRequest } from '../lib/requests';

const MyRidesPage = () => {
  const { user } = useAuth();
  const { rides, loading, error, refreshRides } = useRides();
  const { cancelBooking, loading: cancellingBooking } = useCancelBooking();
  const [activeTab, setActiveTab] = useState('offered');
  const [activeChat, setActiveChat] = useState<{
    bookingId: string;
    recipientId: string;
    recipientName: string;
  } | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingRequest, setLoadingRequest] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  useEffect(() => {
    const loadRequests = async () => {
      if (user) {
        try {
          setLoadingRequests(true);
          setRequestError(null);
          const { requests: pendingRequests, error } = await getPendingRequests(user.id);
          if (error) throw error;
          setRequests(pendingRequests || []);
        } catch (err) {
          setRequestError(err instanceof Error ? err.message : 'Failed to load requests');
        } finally {
          setLoadingRequests(false);
        }
      }
    };

    if (activeTab === 'requests') {
      loadRequests();
    }
  }, [user, activeTab]);

  if (!user) {
    return <Navigate to="/signin" />;
  }

  const handleCancelBooking = async (bookingId: string) => {
    await cancelBooking(bookingId);
    refreshRides();
  };

  const handleUpdateRideStatus = async (rideId: string, status: 'completed' | 'cancelled') => {
    try {
      setUpdatingStatus(rideId);
      await updateRideStatus(rideId, status);
      await refreshRides();
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleRequestAction = async (bookingId: string, status: 'approved' | 'rejected') => {
    try {
      setLoadingRequest(bookingId);
      await handleRequest(bookingId, status);
      // Refresh requests
      const { requests: updatedRequests } = await getPendingRequests(user.id);
      setRequests(updatedRequests || []);
      // Refresh rides to show updated status
      await refreshRides();
    } finally {
      setLoadingRequest(null);
    }
  };

  const isRideExpired = (departureDate: string, departureTime: string) => {
    const now = new Date();
    const rideDateTime = new Date(`${departureDate}T${departureTime}`);
    return now > rideDateTime;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your rides...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
            {error}
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'offered':
        return rides.offered?.map((ride) => {
          const expired = isRideExpired(ride.departure_date, ride.departure_time);
          const rideBookings = rides.booked?.filter(booking => booking.ride_id === ride.id) || [];
          
          return (
            <div key={ride.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
              {/* Existing offered rides content */}
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <CarIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {ride.from_location} → {ride.to_location}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          ride.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : ride.status === 'completed'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
                        </span>
                        {expired && ride.status === 'active' && (
                          <span className="inline-flex items-center space-x-1 text-xs text-orange-600">
                            <AlertTriangle className="h-4 w-4" />
                            <span>Ride has expired</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-600">
                        {new Date(ride.departure_date).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-600">{ride.departure_time}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-600">
                        {ride.available_seats} seats available
                      </span>
                    </div>

                    {ride.car_model && (
                      <div className="flex items-center space-x-2">
                        <CarIcon className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-600">{ride.car_model}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    ${ride.price}
                    <span className="text-sm text-gray-500 font-normal">/seat</span>
                  </div>
                  {ride.status === 'active' && (
                    <div className="mt-4 space-y-2">
                      {expired && (
                        <button
                          onClick={() => handleUpdateRideStatus(ride.id, 'completed')}
                          disabled={updatingStatus === ride.id}
                          className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
                        >
                          {updatingStatus === ride.id ? 'Updating...' : 'Mark as Completed'}
                        </button>
                      )}
                      <button
                        onClick={() => handleUpdateRideStatus(ride.id, 'cancelled')}
                        disabled={updatingStatus === ride.id}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                      >
                        {updatingStatus === ride.id ? 'Cancelling...' : 'Cancel Ride'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {rideBookings.length > 0 && (
                <div className="mt-6 border-t pt-6">
                  <h4 className="text-lg font-semibold mb-4">Bookings</h4>
                  <div className="space-y-4">
                    {rideBookings.map(booking => (
                      <div key={booking.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <img
                            src={`https://ui-avatars.com/api/?name=${booking.profiles?.name || 'User'}&background=random`}
                            alt={booking.profiles?.name}
                            className="h-10 w-10 rounded-full"
                          />
                          <div>
                            <p className="font-medium">{booking.profiles?.name}</p>
                            <p className="text-sm text-gray-600">{booking.seats_booked} seats booked</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setActiveChat({
                            bookingId: booking.id,
                            recipientId: booking.passenger_id,
                            recipientName: booking.profiles?.name || 'Passenger'
                          })}
                          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                        >
                          <MessageSquare className="h-5 w-5" />
                          <span>Chat</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeChat && (
                <div className="mt-6">
                  <ChatWindow
                    bookingId={activeChat.bookingId}
                    recipientId={activeChat.recipientId}
                    recipientName={activeChat.recipientName}
                    onClose={() => setActiveChat(null)}
                  />
                </div>
              )}
            </div>
          );
        });

      case 'booked':
        return rides.booked?.map((booking) => (
          <BookedRideCard
            key={booking.id}
            booking={booking}
            onCancel={() => handleCancelBooking(booking.id)}
            loading={cancellingBooking}
          />
        ));

      case 'requests':
        if (loadingRequests) {
          return (
            <div className="text-center py-12">
              <Loader className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading requests...</p>
            </div>
          );
        }

        if (requestError) {
          return (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
              {requestError}
            </div>
          );
        }

        if (requests.length === 0) {
          return (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No pending requests
              </h3>
              <p className="text-gray-500">
                You don't have any pending ride requests at the moment
              </p>
            </div>
          );
        }

        return requests.map((request) => (
          <RequestCard
            key={request.id}
            request={request}
            onApprove={() => handleRequestAction(request.id, 'approved')}
            onReject={() => handleRequestAction(request.id, 'rejected')}
            loading={loadingRequest === request.id}
          />
        ));

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">My Rides</h1>
          <div className="inline-flex p-1 space-x-1 bg-white rounded-xl shadow-sm">
            <button
              className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'offered'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('offered')}
            >
              Offered Rides
            </button>
            <button
              className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'booked'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('booked')}
            >
              Booked Rides
            </button>
            <button
              className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'requests'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('requests')}
            >
              Requests
              {requests.length > 0 && (
                <span className="ml-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">
                  {requests.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default MyRidesPage;