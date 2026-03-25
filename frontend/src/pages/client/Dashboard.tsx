
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Package,
  Clock,
  Star,
  Heart,
  ShoppingBag,
  TrendingUp,
  User,
  CreditCard,
  Truck,
  CheckCircle,
  AlertCircle,
  FileText
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { orderService } from '../../services/orderService';
import { productService } from '../../services/productService';
import { designerService } from '../../services/designerService';
import { useState, useEffect } from 'react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import InvoiceList from '../../components/orders/InvoiceList';
import { Line, Doughnut } from 'react-chartjs-2'; // cspell:disable-line
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardStats {
  totalOrders: number;
  totalSpent: number;
  favoriteProducts: number;
  pendingOrders: number;
}

const ClientDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useNotification();
  const { toggleFavorite, isFavorite } = useFavorites();

  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);
  const [featuredDesigners, setFeaturedDesigners] = useState<any[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalSpent: 0,
    favoriteProducts: 0,
    pendingOrders: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch dashboard data in parallel
        const [ordersResponse, productsResponse, designersResponse] = await Promise.all([
          orderService.getRecentOrders(3).catch(() => []),
          productService.getFeaturedProducts(6).catch(() => []),
          designerService.getFeaturedDesigners(3).catch(() => [])
        ]);

        // Calculate stats from orders
        const totalOrders = ordersResponse.length;
        const totalSpent = ordersResponse.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0);
        const pendingOrders = ordersResponse.filter((order: any) => order.status === 'pending').length;

        setStats({
          totalOrders,
          totalSpent,
          favoriteProducts: 0, // This would come from a favorites service
          pendingOrders
        });

        setRecentOrders(ordersResponse);
        setRecommendedProducts(productsResponse);
        setFeaturedDesigners(designersResponse);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        addToast('error', 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [addToast]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-8 sm:px-8">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h1 className="text-3xl font-bold">
                Welcome back, {user?.name}! 👋
              </h1>
              <p className="mt-2 text-blue-100 text-lg">
                Discover amazing fashion and connect with talented designers
              </p>
            </div>
            <div className="hidden sm:flex space-x-3">
              <Link
                to="/client/browse"
                className="inline-flex items-center px-6 py-3 border border-white/20 text-sm font-medium rounded-lg text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-200"
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                Browse Products
              </Link>
              <button
                onClick={() => {
                  // Trigger the floating custom order button
                  const customOrderButton = document.querySelector('[data-custom-order-button]') as HTMLButtonElement;
                  if (customOrderButton) {
                    customOrderButton.click();
                  }
                }}
                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-blue-600 bg-white hover:bg-gray-50 transition-all duration-200"
              >
                <FileText className="mr-2 h-5 w-5" />
                Custom Order
              </button>
            </div>
          </div>
          {/* Mobile Action Buttons */}
          <div className="sm:hidden px-6 pb-6">
            <div className="flex space-x-3">
              <Link
                to="/client/browse"
                className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-white/20 text-sm font-medium rounded-lg text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-200"
              >
                <ShoppingBag className="mr-2 h-4 w-4" />
                Browse
              </Link>
              <button
                onClick={() => {
                  // Trigger the floating custom order button
                  const customOrderButton = document.querySelector('[data-custom-order-button]') as HTMLButtonElement;
                  if (customOrderButton) {
                    customOrderButton.click();
                  }
                }}
                className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-blue-600 bg-white hover:bg-gray-50 transition-all duration-200"
              >
                <FileText className="mr-2 h-4 w-4" />
                Custom
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg">
              <Package className="h-7 w-7" />
            </div>
            <div className="ml-5">
              <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Orders</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalOrders}</p>
              <p className="text-xs text-gray-500 mt-1">All time purchases</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-4 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg">
              <CreditCard className="h-7 w-7" />
            </div>
            <div className="ml-5">
              <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Spent</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalSpent)}</p>
              <p className="text-xs text-gray-500 mt-1">Lifetime investment</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-4 rounded-xl bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg">
              <Heart className="h-7 w-7" />
            </div>
            <div className="ml-5">
              <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Favorites</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.favoriteProducts}</p>
              <p className="text-xs text-gray-500 mt-1">Saved for later</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-4 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg">
              <Clock className="h-7 w-7" />
            </div>
            <div className="ml-5">
              <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Pending</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingOrders}</p>
              <p className="text-xs text-gray-500 mt-1">Being processed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts for pending orders */}
      {stats.pendingOrders > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6 shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-amber-900">
                Order Updates Available
              </h3>
              <div className="mt-2 text-amber-800">
                <p>You have {stats.pendingOrders} {stats.pendingOrders === 1 ? 'order' : 'orders'} being crafted by our talented designers.</p>
              </div>
              <div className="mt-4">
                <Link
                  to="/client/orders"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors duration-200"
                >
                  Track Orders
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Spending Analytics */}
        <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Spending Analytics</h3>
            <div className="flex items-center text-sm text-gray-500">
              <TrendingUp className="h-4 w-4 mr-1" />
              Last 6 months
            </div>
          </div>
          <div className="h-64">
            <Line
              data={{
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [
                  {
                    label: 'Spending (MWK)',
                    data: [5000, 8000, 12000, 6000, 15000, 10000],
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return 'MWK ' + value.toLocaleString();
                      }
                    }
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Order Categories */}
        <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Order Categories</h3>
            <div className="flex items-center text-sm text-gray-500">
              <Package className="h-4 w-4 mr-1" />
              All time
            </div>
          </div>
          <div className="h-64">
            <Doughnut
              data={{
                labels: ['Dresses', 'Traditional Wear', 'Accessories', 'Custom Orders'],
                datasets: [
                  {
                    data: [35, 25, 20, 20],
                    backgroundColor: [
                      'rgba(59, 130, 246, 0.8)',
                      'rgba(16, 185, 129, 0.8)',
                      'rgba(245, 158, 11, 0.8)',
                      'rgba(239, 68, 68, 0.8)',
                    ],
                    borderWidth: 2,
                    borderColor: '#fff',
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      padding: 20,
                      usePointStyle: true,
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white shadow-lg rounded-xl border border-gray-100">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
              </div>
              <Link
                to="/client/orders"
                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors duration-200"
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
                          <Package className="h-5 w-5 text-primary-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">
                          Order #{order._id?.slice(-6) || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(order.createdAt)} • {formatCurrency(order.totalAmount || 0)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.status || 'pending'}
                      </span>
                      {order.status === 'shipped' && (
                        <Truck className="ml-2 h-4 w-4 text-blue-500" />
                      )}
                      {order.status === 'delivered' && (
                        <CheckCircle className="ml-2 h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <ShoppingBag className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Your Fashion Journey</h3>
                <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                  Discover unique designs from talented creators and place your first order.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    to="/client/browse"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                  >
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Browse Products
                  </Link>
                  <button
                    onClick={() => {
                      // Trigger the floating custom order button
                      const customOrderButton = document.querySelector('[data-custom-order-button]') as HTMLButtonElement;
                      if (customOrderButton) {
                        customOrderButton.click();
                      }
                    }}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Custom Order
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Featured Designers */}
        <div className="bg-white shadow-lg rounded-xl border border-gray-100">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 rounded-t-xl">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg mr-3">
                <Star className="h-5 w-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Featured Designers</h2>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {featuredDesigners.length > 0 ? (
              featuredDesigners.map((designer) => (
                <div key={designer._id} className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <img
                        className="h-10 w-10 rounded-full"
                        src={designer.profileImage || '/placeholder-avatar.jpg'}
                        alt={designer.name}
                      />
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-900">{designer.name}</p>
                      <p className="text-sm text-gray-500">{designer.specialty}</p>
                      <div className="flex items-center mt-1">
                        <Star className="h-3 w-3 text-yellow-400" />
                        <span className="ml-1 text-xs text-gray-500">
                          {designer.rating || 4.5} ({designer.reviewCount || 0} reviews)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center">
                <User className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No featured designers</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Check back later for featured designers.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Recommended Products */}
      <div className="bg-white shadow-xl rounded-2xl border border-gray-100">
        <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Recommended for You</h2>
              <p className="text-sm text-gray-600">Curated products based on your style preferences</p>
            </div>
            <Link
              to="/client/browse"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Browse All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
        <div className="p-8">
          {loading ? (
            // Loading skeleton
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-gray-200"></div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-4 bg-gray-200 rounded-full w-20"></div>
                      <div className="h-4 bg-gray-200 rounded-full w-16"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="flex items-center justify-between">
                      <div className="h-8 bg-gray-200 rounded w-24"></div>
                      <div className="h-10 bg-gray-200 rounded-xl w-28"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : recommendedProducts.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 fade-in">
              {recommendedProducts.map((product) => (
                <div key={product._id} className="group relative bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl hover:border-primary-200 transition-all duration-500 transform hover:-translate-y-2">
                  {/* Product Image Container */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                    <img
                      src={product.images?.[0] || '/placeholder-product.jpg'}
                      alt={product.name}
                      className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
                    />

                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Quick Actions */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                      <button
                        type="button"
                        title={isFavorite(product._id) ? "Remove from favorites" : "Add to favorites"}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleFavorite(product);
                        }}
                        className="bg-white/90 backdrop-blur-sm hover:bg-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                      >
                        <Heart className={`h-4 w-4 transition-colors ${
                          isFavorite(product._id)
                            ? 'text-red-500 fill-red-500'
                            : 'text-gray-600 hover:text-red-500'
                        }`} />
                      </button>
                      <Link
                        to={`/client/product/${product._id}`}
                        className="bg-white/90 backdrop-blur-sm hover:bg-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                      >
                        <ShoppingBag className="h-4 w-4 text-gray-600 hover:text-primary-600 transition-colors" />
                      </Link>
                    </div>

                    {/* Product Badge */}
                    {product.featured && (
                      <div className="absolute top-4 left-4">
                        <span className="bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                          FEATURED
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Content */}
                  <div className="p-6">
                    {/* Category */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider bg-primary-50 px-2 py-1 rounded-full">
                        {product.category}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium text-gray-700">
                          {product.rating || 4.5}
                        </span>
                        <span className="text-xs text-gray-400">
                          ({product.reviewCount || 12})
                        </span>
                      </div>
                    </div>

                    {/* Product Name */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
                      <Link
                        to={`/client/product/${product._id}`}
                        className="hover:text-primary-600 transition-colors duration-200"
                      >
                        {product.name}
                      </Link>
                    </h3>

                    {/* Designer Info */}
                    <div className="flex items-center mb-4">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-center mr-2">
                        <User className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-sm text-gray-600">
                        by <Link
                          to={`/client/designer/${product.designer?._id}`}
                          className="font-semibold text-primary-600 hover:text-primary-700 transition-colors duration-200"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {product.designer?.name || 'Designer'}
                        </Link>
                      </span>
                    </div>

                    {/* Price and Action */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-2xl font-bold text-gray-900">
                          {formatCurrency(product.price)}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-sm text-gray-500 line-through">
                            {formatCurrency(product.originalPrice)}
                          </span>
                        )}
                      </div>

                      <Link
                        to={`/client/product/${product._id}`}
                        className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>

                  {/* Hover Effect Border */}
                  <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-primary-200 transition-colors duration-300 pointer-events-none" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="relative mb-8">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center shadow-lg">
                  <Star className="h-12 w-12 text-primary-600" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-3">Discover Your Perfect Style</h3>
              <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto leading-relaxed">
                Start browsing our curated collection to get personalized recommendations tailored just for you.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/client/browse"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <ShoppingBag className="mr-3 h-5 w-5" />
                  Explore Products
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    // Trigger the floating custom order button
                    const customOrderButton = document.querySelector('[data-custom-order-button]') as HTMLButtonElement;
                    if (customOrderButton) {
                      customOrderButton.click();
                    }
                  }}
                  className="inline-flex items-center px-8 py-4 bg-white border-2 border-primary-200 hover:border-primary-300 text-primary-600 hover:text-primary-700 font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <FileText className="mr-3 h-5 w-5" />
                  Custom Order
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-200 group">
          <div className="p-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <FileText className="h-8 w-8 relative z-10" />
            <h3 className="mt-3 text-xl font-semibold relative z-10">Custom Orders</h3>
          </div>
          <div className="p-6">
            <p className="text-gray-600 mb-4 leading-relaxed">
              Work with designers to create unique pieces tailored to your exact measurements and style.
            </p>
            <button
              type="button"
              onClick={() => {
                // Trigger the floating custom order button
                const customOrderButton = document.querySelector('[data-custom-order-button]') as HTMLButtonElement;
                if (customOrderButton) {
                  customOrderButton.click();
                }
              }}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200 group-hover:bg-blue-100"
            >
              Start Custom Order
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-200 group">
          <div className="p-6 bg-gradient-to-br from-yellow-500 to-orange-500 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <Star className="h-8 w-8 relative z-10" />
            <h3 className="mt-3 text-xl font-semibold relative z-10">Reviews</h3>
          </div>
          <div className="p-6">
            <p className="text-gray-600 mb-4 leading-relaxed">
              Share your experience and help other customers make informed decisions about products.
            </p>
            <Link
              to="/client/reviews"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors duration-200 group-hover:bg-orange-100"
            >
              Manage Reviews
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-200 group">
          <div className="p-6 bg-gradient-to-br from-pink-500 to-red-500 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <Heart className="h-8 w-8 relative z-10" />
            <h3 className="mt-3 text-xl font-semibold relative z-10">Favorites</h3>
          </div>
          <div className="p-6">
            <p className="text-gray-600 mb-4 leading-relaxed">
              Save your favorite products and designers for quick access and future purchases.
            </p>
            <Link
              to="/client/favorites"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200 group-hover:bg-red-100"
            >
              View Favorites
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-200 group">
          <div className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <User className="h-8 w-8 relative z-10" />
            <h3 className="mt-3 text-xl font-semibold relative z-10">Find Designers</h3>
          </div>
          <div className="p-6">
            <p className="text-gray-600 mb-4 leading-relaxed">
              Discover talented designers in your area or by specialty and connect with them.
            </p>
            <Link
              to="/designers"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200 group-hover:bg-green-100"
            >
              Browse Designers
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Invoices Section */}
      <div className="mt-8">
        <InvoiceList />
      </div>
    </div>
  );
};

export default ClientDashboard;
 