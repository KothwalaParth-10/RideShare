import React from 'react';
import { AlertCircle } from 'lucide-react';

interface AuthErrorProps {
  message: string | null;
}

export const AuthError: React.FC<AuthErrorProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
      <div className="flex items-center space-x-2 text-red-600">
        <AlertCircle className="h-5 w-5" />
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
};