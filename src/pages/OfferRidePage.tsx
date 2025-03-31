import React, { useState } from 'react';
import { MapPin, Calendar, Clock, DollarSign, Car } from 'lucide-react';
import { useRideForm } from '../hooks/useRideForm';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const OfferRidePage = () => {
  const { user } = useAuth();
  const { loading, error, handleCreateRide } = useRideForm();
  const [rideDetails, setRideDetails] = useState({
    from_location: '',
    to_location: '',
    departure_date: '',
    departure_time: '',
    available_seats: 2,
    price: '',
    car_model: '',
    description: ''
  });

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/signin" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleCreateRide({
      ...rideDetails,
      price: Number(rideDetails.price),
      available_seats: Number(rideDetails.available_seats)
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Offer a Ride</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          {error && (
            <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter starting point"
                    value={rideDetails.from_location}
                    onChange={(e) => setRideDetails({...rideDetails, from_location: e.target.value})}
                  />
                  <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter destination"
                    value={rideDetails.to_location}
                    onChange={(e) => setRideDetails({...rideDetails, to_location: e.target.value})}
                  />
                  <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={rideDetails.departure_date}
                    onChange={(e) => setRideDetails({...rideDetails, departure_date: e.target.value})}
                  />
                  <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <div className="relative">
                  <input
                    type="time"
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={rideDetails.departure_time}
                    onChange={(e) => setRideDetails({...rideDetails, departure_time: e.target.value})}
                  />
                  <Clock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Available Seats</label>
                <select
                  required
                  className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={rideDetails.available_seats}
                  onChange={(e) => setRideDetails({...rideDetails, available_seats: Number(e.target.value)})}
                >
                  {[1,2,3,4].map(num => (
                    <option key={num} value={num}>{num} seat{num > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price per Seat</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter price"
                    value={rideDetails.price}
                    onChange={(e) => setRideDetails({...rideDetails, price: e.target.value})}
                  />
                  <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Car Model</label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your car model"
                  value={rideDetails.car_model}
                  onChange={(e) => setRideDetails({...rideDetails, car_model: e.target.value})}
                />
                <Car className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Information</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                placeholder="Add any additional details about the ride"
                value={rideDetails.description}
                onChange={(e) => setRideDetails({...rideDetails, description: e.target.value})}
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Publishing...' : 'Publish Ride'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OfferRidePage;