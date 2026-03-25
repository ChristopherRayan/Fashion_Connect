import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Package, 
  Clock, 
  Play, 
  Check, 
  Truck,
  MessageSquare,
  Phone,
  Mail,
  Eye,
  ArrowRight
} from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { tailorService } from '../../services/tailorService';
import { CustomOrder } from '../../types';
import { getImageUrl } from '../../utils/imageUtils';

const TailorOrderDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { addToast } = useNotification();
  
  const [order, setOrder] = useState<CustomOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetail();
    }
  }, [orderId]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tailorService.getTailorOrderById(orderId!);
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order detail:', error);
      setError(error instanceof Error ? error.message : 'Failed to load order details');
      addToast('error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;
    
    try {
      setUpdatingStatus(true);
      await tailorService.updateOrderStatus(order.id, {
        status: newStatus,
        notes: `Status updated to ${newStatus} by tailor`
      });
      
      addToast('success', 'Order status updated successfully');
      await fetchOrderDetail(); // Refresh the order details
    } catch (error) {
      console.error('Error updating order status:', error);
      addToast('error', error instanceof Error ? error.message : 'Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusColor = (status: string): string => {
    const statusColors: Record<string, string> = {
      'assigned_to_tailor': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'processing': 'bg-amber-100 text-amber-800 border-amber-200',
      'tailor_completed': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'ready_for_shipping': 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusLabel = (status: string): string => {
    const statusLabels: Record<string, string> = {
      'assigned_to_tailor': 'Assigned',
      'processing': 'In Progress',
      'tailor_completed': 'Completed',
      'ready_for_shipping': 'Ready for Shipping',
    };
    return statusLabels[status] || status;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assigned_to_tailor':
        return Clock;
      case 'processing':
        return Play;
      case 'tailor_completed':
        return Check;
      case 'ready_for_shipping':
        return Truck;
      default:
        return Package;
    }
  };

  const canUpdateStatus = (status: string): boolean => {
    return ['assigned_to_tailor', 'processing'].includes(status);
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const nextStatus: Record<string, string> = {
      'assigned_to_tailor': 'processing',
      'processing': 'tailor_completed',
    };
    return nextStatus[currentStatus] || null;
  };

  const getNextStatusLabel = (currentStatus: string): string => {
    const nextStatus = getNextStatus(currentStatus);
    if (!nextStatus) return '';
    
    const labels: Record<string, string> = {
      'processing': 'Start Working',
      'tailor_completed': 'Mark as Completed',
    };
    return labels[nextStatus] || 'Update Status';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-600 mb-8">{error || 'The order you\'re looking for doesn\'t exist or you don\'t have permission to view it.'}</p>
          <Link
            to="/tailor/orders"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(order.status);
  const canUpdate = canUpdateStatus(order.status);
  const nextStatus = getNextStatus(order.status);
  const nextStatusLabel = getNextStatusLabel(order.status);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/tailor/orders')}
              className="mr-4 p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
              <p className="text-gray-600">Order #{order.id.slice(-6)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
              <StatusIcon className="h-4 w-4 mr-2" />
              {getStatusLabel(order.status)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Product Information</h2>
              </div>
              <div className="p-6">
                <div className="flex items-start space-x-4">
                  {order.productReference?.productImage && (
                    <div className="flex-shrink-0">
                      <img
                        src={getImageUrl(order.productReference.productImage)}
                        alt={order.productType}
                        className="h-20 w-20 rounded-lg object-cover border border-gray-200"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{order.productType}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Color:</span>
                        <span className="ml-2 text-gray-900">{order.color}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Price:</span>
                        <span className="ml-2 text-gray-900">MWK {order.estimatedPrice.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Delivery Type:</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                          order.deliveryType === 'premium' ? 'bg-purple-100 text-purple-800' :
                          order.deliveryType === 'express' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {order.deliveryType?.charAt(0).toUpperCase() + order.deliveryType?.slice(1) || 'Standard'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Collection:</span>
                        <span className="ml-2 text-gray-900">
                          {order.collectionMethod === 'pickup' ? 'Pickup' : 'Delivery'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Customer Information</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Customer</p>
                        <p className="font-medium text-gray-900">{order.user.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium text-gray-900">{order.user.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Due Date</p>
                        <p className="font-medium text-gray-900">{new Date(order.expectedDeliveryDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Delivery Location</p>
                        <p className="font-medium text-gray-900">{order.deliveryLocation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Measurements */}
            {order.measurements && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Measurements</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    {Object.entries(order.measurements).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <span className="font-medium text-gray-900">{value}"</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-6 space-y-3">
                <Link
                  to={`/tailor/messages?orderId=${order.id}`}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message Customer
                </Link>
                
                {canUpdate && nextStatus && (
                  <button
                    onClick={() => handleStatusUpdate(nextStatus)}
                    disabled={updatingStatus}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updatingStatus ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    ) : (
                      <ArrowRight className="h-4 w-4 mr-2" />
                    )}
                    {updatingStatus ? 'Updating...' : nextStatusLabel}
                  </button>
                )}
              </div>
            </div>

            {/* Designer Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Designer</h2>
              </div>
              <div className="p-6">
                <div className="space-y-2">
                  <p className="font-medium text-gray-900">{order.designer.name}</p>
                  {order.designer.businessName && (
                    <p className="text-sm text-gray-600">{order.designer.businessName}</p>
                  )}
                  <p className="text-sm text-gray-500">{order.designer.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TailorOrderDetail;