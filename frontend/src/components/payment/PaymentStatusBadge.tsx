import React from 'react';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { paymentService } from '../../services/paymentService';

interface PaymentStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true
}) => {
  const getStatusIcon = (status: string) => {
    const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
    
    switch (status.toUpperCase()) {
      case 'PAID':
      case 'COMPLETED':
      case 'PURCHASED':
        return <CheckCircle className={`${iconSize} text-green-600`} />;
      case 'PENDING':
        return <Clock className={`${iconSize} text-yellow-600`} />;
      case 'FAILED':
        return <XCircle className={`${iconSize} text-red-600`} />;
      case 'CANCELLED':
        return <AlertCircle className={`${iconSize} text-red-600`} />;
      default:
        return <Clock className={`${iconSize} text-gray-600`} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PAID':
      case 'COMPLETED':
      case 'PURCHASED':
        return 'Paid';
      case 'PENDING':
        return 'Pending';
      case 'FAILED':
        return 'Failed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const badgeColor = paymentService.getPaymentStatusBadgeColor(status);

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${badgeColor} ${sizeClasses[size]}`}>
      {showIcon && getStatusIcon(status)}
      {getStatusText(status)}
    </span>
  );
};

export default PaymentStatusBadge;
