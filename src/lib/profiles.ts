import { supabase } from './supabase';
import type { Database } from './database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export const getProfile = async (userId: string) => {
  // Fixed query to properly filter by id
  const { data, error } = await supabase
    .from('profiles')
    .select()
    .eq('id', userId)
    .single();

  if (error && error.code === 'PGRST116') {
    // If profile doesn't exist, create one with basic info
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          name: userData.user.email?.split('@')[0] || 'User',
          email: userData.user.email || '',
        }])
        .select()
        .single();

      return { profile: newProfile, error: createError };
    }
  }

  return { profile: data, error };
};

export const updateProfile = async (userId: string, updates: ProfileUpdate) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  return { profile: data, error };
};

export const uploadAvatar = async (userId: string, file: File) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Math.random()}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file);

  if (uploadError) {
    return { url: null, error: uploadError };
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
  
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: data.publicUrl })
    .eq('id', userId);

  return {
    url: data.publicUrl,
    error: updateError
  };
};