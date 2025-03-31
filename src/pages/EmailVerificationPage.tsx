import React from 'react';
import { Mail, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const EmailVerificationPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
          <Mail className="h-8 w-8 text-blue-600" />
        </div>
        
        <h2 className="text-3xl font-extrabold text-gray-900">
          Verify your email
        </h2>
        
        <div className="mt-4 space-y-4">
          <p className="text-gray-600">
            We've sent a verification link to your email address.
            Please check your inbox (and spam folder) and click the link to verify your account.
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-sm text-yellow-700">
              Important: You must verify your email before you can sign in.
              The verification link will expire in 24 hours.
            </p>
          </div>
          
          <p className="text-sm text-gray-500">
            Once verified, you'll be automatically signed in.
          </p>
          
          <Link 
            to="/signin"
            className="inline-flex items-center text-blue-600 hover:text-blue-500"
          >
            <span>Back to Sign In</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;