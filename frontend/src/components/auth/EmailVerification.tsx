import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Mail, Clock, AlertTriangle } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';

interface VerificationResult {
  success: boolean;
  message: string;
  email?: string;
  error?: string;
}

const EmailVerification: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useNotification();
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [countdown, setCountdown] = useState(5);

  const email = searchParams.get('email');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!email || !token) {
      setResult({
        success: false,
        message: 'Invalid verification link',
        error: 'Missing email or token parameters'
      });
      setIsVerifying(false);
      return;
    }

    verifyEmail();
  }, [email, token]);

  useEffect(() => {
    // Start countdown when verification is successful
    if (result?.success && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (result?.success && countdown === 0) {
      // Get the selected role - prefer URL param, then sessionStorage
      const urlRole = searchParams.get('role');
      const sessionRole = sessionStorage.getItem('selectedRole');
      let selectedRole = 'buyer'; // default

      if (urlRole) {
        selectedRole = urlRole.toLowerCase();
      } else if (sessionRole) {
        selectedRole = sessionRole.toLowerCase();
      }

      // Debug logging
      console.log('🔍 Role Detection Debug:', {
        urlRole,
        sessionRole,
        selectedRole,
        currentUrl: window.location.href,
        searchParams: Object.fromEntries(searchParams.entries())
      });

      // If no role can be determined, redirect to role selection with email pre-filled
      if (!urlRole && !sessionRole) {
        console.warn('⚠️ No role detected, redirecting to role selection');
        navigate(`/register?email=${encodeURIComponent(email || '')}&verified=true&token=${encodeURIComponent(token || '')}`);
        return;
      }

      // Ensure role is valid
      if (!['buyer', 'designer'].includes(selectedRole)) {
        console.warn('⚠️ Invalid role detected, defaulting to buyer:', selectedRole);
        selectedRole = 'buyer';
      }

      // Redirect to appropriate registration page with pre-filled email and token
      navigate(`/register/${selectedRole}?email=${encodeURIComponent(email || '')}&verified=true&token=${encodeURIComponent(token || '')}`);
    }
  }, [result, countdown, navigate, email]);

  const verifyEmail = async () => {
    try {
      setIsVerifying(true);

      const response = await fetch('http://localhost:8000/api/v1/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, token }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || 'Email verified successfully!',
          email: data.data?.email
        });
        addToast('success', 'Email verified successfully! Redirecting to registration...');
      } else {
        let errorMessage = data.message || 'Verification failed';
        
        // Handle specific error cases
        if (response.status === 410) {
          errorMessage = 'Verification link has expired. Please request a new one.';
        } else if (response.status === 404) {
          errorMessage = 'Invalid verification link. Please check your email for the correct link.';
        } else if (response.status === 429) {
          errorMessage = 'Too many verification attempts. Please request a new verification email.';
        } else if (response.status === 409) {
          errorMessage = 'An account with this email already exists. You can sign in instead.';
        }

        setResult({
          success: false,
          message: errorMessage,
          error: data.error
        });
        addToast('error', errorMessage);
      }
    } catch (error) {
      console.error('Verification error:', error);
      const errorMessage = 'Network error. Please check your connection and try again.';
      setResult({
        success: false,
        message: errorMessage,
        error: 'Network error'
      });
      addToast('error', errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRetryVerification = () => {
    setResult(null);
    verifyEmail();
  };

  const handleRequestNewVerification = () => {
    if (email) {
      navigate(`/request-verification?email=${encodeURIComponent(email)}`);
    } else {
      navigate('/request-verification');
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
              <Loader2 className="h-8 w-8 text-yellow-600 animate-spin" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Email</h1>
            <p className="text-gray-600 mb-4">
              Please wait while we verify your email address...
            </p>
            
            {email && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-600">
                  Verifying: <span className="font-medium text-gray-900">{email}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {result?.success ? (
            <>
              {/* Success State */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h1>
              <p className="text-gray-600 mb-6">
                {result.message}
              </p>
              
              {result.email && (
                <div className="bg-green-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center mb-2">
                    <Mail className="h-5 w-5 text-green-600 mr-2" />
                    <span className="font-medium text-green-800">{result.email}</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Your email has been successfully verified
                  </p>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                  <span className="font-medium text-yellow-800">
                    Redirecting in {countdown} seconds...
                  </span>
                </div>
                <p className="text-sm text-yellow-700">
                  You'll be redirected to complete your registration
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => navigate(`/register?email=${encodeURIComponent(email || '')}&verified=true`)}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                >
                  Continue to Registration
                </button>
                
                <Link
                  to="/login"
                  className="block w-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                >
                  Already have an account? Sign In
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* Error State */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
              <p className="text-gray-600 mb-6">
                {result?.message || 'Unable to verify your email address'}
              </p>
              
              {email && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center mb-2">
                    <Mail className="h-5 w-5 text-gray-600 mr-2" />
                    <span className="font-medium text-gray-900">{email}</span>
                  </div>
                </div>
              )}

              {result?.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center mb-2">
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                    <span className="font-medium text-red-800">Error Details</span>
                  </div>
                  <p className="text-sm text-red-700">{result.error}</p>
                </div>
              )}

              <div className="space-y-3">
                {result?.message?.includes('expired') || result?.message?.includes('attempts') ? (
                  <button
                    onClick={handleRequestNewVerification}
                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                  >
                    Request New Verification Email
                  </button>
                ) : (
                  <button
                    onClick={handleRetryVerification}
                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                  >
                    Try Again
                  </button>
                )}
                
                <Link
                  to="/request-verification"
                  className="block w-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                >
                  Request New Verification
                </Link>
                
                <Link
                  to="/login"
                  className="block w-full text-gray-600 hover:text-gray-800 font-medium py-2 px-4 transition-colors duration-200"
                >
                  Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact our{' '}
            <Link to="/support" className="text-yellow-600 hover:text-yellow-700 font-medium">
              customer support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
