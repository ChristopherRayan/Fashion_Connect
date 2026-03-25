import  { useState, useEffect } from 'react';
import { Package, ChevronRight, Filter, X, Download, MessageSquare, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/helpers';
import { useLanguage } from '../../contexts/LanguageContext';
import { analyticsService } from '../../services/analyticsService';
import { orderService, Order } from '../../services/orderService';
import { getFirstProductImageUrl } from '../../utils/productImageUtils';

// Order status types
type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

const Orders = () => {
  const { user } = useAuth();
  const { addToast } = useNotification();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState<'all' | 'regular' | 'custom'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | '30days' | '90days' | '6months' | '1year'>('all');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);

        // Fetch real orders from API
        const response = await orderService.getMyOrders({
          page: 1,
          limit: 50,
          sortBy: 'createdAt',
          sortType: 'desc'
        });

        setOrders(response.docs || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
        addToast('error', 'Failed to load orders');
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [addToast]);

  // Keep the mock data as fallback for demo purposes
  const getMockOrders = () => {
    return [
            {
              id: 'ORD12345',
              createdAt: '2025-06-15T10:30:00Z',
              status: 'delivered',
              totalAmount: 24500,
              items: [
                {
                  id: 'ITEM1',
                  name: 'Traditional Malawian Dress',
                  quantity: 1,
                  price: 24500,
                  image: 'https://images.unsplash.com/photo-1534126511673-b6899657816a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80'
                }
              ],
              designer: {
                id: 'D1',
                name: 'Grace Banda',
                avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80'
              },
              isCustomOrder: false,
              trackingNumber: 'TRK9876543',
              estimatedDelivery: '2025-06-20T00:00:00Z'
            },
            {
              id: 'ORD12346',
              createdAt: '2025-06-02T14:20:00Z',
              status: 'processing',
              totalAmount: 35000,
              items: [
                {
                  id: 'ITEM2',
                  name: 'Custom Wedding Suit',
                  quantity: 1,
                  price: 35000,
                  image: 'https://images.unsplash.com/photo-1598808503746-f34cfade3450?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80'
                }
              ],
              designer: {
                id: 'D2',
                name: 'David Mzungu',
                avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80'
              },
              isCustomOrder: true,
              estimatedDelivery: '2025-06-25T00:00:00Z'
            },
            {
              id: 'ORD12347',
              createdAt: '2025-05-20T09:15:00Z',
              status: 'completed',
              totalAmount: 12800,
              items: [
                {
                  id: 'ITEM3',
                  name: 'Chitenge Shirt',
                  quantity: 2,
                  price: 6400,
                  image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80'
                }
              ],
              designer: {
                id: 'D3',
                name: 'Takondwa Phiri',
                avatar: 'https://images.unsplash.com/photo-1532074205216-d0e1f4b87368?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80'
              },
              isCustomOrder: false,
              trackingNumber: 'TRK9876544',
              estimatedDelivery: '2025-05-28T00:00:00Z'
            },
            {
              id: 'ORD12348',
              createdAt: '2025-05-10T16:45:00Z',
              status: 'cancelled',
              totalAmount: 18700,
              items: [
                {
                  id: 'ITEM4',
                  name: 'Summer Dress Collection',
                  quantity: 1,
                  price: 18700,
                  image: 'https://images.unsplash.com/photo-1603400521630-9f2de124b33b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80'
                }
              ],
              designer: {
                id: 'D1',
                name: 'Grace Banda',
                avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80'
              },
              isCustomOrder: false
            },
            {
              id: 'ORD12349',
              createdAt: '2025-04-28T11:30:00Z',
              status: 'shipped',
              totalAmount: 42000,
              items: [
                {
                  id: 'ITEM5',
                  name: 'Custom Engagement Outfit',
                  quantity: 1,
                  price: 42000,
                  image: 'https://images.unsplash.com/photo-1545291730-faff8ca1d4b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80'
                }
              ],
              designer: {
                id: 'D4',
                name: 'Chikondi Tembo',
                avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80'
              },
              isCustomOrder: true,
              trackingNumber: 'TRK9876545',
              estimatedDelivery: '2025-05-05T00:00:00Z'
            }
          ];
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setOrderTypeFilter('all');
    setTimeFilter('all');
  };

  const hasActiveFilters = () => {
    return statusFilter !== 'all' || orderTypeFilter !== 'all' || timeFilter !== 'all';
  };

  const getTimeFilterDate = (filter: string): Date | null => {
    const now = new Date();
    switch (filter) {
      case '30days':
        return new Date(now.setDate(now.getDate() - 30));
      case '90days':
        return new Date(now.setDate(now.getDate() - 90));
      case '6months':
        return new Date(now.setMonth(now.getMonth() - 6));
      case '1year':
        return new Date(now.setFullYear(now.getFullYear() - 1));
      default:
        return null;
    }
  };

  const filteredOrders = orders.filter(order => {
    // Status filter
    if (statusFilter !== 'all' && order.status !== statusFilter) {
      return false;
    }
    
    // Order type filter
    if (orderTypeFilter === 'regular' && order.isCustomOrder) {
      return false;
    }
    if (orderTypeFilter === 'custom' && !order.isCustomOrder) {
      return false;
    }
    
    // Time filter
    if (timeFilter !== 'all') {
      const orderDate = new Date(order.createdAt);
      const filterDate = getTimeFilterDate(timeFilter);
      if (filterDate && orderDate < filterDate) {
        return false;
      }
    }
    
    return true;
  });

  const getStatusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const downloadInvoice = async (orderId: string) => {
    try {
      addToast('info', `Generating PDF invoice for order #${orderId.slice(-8)}...`);

      // Use the order service to generate PDF invoice
      const invoiceBlob = await orderService.generateInvoice(orderId, 'pdf');

      // Create download link
      const url = window.URL.createObjectURL(invoiceBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FashionConnect-Invoice-${orderId.slice(-8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      addToast('success', 'Invoice downloaded successfully!');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      addToast('error', 'Failed to generate invoice. Please try again or contact support if the issue persists.');
    }
  };

  const contactDesigner = (designerId: string, designerName: string) => {
    if (!designerId) {
      addToast('error', 'Designer information not available');
      return;
    }

    // Navigate to messages page with designer
    const messagesUrl = `/client/messages?designer=${designerId}&name=${encodeURIComponent(designerName)}`;
    window.open(messagesUrl, '_blank');
    addToast('success', `Opening chat with ${designerName}...`);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">My Orders</h1>
        
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={toggleFilters}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Filter className="mr-2 h-4 w-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            
            {hasActiveFilters() && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>{filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'} found</span>
          </div>
        </div>
        
        {showFilters && (
          <div className="mt-4 bg-gray-50 p-4 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  id="status-filter"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700">Order Type</label>
                <select
                  id="type-filter"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  value={orderTypeFilter}
                  onChange={(e) => setOrderTypeFilter(e.target.value as 'all' | 'regular' | 'custom')}
                >
                  <option value="all">All Types</option>
                  <option value="regular">Regular Orders</option>
                  <option value="custom">Custom Orders</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="time-filter" className="block text-sm font-medium text-gray-700">Time Period</label>
                <select
                  id="time-filter"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value as 'all' | '30days' | '90days' | '6months' | '1year')}
                >
                  <option value="all">All Time</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                  <option value="6months">Last 6 Months</option>
                  <option value="1year">Last Year</option>
                </select>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-6 space-y-6">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {hasActiveFilters()
                  ? 'Try adjusting your filters to see more orders.'
                  : 'You haven\'t placed any orders yet. Start shopping to see your orders here.'}
              </p>
              {!hasActiveFilters() && (
                <div className="mt-6">
                  <Link
                    to="/client/browse"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Start Shopping
                  </Link>
                </div>
              )}
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order._id} className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Order #{order._id} {order.isCustomOrder && <span className="ml-2 text-xs font-semibold uppercase tracking-wide bg-purple-100 text-purple-800 px-2 py-0.5 rounded">Custom</span>}
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      Placed on {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="mt-2 sm:mt-0">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                </div>
                
                <div className="border-t border-gray-200">
                  <div className="px-4 py-5 sm:p-6">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center py-3">
                        <div className="flex-shrink-0 w-16 h-16">
                          <img
                            src={getFirstProductImageUrl(item.product?.images)}
                            alt={item.product?.name || 'Product'}
                            className="w-16 h-16 rounded-md object-cover"
                          />
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="font-medium text-gray-900">{item.product?.name || 'Product'}</div>
                          <div className="mt-1 flex text-sm text-gray-500">
                            <span>Qty: {item.quantity}</span>
                            <span className="mx-2">•</span>
                            <span>MWK {item.price.toLocaleString()}</span>
                          </div>
                          {item.deliveryInfo && (
                            <div className="mt-1 text-xs text-blue-600">
                              <span className="font-medium">{item.deliveryInfo.type.charAt(0).toUpperCase() + item.deliveryInfo.type.slice(1)} Delivery:</span> 
                              {item.deliveryInfo.price > 0 ? ` +MWK ${item.deliveryInfo.price.toLocaleString()}` : ' FREE'} 
                              <span className="text-gray-500">({item.deliveryInfo.days} day{item.deliveryInfo.days !== 1 ? 's' : ''})</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {order.designer?.name?.charAt(0).toUpperCase() || 'D'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              Designer: {order.designer?.name || 'Unknown'}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          Total: MWK {order.totalAmount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-4 py-4 sm:px-6 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
                    <div className="flex items-center space-x-4">
                      <button
                        type="button"
                        onClick={() => downloadInvoice(order._id)}
                        className="inline-flex items-center text-sm text-gray-700 hover:text-gray-900"
                      >
                        <Download className="mr-1.5 h-4 w-4" />
                        Invoice
                      </button>
                      <button
                        type="button"
                        onClick={() => contactDesigner(order.designer?._id || '', order.designer?.name || 'Designer')}
                        className="inline-flex items-center text-sm text-gray-700 hover:text-gray-900"
                      >
                        <MessageSquare className="mr-1.5 h-4 w-4" />
                        Contact Designer
                      </button>
                    </div>
                    
                    <div className="flex items-center">
                      {(order.status === 'shipped' || order.status === 'delivered') && order.trackingNumber && (
                        <div className="text-sm text-gray-500 mr-4">
                          Tracking: <span className="font-medium">{order.trackingNumber}</span>
                        </div>
                      )}
                      
                      <a
                        href={`/client/order-detail/${order._id}`}
                        className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500"
                      >
                        View Details <ChevronRight className="ml-1 h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;
 