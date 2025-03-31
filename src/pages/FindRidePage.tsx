// import React, { useState } from 'react';
// import { useSearchRides } from '../hooks/useSearchRides';
// import { useBookRide } from '../hooks/useBookRide';
// import { RideCard } from '../components/rides/RideCard';
// import { SearchRides } from '../components/rides/SearchRides';
// import { useAuth } from '../contexts/AuthContext';
// import { useNavigate } from 'react-router-dom';
// import { Car, AlertTriangle } from 'lucide-react';

// const FindRidePage = () => {
//   const { user } = useAuth();
//   const navigate = useNavigate();
//   const { rides, loading: searchLoading, error: searchError, searchForRides } = useSearchRides();
//   const { bookRide, loading: bookingLoading, error: bookingError } = useBookRide();
//   const [bookingRideIds, setBookingRideIds] = useState<Set<string>>(new Set());

//   const handleSearch = async (searchParams: { from: string; to: string; date: string }) => {
//     await searchForRides(searchParams.from, searchParams.to, searchParams.date);
//   };

//   const handleBookRide = async (rideId: string, seats: number) => {
//     if (!user) {
//       navigate('/signin');
//       return;
//     }

//     try {
//       setBookingRideIds(prev => new Set(prev).add(rideId));
//       await bookRide(rideId, user.id, seats);
//     } finally {
//       setBookingRideIds(prev => {
//         const newSet = new Set(prev);
//         newSet.delete(rideId);
//         return newSet;
//       });
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="bg-blue-600 py-12">
//         <div className="max-w-7xl mx-auto px-4">
//           <h1 className="text-4xl font-bold text-white mb-2">Find a Ride</h1>
//           <p className="text-blue-100">Search available rides and travel together</p>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-4 -mt-8">
//         <SearchRides onSearch={handleSearch} loading={searchLoading} />

//         {(searchError || bookingError) && (
//           <div className="mt-8 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center">
//             <AlertTriangle className="h-5 w-5 mr-2" />
//             <span>{searchError || bookingError}</span>
//           </div>
//         )}

//         <div className="mt-8">
//           {rides && (
//             <div className="flex items-center justify-between mb-6">
//               <h2 className="text-xl font-semibold text-gray-900">
//                 {rides.length} {rides.length === 1 ? 'ride' : 'rides'} available
//               </h2>
//               <div className="flex items-center space-x-2 text-gray-500">
//                 <Car className="h-5 w-5" />
//                 <span>Showing all rides</span>
//               </div>
//             </div>
//           )}

//           <div className="space-y-4">
//             {rides?.map((ride) => (
//               <RideCard
//                 key={ride.id}
//                 ride={ride}
//                 onBook={(seats) => handleBookRide(ride.id, seats)}
//                 loading={bookingRideIds.has(ride.id)}
//               />
//             ))}
            
//             {rides?.length === 0 && (
//               <div className="text-center py-12">
//                 <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                   <Car className="h-8 w-8 text-gray-400" />
//                 </div>
//                 <h3 className="text-lg font-medium text-gray-900 mb-2">
//                   No rides found
//                 </h3>
//                 <p className="text-gray-500">
//                   Try adjusting your search criteria or check back later
//                 </p>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default FindRidePage;

import React from 'react';
import { useSearchRides } from '../hooks/useSearchRides';
import { useBookRide } from '../hooks/useBookRide';
import { RideCard } from '../components/rides/RideCard';
import { SearchRides } from '../components/rides/SearchRides';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Car } from 'lucide-react';

const FindRidePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { rides, loading: searchLoading, error: searchError, searchForRides } = useSearchRides();
  const { bookRide, loading: bookingLoading } = useBookRide();

  const handleSearch = async (searchParams: { from: string; to: string; date: string }) => {
    await searchForRides(searchParams.from, searchParams.to, searchParams.date);
  };

  const handleBookRide = async (rideId: string, seats: number) => {
    if (!user) {
      navigate('/signin');
      return;
    }
    await bookRide(rideId, user.id, seats);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-white mb-2">Find a Ride</h1>
          <p className="text-blue-100">Search available rides and travel together</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-8">
        <SearchRides onSearch={handleSearch} loading={searchLoading} />

        {searchError && (
          <div className="mt-8 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
            {searchError}
          </div>
        )}

        <div className="mt-8">
          {rides && (
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {rides.length} {rides.length === 1 ? 'ride' : 'rides'} available
              </h2>
              <div className="flex items-center space-x-2 text-gray-500">
                <Car className="h-5 w-5" />
                <span>Showing all rides</span>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {rides?.map((ride) => (
              <RideCard
                key={ride.id}
                ride={ride}
                onBook={(seats) => handleBookRide(ride.id, seats)}
                loading={bookingLoading}
              />
            ))}
            
            {rides?.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Car className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No rides found
                </h3>
                <p className="text-gray-500">
                  Try adjusting your search criteria or check back later
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindRidePage;