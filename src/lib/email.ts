import { supabase } from './supabase';

type EmailType = 'welcome' | 'ride_offered' | 'ride_booked';

export const sendEmail = async (
  type: EmailType,
  userId: string,
  rideId?: string,
  bookingId?: string
) => {
  try {
    // Check if we have a valid session first
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('No active session for email sending');
      return { success: false, error: 'No active session' };
    }

    // For development environment, just log the email that would be sent
    if (import.meta.env.DEV) {
      console.log(`[DEV] Email would be sent: ${type} to user ${userId}`, {
        rideId,
        bookingId
      });
      return { success: true, error: null };
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/send-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          type,
          userId,
          rideId,
          bookingId,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Email service error:', errorData);
      throw new Error(errorData.message || 'Failed to send email');
    }

    const data = await response.json();
    return { success: true, data, error: null };
  } catch (error) {
    console.error('Error sending email:', error);
    // Return error but don't throw, so the app can continue functioning
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send email' 
    };
  }
};