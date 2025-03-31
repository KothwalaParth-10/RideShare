import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client with specific configuration
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
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
    },
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  persistSession: true
});