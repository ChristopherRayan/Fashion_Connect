import React from 'react';
import { CreditCard } from 'lucide-react';
import PaymentHistory from '../../components/payment/PaymentHistory';

const Payments: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <CreditCard className="h-8 w-8 text-yellow-500" />
          <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
        </div>
        <p className="text-gray-600">
          View and manage your payment history and transaction details
        </p>
      </div>

      {/* Payment History Component */}
      <PaymentHistory />
    </div>
  );
};

export default Payments;
