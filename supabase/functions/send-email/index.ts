import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { Resend } from 'https://esm.sh/resend@2.1.0';

// Initialize Resend with API key from environment variables
const resendApiKey = Deno.env.get('RESEND_API_KEY');
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Initialize Supabase client with environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailPayload {
  type: 'welcome' | 'ride_offered' | 'ride_booked';
  userId: string;
  rideId?: string;
  bookingId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Check if Resend is configured
    if (!resend) {
      console.log('Resend API key not configured. Email would be sent in production.');
      return new Response(
        JSON.stringify({ 
          message: 'Email service not configured. This is expected in development.' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    const payload: EmailPayload = await req.json();
    
    // Get user data from database
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', payload.userId)
      .single();

    if (userError || !user) {
      throw new Error(`User not found: ${userError?.message || 'Unknown error'}`);
    }

    let emailData;

    switch (payload.type) {
      case 'welcome':
        emailData = {
          from: 'RideShare <noreply@rideshare.com>',
          to: user.email,
          subject: 'Welcome to RideShare!',
          html: `
            <h1>Welcome to RideShare, ${user.name}!</h1>
            <p>Thank you for joining our community. We're excited to help you find and share rides!</p>
            <p>Get started by:</p>
            <ul>
              <li>Completing your profile</li>
              <li>Finding a ride</li>
              <li>Offering a ride</li>
            </ul>
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <p>Happy riding!</p>
            <p>Best regards,<br>The RideShare Team</p>
          `
        };
        break;

      case 'ride_offered':
        if (!payload.rideId) throw new Error('Ride ID is required');
        
        const { data: ride, error: rideError } = await supabase
          .from('rides')
          .select('from_location, to_location, departure_date, departure_time')
          .eq('id', payload.rideId)
          .single();

        if (rideError || !ride) throw new Error(`Ride not found: ${rideError?.message || 'Unknown error'}`);

        emailData = {
          from: 'RideShare <noreply@rideshare.com>',
          to: user.email,
          subject: 'Your Ride Has Been Published!',
          html: `
            <h1>Ride Successfully Published</h1>
            <p>Hi ${user.name},</p>
            <p>Your ride has been successfully published on RideShare:</p>
            <ul>
              <li>From: ${ride.from_location}</li>
              <li>To: ${ride.to_location}</li>
              <li>Date: ${ride.departure_date}</li>
              <li>Time: ${ride.departure_time}</li>
            </ul>
            <p>We'll notify you when someone books your ride.</p>
          `
        };
        break;

      case 'ride_booked':
        if (!payload.bookingId) throw new Error('Booking ID is required');
        
        const { data: booking, error: bookingError } = await supabase
          .from('bookings')
          .select(`
            seats_booked,
            rides (
              from_location,
              to_location,
              departure_date,
              departure_time,
              driver_id,
              profiles (
                name,
                email
              )
            )
          `)
          .eq('id', payload.bookingId)
          .single();

        if (bookingError || !booking) throw new Error(`Booking not found: ${bookingError?.message || 'Unknown error'}`);

        // Send email to passenger
        await resend.emails.send({
          from: 'RideShare <noreply@rideshare.com>',
          to: user.email,
          subject: 'Ride Booking Confirmation',
          html: `
            <h1>Your Ride Booking is Confirmed!</h1>
            <p>Hi ${user.name},</p>
            <p>Your ride has been successfully booked:</p>
            <ul>
              <li>From: ${booking.rides.from_location}</li>
              <li>To: ${booking.rides.to_location}</li>
              <li>Date: ${booking.rides.departure_date}</li>
              <li>Time: ${booking.rides.departure_time}</li>
              <li>Seats: ${booking.seats_booked}</li>
              <li>Driver: ${booking.rides.profiles.name}</li>
            </ul>
          `
        });

        // Send email to driver
        emailData = {
          from: 'RideShare <noreply@rideshare.com>',
          to: booking.rides.profiles.email,
          subject: 'New Ride Booking',
          html: `
            <h1>New Booking for Your Ride</h1>
            <p>Hi ${booking.rides.profiles.name},</p>
            <p>${user.name} has booked ${booking.seats_booked} seat(s) for your ride:</p>
            <ul>
              <li>From: ${booking.rides.from_location}</li>
              <li>To: ${booking.rides.to_location}</li>
              <li>Date: ${booking.rides.departure_date}</li>
              <li>Time: ${booking.rides.departure_time}</li>
            </ul>
          `
        };
        break;

      default:
        throw new Error('Invalid email type');
    }

    // Send the email
    const { error: emailError } = await resend.emails.send(emailData);
    if (emailError) throw emailError;

    return new Response(
      JSON.stringify({ message: 'Email sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Email function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});