import { supabase } from './supabase';
import { sendEmail } from './email';
import type { AuthError, User } from '@supabase/supabase-js';

// Password validation regex
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type AuthResponse = {
  user: User | null;
  error: AuthError | null;
};

// Validate password strength
const validatePassword = (password: string): string | null => {
  if (!PASSWORD_REGEX.test(password)) {
    return 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character';
  }
  return null;
};

// Validate email format
const validateEmail = (email: string): string | null => {
  if (!EMAIL_REGEX.test(email)) {
    return 'Please enter a valid email address';
  }
  return null;
};

// Rate limiting map
const loginAttempts = new Map<string, { count: number; timestamp: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

const checkRateLimit = (email: string): string | null => {
  const now = Date.now();
  const attempts = loginAttempts.get(email);

  if (attempts) {
    // Reset attempts if lockout duration has passed
    if (now - attempts.timestamp > LOCKOUT_DURATION) {
      loginAttempts.delete(email);
      return null;
    }

    if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
      const remainingTime = Math.ceil((LOCKOUT_DURATION - (now - attempts.timestamp)) / 60000);
      return `Too many login attempts. Please try again in ${remainingTime} minutes`;
    }
  }

  return null;
};

const updateLoginAttempts = (email: string) => {
  const attempts = loginAttempts.get(email);
  if (attempts) {
    attempts.count += 1;
    attempts.timestamp = Date.now();
  } else {
    loginAttempts.set(email, { count: 1, timestamp: Date.now() });
  }
};

export const signIn = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    // Validate email format
    const emailError = validateEmail(email);
    if (emailError) {
      return { 
        user: null, 
        error: { name: 'ValidationError', message: emailError } as AuthError 
      };
    }

    // Check rate limiting
    const rateLimitError = checkRateLimit(email);
    if (rateLimitError) {
      return { 
        user: null, 
        error: { name: 'RateLimitError', message: rateLimitError } as AuthError 
      };
    }

    // Attempt sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Update login attempts on failure
      updateLoginAttempts(email);
      console.error('Sign in error:', error);
      return { user: null, error };
    }

    // Clear login attempts on successful sign in
    loginAttempts.delete(email);

    return { user: data.user, error: null };
  } catch (error) {
    console.error('Sign in process error:', error);
    return {
      user: null,
      error: {
        name: 'AuthError',
        message: error instanceof Error ? error.message : 'Failed to sign in'
      } as AuthError
    };
  }
};

export const signUp = async (email: string, password: string, name: string): Promise<AuthResponse> => {
  try {
    // Validate email format
    const emailError = validateEmail(email);
    if (emailError) {
      return { 
        user: null, 
        error: { name: 'ValidationError', message: emailError } as AuthError 
      };
    }

    // Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) {
      return { 
        user: null, 
        error: { name: 'ValidationError', message: passwordError } as AuthError 
      };
    }

    // Check if email already exists in profiles
    const { data: existingProfiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email);

    if (existingProfiles && existingProfiles.length > 0) {
      return {
        user: null,
        error: { 
          name: 'AuthError', 
          message: 'An account with this email already exists' 
        } as AuthError
      };
    }

    // Create new user with email verification
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/email-verified`
      }
    });

    if (authError) {
      console.error('Signup error:', authError);
      return { user: null, error: authError };
    }

    if (!authData?.user) {
      return {
        user: null,
        error: { 
          name: 'SignUpError', 
          message: 'Failed to create account' 
        } as AuthError
      };
    }

    // Create profile for the user with XSS prevention
    const sanitizedName = name.replace(/[<>]/g, '');
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{ 
        id: authData.user.id,
        name: sanitizedName,
        email 
      }]);

    if (profileError) {
      console.error('Profile creation error:', profileError);
    }

    return { user: authData.user, error: null };
  } catch (error) {
    console.error('Signup error:', error);
    return { 
      user: null, 
      error: error instanceof Error ? error : { 
        name: 'SignUpError', 
        message: 'An unexpected error occurred during signup' 
      } as AuthError 
    };
  }
};

// Add a new function to verify email and set up session
export const verifyEmailAndSetSession = async (accessToken: string, refreshToken: string): Promise<AuthResponse> => {
  try {
    // First, verify that the tokens are valid
    const { data: { user: verifiedUser }, error: verifyError } = await supabase.auth.getUser(accessToken);
    
    if (verifyError || !verifiedUser) {
      throw verifyError || new Error('Invalid verification tokens');
    }

    // Set the session with the tokens
    const { data: { session }, error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    if (sessionError) throw sessionError;
    if (!session?.user) throw new Error('Failed to establish session');

    // Update user's email verification status in the profiles table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ email_verified: true })
      .eq('id', session.user.id);

    if (updateError) {
      console.error('Failed to update email verification status:', updateError);
    }

    return { user: session.user, error: null };
  } catch (error) {
    console.error('Email verification error:', error);
    return {
      user: null,
      error: error instanceof Error ? {
        name: 'VerificationError',
        message: error.message
      } as AuthError : {
        name: 'VerificationError',
        message: 'Failed to verify email'
      } as AuthError
    };
  }
};

export const refreshSession = async (): Promise<void> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session refresh error:', error);
      return;
    }

    if (!session) {
      await supabase.auth.refreshSession();
    }
  } catch (error) {
    console.error('Session refresh process error:', error);
  }
};

export const signOut = async (): Promise<{ error: AuthError | null }> => {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (error) {
    return {
      error: {
        name: 'SignOutError',
        message: error instanceof Error ? error.message : 'Failed to sign out'
      } as AuthError
    };
  }
};