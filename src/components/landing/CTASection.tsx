import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const CTASection = () => {
  return (
    <div className="bg-blue-900 py-20">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold text-white mb-6">
          Ready to Start Your Journey?
        </h2>
        <p className="text-xl text-blue-200 mb-8 max-w-2xl mx-auto">
          Join our community today and experience a better way to travel. 
          Share rides, save money, and make connections.
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            to="/signup"
            className="bg-white text-blue-900 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition flex items-center space-x-2"
          >
            <span>Get Started</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            to="/find-ride"
            className="bg-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Browse Rides
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CTASection;