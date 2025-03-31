// import React from 'react';
// import { Calendar, Clock, MapPin, Users, Car, AlertTriangle } from 'lucide-react';
// import type { Database } from '../../lib/database.types';
// import { getRideTimeInfo } from '../../lib/rides';

// type Ride = Database['public']['Tables']['rides']['Row'] & {
//   profiles: { name: string; avatar_url: string | null }
// };

// interface RideCardProps {
//   ride: Ride;
//   onBook: (seats: number) => void;
//   loading?: boolean;
// }

// export const RideCard: React.FC<RideCardProps> = ({ ride, onBook, loading }) => {
//   const [seatsToBook, setSeatsToBook] = React.useState(1);
//   const timeInfo = getRideTimeInfo(ride.departure_date, ride.departure_time);

//   // Check if ride is bookable (more than 1 hour in the future)
//   const now = new Date();
//   now.setHours(now.getHours() + 1);
//   const rideDateTime = new Date(`${ride.departure_date}T${ride.departure_time}`);
//   const isBookable = rideDateTime > now;

//   return (
//     <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
//       <div className="p-6">
//         <div className="flex justify-between items-start">
//           <div className="flex-1">
//             <div className="flex items-center space-x-4 mb-4">
//               <img
//                 className="h-12 w-12 rounded-full object-cover border-2 border-blue-100"
//                 src={ride.profiles.avatar_url || `https://ui-avatars.com/api/?name=${ride.profiles.name}&background=random`}
//                 alt={ride.profiles.name}
//               />
//               <div>
//                 <h3 className="text-lg font-semibold text-gray-900">{ride.profiles.name}</h3>
//                 <div className="flex items-center space-x-1 text-sm text-gray-500">
//                   <span>⭐ 4.8</span>
//                   <span>•</span>
//                   <span>245 rides</span>
//                 </div>
//               </div>
//             </div>
            
//             <div className="space-y-4">
//               <div className="flex items-start space-x-3">
//                 <MapPin className="h-5 w-5 text-blue-500 mt-1" />
//                 <div>
//                   <div className="font-medium">From</div>
//                   <div className="text-gray-600">{ride.from_location}</div>
//                 </div>
//               </div>
              
//               <div className="flex items-start space-x-3">
//                 <MapPin className="h-5 w-5 text-green-500 mt-1" />
//                 <div>
//                   <div className="font-medium">To</div>
//                   <div className="text-gray-600">{ride.to_location}</div>
//                 </div>
//               </div>
              
//               <div className="grid grid-cols-2 gap-4">
//                 <div className="flex items-center space-x-2">
//                   <Calendar className="h-5 w-5 text-gray-400" />
//                   <span className="text-gray-600">
//                     {new Date(ride.departure_date).toLocaleDateString()}
//                   </span>
//                 </div>
                
//                 <div className="flex items-center space-x-2">
//                   <Clock className="h-5 w-5 text-gray-400" />
//                   <span className="text-gray-600">{ride.departure_time}</span>
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div className="flex items-center space-x-2">
//                   <Users className="h-5 w-5 text-gray-400" />
//                   <span className="text-gray-600">
//                     {ride.available_seats} seats available
//                   </span>
//                 </div>

//                 {ride.car_model && (
//                   <div className="flex items-center space-x-2">
//                     <Car className="h-5 w-5 text-gray-400" />
//                     <span className="text-gray-600">{ride.car_model}</span>
//                   </div>
//                 )}
//               </div>

//               <div className={`flex items-center space-x-2 ${timeInfo.color}`}>
//                 <Clock className="h-5 w-5" />
//                 <span>{timeInfo.timeLeft}</span>
//               </div>
//             </div>
//           </div>
          
