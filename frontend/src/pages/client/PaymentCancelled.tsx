import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw, Package } from 'lucide-react';

const PaymentCancelled: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Cancelled Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>

          {/* Cancelled Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
          <p className="text-gray-600 mb-6">
            Your payment was cancelled. Don't worry, no charges were made to your account. 
            Your order is still pending and you can complete the payment anytime.
          </p>

          {/* Order Info */}
          {orderId && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">
                Order ID: <span className="font-medium text-gray-900">{orderId}</span>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Status: <span className="font-medium text-yellow-600">Payment Pending</span>
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {orderId && (
              <Link
                to={`/client/orders/${orderId}`}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Try Payment Again
              </Link>
            )}
            
            <Link
              to="/client/orders"
              className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              <Package className="h-5 w-5 mr-2" />
              View My Orders
            </Link>

            <Link
              to="/client"
              className="w-full text-gray-600 hover:text-gray-800 font-medium py-2 px-4 transition-colors duration-200 flex items-center justify-center"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Having trouble with payment? Contact our{' '}
            <Link to="/client/support" className="text-yellow-600 hover:text-yellow-700 font-medium">
              customer support
            </Link>{' '}
            for assistance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelled;
