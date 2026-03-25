import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight, Loader2 } from 'lucide-react';
import { paymentService } from '../../services/paymentService';
import { useNotification } from '../../contexts/NotificationContext';

const PaymentSuccess: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { addToast } = useNotification();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<any>(null);

  useEffect(() => {
    if (orderId) {
      checkPaymentStatus();
    } else {
      navigate('/client/orders');
    }
  }, [orderId]);

  const checkPaymentStatus = async () => {
    try {
      setLoading(true);
      const status = await paymentService.checkPaymentStatus(orderId!);
      setPaymentStatus(status);

      if (['PAID', 'COMPLETED', 'PURCHASED'].includes(status.paymentStatus.toUpperCase())) {
        addToast('success', 'Payment completed successfully!');
      } else {
        addToast('warning', 'Payment is still being processed. Please check back later.');
      }
    } catch (error: any) {
      console.error('Error checking payment status:', error);
      addToast('error', 'Failed to verify payment status');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying Payment</h2>
          <p className="text-gray-600">Please wait while we confirm your payment...</p>
        </div>
      </div>
    );
  }

  const isPaymentSuccessful = paymentStatus && ['PAID', 'COMPLETED', 'PURCHASED'].includes(paymentStatus.paymentStatus.toUpperCase());

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {isPaymentSuccessful ? (
            <>
              {/* Success Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>

              {/* Success Message */}
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
              <p className="text-gray-600 mb-6">
                Your payment has been processed successfully. Your order is now confirmed and will be processed by the designer.
              </p>

              {/* Payment Details */}
              {paymentStatus && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                  <h3 className="font-medium text-gray-900 mb-3">Payment Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order ID:</span>
                      <span className="font-medium">{paymentStatus.orderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-medium">{paymentService.formatAmount(paymentStatus.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="font-medium capitalize">
                        {paymentStatus.paymentMethod === 'airtel' ? 'Airtel Money' : 'Card Payment'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reference:</span>
                      <span className="font-medium text-xs">{paymentStatus.reference}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <Link
                  to="/client/orders"
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                >
                  <Package className="h-5 w-5 mr-2" />
                  View My Orders
                </Link>
                <Link
                  to="/client"
                  className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                >
                  Continue Shopping
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* Pending/Failed Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
                <Loader2 className="h-8 w-8 text-yellow-600 animate-spin" />
              </div>

              {/* Pending Message */}
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Processing</h1>
              <p className="text-gray-600 mb-6">
                Your payment is still being processed. This may take a few minutes to complete.
              </p>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={checkPaymentStatus}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                >
                  Check Payment Status
                </button>
                <Link
                  to="/client/orders"
                  className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                >
                  <Package className="h-5 w-5 mr-2" />
                  View My Orders
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact our{' '}
            <Link to="/client/support" className="text-yellow-600 hover:text-yellow-700 font-medium">
              customer support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
