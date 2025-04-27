import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Get environment variables with fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://znbbjanyymvpnckmzyhb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuYmJqYW55eW12cG5ja216eWhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwNTkyOTQsImV4cCI6MjA1MDYzNTI5NH0.8_VyULLskgp2xqOJafoFDuDp4-vny_1thZl-neLORMY';

// Create Supabase client with specific configuration
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'supabase.auth.token',
    storage: {
      getItem: (key) => {
        try {
          return sessionStorage.getItem(key);
        } catch (error) {
          console.error('Error accessing sessionStorage:', error);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          sessionStorage.setItem(key, value);
        } catch (error) {
          console.error('Error setting sessionStorage:', error);
        }
      },
      removeItem: (key) => {
        try {
          sessionStorage.removeItem(key);
        } catch (error) {
          console.error('Error removing from sessionStorage:', error);
        }
      }
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Test the connection
supabase.auth.getSession().then(({ data: { session }, error }) => {
  if (error) {
    console.error('Supabase connection error:', error);
  } else {
    console.log('Supabase connected successfully');
  }
});