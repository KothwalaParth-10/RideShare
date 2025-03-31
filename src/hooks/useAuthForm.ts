import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, signUp } from '../lib/auth';
import { useNotification } from '../contexts/NotificationContext';

export const useAuthForm = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const { user, error } = await signIn(email, password);
      
      if (error) throw error;
      if (user) {
        showNotification('Signed in successfully!', 'success');
        navigate('/');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      setError(null);

      const { user, error } = await signUp(email, password, name);
      
      if (error) {
        if (error.message.includes('already registered')) {
          throw new Error('An account with this email already exists');
        }
        throw error;
      }
      
      if (user) {
        showNotification('A verification link has been sent to your email.', 'success');
        return { error: null };
      }

      throw new Error('Failed to create account');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create account';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, handleSignIn, handleSignUp };
};