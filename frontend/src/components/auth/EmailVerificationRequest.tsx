import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Mail, Send, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';

interface RequestState {
  loading: boolean;
  success: boolean;
  error: string | null;
  email: string;
  expiresAt?: string;
  expiresInMinutes?: number;
  messageId?: string;
  previewUrl?: string;
}

const EmailVerificationRequest: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { addToast } = useNotification();
  
  const [state, setState] = useState<RequestState>({
    loading: false,
    success: false,
    error: null,
    email: searchParams.get('email') || ''
  });

  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    // Countdown timer for rate limiting
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!state.email.trim()) {
      setState(prev => ({ ...prev, error: 'Email is required' }));
      return;
    }

    if (!validateEmail(state.email)) {
      setState(prev => ({ ...prev, error: 'Please enter a valid email address' }));
      return;
    }

    await requestVerification();
  };

  const requestVerification = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const selectedRole = sessionStorage.getItem('selectedRole');
      const response = await fetch('http://localhost:8000/api/v1/auth/request-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: state.email.trim(), role: selectedRole }),
      });

      const data = await response.json();

      if (response.ok) {
        setState(prev => ({
          ...prev,
          loading: false,
          success: true,
          error: null,
          expiresAt: data.data?.expiresAt,
          expiresInMinutes: data.data?.expiresInMinutes,
          messageId: data.data?.messageId,
          previewUrl: data.data?.previewUrl
        }));
        
        addToast('success', 'Verification email sent successfully!');
        setCountdown(120); // 2 minutes cooldown
      } else {
        let errorMessage = data.message || 'Failed to send verification email';
        
        // Handle specific error cases
        if (response.status === 409) {
          errorMessage = 'An account with this email already exists. You can sign in instead.';
        } else if (response.status === 429) {
          errorMessage = 'Please wait before requesting another verification email.';
          setCountdown(120); // 2 minutes cooldown
        } else if (response.status === 400) {
          errorMessage = 'Please enter a valid email address.';
        }

        setState(prev => ({
          ...prev,
          loading: false,
          success: false,
          error: errorMessage
        }));
        
        addToast('error', errorMessage);
      }
    } catch (error) {
      console.error('Request verification error:', error);
      const errorMessage = 'Network error. Please check your connection and try again.';
      
      setState(prev => ({
        ...prev,
        loading: false,
        success: false,
        error: errorMessage
      }));
      
      addToast('error', errorMessage);
    }
  };

  const handleResendVerification = async () => {
    if (countdown > 0) {
      addToast('warning', `Please wait ${countdown} seconds before requesting another email`);
      return;
    }

    await requestVerification();
  };

  const formatCountdown = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (state.success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            {/* Success Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>

            {/* Success Message */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Email Sent!</h1>
            <p className="text-gray-600 mb-6">
              We've sent a verification email to your inbox. Please check your email and click the verification link to continue.
            </p>

            {/* Email Info */}
            <div className="bg-green-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center mb-2">
                <Mail className="h-5 w-5 text-green-600 mr-2" />
                <span className="font-medium text-green-800">{state.email}</span>
              </div>
              {state.expiresInMinutes && (
                <div className="flex items-center justify-center">
                  <Clock className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-700">
                    Expires in {state.expiresInMinutes} minutes
                  </span>
                </div>
              )}
            </div>

            {/* Development Preview */}
            {state.previewUrl && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Development Mode:</strong> Preview your email
                </p>
                <a
                  href={state.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 text-sm underline"
                >
                  View Email Preview
                </a>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-medium text-gray-900 mb-2">Next Steps:</h3>
              <ol className="text-sm text-gray-600 space-y-1">
                <li>1. Check your email inbox</li>
                <li>2. Look for an email from FashionConnect</li>
                <li>3. Click the "Verify Email Address" button</li>
                <li>4. Complete your registration</li>
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleResendVerification}
                disabled={countdown > 0}
                className={`w-full font-medium py-3 px-4 rounded-lg transition-colors duration-200 ${
                  countdown > 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-yellow-400 hover:bg-yellow-500 text-black'
                }`}
              >
                {countdown > 0 ? (
                  <>
                    <Clock className="h-4 w-4 inline mr-2" />
                    Resend in {formatCountdown(countdown)}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 inline mr-2" />
                    Resend Verification Email
                  </>
                )}
              </button>
              
              <Link
                to="/login"
                className="block w-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
              >
                Back to Sign In
              </Link>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Didn't receive the email? Check your spam folder or{' '}
              <Link to="/support" className="text-yellow-600 hover:text-yellow-700 font-medium">
                contact support
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
              <Mail className="h-8 w-8 text-yellow-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h1>
            <p className="text-gray-600">
              Enter your email address to receive a verification link
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={state.email}
                onChange={(e) => setState(prev => ({ ...prev, email: e.target.value, error: null }))}
                className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors ${
                  state.error ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter your email address"
                disabled={state.loading}
                required
              />
              {state.error && (
                <div className="mt-2 flex items-center text-red-600">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  <span className="text-sm">{state.error}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={state.loading || countdown > 0}
              className={`w-full font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center ${
                state.loading || countdown > 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-yellow-400 hover:bg-yellow-500 text-black'
              }`}
            >
              {state.loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : countdown > 0 ? (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Wait {formatCountdown(countdown)}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Verification Email
                </>
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center space-y-2">
            <Link
              to="/login"
              className="block text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
            >
              Already have an account? Sign In
            </Link>
            <Link
              to="/register"
              className="block text-yellow-600 hover:text-yellow-700 font-medium transition-colors duration-200"
            >
              Back to Registration
            </Link>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            By verifying your email, you agree to our{' '}
            <Link to="/terms" className="text-yellow-600 hover:text-yellow-700 font-medium">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-yellow-600 hover:text-yellow-700 font-medium">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationRequest;
