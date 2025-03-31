import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { getProfile, updateProfile } from '../lib/profiles';
import type { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export const useProfile = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const { profile: userProfile, error: profileError } = await getProfile(user.id);
      if (profileError) throw profileError;
      setProfile(userProfile);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.id, showNotification]);

  useEffect(() => {
    if (user?.id) {
      loadProfile();
    }
  }, [user?.id]); // Only depend on user.id instead of the entire user object

  const updateUserProfile = async (updates: ProfileUpdate) => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const { profile: updatedProfile, error: updateError } = await updateProfile(user.id, updates);
      if (updateError) throw updateError;
      
      setProfile(updatedProfile);
      showNotification('Profile updated successfully!', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return { profile, loading, error, updateUserProfile, refreshProfile: loadProfile };
};