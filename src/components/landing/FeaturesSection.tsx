import React from 'react';
import { Shield, Clock, CreditCard, MapPin, Users, MessageSquare } from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      icon: <Shield className="w-8 h-8 text-blue-600" />,
      title: "Verified Users",
      description: "All users are verified through our secure verification process"
    },
    {
      icon: <Clock className="w-8 h-8 text-blue-600" />,
      title: "Flexible Scheduling",
      description: "Find rides that match your schedule, any time of the day"
    },
    {
      icon: <CreditCard className="w-8 h-8 text-blue-600" />,
      title: "Secure Payments",
      description: "Safe and secure payment processing for all rides"
    },
    {
      icon: <MapPin className="w-8 h-8 text-blue-600" />,
      title: "Route Matching",
      description: "Smart algorithm to match riders going your way"
    },
    {
      icon: <Users className="w-8 h-8 text-blue-600" />,
      title: "Community Driven",
      description: "Join a community of trusted travelers"
    },
    {
      icon: <MessageSquare className="w-8 h-8 text-blue-600" />,
      title: "In-app Chat",
      description: "Easy communication between riders and drivers"
    }
  ];

  return (
    <div className="bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose RideShare?</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We provide the best experience for shared rides with features designed for your comfort and safety.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition">
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturesSection;