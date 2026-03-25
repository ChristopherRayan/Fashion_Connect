import React, { useState, useEffect } from 'react';
import {
  Package,
  User,
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle,
  Eye,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Scissors,
  MessageSquare,
  Edit,
  ArrowRight,
  Play,
  Check,
  Truck,
  Star,
  Phone,
  Mail
} from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { tailorService } from '../../services/tailorService';
import { CustomOrder } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency } from '../../utils/helpers';
import { getImageUrl } from '../../utils/imageUtils';

interface TailorOrdersResponse {
  docs: CustomOrder[];
  totalDocs: number;
  totalPages: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const TailorOrders: React.FC = () => {
  const { addToast } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<TailorOrdersResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Get current filters from URL
  const currentStatus = searchParams.get('status') || '';
  const currentPage = parseInt(searchParams.get('page') || '1');
  const searchQuery = searchParams.get('search') || '';
  const filterType = searchParams.get('filter') || '';

  useEffect(() => {
    fetchOrders();
  }, [currentStatus, currentPage, searchQuery, filterType]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        page: currentPage,
        limit: 20  // Increased limit for better grid display
      };
      
      if (currentStatus) params.status = currentStatus;
      if (searchQuery) params.search = searchQuery;
      if (filterType === 'urgent') {
        // Filter for orders due within 3 days
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        params.dueBefore = threeDaysFromNow.toISOString();
      }
      
      const data = await tailorService.getTailorOrders(params);
      setOrders(data);
    } catch (error) {
      console.error('Error fetching tailor orders:', error);
      setError(error instanceof Error ? error.message : 'Failed to load orders');
      addToast('error', 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateSearchParams = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    // Reset to page 1 when changing filters
    if (key !== 'page') {
      newParams.set('page', '1');
    }
    setSearchParams(newParams);
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatus(orderId);
      await tailorService.updateOrderStatus(orderId, {
        status: newStatus,
        notes: `Status updated to ${newStatus} by tailor`
      });
      
      addToast('success', 'Order status updated successfully');
      fetchOrders(); // Refresh the list
    } catch (error) {
      console.error('Error updating order status:', error);
      addToast('error', error instanceof Error ? error.message : 'Failed to update order status');
    } finally {
      setUpdatingStatus(null);
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

  const getProgressSteps = (status: string) => {
    const steps = [
      { key: 'assigned_to_tailor', label: 'Assigned', icon: Clock },
      { key: 'processing', label: 'Working', icon: Play },
      { key: 'tailor_completed', label: 'Completed', icon: Check },
      { key: 'ready_for_shipping', label: 'Ready', icon: Truck }
    ];

    const currentIndex = steps.findIndex(step => step.key === status);
    return steps.map((step, index) => ({
      ...step,
      completed: index < currentIndex,
      current: index === currentIndex,
      upcoming: index > currentIndex
    }));
  };

  const canUpdateStatus = (order: CustomOrder): boolean => {
    return ['assigned_to_tailor', 'processing'].includes(order.status);
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

  const getDaysUntilDue = (dueDate: string): number => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };


  const statusOptions = [
    { value: '', label: 'All Orders' },
    { value: 'assigned_to_tailor', label: 'Assigned' },
    { value: 'processing', label: 'In Progress' },
    { value: 'tailor_completed', label: 'Completed' }
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !orders) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading orders</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <div className="mt-6">
            <button
              onClick={fetchOrders}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg border-l-4 border-indigo-500">
        <div className="px-6 py-4">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <Package className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-2xl font-bold leading-7 text-gray-900">
                My Orders
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Manage your assigned orders and update their status
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            {/* Status Filter */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                value={currentStatus}
                onChange={(e) => updateSearchParams('status', e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Type */}
            <div>
              <label htmlFor="filter" className="block text-sm font-medium text-gray-700">
                Filter
              </label>
              <select
                id="filter"
                value={filterType}
                onChange={(e) => updateSearchParams('filter', e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="">All Orders</option>
                <option value="urgent">Urgent (Due Soon)</option>
              </select>
            </div>

            {/* Search */}
            <div className="sm:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                Search
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="search"
                  value={searchQuery}
                  onChange={(e) => updateSearchParams('search', e.target.value)}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Search by product type, customer name..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {orders.docs.length === 0 ? (
          <div className="col-span-full">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="mx-auto h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <Scissors className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-600">
                {currentStatus || searchQuery || filterType
                  ? 'Try adjusting your filters to see more orders.'
                  : 'Orders assigned to you will appear here.'}
              </p>
            </div>
          </div>
        ) : (
          orders.docs.map((order) => {
            const StatusIcon = getStatusIcon(order.status);
            const canUpdate = canUpdateStatus(order);
            const nextStatus = getNextStatus(order.status);
            const nextStatusLabel = getNextStatusLabel(order.status);
            const daysUntilDue = getDaysUntilDue(order.expectedDeliveryDate);
            const isUrgent = daysUntilDue <= 3 && daysUntilDue >= 0;

            return (
              <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-300 transition-all duration-200 overflow-hidden group">
                {/* Product Image */}
                <div className="aspect-square bg-gray-100 overflow-hidden">
                  {(() => {
                    console.log('🖼️ Tailor Order productReference:', order.productReference);
                    console.log('🖼️ Tailor Order productImage:', order.productReference?.productImage);
                    return order.productReference?.productImage;
                  })() ? (
                    <img
                      src={getImageUrl(order.productReference?.productImage || '')}
                      alt={order.productType}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                        console.error('❌ Failed to load tailor image:', order.productReference?.productImage);
                        e.currentTarget.src = '/api/placeholder/300/300';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100">
                      <div className="text-center p-4">
                        <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-white" />
                        </div>
                        <p className="text-sm font-semibold text-gray-700 mb-1">{order.productType}</p>
                        <p className="text-xs text-indigo-600 font-medium">{order.color}</p>
                        <p className="text-xs text-gray-500 mt-1">Custom Order</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Card Header */}
                <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        isUrgent ? 'bg-red-100' : 'bg-indigo-100'
                      }`}>
                        <StatusIcon className={`h-5 w-5 ${
                          isUrgent ? 'text-red-600' : 'text-indigo-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{order.productType}</h3>
                        <p className="text-xs text-gray-500">#{order.id.slice(-6)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-indigo-600">{formatCurrency(order.estimatedPrice)}</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {getStatusLabel(order.status)}
                    </span>
                    {isUrgent && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {daysUntilDue === 0 ? 'Due Today' : `${daysUntilDue}d left`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3">
                  {/* Customer Info */}
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                    <span className="font-medium truncate">{order.user.name}</span>
                  </div>

                  {/* Due Date */}
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{new Date(order.expectedDeliveryDate).toLocaleDateString()}</span>
                  </div>

                  {/* Location */}
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{order.deliveryLocation}</span>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to={`/tailor/orders/${order.id}`}
                      className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Link>

                    <Link
                      to={`/tailor/messages?orderId=${order.id}`}
                      className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Chat
                    </Link>
                  </div>

                  {/* Status Update Button */}
                  {canUpdate && nextStatus && (
                    <button
                      onClick={() => handleStatusUpdate(order.id, nextStatus)}
                      disabled={updatingStatus === order.id}
                      className="w-full mt-2 inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {updatingStatus === order.id ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1" />
                      ) : (
                        <ArrowRight className="h-3 w-3 mr-1" />
                      )}
                      {updatingStatus === order.id ? 'Updating...' : nextStatusLabel}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {orders.totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => updateSearchParams('page', (currentPage - 1).toString())}
              disabled={!orders.hasPrevPage}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => updateSearchParams('page', (currentPage + 1).toString())}
              disabled={!orders.hasNextPage}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">
                  {(currentPage - 1) * orders.limit + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * orders.limit, orders.totalDocs)}
                </span>{' '}
                of{' '}
                <span className="font-medium">{orders.totalDocs}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => updateSearchParams('page', (currentPage - 1).toString())}
                  disabled={!orders.hasPrevPage}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  Page {currentPage} of {orders.totalPages}
                </span>
                <button
                  onClick={() => updateSearchParams('page', (currentPage + 1).toString())}
                  disabled={!orders.hasNextPage}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TailorOrders;