//           <div className="ml-6 text-right">
//             <div className="text-3xl font-bold text-blue-600">
//               ${ride.price}
//               <span className="text-sm text-gray-500 font-normal">/seat</span>
//             </div>
//             <div className="mt-4 space-y-2">
//               {!isBookable ? (
//                 <div className="flex items-center justify-center space-x-2 text-orange-600 bg-orange-50 px-4 py-2 rounded-lg">
//                   <AlertTriangle className="h-5 w-5" />
//                   <span className="text-sm">Must book at least 1 hour before departure</span>
//                 </div>
//               ) : (
//                 <>
//                   <select
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
//                     value={seatsToBook}
//                     onChange={(e) => setSeatsToBook(Number(e.target.value))}
//                   >
//                     {[...Array(ride.available_seats)].map((_, i) => (
//                       <option key={i + 1} value={i + 1}>
//                         {i + 1} seat{i + 1 > 1 ? 's' : ''}
//                       </option>
//                     ))}
//                   </select>
//                   <button
//                     onClick={() => onBook(seatsToBook)}
//                     disabled={loading}
//                     className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
//                   >
//                     {loading ? 'Booking...' : 'Book Now'}
//                   </button>
//                 </>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

import React from 'react';
import { Calendar, Clock, MapPin, Users, Car, AlertTriangle } from 'lucide-react';
import type { Database } from '../../lib/database.types';
import { getRideTimeInfo } from '../../lib/rides';

type Ride = Database['public']['Tables']['rides']['Row'] & {
  profiles: { name: string; avatar_url: string | null }
};

interface RideCardProps {
  ride: Ride;
  onBook: (seats: number) => void;
  loading?: boolean;
}

export const RideCard: React.FC<RideCardProps> = ({ ride, onBook, loading }) => {
  const [seatsToBook, setSeatsToBook] = React.useState(1);
  const timeInfo = getRideTimeInfo(ride.departure_date, ride.departure_time);

  // Check if ride is bookable (more than 1 hour in the future)
  const now = new Date();
  now.setHours(now.getHours() + 1);
  const rideDateTime = new Date(`${ride.departure_date}T${ride.departure_time}`);
  const isBookable = rideDateTime > now;

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-4">
              <img
                className="h-12 w-12 rounded-full object-cover border-2 border-blue-100"
                src={ride.profiles.avatar_url || `https://ui-avatars.com/api/?name=${ride.profiles.name}&background=random`}
                alt={ride.profiles.name}
              />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{ride.profiles.name}</h3>
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <span>⭐ 4.8</span>
                  <span>•</span>
                  <span>245 rides</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-blue-500 mt-1" />
                <div>
                  <div className="font-medium">From</div>
                  <div className="text-gray-600">{ride.from_location}</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-green-500 mt-1" />
                <div>
                  <div className="font-medium">To</div>
                  <div className="text-gray-600">{ride.to_location}</div>
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-600">
                    {ride.available_seats} seats available
                  </span>
                </div>

                {ride.car_model && (
                  <div className="flex items-center space-x-2">
                    <Car className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-600">{ride.car_model}</span>
                  </div>
                )}
              </div>

              <div className={`flex items-center space-x-2 ${timeInfo.color}`}>
                <Clock className="h-5 w-5" />
                <span>{timeInfo.timeLeft}</span>
              </div>
            </div>
          </div>
          
          <div className="ml-6 text-right">
            <div className="text-3xl font-bold text-blue-600">
              ${ride.price}
              <span className="text-sm text-gray-500 font-normal">/seat</span>
            </div>
            <div className="mt-4 space-y-2">
              {!isBookable ? (
                <div className="flex items-center justify-center space-x-2 text-orange-600 bg-orange-50 px-4 py-2 rounded-lg">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="text-sm">Must book at least 1 hour before departure</span>
                </div>
              ) : (
                <>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    value={seatsToBook}
                    onChange={(e) => setSeatsToBook(Number(e.target.value))}
                  >
                    {[...Array(ride.available_seats)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1} seat{i + 1 > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => onBook(seatsToBook)}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Booking...' : 'Book Now'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};