import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, 
  User, 
  MapPin, 
  Calendar, 
  CreditCard,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  FileText,
  Download,
  Edit3,
  MessageSquare
} from 'lucide-react';
import { orderService, Order } from '../../services/orderService';
import { useNotification } from '../../contexts/NotificationContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency } from '../../utils/helpers';
import { getImageUrl, handleImageError } from '../../utils/imageUtils';

const OrderDetails: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const { addToast } = useNotification();

  // Get customer info (handle both buyer and user fields)
  const getCustomerInfo = (order: Order) => {
    // Try multiple possible field names that the API might use
    const customer = order.buyer || order.user || (order as any).customer;

    return {
      name: customer?.name || (order as any).customerName || 'Unknown Customer',
      email: customer?.email || (order as any).customerEmail || 'No Email',
      phone: customer?.phone || order.shippingAddress?.phone || null
    };
  };

  // Get designer info
  const getDesignerInfo = (order: Order) => {
    return {
      name: order.designer?.name || order.designer?.businessName || 'N/A',
      email: order.designer?.email || 'N/A'
    };
  };

  // Fetch order details
  const fetchOrderDetails = async () => {
    if (!orderId) return;
    
    try {
      setLoading(true);
      const orderData = await orderService.getOrderById(orderId);
      console.log('📋 Order details received:', orderData);
      setOrder(orderData);
    } catch (error) {
      console.error('Error fetching order details:', error);
      addToast('error', 'Failed to fetch order details');
      navigate('/designer/orders');
    } finally {
      setLoading(false);
    }
  };

  // Update order status
  const handleStatusUpdate = async () => {
    if (!order || !newStatus) return;

    try {
      setUpdating(true);
      await orderService.updateOrderStatus(order._id, {
        status: newStatus.toUpperCase() as Order['status'], // Convert to uppercase for backend
        notes: statusNotes
      });

      addToast('success', 'Order status updated successfully');
      setShowStatusModal(false);
      setNewStatus('');
      setStatusNotes('');
      fetchOrderDetails(); // Refresh order data
    } catch (error) {
      console.error('Error updating order status:', error);
      addToast('error', 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  // Get status display info
  const getStatusDisplay = (status: string) => {
    const statusLower = status.toLowerCase().replace('_', ' ');
    switch (statusLower) {
      case 'pending':
        return { color: 'text-yellow-600 bg-yellow-100', icon: Clock, text: 'Pending' };
      case 'confirmed':
        return { color: 'text-blue-600 bg-blue-100', icon: CheckCircle, text: 'Confirmed' };
      case 'processing':
        return { color: 'text-purple-600 bg-purple-100', icon: Package, text: 'Processing' };
      case 'ready for shipping':
        return { color: 'text-orange-600 bg-orange-100', icon: Package, text: 'Ready for Shipping' };
      case 'shipped':
        return { color: 'text-indigo-600 bg-indigo-100', icon: Truck, text: 'Shipped' };
      case 'delivered':
        return { color: 'text-green-600 bg-green-100', icon: CheckCircle, text: 'Delivered' };
      case 'cancelled':
        return { color: 'text-red-600 bg-red-100', icon: XCircle, text: 'Cancelled' };
      default:
        return { color: 'text-gray-600 bg-gray-100', icon: Package, text: status };
    }
  };

  // Generate and download invoice
  const generateInvoice = async () => {
    if (!order) return;

    try {
      setUpdating(true);
      const invoiceBlob = await orderService.generateInvoice(order._id, 'pdf');

      // Create download link
      const url = window.URL.createObjectURL(invoiceBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${order._id.slice(-8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      addToast('success', 'PDF Invoice generated successfully');
    } catch (error) {
      console.error('Error generating invoice:', error);
      addToast('error', 'Failed to generate invoice');
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-4">The order you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/designer/orders')}
            className="px-4 py-2 bg-yellow-500 text-black rounded-md hover:bg-yellow-600 transition-colors"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const statusDisplay = getStatusDisplay(order.status);
  const StatusIcon = statusDisplay.icon;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/designer/orders')}
              className="mr-4 p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Order #{order._id.slice(-8)}
              </h1>
              <p className="text-gray-600">
                Placed on {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={generateInvoice}
              disabled={updating}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4 mr-2" />
              {updating ? 'Generating...' : 'Invoice'}
            </button>
            <button
              onClick={() => setShowStatusModal(true)}
              className="inline-flex items-center px-4 py-2 bg-yellow-500 text-black rounded-md hover:bg-yellow-600 transition-colors"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Update Status
            </button>
          </div>
        </div>

        {/* Order Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusDisplay.color}`}>
                <StatusIcon className="h-4 w-4 mr-2" />
                {statusDisplay.text}
              </span>
              {order.isCustomOrder && (
                <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Custom Order
                </span>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(order.totalAmount)}
              </p>
              <p className="text-sm text-gray-600">
                {order.items.length} item{order.items.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Customer Information
            </h2>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-lg font-semibold text-gray-900">{getCustomerInfo(order).name}</p>
                    <p className="text-sm text-gray-500">Customer</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Email Address</p>
                      <p className="text-gray-900">{getCustomerInfo(order).email}</p>
                    </div>
                  </div>

                  {getCustomerInfo(order).phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Phone Number</p>
                        <p className="text-gray-900">{getCustomerInfo(order).phone}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Customer Since</p>
                      <p className="text-gray-900">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Shipping Address
            </h2>
            {order.shippingAddress ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium text-gray-900">{order.shippingAddress.street}</p>
                    <p className="text-gray-700">
                      {order.shippingAddress.city}
                      {order.shippingAddress.state && `, ${order.shippingAddress.state}`}
                    </p>
                    <p className="text-gray-700">{order.shippingAddress.country}</p>
                    {order.shippingAddress.postalCode && (
                      <p className="text-gray-600 text-sm">Postal Code: {order.shippingAddress.postalCode}</p>
                    )}
                    {order.shippingAddress.phone && (
                      <div className="flex items-center mt-2 pt-2 border-t border-gray-200">
                        <Phone className="h-4 w-4 text-gray-400 mr-2" />
                        <p className="text-gray-700">{order.shippingAddress.phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No shipping address provided</p>
              </div>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Order Items
          </h2>
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                {item.product?.images?.[0] && (
                  <img
                    src={getImageUrl(item.product.images[0])}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded-md"
                    onError={handleImageError}
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{item.product?.name || 'Product'}</h3>
                  <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  {item.color && <p className="text-sm text-gray-600">Color: {item.color}</p>}
                  {item.size && <p className="text-sm text-gray-600">Size: {item.size}</p>}
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatCurrency(item.price)}</p>
                  <p className="text-sm text-gray-600">each</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment & Additional Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Payment Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Payment Information
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-600">Payment Method</p>
                <p className="text-gray-900 capitalize">{order.paymentMethod?.replace('_', ' ') || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Payment Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  order.paymentStatus === 'paid'
                    ? 'bg-green-100 text-green-800'
                    : order.paymentStatus === 'failed'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.paymentStatus || 'Pending'}
                </span>
              </div>
              {order.paymentReference && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Payment Reference</p>
                  <p className="text-gray-900 font-mono text-sm">{order.paymentReference}</p>
                </div>
              )}
            </div>
          </div>

          {/* Order Timeline */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Order Timeline
            </h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Order Placed</p>
                  <p className="text-xs text-gray-600">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              {order.deliveredAt && (
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Delivered</p>
                    <p className="text-xs text-gray-600">
                      {new Date(order.deliveredAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Order Notes
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">{order.notes}</p>
          </div>
        )}

        {/* Status Update Modal */}
        {showStatusModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Order Status</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  >
                    <option value="">Select status...</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="ready_for_shipping">Ready for Shipping</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    placeholder="Add any notes about this status update..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setNewStatus('');
                    setStatusNotes('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusUpdate}
                  disabled={!newStatus || updating}
                  className="px-4 py-2 bg-yellow-500 text-black rounded-md hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;
