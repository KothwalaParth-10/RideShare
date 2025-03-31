import React, { useEffect } from 'react';
import { Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import { verifyEmailAndSetSession } from '../lib/auth';
import { useAuth } from '../contexts/AuthContext';

const EmailVerifiedPage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { user } = useAuth();
  const [verifying, setVerifying] = React.useState(true);

  useEffect(() => {
    // If user is already signed in, redirect to home
    if (user) {
      navigate('/', { replace: true });
      return;
    }

    const verifyEmail = async () => {
      try {
        // Get the URL hash parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        if (!accessToken || !refreshToken) {
          throw new Error('Invalid verification link');
        }

        // Only proceed with verification if this is an email verification flow
        if (type === 'email_verification') {
          // Verify email and set up session
          const { user, error } = await verifyEmailAndSetSession(accessToken, refreshToken);
          
          if (error) throw error;
          if (!user) throw new Error('Failed to verify email');

          showNotification('Email verified successfully! Welcome to RideShare!', 'success');
          navigate('/', { replace: true });
        } else {
          // If not an email verification, might be a password reset or other flow
          throw new Error('Invalid verification type');
        }
      } catch (err) {
        console.error('Verification error:', err);
        showNotification(
          err instanceof Error ? err.message : 'Failed to verify email. Please try signing in manually.',
          'error'
        );
        navigate('/signin', { replace: true });
      } finally {
        setVerifying(false);
      }
    };

    verifyEmail();
  }, [navigate, showNotification, user]);

  if (!verifying) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <Loader className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
        <h2 className="text-3xl font-extrabold text-gray-900">
          Verifying your email...
        </h2>
        <p className="text-gray-600">
          Please wait while we verify your email address...
        </p>
      </div>
    </div>
  );
};

export default EmailVerifiedPage;