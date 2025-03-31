import React from 'react';
import { Shield, Users, CreditCard } from 'lucide-react';

const features = [
  {
    icon: Shield,
    label: 'Verified Users'
  },
  {
    icon: Users,
    label: 'Community Driven'
  },
  {
    icon: CreditCard,
    label: 'Secure Payments'
  }
];

const HeroFeatures = () => {
  return (
    <div className="grid grid-cols-3 gap-6 pt-8">
      {features.map((feature, index) => (
        <div key={index} className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm mb-3">
            <feature.icon className="h-6 w-6 text-white" />
          </div>
          <p className="text-sm text-white/90">{feature.label}</p>
        </div>
      ))}
    </div>
  );
};

export default HeroFeatures;