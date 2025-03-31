import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const HeroActions = () => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 pt-4">
      <Link
        to="/find-ride"
        className="group bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition flex items-center justify-center space-x-2"
      >
        <span>Find a Ride</span>
        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
      </Link>
      <Link
        to="/offer-ride"
        className="bg-black/30 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold hover:bg-black/40 transition text-center"
      >
        Offer a Ride
      </Link>
    </div>
  );
};

export default HeroActions;