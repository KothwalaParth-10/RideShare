import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useNotification } from './NotificationContext';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {}
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const authListenerInitialized = useRef(false);

  useEffect(() => {
    let mounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;

    const initializeAuth = async () => {
      if (authListenerInitialized.current) {
        console.log('Auth listener already initialized, skipping...');
        return;
      }
      
      console.log('Initializing auth...');
      authListenerInitialized.current = true;

      try {
        // Get the initial session
        console.log('Fetching initial session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          if (mounted) {
            setLoading(false);
            setInitialized(true);
          }
          return;
        }

        console.log('Initial session:', session ? 'Found' : 'Not found');
        
        // Only update state if component is still mounted
        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
          setInitialized(true);
        }
        
        // Set up auth listener only once
        console.log('Setting up auth state listener...');
        const { data: { subscription } } = await supabase.auth.onAuthStateChange(async (event, session) => {
          if (!mounted) {
            console.log('Component unmounted, ignoring auth state change');
            return;
          }
          
          console.log('Auth event:', event, 'Session:', session ? 'Present' : 'None');
          setUser(session?.user ?? null);

          // Handle auth events
          switch (event) {
            case 'SIGNED_OUT':
              navigate('/', { replace: true });
              showNotification('You have been signed out', 'success');
              // Clear any stored auth data
              localStorage.removeItem('supabase.auth.token');
              sessionStorage.removeItem('supabase.auth.token');
              break;
            case 'SIGNED_IN':
              // Only show notification if it's a manual sign in (not session recovery)
              if (!user) {
                showNotification('Successfully signed in', 'success');
              }
              break;
            case 'TOKEN_REFRESHED':
              console.log('Token refreshed successfully');
              break;
            case 'USER_DELETED':
              navigate('/', { replace: true });
              showNotification('Your account has been deleted', 'success');
              break;
          }
        });

        authSubscription = subscription;
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          showNotification('Authentication error occurred', 'error');
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initializeAuth();

    // Cleanup function
    return () => {
      console.log('Cleaning up auth context...');
      mounted = false;
      if (authSubscription) {
        console.log('Unsubscribing from auth events...');
        authSubscription.unsubscribe();
      }
      authListenerInitialized.current = false;
    };
  }, [navigate, showNotification]);

  const signOut = async () => {
    try {
      console.log('Signing out...');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      // Clear session storage
      sessionStorage.clear();
      navigate('/', { replace: true });
      showNotification('Successfully signed out', 'success');
    } catch (error) {
      console.error('Sign out error:', error);
      showNotification('Failed to sign out', 'error');
    }
  };

  // Don't render children until auth is initialized
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};