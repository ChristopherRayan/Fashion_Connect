import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Scissors, ArrowRight } from 'lucide-react';
import Logo from '../../components/common/Logo';

const RoleSelectionPage = () => {
  const navigate = useNavigate();

  const handleRoleSelection = (role: 'buyer' | 'designer') => {
    // Store the selected role in sessionStorage and redirect to email verification with role in URL
    sessionStorage.setItem('selectedRole', role);
    navigate(`/register/verify-email?role=${role}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Logo size="lg" variant="dark" showIcon={true} />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Join FashionConnect
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Choose how you want to join our platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Buyer Registration */}
            <div 
              onClick={() => handleRoleSelection('buyer')}
              className="group cursor-pointer bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all duration-300"
            >
              <div className="text-center">
                <div className="bg-blue-500 rounded-full p-4 w-16 h-16 mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <ShoppingBag className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Register as Buyer</h3>
                <p className="text-gray-600 mb-4">
                  Browse and purchase custom fashion pieces from talented designers
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center justify-center">
                    <span>✓ Browse designer collections</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <span>✓ Order custom pieces</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <span>✓ Direct designer communication</span>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-center text-blue-600 font-medium group-hover:text-blue-700">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </div>
            </div>

            {/* Designer Registration */}
            <div 
              onClick={() => handleRoleSelection('designer')}
              className="group cursor-pointer bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-8 border-2 border-purple-200 hover:border-purple-400 hover:shadow-lg transition-all duration-300"
            >
              <div className="text-center">
                <div className="bg-purple-500 rounded-full p-4 w-16 h-16 mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Scissors className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Register as Designer</h3>
                <p className="text-gray-600 mb-4">
                  Showcase your talent and connect with customers seeking custom fashion
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center justify-center">
                    <span>✓ Showcase your portfolio</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <span>✓ Receive custom orders</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <span>✓ Build your brand</span>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-center text-purple-600 font-medium group-hover:text-purple-700">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionPage;
