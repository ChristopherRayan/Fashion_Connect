import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Scissors,
  Package,
  Clock,
  CheckCircle,
  User,
  Calendar,
  MapPin,
  DollarSign,
  AlertCircle,
  TrendingUp,
  Eye,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { tailorService } from '../../services/tailorService';
import { CustomOrder } from '../../types';
import { formatCurrency } from '../../utils/helpers';
import LoadingSpinner from '../../components/common/LoadingSpinner';

interface TailorStats {
  totalAssignedOrders: number;
  processingOrders: number;
  completedOrders: number;
  totalEarnings: number;
  completedThisWeek: number;
  averageCompletionTime: number;
}

const TailorDashboard: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useNotification();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TailorStats>({
    totalAssignedOrders: 0,
    processingOrders: 0,
    completedOrders: 0,
    totalEarnings: 0,
    completedThisWeek: 0,
    averageCompletionTime: 0
  });
  const [recentOrders, setRecentOrders] = useState<CustomOrder[]>([]);
  const [urgentOrders, setUrgentOrders] = useState<CustomOrder[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch tailor stats and recent orders
      const [statsData, ordersData] = await Promise.all([
        tailorService.getTailorStats(),
        tailorService.getTailorOrders({ limit: 5, sortBy: 'createdAt', sortType: 'desc' })
      ]);

      setStats(statsData);
      setRecentOrders(ordersData.docs || []);

      // Filter urgent orders (due within 3 days)
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      
      const urgent = (ordersData.docs || []).filter(order => 
        order.status === 'processing' && 
        new Date(order.expectedDeliveryDate) <= threeDaysFromNow
      );
      setUrgentOrders(urgent);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      addToast('error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    const statusColors: Record<string, string> = {
      'assigned_to_tailor': 'bg-blue-100 text-blue-800',
      'processing': 'bg-orange-100 text-orange-800',
      'tailor_completed': 'bg-green-100 text-green-800',
      'ready_for_shipping': 'bg-indigo-100 text-indigo-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
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

  const getDaysUntilDue = (dueDate: string): number => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg">
        <div className="px-6 py-8 text-white">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-16 w-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <Scissors className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="ml-6">
              <h1 className="text-2xl font-bold">Welcome back, {user?.name}!</h1>
              <p className="text-indigo-100 mt-1">
                Ready to work on your assigned orders? You have {stats.processingOrders} orders in progress.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded-lg p-6 border-l-4 border-indigo-500">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-md bg-indigo-100">
              <Package className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Assigned</h3>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalAssignedOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 border-l-4 border-orange-500">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-md bg-orange-100">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">In Progress</h3>
              <p className="text-2xl font-semibold text-gray-900">{stats.processingOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-md bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Completed</h3>
              <p className="text-2xl font-semibold text-gray-900">{stats.completedOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-md bg-purple-100">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">This Week</h3>
              <p className="text-2xl font-semibold text-gray-900">{stats.completedThisWeek}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Urgent Orders Alert */}
      {urgentOrders.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Urgent Orders - Due Soon!
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>You have {urgentOrders.length} order(s) due within the next 3 days.</p>
              </div>
              <div className="mt-4">
                <Link
                  to="/tailor/orders?filter=urgent"
                  className="text-sm font-medium text-red-800 hover:text-red-600"
                >
                  View urgent orders →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Recent Orders</h2>
          <Link
            to="/tailor/orders"
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            View all →
          </Link>
        </div>
        <div className="divide-y divide-gray-200">
          {recentOrders.length > 0 ? (
            recentOrders.map((order) => {
              const daysUntilDue = getDaysUntilDue(order.expectedDeliveryDate);
              const isUrgent = daysUntilDue <= 3 && order.status === 'processing';
              
              return (
                <div key={order.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className="flex-shrink-0">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          isUrgent ? 'bg-red-100' : 'bg-indigo-100'
                        }`}>
                          <Scissors className={`h-5 w-5 ${
                            isUrgent ? 'text-red-600' : 'text-indigo-600'
                          }`} />
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {order.productType}
                            </p>
                            <div className="flex items-center mt-1 space-x-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                {getStatusLabel(order.status)}
                              </span>
                              {isUrgent && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Due in {daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(order.estimatedPrice)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-gray-500">
                          <div className="flex items-center">
                            <User className="flex-shrink-0 mr-1.5 h-3 w-3" />
                            <span>{order.user.name}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="flex-shrink-0 mr-1.5 h-3 w-3" />
                            <span>Due: {new Date(order.expectedDeliveryDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="flex-shrink-0 mr-1.5 h-3 w-3" />
                            <span className="truncate">{order.deliveryLocation}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4 flex items-center space-x-2">
                      <Link
                        to={`/tailor/orders/${order.id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Link>
                      <Link
                        to={`/tailor/messages?orderId=${order.id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Chat
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-6 py-8 text-center">
              <Scissors className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No orders assigned yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Orders assigned to you by your designer will appear here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-5 bg-indigo-600 text-white">
            <Package className="h-6 w-6" />
            <h3 className="mt-2 text-lg font-medium">My Orders</h3>
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-500">
              View all orders assigned to you, update status, and track progress.
            </p>
            <Link
              to="/tailor/orders"
              className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              View Orders
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-5 bg-purple-600 text-white">
            <MessageSquare className="h-6 w-6" />
            <h3 className="mt-2 text-lg font-medium">Messages</h3>
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-500">
              Communicate with your designer about order details and requirements.
            </p>
            <Link
              to="/tailor/messages"
              className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              View Messages
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Performance Summary</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-900">{stats.completedOrders}</div>
              <div className="text-sm text-gray-500">Total Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-900">
                {stats.averageCompletionTime > 0 ? `${stats.averageCompletionTime} days` : 'N/A'}
              </div>
              <div className="text-sm text-gray-500">Avg. Completion Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-900">
                {stats.completedOrders > 0 ? Math.round((stats.completedOrders / stats.totalAssignedOrders) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-500">Completion Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TailorDashboard;