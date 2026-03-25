import React, { useState, useEffect } from 'react';
import { X, CreditCard, Smartphone, Loader2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { paymentService, PaymentMethod, PaymentOrder, MobilePayment, PaymentStatus } from '../../services/paymentService';
import { useNotification } from '../../contexts/NotificationContext';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  amount: number;
  onPaymentSuccess: (paymentData: any) => void;
  onPaymentError: (error: string) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  orderId,
  amount,
  onPaymentSuccess,
  onPaymentError
}) => {
  const { addToast } = useNotification();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentWindow, setPaymentWindow] = useState<Window | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [currentStep, setCurrentStep] = useState<'select' | 'process' | 'status'>('select');

  useEffect(() => {
    if (isOpen) {
      fetchPaymentMethods();
      setCurrentStep('select');
      setSelectedMethod('');
      setPhoneNumber('');
      setPaymentStatus(null);
    }
  }, [isOpen]);

  useEffect(() => {
    // Clean up payment window on unmount
    return () => {
      if (paymentWindow && !paymentWindow.closed) {
        paymentWindow.close();
      }
    };
  }, [paymentWindow]);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const methods = await paymentService.getPaymentMethods();
      setPaymentMethods(methods.filter(method => method.enabled));
      if (methods.length > 0) {
        setSelectedMethod(methods[0].id);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      addToast('error', 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleCardPayment = async () => {
    try {
      setProcessing(true);
      setCurrentStep('process');

      const paymentOrder = await paymentService.createPaymentOrder({
        orderId,
        paymentMethod: 'card',
        amount,
        redirectUrl: `${window.location.origin}/client/orders/${orderId}/payment-success`,
        cancelUrl: `${window.location.origin}/client/orders/${orderId}/payment-cancelled`
      });

      // Open payment page in new window
      const newWindow = paymentService.openPaymentPage(paymentOrder.paymentPageUrl);
      setPaymentWindow(newWindow);

      // Start polling for payment status
      setCurrentStep('status');
      startPaymentStatusPolling();

    } catch (error: any) {
      console.error('Error processing card payment:', error);
      addToast('error', error.message || 'Failed to process card payment');
      onPaymentError(error.message || 'Card payment failed');
      setCurrentStep('select');
    } finally {
      setProcessing(false);
    }
  };

  const handleMobilePayment = async () => {
    if (!paymentService.validateAirtelPhone(phoneNumber)) {
      addToast('error', 'Please enter a valid Airtel phone number (099, 088, or 089)');
      return;
    }

    try {
      setProcessing(true);
      setCurrentStep('process');

      const mobilePayment = await paymentService.processMobilePayment({
        orderId,
        phone: phoneNumber,
        amount
      });

      addToast('success', 'Payment request sent to your phone. Please complete the payment.');
      
      // Start polling for payment status
      setCurrentStep('status');
      startPaymentStatusPolling();

    } catch (error: any) {
      console.error('Error processing mobile payment:', error);
      addToast('error', error.message || 'Failed to process mobile payment');
      onPaymentError(error.message || 'Mobile payment failed');
      setCurrentStep('select');
    } finally {
      setProcessing(false);
    }
  };

  const startPaymentStatusPolling = () => {
    paymentService.pollPaymentStatus(
      orderId,
      (status) => {
        setPaymentStatus(status);
        
        if (['PAID', 'COMPLETED', 'PURCHASED'].includes(status.paymentStatus.toUpperCase())) {
          addToast('success', 'Payment completed successfully!');
          onPaymentSuccess(status);
          onClose();
        } else if (['FAILED', 'CANCELLED'].includes(status.paymentStatus.toUpperCase())) {
          addToast('error', 'Payment failed or was cancelled');
          onPaymentError(status.message || 'Payment failed');
          setCurrentStep('select');
        }
      },
      30, // Max 30 attempts
      5000 // 5 second intervals
    );
  };

  const handlePayment = () => {
    if (selectedMethod === 'card') {
      handleCardPayment();
    } else if (selectedMethod === 'airtel') {
      handleMobilePayment();
    }
  };

  const getMethodIcon = (methodId: string) => {
    switch (methodId) {
      case 'card':
        return <CreditCard className="h-6 w-6" />;
      case 'airtel':
        return <Smartphone className="h-6 w-6" />;
      default:
        return <CreditCard className="h-6 w-6" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Complete Payment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Amount Display */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                {paymentService.formatAmount(amount)}
              </p>
            </div>
          </div>

          {/* Step 1: Select Payment Method */}
          {currentStep === 'select' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Choose Payment Method</h3>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedMethod === method.id
                          ? 'border-yellow-500 bg-yellow-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={selectedMethod === method.id}
                        onChange={(e) => setSelectedMethod(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex items-center flex-1">
                        <div className={`mr-3 ${selectedMethod === method.id ? 'text-yellow-600' : 'text-gray-400'}`}>
                          {getMethodIcon(method.id)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{method.name}</p>
                          <p className="text-sm text-gray-600">{method.description}</p>
                          <p className="text-xs text-gray-500">Processing time: {method.processingTime}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {/* Phone Number Input for Airtel Money */}
              {selectedMethod === 'airtel' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Airtel Money Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="099 123 4567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter your Airtel Money number (099, 088, or 089)
                  </p>
                </div>
              )}

              {/* Payment Button */}
              <button
                onClick={handlePayment}
                disabled={processing || !selectedMethod || (selectedMethod === 'airtel' && !phoneNumber)}
                className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-black font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  `Pay ${paymentService.formatAmount(amount)}`
                )}
              </button>
            </div>
          )}

          {/* Step 2: Processing */}
          {currentStep === 'process' && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Processing Payment</h3>
              <p className="text-gray-600">
                {selectedMethod === 'card' 
                  ? 'Redirecting to secure payment page...' 
                  : 'Sending payment request to your phone...'}
              </p>
            </div>
          )}

          {/* Step 3: Payment Status */}
          {currentStep === 'status' && (
            <div className="text-center py-8">
              {paymentStatus ? (
                <div>
                  {['PAID', 'COMPLETED', 'PURCHASED'].includes(paymentStatus.paymentStatus.toUpperCase()) ? (
                    <>
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Successful!</h3>
                      <p className="text-gray-600">Your payment has been processed successfully.</p>
                    </>
                  ) : ['FAILED', 'CANCELLED'].includes(paymentStatus.paymentStatus.toUpperCase()) ? (
                    <>
                      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Failed</h3>
                      <p className="text-gray-600">{paymentStatus.message || 'Payment could not be processed.'}</p>
                    </>
                  ) : (
                    <>
                      <Loader2 className="h-12 w-12 animate-spin text-yellow-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Waiting for Payment</h3>
                      <p className="text-gray-600">
                        {selectedMethod === 'card' 
                          ? 'Please complete the payment in the opened window.' 
                          : 'Please check your phone and complete the payment.'}
                      </p>
                      {selectedMethod === 'card' && paymentWindow && (
                        <button
                          onClick={() => paymentWindow.focus()}
                          className="mt-4 text-yellow-600 hover:text-yellow-700 flex items-center justify-center mx-auto"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Open Payment Window
                        </button>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <>
                  <Loader2 className="h-12 w-12 animate-spin text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Checking Payment Status</h3>
                  <p className="text-gray-600">Please wait while we verify your payment...</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
