import { supabase } from './supabase';

// Add your SMS service credentials
const SMS_API_KEY = import.meta.env.VITE_SMS_API_KEY;
const SMS_API_SECRET = import.meta.env.VITE_SMS_API_SECRET;

export const sendOTP = async (phoneNumber: string) => {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in database
    const { error: dbError } = await supabase
      .from('phone_verification')
      .insert([{
        phone_number: phoneNumber,
        otp,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes expiry
      }]);

    if (dbError) throw dbError;

    // For development, log the OTP
    console.log('Development OTP:', otp);
    
    // TODO: Uncomment and configure your SMS service
    /*
    const client = require('twilio')(SMS_API_KEY, SMS_API_SECRET);
    await client.messages.create({
      body: `Your RideShare verification code is: ${otp}`,
      to: phoneNumber,
      from: 'YOUR_TWILIO_PHONE_NUMBER'
    });
    */
    
    return { success: true };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return { success: false, error };
  }
};

export const verifyOTP = async (phoneNumber: string, otp: string) => {
  try {
    const { data, error } = await supabase
      .rpc('verify_phone_otp', {
        p_phone_number: phoneNumber,
        p_otp: otp
      });

    if (error) throw error;

    return { verified: data };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return { verified: false, error };
  }
};