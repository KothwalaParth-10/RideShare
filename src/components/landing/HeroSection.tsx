import React from 'react';
import { Car } from 'lucide-react';
import HeroFeatures from './HeroFeatures';
import HeroActions from './HeroActions';

const HeroSection = () => {
  return (
    <div className="relative min-h-[800px]">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
          alt="Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 h-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center py-20">
          <div className="text-white space-y-8">
            <div className="inline-flex items-center space-x-3 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <Car className="h-6 w-6 text-white" />
              <span className="text-lg font-semibold text-white">RideShare</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
              Share Your Journey, <br />
              <span className="text-white/90">
                Save Together
              </span>
            </h1>
            
            <p className="text-xl text-white/80 max-w-lg">
              Join thousands of travelers connecting daily for shared rides. 
              Save money, reduce your carbon footprint, and make new friends along the way.
            </p>

            <HeroActions />
            <HeroFeatures />
          </div>
          
          <div className="hidden lg:block">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1532054241088-402b4150db33?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                alt="Happy travelers"
                className="rounded-2xl shadow-2xl transform -rotate-2 hover:rotate-0 transition-transform duration-300"
              />
              <div className="absolute inset-0 rounded-2xl ring-1 ring-white/20 transform rotate-2 hover:rotate-0 transition-transform duration-300"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;