import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Plus,
  Eye,
  Package,
  Clock,
  Star,
  ArrowRight,
  AlertCircle,
  Calendar,
  MessageSquare,
  Scissors,
  Users,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

import { useNotification } from '../../contexts/NotificationContext';
import { productService } from '../../services/productService';
import { orderService } from '../../services/orderService';
import { designerService } from '../../services/designerService';
import { formatCurrency } from '../../utils/helpers';
import LoadingSpinner from '../../components/common/LoadingSpinner';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalViews: number;
  pendingOrders: number;
  lowStockProducts: number;
}

interface RecentActivity {
  id: string;
  type: 'order' | 'product_view' | 'review' | 'message';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
}

const DesignerDashboard = () => {
  const { user } = useAuth();

  const { addToast } = useNotification();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalViews: 0,
    pendingOrders: 0,
    lowStockProducts: 0
  });
  const [recentProducts, setRecentProducts] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch dashboard data in parallel
      const [productsResponse, ordersResponse, analyticsResponse] = await Promise.all([
        productService.getDesignerProducts({ limit: 5, page: 1 }).catch(() => ({ docs: [] })),
        orderService.getDesignerOrders({ limit: 5, page: 1 }).catch(() => ({ docs: [] })),
        designerService.getAnalytics().catch(() => null)
      ]);

      // Update stats
      if (analyticsResponse) {
        setStats({
          totalProducts: analyticsResponse.overview?.totalProducts || 0,
          totalOrders: analyticsResponse.overview?.totalOrders || 0,
          totalRevenue: analyticsResponse.overview?.totalRevenue || 0,
          totalViews: analyticsResponse.overview?.totalViews || 0,
          pendingOrders: analyticsResponse.pendingOrders || 0,
          lowStockProducts: analyticsResponse.lowStockProducts || 0
        });
      }

      setRecentProducts(productsResponse.docs || []);
      setRecentOrders(ordersResponse.docs || []);

      // Generate recent activity from orders and products
      const activities: RecentActivity[] = [
        ...ordersResponse.docs.slice(0, 3).map((order: any) => ({
          id: order._id,
          type: 'order' as const,
          title: 'New Order Received',
          description: `Order #${order.orderNumber} for ${formatCurrency(order.totalAmount)}`,
          timestamp: order.createdAt,
          status: order.status
        })),
        ...productsResponse.docs.slice(0, 2).map((product: any) => ({
          id: product._id,
          type: 'product_view' as const,
          title: 'Product Activity',
          description: `${product.name} has been viewed`,
          timestamp: product.updatedAt
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setRecentActivity(activities);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      addToast('error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gray-900 shadow-lg rounded-lg p-6 border-2 border-yellow-400">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-yellow-400">
              Welcome back, {user?.name || 'Designer'}!
            </h1>
            <p className="mt-1 text-gray-300">
              Here's what's happening with your business today.
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              to="/designer/products/new"
              className="inline-flex items-center px-4 py-2 border-2 border-yellow-400 text-sm font-medium rounded-md text-gray-900 bg-yellow-400 hover:bg-yellow-300 hover:border-yellow-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Link>
            <Link
              to="/designer/analytics"
              className="inline-flex items-center px-4 py-2 border-2 border-gray-600 text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-700 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              View Analytics
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-gray-900 shadow-lg rounded-lg p-6 border-2 border-yellow-400">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-md bg-yellow-400 text-gray-900">
              <DollarSign className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-300">Total Revenue</h3>
              <p className="text-xl font-semibold text-yellow-400">{formatCurrency(stats.totalRevenue)}</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="h-3 w-3 text-green-400 mr-1" />
                <span className="text-xs text-green-400">+12.5% from last month</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 shadow-lg rounded-lg p-6 border-2 border-yellow-400">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-md bg-yellow-400 text-gray-900">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-300">Total Orders</h3>
              <p className="text-xl font-semibold text-yellow-400">{stats.totalOrders}</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="h-3 w-3 text-green-400 mr-1" />
                <span className="text-xs text-green-400">+8.2% from last month</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 shadow-lg rounded-lg p-6 border-2 border-yellow-400">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-md bg-yellow-400 text-gray-900">
              <Package className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-300">Total Products</h3>
              <p className="text-xl font-semibold text-yellow-400">{stats.totalProducts}</p>
              <p className="text-xs text-gray-400">Active listings</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 shadow-lg rounded-lg p-6 border-2 border-yellow-400">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-md bg-yellow-400 text-gray-900">
              <Eye className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-300">Profile Views</h3>
              <p className="text-xl font-semibold text-yellow-400">{stats.totalViews.toLocaleString()}</p>
              <p className="text-xs text-gray-400">This month</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(stats.pendingOrders > 0 || stats.lowStockProducts > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.pendingOrders > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Clock className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Pending Orders
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>You have {stats.pendingOrders} orders waiting for processing.</p>
                  </div>
                  <div className="mt-4">
                    <Link
                      to="/designer/orders?status=pending"
                      className="text-sm font-medium text-yellow-800 hover:text-yellow-600"
                    >
                      View pending orders →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {stats.lowStockProducts > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Low Stock Alert
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{stats.lowStockProducts} products are running low on stock.</p>
                  </div>
                  <div className="mt-4">
                    <Link
                      to="/designer/products?filter=low-stock"
                      className="text-sm font-medium text-red-800 hover:text-red-600"
                    >
                      Manage inventory →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Recent Orders</h2>
              <Link
                to="/designer/orders"
                className="text-sm font-medium text-primary-600 hover:text-primary-500 flex items-center"
              >
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div key={order._id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <ShoppingBag className="h-5 w-5 text-primary-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">
                          Order #{order.orderNumber || order._id.slice(-6)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.customer?.name || 'Customer'} • {formatCurrency(order.totalAmount || 0)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status || 'pending'}
                      </span>
                      <p className="ml-2 text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center">
                <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No orders yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Your orders will appear here once customers start purchasing.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="px-6 py-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        activity.type === 'order' ? 'bg-green-100' :
                        activity.type === 'product_view' ? 'bg-blue-100' :
                        activity.type === 'review' ? 'bg-yellow-100' :
                        'bg-purple-100'
                      }`}>
                        {activity.type === 'order' && <ShoppingBag className="h-4 w-4 text-green-600" />}
                        {activity.type === 'product_view' && <Eye className="h-4 w-4 text-blue-600" />}
                        {activity.type === 'review' && <Star className="h-4 w-4 text-yellow-600" />}
                        {activity.type === 'message' && <MessageSquare className="h-4 w-4 text-purple-600" />}
                      </div>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-500">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Your recent activity will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Products */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Recent Products</h2>
            <Link
              to="/designer/products"
              className="text-sm font-medium text-primary-600 hover:text-primary-500 flex items-center"
            >
              View all
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 p-6">
          {recentProducts.length > 0 ? (
            recentProducts.map((product) => (
              <div key={product._id} className="group relative">
                <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200">
                  <img
                    src={product.images?.[0] || '/placeholder-product.jpg'}
                    alt={product.name}
                    className="h-48 w-full object-cover object-center"
                  />
                </div>
                <div className="mt-2">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-500">{formatCurrency(product.price)}</p>
                  <div className="flex items-center mt-1">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      product.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {product.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                    {product.stockQuantity && (
                      <span className="ml-2 text-xs text-gray-500">
                        {product.stockQuantity} left
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No products yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start by adding your first product to showcase your designs.
              </p>
              <div className="mt-6">
                <Link
                  to="/designer/products/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Product
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tailor Management */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <Scissors className="h-5 w-5 mr-2 text-yellow-600" />
            Tailor Management
          </h2>
          <Link
            to="/designer/tailors"
            className="text-sm text-yellow-600 hover:text-yellow-500"
          >
            View all →
          </Link>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">Active Tailors</p>
                  <p className="text-2xl font-semibold text-yellow-600">0</p>
                </div>
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">Orders in Progress</p>
                  <p className="text-2xl font-semibold text-orange-600">0</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">Completed Today</p>
                  <p className="text-2xl font-semibold text-green-600">0</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 flex space-x-3">
            <Link
              to="/designer/tailors"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Manage Tailors
            </Link>
            <Link
              to="/designer/custom-orders"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Scissors className="h-4 w-4 mr-2" />
              Manage Custom Orders
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-5 bg-primary-600 text-white">
            <Package className="h-6 w-6" />
            <h3 className="mt-2 text-lg font-medium">Product Management</h3>
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-500">
              Add new products, update inventory, and manage your catalog.
            </p>
            <Link
              to="/designer/products"
              className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Manage Products
            </Link>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-5 bg-accent-600 text-white">
            <ShoppingBag className="h-6 w-6" />
            <h3 className="mt-2 text-lg font-medium">Order Management</h3>
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-500">
              Process orders, update shipping status, and communicate with customers.
            </p>
            <Link
              to="/designer/orders"
              className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-accent-700 bg-accent-100 hover:bg-accent-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500"
            >
              View Orders
            </Link>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-5 bg-green-600 text-white">
            <TrendingUp className="h-6 w-6" />
            <h3 className="mt-2 text-lg font-medium">Analytics & Reports</h3>
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-500">
              Track your performance, analyze sales trends, and grow your business.
            </p>
            <Link
              to="/designer/analytics"
              className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              View Analytics
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignerDashboard;
 