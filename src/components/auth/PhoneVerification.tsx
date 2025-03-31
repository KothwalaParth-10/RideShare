import React, { useState } from 'react';
import { Phone } from 'lucide-react';
import { sendOTP, verifyOTP } from '../../lib/phone';

interface PhoneVerificationProps {
  phoneNumber: string;
  onVerified: () => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export const PhoneVerification: React.FC<PhoneVerificationProps> = ({
  phoneNumber,
  onVerified,
  error,
  setError
}) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);

  const handleSendOTP = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { success, error: otpError } = await sendOTP(phoneNumber);
      
      if (!success) {
        throw new Error(otpError?.message || 'Failed to send OTP');
      }

      setShowOtpInput(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    try {
      setLoading(true);
      setError(null);

      const { verified, error: verifyError } = await verifyOTP(phoneNumber, otp);
      
      if (!verified) {
        throw new Error(verifyError?.message || 'Invalid OTP');
      }

      onVerified();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Phone className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-600">{phoneNumber}</span>
        </div>
        {!showOtpInput && (
          <button
            onClick={handleSendOTP}
            disabled={loading}
            className="text-sm text-blue-600 hover:text-blue-500 font-medium disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        )}
      </div>

      {showOtpInput && (
        <div>
          <input
            type="text"
            maxLength={6}
            placeholder="Enter OTP"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          />
          <div className="mt-2 flex justify-between items-center">
            <button
              onClick={handleSendOTP}
              disabled={loading}
              className="text-sm text-gray-600 hover:text-gray-500"
            >
              Resend OTP
            </button>
            <button
              onClick={handleVerifyOTP}
              disabled={loading || otp.length !== 6}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};