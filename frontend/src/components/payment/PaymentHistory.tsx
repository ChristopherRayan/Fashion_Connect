import React, { useState, useEffect } from 'react';
import { CreditCard, Smartphone, Calendar, User, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { paymentService, PaymentHistory as PaymentHistoryType, PaymentHistoryResponse } from '../../services/paymentService';
import { useNotification } from '../../contexts/NotificationContext';
import PaymentStatusBadge from './PaymentStatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';
import { getImageUrl } from '../../utils/imageUtils';
import { getFirstProductImageUrl } from '../../utils/productImageUtils';

const PaymentHistory: React.FC = () => {
  const { addToast } = useNotification();
  const [payments, setPayments] = useState<PaymentHistoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);

  useEffect(() => {
    fetchPaymentHistory();
  }, [currentPage]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getPaymentHistory({
        page: currentPage,
        limit: 10
      });

      setPayments(response.payments);
      setTotalPages(response.pagination.totalPages);
      setTotalPayments(response.pagination.totalPayments);
    } catch (error: any) {
      console.error('Error fetching payment history:', error);
      addToast('error', error.message || 'Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'card':
        return <CreditCard className="h-5 w-5 text-blue-600" />;
      case 'airtel':
        return <Smartphone className="h-5 w-5 text-red-600" />;
      default:
        return <CreditCard className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-MW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && currentPage === 1) {
    return <LoadingSpinner />;
  }

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
        <p className="text-sm text-gray-600 mt-1">
          {totalPayments > 0 ? `${totalPayments} payment${totalPayments !== 1 ? 's' : ''} found` : 'No payments found'}
        </p>
      </div>

      {/* Payment List */}
      <div className="divide-y divide-gray-200">
        {payments.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No payments yet</h3>
            <p className="text-gray-600">Your payment history will appear here once you make purchases.</p>
          </div>
        ) : (
          payments.map((payment) => (
            <div key={payment.orderId} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                {/* Payment Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getPaymentMethodIcon(payment.paymentMethod)}
                    <div>
                      <p className="font-medium text-gray-900">
                        Order #{payment.orderNumber}
                      </p>
                      <p className="text-sm text-gray-600">
                        {paymentService.formatAmount(payment.amount)}
                      </p>
                    </div>
                    <PaymentStatusBadge status={payment.paymentStatus} size="sm" />
                  </div>

                  {/* Designer Info */}
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {payment.designer.businessName || payment.designer.name}
                    </span>
                  </div>

                  {/* Items Preview */}
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4 text-gray-400" />
                    <div className="flex items-center gap-2">
                      {payment.items.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex items-center gap-1">
                          <img
                            src={getFirstProductImageUrl(item.product.images)}
                            alt={item.product.name}
                            className="w-6 h-6 rounded object-cover"
                          />
                          <span className="text-xs text-gray-600">
                            {item.product.name} (x{item.quantity})
                          </span>
                        </div>
                      ))}
                      {payment.itemCount > 3 && (
                        <span className="text-xs text-gray-500">
                          +{payment.itemCount - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Payment Date */}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {payment.paidAt 
                        ? `Paid on ${formatDate(payment.paidAt)}`
                        : `Initiated on ${formatDate(payment.paymentInitiatedAt)}`
                      }
                    </span>
                  </div>

                  {/* Payment Reference */}
                  {payment.paymentReference && (
                    <div className="mt-2">
                      <span className="text-xs text-gray-500">
                        Ref: {payment.paymentReference}
                      </span>
                    </div>
                  )}
                </div>

                {/* Amount */}
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">
                    {paymentService.formatAmount(payment.amount)}
                  </p>
                  <p className="text-sm text-gray-600 capitalize">
                    {payment.paymentMethod === 'airtel' ? 'Airtel Money' : 'Card Payment'}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || loading}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || loading}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
