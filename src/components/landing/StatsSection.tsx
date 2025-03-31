import React from 'react';
import { Users, Car, Globe2 } from 'lucide-react';

const StatsSection = () => {
  return (
    <div className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-8 rounded-xl bg-blue-50">
            <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <div className="text-4xl font-bold text-blue-900 mb-2">50K+</div>
            <p className="text-gray-600">Active Users</p>
          </div>
          <div className="text-center p-8 rounded-xl bg-green-50">
            <Car className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <div className="text-4xl font-bold text-green-900 mb-2">100K+</div>
            <p className="text-gray-600">Rides Completed</p>
          </div>
          <div className="text-center p-8 rounded-xl bg-purple-50">
            <Globe2 className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <div className="text-4xl font-bold text-purple-900 mb-2">500K+</div>
            <p className="text-gray-600">CO₂ Saved (kg)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsSection;