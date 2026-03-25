import  { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, Package, Truck, CheckCircle, Clock, AlertCircle, Eye, Download, Check, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { orderService, Order as ApiOrder } from '../../services/orderService';
import { analyticsService } from '../../services/analyticsService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { getFirstProductImageUrl } from '../../utils/productImageUtils';

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface OrderItem {
  id: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  customizations?: {
    color?: string;
    size?: string;
    notes?: string;
  };
}

interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  totalPrice: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  shippingAddress: {
    street: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  };
  isCustomOrder: boolean;
  paymentMethod: string;
  trackingNumber?: string;
  notes?: string;
}

// Mock data for demonstration
const mockOrders: Order[] = [
  {
    id: 'ORD12345',
    customerId: 'cust1',
    customerName: 'Chikondi Banda',
    customerEmail: 'chikondi@example.com',
    customerPhone: '+265 991234567',
    items: [
      {
        id: 'item1',
        productId: 'p1',
        name: 'Traditional Chitenge Dress',
        image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80',
        price: 25000,
        quantity: 1,
        customizations: {
          color: 'Blue',
          size: 'M'
        }
      }
    ],
    totalPrice: 25000,
    status: 'pending',
    createdAt: '2025-12-01T14:30:00Z',
    updatedAt: '2025-12-01T14:30:00Z',
    shippingAddress: {
      street: '123 Chilembwe Road',
      city: 'Blantyre',
      region: 'Southern Region',
      postalCode: 'BT01',
      country: 'Malawi'
    },
    isCustomOrder: false,
    paymentMethod: 'Mpamba'
  },
  {
    id: 'ORD12346',
    customerId: 'cust2',
    customerName: 'Tiyamike Nkhoma',
    customerEmail: 'tiyamike@example.com',
    customerPhone: '+265 881234567',
    items: [
      {
        id: 'item2',
        productId: 'p2',
        name: 'Modern African Print Blazer',
        image: 'https://images.unsplash.com/photo-1593030942428-a5451dca4b42?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80',
        price: 35000,
        quantity: 1
      },
      {
        id: 'item3',
        productId: 'p3',
        name: 'Handcrafted Beaded Necklace',
        image: 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80',
        price: 8000,
        quantity: 2
      }
    ],
    totalPrice: 51000,
    status: 'processing',
    createdAt: '2025-11-25T10:15:00Z',
    updatedAt: '2025-11-26T09:20:00Z',
    shippingAddress: {
      street: '456 Independence Avenue',
      city: 'Lilongwe',
      region: 'Central Region',
      postalCode: 'LL01',
      country: 'Malawi'
    },
    isCustomOrder: false,
    paymentMethod: 'Airtel Money'
  },
  {
    id: 'ORD12347',
    customerId: 'cust3',
    customerName: 'Kondwani Phiri',
    customerEmail: 'kondwani@example.com',
    customerPhone: '+265 991876543',
    items: [
      {
        id: 'item4',
        productId: 'custom1',
        name: 'Custom Tailored Suit',
        image: 'https://images.unsplash.com/photo-1592878940526-0214b0f374f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80',
        price: 75000,
        quantity: 1,
        customizations: {
          notes: 'Three-piece suit with navy blue fabric. Custom measurements provided in message.'
        }
      }
    ],
    totalPrice: 75000,
    status: 'shipped',
    createdAt: '2025-11-18T16:45:00Z',
    updatedAt: '2025-11-22T11:30:00Z',
    shippingAddress: {
      street: '789 Lakeshore Road',
      city: 'Mangochi',
      region: 'Southern Region',
      postalCode: 'MH01',
      country: 'Malawi'
    },
    isCustomOrder: true,
    paymentMethod: 'Bank Transfer',
    trackingNumber: 'MWI123456789'
  },
  {
    id: 'ORD12348',
    customerId: 'cust4',
    customerName: 'Grace Mbewe',
    customerEmail: 'grace@example.com',
    customerPhone: '+265 882345678',
    items: [
      {
        id: 'item5',
        productId: 'p4',
        name: 'Contemporary Malawian Scarf',
        image: 'https://images.unsplash.com/photo-1543076447-215ad9ba6923?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80',
        price: 12000,
        quantity: 3
      }
    ],
    totalPrice: 36000,
    status: 'delivered',
    createdAt: '2025-11-10T09:00:00Z',
    updatedAt: '2025-11-15T15:20:00Z',
    shippingAddress: {
      street: '101 Chipembere Highway',
      city: 'Zomba',
      region: 'Southern Region',
      postalCode: 'ZA01',
      country: 'Malawi'
    },
    isCustomOrder: false,
    paymentMethod: 'Cash on Delivery',
    trackingNumber: 'MWI987654321'
  },
  {
    id: 'ORD12349',
    customerId: 'cust5',
    customerName: 'Mphatso Gondwe',
    customerEmail: 'mphatso@example.com',
    customerPhone: '+265 992345678',
    items: [
      {
        id: 'item6',
        productId: 'custom2',
        name: 'Custom Traditional Wedding Attire',
        image: 'https://images.unsplash.com/photo-1596358930482-e5c0315f3d8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80',
        price: 120000,
        quantity: 1,
        customizations: {
          notes: 'Traditional wedding attire for bride and groom. Detailed requirements in attached message.'
        }
      }
    ],
    totalPrice: 120000,
    status: 'cancelled',
    createdAt: '2025-11-05T13:25:00Z',
    updatedAt: '2025-11-07T10:15:00Z',
    shippingAddress: {
      street: '202 Mzuzu Road',
      city: 'Mzuzu',
      region: 'Northern Region',
      postalCode: 'MZ01',
      country: 'Malawi'
    },
    isCustomOrder: true,
    paymentMethod: 'Mpamba',
    notes: 'Cancelled due to customer request - change of wedding date.'
  }
];

type FilterOption = 'all' | OrderStatus | 'custom';
type SortOption = 'recent' | 'oldest' | 'price-high' | 'price-low';

const OrderManagement = () => {
  const { user } = useAuth();
  const { addToast } = useNotification();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [statusUpdateModal, setStatusUpdateModal] = useState<{
    open: boolean;
    orderId: string;
    currentStatus: OrderStatus;
    newStatus: OrderStatus;
    trackingNumber?: string;
  }>({
    open: false,
    orderId: '',
    currentStatus: 'pending',
    newStatus: 'pending'
  });

  const [approvalModal, setApprovalModal] = useState({
    isOpen: false,
    orderId: '',
    action: 'approve' as 'approve' | 'reject',
    notes: '',
    reason: ''
  });

  // Fetch real orders from API
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching designer orders...');

      const response = await orderService.getDesignerOrders({
        page: 1,
        limit: 50, // Get more orders for better demo
        sortBy: 'createdAt',
        sortType: 'desc'
      });

      console.log('✅ Designer orders fetched:', response);

      // Transform API orders to match component interface
      const transformedOrders: Order[] = response.docs
        .filter((apiOrder: ApiOrder) => apiOrder && apiOrder._id) // Filter out null/invalid orders
        .map((apiOrder: ApiOrder) => ({
        id: apiOrder._id,
        customerId: apiOrder.user?._id || 'unknown',
        customerName: apiOrder.user?.name || 'Unknown Customer',
        customerEmail: apiOrder.user?.email || 'unknown@example.com',
        customerPhone: '', // API doesn't provide phone in user object
        items: apiOrder.items.map(item => ({
          id: (typeof item.product === 'object' ? item.product?._id : item.product) || 'unknown',
          productId: (typeof item.product === 'object' ? item.product?._id : item.product) || 'unknown',
          name: (typeof item.product === 'object' ? item.product?.name : 'Unknown Product') || 'Unknown Product',
          image: typeof item.product === 'object' ? getFirstProductImageUrl(item.product?.images) : '',
          price: item.price || 0,
          quantity: item.quantity || 1,
          customizations: {}
        })),
        totalPrice: apiOrder.totalAmount || 0,
        status: (apiOrder.status?.toLowerCase() || 'pending') as OrderStatus,
        createdAt: apiOrder.createdAt || new Date().toISOString(),
        updatedAt: apiOrder.updatedAt || new Date().toISOString(),
        shippingAddress: {
          street: apiOrder.shippingAddress?.street || '',
          city: apiOrder.shippingAddress?.city || '',
          region: apiOrder.shippingAddress?.state || '',
          postalCode: apiOrder.shippingAddress?.postalCode || '',
          country: apiOrder.shippingAddress?.country || 'Malawi'
        },
        isCustomOrder: apiOrder.isCustomOrder,
        paymentMethod: apiOrder.paymentMethod || 'Not specified',
        trackingNumber: apiOrder.trackingNumber,
        notes: apiOrder.notes
      }));

      setOrders(transformedOrders);
      console.log(`✅ Loaded ${transformedOrders.length} orders for designer`);

      if (transformedOrders.length === 0) {
        console.log('ℹ️ No orders found for this designer');
      }

    } catch (error) {
      console.error('❌ Error fetching designer orders:', error);
      addToast('error', 'Failed to load orders. Using demo data.');

      // Fallback to mock data if API fails
      setOrders(mockOrders);
    } finally {
      setLoading(false);
    }
  };

  // Download invoice for order
  const downloadInvoice = async (orderId: string) => {
    try {
      addToast('info', `Generating invoice for order #${orderId.slice(-6)}...`);

      // First create the invoice if it doesn't exist
      await analyticsService.createInvoice(orderId);

      // Then get the designer's invoices to find the invoice ID
      const invoicesResponse = await analyticsService.getUserInvoices(1, 100);
      const invoice = invoicesResponse.invoices.find(inv => inv.order._id === orderId);

      if (invoice) {
        // Download the invoice
        await analyticsService.downloadInvoice(invoice._id);
        addToast('success', `Invoice ${invoice.invoiceNumber} downloaded successfully`);
        console.log('✅ Designer invoice downloaded:', invoice.invoiceNumber);
      } else {
        addToast('error', 'Invoice not found. Please try again.');
        console.error('❌ Invoice not found for order:', orderId);
      }
    } catch (error) {
      console.error('❌ Error downloading invoice:', error);
      addToast('error', 'Failed to download invoice. Please try again.');
    }
  };

  // Handle order approval
  const handleApproveOrder = async () => {
    try {
      await orderService.approveOrder(approvalModal.orderId, approvalModal.notes);
      addToast('success', 'Order approved successfully');

      // Refresh orders list
      await fetchOrders();

      // Close modal
      setApprovalModal({
        isOpen: false,
        orderId: '',
        action: 'approve',
        notes: '',
        reason: ''
      });
    } catch (error) {
      console.error('Error approving order:', error);
      addToast('error', 'Failed to approve order');
    }
  };

  // Handle order rejection
  const handleRejectOrder = async () => {
    if (!approvalModal.reason.trim()) {
      addToast('error', 'Please provide a reason for rejection');
      return;
    }

    try {
      await orderService.rejectOrder(approvalModal.orderId, approvalModal.reason);
      addToast('success', 'Order rejected successfully');

      // Refresh orders list
      await fetchOrders();

      // Close modal
      setApprovalModal({
        isOpen: false,
        orderId: '',
        action: 'approve',
        notes: '',
        reason: ''
      });
    } catch (error) {
      console.error('Error rejecting order:', error);
      addToast('error', 'Failed to reject order');
    }
  };

  // Open approval modal
  const openApprovalModal = (orderId: string, action: 'approve' | 'reject') => {
    setApprovalModal({
      isOpen: true,
      orderId,
      action,
      notes: '',
      reason: ''
    });
  };

  const handleStatusChange = async () => {
    if (!statusUpdateModal.orderId) return;

    // Validate tracking number for shipped status
    if (statusUpdateModal.newStatus === 'shipped' && (!statusUpdateModal.trackingNumber || statusUpdateModal.trackingNumber.trim() === '')) {
      addToast('error', t('orders.trackingNumberRequired'));
      return;
    }

    try {
      console.log('🔄 Updating order status...', {
        orderId: statusUpdateModal.orderId,
        newStatus: statusUpdateModal.newStatus,
        trackingNumber: statusUpdateModal.trackingNumber
      });

      // Update order status via API
      await orderService.updateOrderStatus(statusUpdateModal.orderId, {
        status: statusUpdateModal.newStatus.toUpperCase() as any, // API expects uppercase status
        trackingNumber: statusUpdateModal.trackingNumber,
        notes: `Status updated to ${statusUpdateModal.newStatus} by designer`
      });

      // Update local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === statusUpdateModal.orderId
            ? {
                ...order,
                status: statusUpdateModal.newStatus,
                updatedAt: new Date().toISOString(),
                trackingNumber: statusUpdateModal.newStatus === 'shipped' ? statusUpdateModal.trackingNumber : order.trackingNumber
              }
            : order
        )
      );

      // Show success notification
      addToast('success', t('orders.statusUpdated'));
      console.log('✅ Order status updated successfully');

    } catch (error) {
      console.error('❌ Error updating order status:', error);
      addToast('error', 'Failed to update order status. Please try again.');
      return; // Don't close modal on error
    }

    // Close modal
    setStatusUpdateModal({
      open: false,
      orderId: '',
      currentStatus: 'pending',
      newStatus: 'pending'
    });
  };

  const openStatusUpdateModal = (order: Order) => {
    setStatusUpdateModal({
      open: true,
      orderId: order.id,
      currentStatus: order.status,
      newStatus: getNextStatus(order.status),
      trackingNumber: order.trackingNumber || ''
    });
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus => {
    switch (currentStatus) {
      case 'pending':
        return 'processing';
      case 'processing':
        return 'shipped';
      case 'shipped':
        return 'delivered';
      default:
        return currentStatus;
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'processing':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            {getStatusIcon(status)}
            <span className="ml-1">{t('orders.pending')}</span>
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {getStatusIcon(status)}
            <span className="ml-1">{t('orders.processing')}</span>
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            {getStatusIcon(status)}
            <span className="ml-1">{t('orders.shipped')}</span>
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {getStatusIcon(status)}
            <span className="ml-1">{t('orders.delivered')}</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            {getStatusIcon(status)}
            <span className="ml-1">{t('orders.cancelled')}</span>
          </span>
        );
      default:
        return null;
    }
  };

  const filteredOrders = orders.filter(order => {
    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'custom' && !order.isCustomOrder) {
        return false;
      } else if (statusFilter !== 'custom' && order.status !== statusFilter) {
        return false;
      }
    }
    
    // Apply search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      return (
        order.id.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.items.some(item => item.name.toLowerCase().includes(query))
      );
    }
    
    return true;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'price-high':
        return b.totalPrice - a.totalPrice;
      case 'price-low':
        return a.totalPrice - b.totalPrice;
      case 'recent':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t('designer.orderManagement')}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {t('designer.orderManagementDescription')}
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="search"
                placeholder={t('orders.searchOrders')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Filter className="mr-2 h-4 w-4" />
              {t('common.filters')}
              {showFilters ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
            </button>
          </div>

          <div className={`mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 ${showFilters ? 'block' : 'hidden md:grid'}`}>
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                {t('orders.status')}
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as FilterOption)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="all">{t('common.all')}</option>
                <option value="pending">{t('orders.pending')}</option>
                <option value="processing">{t('orders.processing')}</option>
                <option value="shipped">{t('orders.shipped')}</option>
                <option value="delivered">{t('orders.delivered')}</option>
                <option value="cancelled">{t('orders.cancelled')}</option>
                <option value="custom">{t('orders.customOrders')}</option>
              </select>
            </div>
            <div>
              <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-1">
                {t('common.sortBy')}
              </label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="recent">{t('common.mostRecent')}</option>
                <option value="oldest">{t('common.oldest')}</option>
                <option value="price-high">{t('common.priceHighToLow')}</option>
                <option value="price-low">{t('common.priceLowToHigh')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('orders.order')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('orders.customer')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('orders.items')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('orders.total')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('orders.status')}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center">
                    <Package className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">{t('orders.noOrdersFound')}</h3>
                    <p className="mt-1 text-sm text-gray-500">{t('orders.tryDifferentFilters')}</p>
                  </td>
                </tr>
              ) : (
                sortedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900">{order.id}</div>
                        <div className="text-sm text-gray-500">{formatDate(order.createdAt)}</div>
                        {order.isCustomOrder && (
                          <span className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {t('orders.custom')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                      <div className="text-sm text-gray-500">{order.customerEmail}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        {order.items.map((item, index) => (
                          <div key={`${order.id}-${item.id}-${index}`} className={`flex items-center ${index > 0 ? 'mt-2' : ''}`}>
                            <div className="flex-shrink-0 h-10 w-10">
                              <img className="h-10 w-10 rounded-md object-cover" src={item.image} alt={item.name} />
                            </div>
                            <div className="ml-4 flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">{item.name}</div>
                              <div className="text-sm text-gray-500">
                                {item.quantity} × {formatCurrency(item.price)}
                              </div>
                            </div>
                          </div>
                        ))}
                        {order.items.length > 1 && (
                          <div className="mt-2 text-xs text-primary-600">
                            +{order.items.length - 1} more items
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(order.totalPrice)}</div>
                      <div className="text-sm text-gray-500">{order.paymentMethod}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsDetailModalOpen(true);
                        }}
                        className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        aria-label={t('common.view')}
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => downloadInvoice(order.id)}
                        className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        aria-label="Download Invoice"
                      >
                        <Download className="h-4 w-4" />
                      </button>

                      {/* Approve/Reject buttons for pending orders */}
                      {order.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => openApprovalModal(order.id, 'approve')}
                            className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            aria-label="Approve Order"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openApprovalModal(order.id, 'reject')}
                            className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            aria-label="Reject Order"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}

                      {/* Status update button for confirmed/processing/shipped orders */}
                      {(order.status === 'confirmed' || order.status === 'processing' || order.status === 'shipped') && (
                        <button
                          type="button"
                          onClick={() => openStatusUpdateModal(order)}
                          className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          aria-label={t('orders.updateStatus')}
                        >
                          <Package className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination would go here */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                {t('common.showing')} <span className="font-medium">{sortedOrders.length}</span> {t('common.of')}{' '}
                <span className="font-medium">{orders.length}</span> {t('orders.orders')}
              </p>
            </div>
            {/* Pagination controls would go here */}
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {isDetailModalOpen && selectedOrder && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {t('orders.orderDetails')} - {selectedOrder.id}
                      </h3>
                      {getStatusBadge(selectedOrder.status)}
                    </div>
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-500">{t('orders.orderDate')}</p>
                          <p className="text-sm text-gray-900">{formatDate(selectedOrder.createdAt)}</p>
                        </div>
                        {selectedOrder.isCustomOrder && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {t('orders.custom')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-medium text-gray-900">{t('orders.customerInformation')}</h4>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs font-medium text-gray-500">{t('orders.name')}</p>
                          <p className="text-sm text-gray-900">{selectedOrder.customerName}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">{t('orders.contactNumber')}</p>
                          <p className="text-sm text-gray-900">{selectedOrder.customerPhone}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs font-medium text-gray-500">{t('orders.email')}</p>
                          <p className="text-sm text-gray-900">{selectedOrder.customerEmail}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-medium text-gray-900">{t('orders.shippingAddress')}</h4>
                      <div className="mt-2">
                        <p className="text-sm text-gray-900">
                          {selectedOrder.shippingAddress.street}<br />
                          {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.region}<br />
                          {selectedOrder.shippingAddress.postalCode}<br />
                          {selectedOrder.shippingAddress.country}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-medium text-gray-900">{t('orders.orderItems')}</h4>
                      <div className="mt-2 space-y-3">
                        {selectedOrder.items.map((item) => (
                          <div key={item.id} className="flex items-center">
                            <div className="flex-shrink-0 h-16 w-16">
                              <img className="h-16 w-16 rounded-md object-cover" src={item.image} alt={item.name} />
                            </div>
                            <div className="ml-4 flex-1">
                              <div className="text-sm font-medium text-gray-900">{item.name}</div>
                              <div className="mt-1 flex justify-between">
                                <div className="text-sm text-gray-500">
                                  {item.quantity} × {formatCurrency(item.price)}
                                </div>
                                <div className="text-sm font-medium text-gray-900">
                                  {formatCurrency(item.quantity * item.price)}
                                </div>
                              </div>
                              {item.customizations && (
                                <div className="mt-1 text-xs text-gray-500">
                                  {item.customizations.color && (
                                    <span className="mr-2">Color: {item.customizations.color}</span>
                                  )}
                                  {item.customizations.size && (
                                    <span className="mr-2">Size: {item.customizations.size}</span>
                                  )}
                                  {item.customizations.notes && (
                                    <div className="mt-1">Notes: {item.customizations.notes}</div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-medium text-gray-900">{t('orders.total')}</div>
                        <div className="text-base font-bold text-gray-900">{formatCurrency(selectedOrder.totalPrice)}</div>
                      </div>
                      <div className="mt-2 flex justify-between items-center">
                        <div className="text-xs text-gray-500">{t('orders.paymentMethod')}</div>
                        <div className="text-sm text-gray-900">{selectedOrder.paymentMethod}</div>
                      </div>
                      {selectedOrder.trackingNumber && (
                        <div className="mt-2 flex justify-between items-center">
                          <div className="text-xs text-gray-500">{t('orders.trackingNumber')}</div>
                          <div className="text-sm text-gray-900">{selectedOrder.trackingNumber}</div>
                        </div>
                      )}
                    </div>
                    
                    {selectedOrder.notes && (
                      <div className="mt-4 border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-medium text-gray-900">{t('orders.notes')}</h4>
                        <p className="mt-1 text-sm text-gray-500">{selectedOrder.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {t('common.close')}
                </button>
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {t('orders.downloadInvoice')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {statusUpdateModal.open && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 sm:mx-0 sm:h-10 sm:w-10">
                    {getStatusIcon(statusUpdateModal.newStatus)}
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {t('orders.updateOrderStatus')}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Update the status for order {statusUpdateModal.orderId}
                      </p>
                    </div>
                    
                    <div className="mt-4">
                      <label htmlFor="new-status" className="block text-sm font-medium text-gray-700">
                        {t('orders.newStatus')}
                      </label>
                      <select
                        id="new-status"
                        value={statusUpdateModal.newStatus}
                        onChange={(e) => setStatusUpdateModal({
                          ...statusUpdateModal,
                          newStatus: e.target.value as OrderStatus
                        })}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                      >
                        <option value="pending">{t('orders.pending')}</option>
                        <option value="processing">{t('orders.processing')}</option>
                        <option value="shipped">{t('orders.shipped')}</option>
                        <option value="delivered">{t('orders.delivered')}</option>
                        <option value="cancelled">{t('orders.cancelled')}</option>
                      </select>
                    </div>
                    
                    {statusUpdateModal.newStatus === 'shipped' && (
                      <div className="mt-4">
                        <label htmlFor="tracking-number" className="block text-sm font-medium text-gray-700">
                          {t('orders.trackingNumber')} *
                        </label>
                        <input
                          type="text"
                          id="tracking-number"
                          value={statusUpdateModal.trackingNumber || ''}
                          onChange={(e) => setStatusUpdateModal({
                            ...statusUpdateModal,
                            trackingNumber: e.target.value
                          })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          placeholder={t('orders.enterTrackingNumber')}
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleStatusChange}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {t('common.update')}
                </button>
                <button
                  type="button"
                  onClick={() => setStatusUpdateModal({
                    open: false,
                    orderId: '',
                    currentStatus: 'pending',
                    newStatus: 'pending'
                  })}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {approvalModal.isOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${
                    approvalModal.action === 'approve' ? 'bg-green-100' : 'bg-red-100'
                  } sm:mx-0 sm:h-10 sm:w-10`}>
                    {approvalModal.action === 'approve' ? (
                      <Check className={`h-6 w-6 text-green-600`} />
                    ) : (
                      <X className={`h-6 w-6 text-red-600`} />
                    )}
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {approvalModal.action === 'approve' ? 'Approve Order' : 'Reject Order'}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {approvalModal.action === 'approve'
                          ? 'Are you sure you want to approve this order? The customer will be notified.'
                          : 'Are you sure you want to reject this order? Please provide a reason for rejection.'
                        }
                      </p>
                    </div>

                    {approvalModal.action === 'approve' ? (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes (Optional)
                        </label>
                        <textarea
                          value={approvalModal.notes}
                          onChange={(e) => setApprovalModal(prev => ({ ...prev, notes: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                          rows={3}
                          placeholder="Add any notes for the customer..."
                        />
                      </div>
                    ) : (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Reason for Rejection *
                        </label>
                        <textarea
                          value={approvalModal.reason}
                          onChange={(e) => setApprovalModal(prev => ({ ...prev, reason: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                          rows={3}
                          placeholder="Please explain why you're rejecting this order..."
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={approvalModal.action === 'approve' ? handleApproveOrder : handleRejectOrder}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${
                    approvalModal.action === 'approve'
                      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                      : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  }`}
                >
                  {approvalModal.action === 'approve' ? 'Approve Order' : 'Reject Order'}
                </button>
                <button
                  type="button"
                  onClick={() => setApprovalModal({
                    isOpen: false,
                    orderId: '',
                    action: 'approve',
                    notes: '',
                    reason: ''
                  })}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
 