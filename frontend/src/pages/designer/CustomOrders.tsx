import React, { useState, useEffect } from 'react';
import {
  Package,
  User,
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle,
  Users,
  Eye,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Scissors,
  MessageSquare,
  ArrowLeft,
  Grid,
  List,
  Play,
  Check,
  Truck
} from 'lucide-react';
import { useSearchParams, Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { customOrderService } from '../../services/customOrderService';
import { CustomOrder, CustomOrderStatus } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import OrderAssignmentModal from '../../components/designer/OrderAssignment';
import { formatCurrency } from '../../utils/helpers';
import { getImageUrl } from '../../utils/imageUtils';

interface CustomOrdersResponse {
  docs: CustomOrder[];
  totalDocs: number;
  totalPages: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const CustomOrders: React.FC = () => {
  const { addToast } = useNotification();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<CustomOrdersResponse | null>(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<CustomOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<CustomOrder | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  // Determine if we're viewing a specific order
  const isDetailView = !!orderId;

  // Get current filters from URL
  const currentStatus = searchParams.get('status') || '';
  const currentPage = parseInt(searchParams.get('page') || '1');
  const searchQuery = searchParams.get('search') || '';

  // Add a console log when component first mounts
  useEffect(() => {
    console.log('🎉 CustomOrders component mounted!');
    console.log('👤 Current user:', user?.name, user?.role);
    console.log('🌐 Current path:', location.pathname);
  }, []);

  useEffect(() => {
    if (isDetailView && orderId) {
      fetchOrderDetail(orderId);
    } else {
      fetchOrders();
    }
  }, [isDetailView, orderId, currentStatus, currentPage, searchQuery]);

  const fetchOrderDetail = async (orderIdToFetch: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching order detail for:', orderIdToFetch);
      
      const orderDetail = await customOrderService.getCustomOrderById(orderIdToFetch);
      setSelectedOrderDetail(orderDetail);
      
      console.log('✅ Order detail fetched:', orderDetail);
      
    } catch (error) {
      console.error('❌ Error fetching order detail:', error);
      setError(error instanceof Error ? error.message : 'Failed to load order details');
      addToast('error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 CustomOrders: Component loaded and fetching custom orders...');
      console.log('📋 Query params:', { currentStatus, currentPage, searchQuery });
      console.log('🌐 Current URL path:', location.pathname);
      console.log('👤 Current user role:', { user: user?.name, role: user?.role });
      
      const params: any = {
        page: currentPage,
        limit: 10
      };
      
      if (currentStatus) params.status = currentStatus;
      if (searchQuery) params.search = searchQuery;
      
      console.log('🌐 Calling customOrderService.getDesignerCustomOrders with:', params);
      
      const data = await customOrderService.getDesignerCustomOrders(params);
      
      console.log('📦 Custom orders response:', data);
      console.log('📊 Orders count:', data.docs?.length || 0);
      console.log('📋 Total docs:', data.totalDocs);
      
      setOrders(data);
      
      if (data.docs && data.docs.length > 0) {
        console.log('✅ Custom orders found:');
        data.docs.forEach((order, index) => {
          console.log(`   ${index + 1}. ${order.productType} - ${order.status} - Customer: ${order.user?.name}`);
        });
      } else {
        console.log('⚠️  No custom orders found');
        console.log('📈 Total docs in response:', data.totalDocs);
        console.log('🔍 Query used:', { currentStatus, currentPage, searchQuery });
        console.log('👤 Designer ID should be:', user?._id || user?.id);
      }
      
    } catch (error) {
      console.error('❌ Error fetching custom orders:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        response: (error as any).response?.data,
        status: (error as any).response?.status
      });
      setError(error instanceof Error ? error.message : 'Failed to load custom orders');
      addToast('error', 'Failed to load custom orders');
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

  const handleAssignOrder = (order: CustomOrder) => {
    setSelectedOrder(order);
    setShowAssignModal(true);
  };

  const handleAssignSuccess = () => {
    fetchOrders(); // Refresh the list
  };

  const getStatusColor = (status: string): string => {
    const statusColors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'accepted': 'bg-blue-100 text-blue-800',
      'assigned_to_tailor': 'bg-purple-100 text-purple-800',
      'processing': 'bg-orange-100 text-orange-800',
      'tailor_completed': 'bg-green-100 text-green-800',
      'ready_for_shipping': 'bg-indigo-100 text-indigo-800',
      'shipped': 'bg-gray-100 text-gray-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'rejected': 'bg-red-100 text-red-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string): string => {
    const statusLabels: Record<string, string> = {
      'pending': 'Pending Review',
      'accepted': 'Accepted',
      'assigned_to_tailor': 'Assigned to Tailor',
      'processing': 'In Progress',
      'tailor_completed': 'Completed by Tailor',
      'ready_for_shipping': 'Ready for Shipping',
      'shipped': 'Shipped',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'rejected': 'Rejected',
    };
    return statusLabels[status] || status;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return Clock;
      case 'accepted':
      case 'assigned_to_tailor':
        return Users;
      case 'processing':
        return Play;
      case 'tailor_completed':
        return Check;
      case 'ready_for_shipping':
        return Truck;
      case 'completed':
        return CheckCircle;
      default:
        return Package;
    }
  };

  const canAssignToTailor = (order: CustomOrder): boolean => {
    return order.status === 'accepted' && !order.assignedTailor;
  };

  const getDaysUntilDue = (dueDate: string): number => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const statusOptions = [
    { value: '', label: 'All Orders' },
    { value: 'pending', label: 'Pending Review' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'assigned_to_tailor', label: 'Assigned to Tailor' },
    { value: 'processing', label: 'In Progress' },
    { value: 'tailor_completed', label: 'Completed by Tailor' },
    { value: 'ready_for_shipping', label: 'Ready for Shipping' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'completed', label: 'Completed' }
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading custom orders</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <div className="mt-6">
            <button
              onClick={() => {
                if (isDetailView && orderId) {
                  fetchOrderDetail(orderId);
                } else {
                  fetchOrders();
                }
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Detail view for specific order
  if (isDetailView && selectedOrderDetail) {
    const StatusIcon = getStatusIcon(selectedOrderDetail.status);
    const canAssign = canAssignToTailor(selectedOrderDetail);

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/designer/custom-orders')}
                className="mr-4 p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
                <p className="text-gray-600">Order #{selectedOrderDetail.id?.slice(-6)}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(selectedOrderDetail.status)}`}>
                <StatusIcon className="h-4 w-4 mr-2" />
                {getStatusLabel(selectedOrderDetail.status)}
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
                    {selectedOrderDetail.productReference?.productImage ? (
                      <div className="flex-shrink-0">
                        <img
                          src={getImageUrl(selectedOrderDetail.productReference.productImage)}
                          alt={selectedOrderDetail.productType}
                          className="h-24 w-24 rounded-lg object-cover border border-gray-200"
                        />
                      </div>
                    ) : (
                      <div className="flex-shrink-0">
                        <div className="h-24 w-24 rounded-lg bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center border border-gray-200">
                          <StatusIcon className="h-8 w-8 text-indigo-500" />
                        </div>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-medium text-gray-900 mb-2">{selectedOrderDetail.productType}</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Color:</span>
                          <span className="ml-2 text-gray-900">{selectedOrderDetail.color}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Price:</span>
                          <span className="ml-2 text-gray-900 font-semibold">{formatCurrency(selectedOrderDetail.estimatedPrice)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Delivery Type:</span>
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                            selectedOrderDetail.deliveryType === 'premium' ? 'bg-purple-100 text-purple-800' :
                            selectedOrderDetail.deliveryType === 'express' ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {selectedOrderDetail.deliveryType?.charAt(0).toUpperCase() + selectedOrderDetail.deliveryType?.slice(1) || 'Standard'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Collection:</span>
                          <span className="ml-2 text-gray-900">
                            {selectedOrderDetail.collectionMethod === 'pickup' ? 'Pickup' : 'Delivery'}
                          </span>
                        </div>
                      </div>
                      {selectedOrderDetail.productReference?.productName && (
                        <p className="text-sm text-gray-600 mt-2">Reference: {selectedOrderDetail.productReference.productName}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500">Due Date</p>
                          <p className="font-medium text-gray-900">{new Date(selectedOrderDetail.expectedDeliveryDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Truck className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500">Delivery Type</p>
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            selectedOrderDetail.deliveryType === 'premium' ? 'bg-purple-100 text-purple-800' :
                            selectedOrderDetail.deliveryType === 'express' ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {selectedOrderDetail.deliveryType?.charAt(0).toUpperCase() + selectedOrderDetail.deliveryType?.slice(1) || 'Standard'}
                            {selectedOrderDetail.deliveryType === 'premium' && ' (1-2 days)'}
                            {selectedOrderDetail.deliveryType === 'express' && ' (3-5 days)'}
                            {(!selectedOrderDetail.deliveryType || selectedOrderDetail.deliveryType === 'standard') && ' (7-14 days)'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500">Collection Method</p>
                          <p className="font-medium text-gray-900">
                            {selectedOrderDetail.collectionMethod === 'pickup' ? 'Pickup from Designer' : 'Home Delivery'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500">Total Price</p>
                          <p className="font-semibold text-gray-900 text-lg">{formatCurrency(selectedOrderDetail.estimatedPrice + (selectedOrderDetail.deliveryTimePrice || 0))}</p>
                          {selectedOrderDetail.deliveryTimePrice > 0 && (
                            <p className="text-xs text-gray-500">Includes delivery fee: {formatCurrency(selectedOrderDetail.deliveryTimePrice)}</p>
                          )}
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
                          <p className="font-medium text-gray-900">{selectedOrderDetail.user?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <MessageSquare className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium text-gray-900">{selectedOrderDetail.user?.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500">Due Date</p>
                          <p className="font-medium text-gray-900">{new Date(selectedOrderDetail.expectedDeliveryDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500">Delivery Location</p>
                          <p className="font-medium text-gray-900">{selectedOrderDetail.deliveryLocation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Notes */}
              {selectedOrderDetail.additionalNotes && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Order Notes</h2>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedOrderDetail.additionalNotes}</p>
                  </div>
                </div>
              )}

              {/* Order Timeline */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Order Timeline</h2>
                </div>
                <div className="p-6">
                  <div className="text-sm text-gray-600">
                    <p><strong>Order Created:</strong> {new Date(selectedOrderDetail.createdAt).toLocaleDateString()}</p>
                    {selectedOrderDetail.updatedAt && (
                      <p className="mt-1"><strong>Last Updated:</strong> {new Date(selectedOrderDetail.updatedAt).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              </div>
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
                    to={`/designer/messages?designerId=${selectedOrderDetail.user?.id}&productId=${selectedOrderDetail.id}`}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message Customer
                  </Link>
                  
                  {canAssign && (
                    <button
                      onClick={() => handleAssignOrder(selectedOrderDetail)}
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Assign to Tailor
                    </button>
                  )}
                </div>
              </div>

              {/* Assigned Tailor Info */}
              {selectedOrderDetail.assignedTailor && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Assigned Tailor</h2>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                        <Scissors className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div className="ml-4">
                        <p className="font-medium text-gray-900">{selectedOrderDetail.assignedTailor.name}</p>
                        <p className="text-sm text-gray-600">Professional Tailor</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Assignment Modal */}
        {showAssignModal && selectedOrder && (
          <OrderAssignmentModal
            isOpen={showAssignModal}
            onClose={() => {
              setShowAssignModal(false);
              setSelectedOrder(null);
            }}
            order={selectedOrder}
            onSuccess={() => {
              handleAssignSuccess();
              if (orderId) {
                fetchOrderDetail(orderId); // Refresh the detail view
              }
            }}
          />
        )}
      </div>
    );
  }

  // List view (default)
  if (!orders) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading custom orders</h3>
          <p className="mt-1 text-sm text-gray-500">Unable to load orders data</p>
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
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Custom Orders
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your custom order requests and assign them to tailors
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-2">
          {/* View Toggle */}
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center px-3 py-2 rounded-l-md border text-sm font-medium ${
                viewMode === 'list'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              <List className="h-4 w-4 mr-1" />
              List
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`inline-flex items-center px-3 py-2 rounded-r-md border-t border-r border-b text-sm font-medium ${
                viewMode === 'grid'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              <Grid className="h-4 w-4 mr-1" />
              Grid
            </button>
          </div>
          
          <button
            onClick={() => {
              console.log('🔄 Manual refresh triggered');
              fetchOrders();
            }}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            🔄 Debug Refresh
          </button>
          <button
            onClick={async () => {
              console.log('🧪 Testing API endpoint directly...');
              try {
                const token = localStorage.getItem('accessToken');
                const response = await fetch('http://localhost:8000/api/v1/custom-orders/designer-orders', {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                });
                const data = await response.json();
                console.log('🧪 Direct API test result:', { status: response.status, data });
                if (!response.ok) {
                  console.error('❌ API Error:', data);
                } else {
                  console.log('✅ API Success - Found orders:', data.data?.docs?.length || 0);
                }
              } catch (error) {
                console.error('❌ Direct API test failed:', error);
              }
            }}
            className="inline-flex items-center px-4 py-2 border border-indigo-300 rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            🧪 Test API
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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

      {/* Orders Display */}
      {viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {orders.docs.length === 0 ? (
            <div className="col-span-full">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="mx-auto h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                  <Package className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No custom orders found</h3>
                <p className="text-gray-600">
                  {currentStatus || searchQuery
                    ? 'Try adjusting your filters to see more orders.'
                    : 'Custom orders will appear here when customers request them.'}
                </p>
              </div>
            </div>
          ) : (
            orders.docs.map((order) => {
              const StatusIcon = getStatusIcon(order.status);
              const canAssign = canAssignToTailor(order);
              const daysUntilDue = getDaysUntilDue(order.expectedDeliveryDate);
              const isUrgent = daysUntilDue <= 3 && daysUntilDue >= 0;

              return (
                <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-300 transition-all duration-200 overflow-hidden group">
                  {/* Product Image */}
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    {(() => {
                      console.log('🖼️ Grid Order productReference:', order.productReference);
                      console.log('🖼️ Grid Order productImage:', order.productReference?.productImage);
                      console.log('🔍 Complete Order Object:', order);
                      console.log('🎯 Order ID:', order.id, 'Product Type:', order.productType);
                      return order.productReference?.productImage;
                    })() ? (
                      <img
                        src={getImageUrl(order.productReference?.productImage || '')}
                        alt={order.productType}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          console.error('❌ Failed to load grid image:', order.productReference?.productImage);
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
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
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

                    {/* Assigned Tailor */}
                    {order.assignedTailor && (
                      <div className="flex items-center text-sm text-indigo-600">
                        <Scissors className="h-4 w-4 mr-2 text-indigo-500 flex-shrink-0" />
                        <span className="truncate">Assigned to: {order.assignedTailor.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="p-4 bg-gray-50 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        to={`/designer/custom-orders/${order.id}`}
                        className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Link>

                      <Link
                        to={`/designer/messages?designerId=${order.user.id}&productId=${order.id}`}
                        className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Chat
                      </Link>
                    </div>

                    {/* Assign Button */}
                    {canAssign && (
                      <button
                        onClick={() => handleAssignOrder(order)}
                        className="w-full mt-2 inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                      >
                        <Users className="h-3 w-3 mr-1" />
                        Assign to Tailor
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* List View */
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {orders.docs.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No custom orders found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {currentStatus || searchQuery
                  ? 'Try adjusting your filters to see more orders.'
                  : 'Custom orders will appear here when customers request them.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {orders.docs.map((order) => {
                const StatusIcon = getStatusIcon(order.status);
                const canAssign = canAssignToTailor(order);
                
                return (
                  <li key={order.id} className="px-4 py-6 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        {/* Product Image */}
                        {(() => {
                          console.log('🖼️ List Order productReference:', order.productReference);
                          console.log('🖼️ List Order productImage:', order.productReference?.productImage);
                          return order.productReference?.productImage;
                        })() ? (
                          <div className="flex-shrink-0 mr-4">
                            <img
                              src={getImageUrl(order.productReference?.productImage || '')}
                              alt={order.productType}
                              className="h-16 w-16 rounded-lg object-cover border border-gray-200"
                              onError={(e) => {
                                console.error('❌ Failed to load list image:', order.productReference?.productImage);
                                e.currentTarget.src = '/api/placeholder/300/300';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 mr-4">
                            <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center border border-indigo-200">
                              <div className="text-center">
                                <Package className="h-6 w-6 text-indigo-500 mx-auto mb-1" />
                                <p className="text-xs font-medium text-indigo-600">{order.color}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-lg font-medium text-gray-900">
                                {order.productType}
                              </p>
                              <div className="flex items-center mt-1">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                  {getStatusLabel(order.status)}
                                </span>
                                <span className="ml-2 text-sm text-gray-500">
                                  Order #{order.id.slice(-6)}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-medium text-gray-900">
                                {formatCurrency(order.estimatedPrice)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <User className="flex-shrink-0 mr-1.5 h-4 w-4" />
                              <span>{order.user.name}</span>
                            </div>
                            <div className="flex items-center">
                              <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4" />
                              <span>Due: {new Date(order.expectedDeliveryDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center">
                              <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4" />
                              <span className="truncate">{order.deliveryLocation}</span>
                            </div>
                          </div>

                          {order.assignedTailor && (
                            <div className="mt-2 flex items-center">
                              <Scissors className="flex-shrink-0 mr-1.5 h-4 w-4 text-indigo-500" />
                              <span className="text-sm text-indigo-600">
                                Assigned to: {order.assignedTailor.name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-4 flex items-center space-x-2">
                        <Link
                          to={`/designer/custom-orders/${order.id}`}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                        
                        <Link
                          to={`/designer/messages?designerId=${order.user.id}&productId=${order.id}`}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Chat
                        </Link>
                        
                        {canAssign && (
                          <button
                            onClick={() => handleAssignOrder(order)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            <Users className="h-4 w-4 mr-1" />
                            Assign to Tailor
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

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

      {/* Assignment Modal */}
      {showAssignModal && selectedOrder && (
        <OrderAssignmentModal
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedOrder(null);
          }}
          order={selectedOrder}
          onSuccess={handleAssignSuccess}
        />
      )}
    </div>
  );
};

export default CustomOrders;