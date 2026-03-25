import  { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { UserRole } from '../../types';

const EmailVerificationPage = () => {
  const { verifyEmail, user } = useAuth();
  const { addToast } = useNotification();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get('token');
  const email = searchParams.get('email');
  
  useEffect(() => {
    if (user?.verified) {
      // User is already verified, redirect to appropriate dashboard
      navigate(getDashboardUrl());
      return;
    }
    
    if (token) {
      handleVerification();
    }
  }, [token, user]);
  
  const handleVerification = async () => {
    if (!token || !email) return;

    setVerifying(true);
    setError(null);

    try {
      const result = await verifyEmail(email, token);
      setVerified(true);
      addToast('success', 'Email verified successfully! You can now complete your registration.');

      // Redirect to registration with the verified token after 3 seconds
      setTimeout(() => {
        // Prefer role from query param, then sessionStorage, then default to buyer
        const urlRole = searchParams.get('role');
        const selectedRole = (urlRole || sessionStorage.getItem('selectedRole') || '').toString().toLowerCase();
        let registrationPath = '/register/buyer';
        if (selectedRole === 'designer') {
          registrationPath = '/register/designer';
        } else if (selectedRole === 'buyer') {
          registrationPath = '/register/buyer';
        } else {
          addToast('warning', 'Role not detected, defaulting to buyer registration.');
        }
        navigate(`${registrationPath}?email=${encodeURIComponent(email)}&token=${encodeURIComponent(result.token)}&verified=true`);
      }, 3000);
    } catch (err) {
      setError('Verification failed. The token may be invalid or expired.');
      addToast('error', 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };
  
  const getDashboardUrl = () => {
    if (!user) return '/login';
    switch (user.role) {
      case UserRole.CLIENT:
        return '/client';
      case UserRole.DESIGNER:
        return '/designer';
      case UserRole.ADMIN:
        return '/admin';
      default:
        return '/login';
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Mail className="h-12 w-12 text-primary-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {t('auth.verifyEmail')}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {token 
            ? 'We\'re verifying your email address...' 
            : 'Please check your email for a verification link.'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {verifying ? (
            <div className="text-center">
              <LoadingSpinner size="large" />
              <p className="mt-4 text-gray-500">Verifying your email address...</p>
            </div>
          ) : verified ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Email verified</h3>
              <p className="mt-2 text-sm text-gray-500">
                Your email has been successfully verified. You'll be redirected to your dashboard in a moment.
              </p>
            </div>
          ) : error ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Verification failed</h3>
              <p className="mt-2 text-sm text-gray-500">{error}</p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Back to login
                </button>
              </div>
            </div>
          ) : !token ? (
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-6">
                We have sent a verification link to your email address. Please click the link to verify your account.
              </p>
              <p className="text-sm text-gray-500">
                If you don't see the email, check your spam folder or click below to resend.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => {
                    // Simulated resend action
                    addToast('info', 'Verification email has been resent');
                  }}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Resend verification email
                </button>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Back to login
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;
 