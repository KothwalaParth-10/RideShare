import { supabase } from './supabase';
import type { Database } from './database.types';

type Message = Database['public']['Tables']['chats']['Row'];

export const sendMessage = async (bookingId: string, senderId: string, message: string) => {
  const { data, error } = await supabase
    .from('chats')
    .insert([{
      booking_id: bookingId,
      sender_id: senderId,
      message
    }])
    .select()
    .single();

  return { message: data, error };
};

export const getMessages = async (bookingId: string) => {
  const { data, error } = await supabase
    .from('chats')
    .select(`
      *,
      profiles:sender_id (
        name,
        avatar_url
      )
    `)
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true });

  return { messages: data, error };
};

export const markMessagesAsRead = async (bookingId: string, senderId: string) => {
  const { error } = await supabase
    .from('chats')
    .update({ read: true })
    .eq('booking_id', bookingId)
    .eq('sender_id', senderId)
    .eq('read', false);

  return { error };
};