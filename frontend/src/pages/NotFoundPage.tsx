import  { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Home } from 'lucide-react';

const NotFoundPage = () => {
  const { user } = useAuth();

  const getDashboardUrl = () => {
    if (!user) return '/';
    
    switch (user.role) {
      case 'client':
        return '/client';
      case 'designer':
        return '/designer';
      case 'admin':
        return '/admin';
      default:
        return '/';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-primary-100">
            <span className="text-primary-600 text-5xl font-bold">404</span>
          </div>
          <h1 className="mt-6 text-3xl font-extrabold text-gray-900">Page not found</h1>
          <p className="mt-2 text-sm text-gray-500">
            The page you are looking for doesn't exist or has been moved.
          </p>
          <div className="mt-6">
            <Link
              to={getDashboardUrl()}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Home className="mr-2 h-5 w-5" />
              Go to home page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
 