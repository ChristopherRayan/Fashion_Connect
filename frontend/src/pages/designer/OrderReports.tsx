import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Download,
  Filter,
  Search,
  TrendingUp,
  Package,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  FileText,
  BarChart3,
  Mail,
  Phone,
  MapPin,
  Edit3
} from 'lucide-react';
import { orderService, Order } from '../../services/orderService';
import { useNotification } from '../../contexts/NotificationContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency } from '../../utils/helpers';

interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
}

interface DateRange {
  startDate: string;
  endDate: string;
}

const OrderReports: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    averageOrderValue: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0] // today
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const { addToast } = useNotification();

  // Fetch orders and calculate stats
  const fetchOrdersAndStats = async () => {
    try {
      setLoading(true);
      
      // Fetch orders with filters
      const params = {
        page: currentPage,
        limit: 20,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        sortBy: 'createdAt',
        sortType: 'desc' as const
      };

      const response = await orderService.getDesignerOrders(params);
      console.log('📦 Orders received:', response?.docs);

      // Safely handle the response
      if (response && response.docs) {
        console.log('📦 First order structure:', response.docs[0]);
        setOrders(response.docs);
        setTotalPages(response.totalPages || 0);
      } else {
        console.warn('📦 No orders data received or invalid response structure');
        setOrders([]);
        setTotalPages(0);
      }

      // Calculate stats from all orders (not just current page)
      const allOrdersResponse = await orderService.getDesignerOrders({
        page: 1,
        limit: 1000, // Get all orders for stats
        sortBy: 'createdAt',
        sortType: 'desc' as const
      });

      // Safely handle stats calculation
      if (allOrdersResponse && allOrdersResponse.docs) {
        calculateStats(allOrdersResponse.docs);
      } else {
        console.warn('📊 No orders data for stats calculation');
        // Reset stats to default values
        setStats({
          totalRevenue: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          pendingOrders: 0,
          completedOrders: 0,
          cancelledOrders: 0
        });
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      addToast('error', 'Failed to fetch order reports');
    } finally {
      setLoading(false);
    }
  };

  // Calculate order statistics
  const calculateStats = (allOrders: Order[]) => {
    const totalOrders = allOrders.length;
    const totalRevenue = allOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const pendingOrders = allOrders.filter(order => 
      ['pending', 'confirmed', 'processing'].includes(order.status.toLowerCase())
    ).length;
    const completedOrders = allOrders.filter(order => 
      order.status.toLowerCase() === 'delivered'
    ).length;
    const cancelledOrders = allOrders.filter(order => 
      order.status.toLowerCase() === 'cancelled'
    ).length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    setStats({
      totalOrders,
      totalRevenue,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      averageOrderValue
    });
  };

  // Get customer info (handle both buyer and user fields)
  const getCustomerInfo = (order: Order) => {
    // Try multiple possible field names that the API might use
    const customer = order.buyer || order.user || (order as any).customer;

    // Log the order structure for debugging
    if (!customer || (!customer.name && !customer.email)) {
      console.log('🔍 Order structure for debugging:', {
        orderId: order._id,
        buyer: order.buyer,
        user: order.user,
        customer: (order as any).customer,
        fullOrder: order
      });
    }

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

  // Filter orders based on search query
  const filteredOrders = orders.filter(order => {
    const customer = getCustomerInfo(order);
    const matchesSearch = searchQuery === '' ||
      order._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  // Get status color and icon
  const getStatusDisplay = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'pending':
        return { color: 'text-yellow-600 bg-yellow-100', icon: Clock, text: 'Pending' };
      case 'confirmed':
        return { color: 'text-blue-600 bg-blue-100', icon: CheckCircle, text: 'Confirmed' };
      case 'processing':
        return { color: 'text-purple-600 bg-purple-100', icon: Package, text: 'Processing' };
      case 'shipped':
        return { color: 'text-indigo-600 bg-indigo-100', icon: TrendingUp, text: 'Shipped' };
      case 'delivered':
        return { color: 'text-green-600 bg-green-100', icon: CheckCircle, text: 'Delivered' };
      case 'cancelled':
        return { color: 'text-red-600 bg-red-100', icon: XCircle, text: 'Cancelled' };
      default:
        return { color: 'text-gray-600 bg-gray-100', icon: AlertCircle, text: status };
    }
  };

  // Update order status
  const handleStatusUpdate = async () => {
    if (!selectedOrder || !newStatus) return;

    try {
      setUpdating(true);
      await orderService.updateOrderStatus(selectedOrder._id, {
        status: newStatus.toUpperCase() as Order['status'], // Convert to uppercase for backend
        notes: statusNotes
      });

      addToast('success', 'Order status updated successfully');
      setShowStatusModal(false);
      setSelectedOrder(null);
      setNewStatus('');
      setStatusNotes('');
      fetchOrdersAndStats(); // Refresh orders
    } catch (error) {
      console.error('Error updating order status:', error);
      addToast('error', 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  // Open status update modal
  const openStatusModal = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setShowStatusModal(true);
  };

  // Generate and download invoice
  const handleGenerateInvoice = async (order: Order) => {
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

  // Export orders to CSV
  const exportToCSV = () => {
    const csvContent = [
      ['Order ID', 'Customer Name', 'Customer Email', 'Date', 'Status', 'Items', 'Total Amount', 'Payment Method'].join(','),
      ...filteredOrders.map(order => {
        const customer = getCustomerInfo(order);
        return [
          order._id,
          customer.name,
          customer.email,
          new Date(order.createdAt).toLocaleDateString(),
          order.status,
          order.items.length,
          order.totalAmount,
          order.paymentMethod || 'N/A'
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order-reports-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    addToast('success', 'Order report exported successfully');
  };

  useEffect(() => {
    fetchOrdersAndStats();
  }, [currentPage, statusFilter]);

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Reports</h1>
          <p className="text-gray-600">Track and analyze your order performance</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.averageOrderValue)}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Export Button */}
            <button
              onClick={exportToCSV}
              className="inline-flex items-center px-4 py-2 bg-yellow-500 text-black rounded-md hover:bg-yellow-600 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            <p className="text-sm text-gray-600 mt-1">
              Showing {filteredOrders.length} of {stats.totalOrders} orders
            </p>
          </div>

          {filteredOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => {
                    const statusDisplay = getStatusDisplay(order.status);
                    const StatusIcon = statusDisplay.icon;

                    return (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            #{order._id.slice(-8)}
                          </div>
                          {order.isCustomOrder && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                              Custom Order
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {(() => {
                            const customer = getCustomerInfo(order);
                            return (
                              <div className="space-y-1">
                                <div className="text-sm font-medium text-gray-900">
                                  {customer.name}
                                </div>
                                <div className="text-sm text-gray-500 flex items-center">
                                  <Mail className="h-3 w-3 mr-1" />
                                  {customer.email}
                                </div>
                                {customer.phone && (
                                  <div className="text-sm text-gray-500 flex items-center">
                                    <Phone className="h-3 w-3 mr-1" />
                                    {customer.phone}
                                  </div>
                                )}
                                {order.shippingAddress?.city && (
                                  <div className="text-sm text-gray-500 flex items-center">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {order.shippingAddress.city}, {order.shippingAddress.country}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusDisplay.color}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusDisplay.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(order.totalAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                // Navigate to order details
                                window.open(`/designer/orders/${order._id}`, '_blank');
                              }}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openStatusModal(order)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Update Status"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleGenerateInvoice(order)}
                              disabled={updating}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                              title="Generate Invoice"
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'No orders found' : 'No orders yet'}
              </h3>
              <p className="text-gray-600">
                {searchQuery
                  ? `No orders match "${searchQuery}". Try adjusting your search.`
                  : 'Orders will appear here once customers start purchasing your products.'
                }
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 px-4 py-2 bg-yellow-500 text-black rounded-md hover:bg-yellow-600 transition-colors"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Status Update Modal */}
        {showStatusModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Update Order Status
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Order #{selectedOrder._id.slice(-8)} - {getCustomerInfo(selectedOrder).name}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Status: <span className="font-semibold">{selectedOrder.status}</span>
                  </label>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
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
                    setSelectedOrder(null);
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

export default OrderReports;
