import React, { useState, useEffect, useRef } from 'react';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface EmailConfirmationPageProps {
  email: string;
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
}

const EmailConfirmationPage: React.FC<EmailConfirmationPageProps> = ({ 
  email, 
  onNavigateToLogin, 
  onNavigateToRegister 
}) => {
  const [confirmationCode, setConfirmationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setError('Your registration has expired. Please register again.');
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: confirmationCode,
        type: 'signup'
      });

      if (error) throw error;

      if (data.user) {
        onNavigateToLogin();
      }
    } catch (err) {
      console.error('Confirmation error:', err);
      setError(err instanceof Error ? err.message : 'Invalid confirmation code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
  setIsResending(true);
  setError('');
  setSuccess('');

  try {
    const { error } = await supabase.auth.signUp({
      email,
      password: 'TemporaryPassword123!' // dummy password required
    });

    // Supabase may throw "already registered" error; still show success
    if (error && !error.message.includes('already registered')) throw error;

    setSuccess('New confirmation code sent to your email!');
    setTimeout(() => setSuccess(''), 3000);
  } catch (err) {
    console.error('Resend error:', err);
    setError(err instanceof Error ? err.message : 'Failed to resend confirmation code');
  } finally {
    setIsResending(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Header Section */}
          <div className="px-8 pt-8 pb-6 text-center">
            <div className="mb-6">
              <img src="/awk3_2.jpg" alt="AWK LLP" className="h-16 w-auto mx-auto" />
            </div>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h1>
            <p className="text-gray-600 text-sm mb-1">We've sent a confirmation code to</p>
            <p className="text-[#4d9837] font-semibold text-sm">{email}</p>

            {/* Countdown Timer */}
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 font-semibold">
                Time remaining: {formatTime(timeRemaining)}
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Your registration will expire if not confirmed within 10 minutes
              </p>
            </div>
          </div>

          {/* Form Section */}
          <div className="px-8 pb-8">
            <form onSubmit={handleConfirmation} className="space-y-6">
              <div>
                <label htmlFor="confirmationCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmation Code
                </label>
                <input
                  id="confirmationCode"
                  type="text"
                  ref={inputRef}
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4d9837] focus:border-transparent transition-colors placeholder-gray-400 text-center text-2xl font-mono tracking-widest"
                  placeholder="000000"
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Enter the 6-digit code from your email
                </p>
              </div>

              {/* Messages */}
              <div className="min-h-[20px]">
                {error && <p className="text-red-600 text-sm font-medium">{error}</p>}
                {success && <p className="text-green-600 text-sm font-medium">{success}</p>}
              </div>

              {/* Confirm Button */}
              <button
                type="submit"
                disabled={isLoading || confirmationCode.length !== 6}
                className="w-full bg-[#4d9837] hover:bg-[#3d7a2a] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Confirm Email
                  </>
                )}
              </button>
            </form>

            {/* Resend Code */}
            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm mb-3">Didn't receive the code?</p>
              <button
                onClick={handleResendCode}
                disabled={isResending}
                className="text-[#4d9837] hover:text-[#3d7a2a] font-semibold text-sm transition-colors duration-200 hover:underline disabled:opacity-50"
              >
                {isResending ? 'Sending...' : 'Resend Code'}
              </button>
            </div>

            {/* Navigation Links */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center space-y-3">
              <button
                onClick={onNavigateToRegister}
                className="text-gray-600 hover:text-gray-800 font-medium text-sm transition-colors duration-200 hover:underline inline-flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Registration
              </button>
              <div>
                <p className="text-gray-600 text-sm">
                  Already confirmed?{' '}
                  <button
                    onClick={onNavigateToLogin}
                    className="text-[#4d9837] hover:text-[#3d7a2a] font-semibold transition-colors duration-200 hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-xs">© 2024 AWK LLP. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmationPage;