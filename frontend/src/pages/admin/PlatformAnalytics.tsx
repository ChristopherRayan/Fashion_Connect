import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Package, 
  ShoppingBag,
  Download,
  RefreshCw,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { adminService, AdminAnalytics, ModerationStats } from '../../services/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const PlatformAnalytics = () => {
  const { addToast } = useNotification();
  
  // State
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [moderationStats, setModerationStats] = useState<ModerationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsData, moderationData] = await Promise.all([
        adminService.getAnalytics(),
        adminService.getModerationStats()
      ]);
      
      setAnalytics(analyticsData);
      setModerationStats(moderationData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      addToast('error', 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Mock growth data (in real app, this would come from backend)
  const getGrowthData = () => {
    return {
      users: Math.random() * 20 - 10, // -10% to +10%
      revenue: Math.random() * 30 - 15, // -15% to +15%
      orders: Math.random() * 25 - 12.5, // -12.5% to +12.5%
      products: Math.random() * 15 - 7.5 // -7.5% to +7.5%
    };
  };

  const growthData = getGrowthData();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
            <p className="mt-1 text-gray-500">
              Comprehensive insights into platform performance and user behavior
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Time Range Selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            
            <button
              onClick={fetchAnalytics}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
            
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-md bg-blue-100 text-blue-600">
              <Users className="h-6 w-6" />
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
              <div className="flex items-center">
                <p className="text-xl font-semibold text-gray-900">{analytics?.totalUsers.toLocaleString() || '0'}</p>
                <div className={`ml-2 flex items-center text-sm ${growthData.users >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {growthData.users >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                  {formatPercentage(growthData.users)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-md bg-green-100 text-green-600">
              <DollarSign className="h-6 w-6" />
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
              <div className="flex items-center">
                <p className="text-xl font-semibold text-gray-900">{formatCurrency(analytics?.totalRevenue || 0)}</p>
                <div className={`ml-2 flex items-center text-sm ${growthData.revenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {growthData.revenue >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                  {formatPercentage(growthData.revenue)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-md bg-purple-100 text-purple-600">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
              <div className="flex items-center">
                <p className="text-xl font-semibold text-gray-900">{analytics?.totalOrders.toLocaleString() || '0'}</p>
                <div className={`ml-2 flex items-center text-sm ${growthData.orders >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {growthData.orders >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                  {formatPercentage(growthData.orders)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-md bg-yellow-100 text-yellow-600">
              <Package className="h-6 w-6" />
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-sm font-medium text-gray-500">Active Products</h3>
              <div className="flex items-center">
                <p className="text-xl font-semibold text-gray-900">{moderationStats?.activeProducts.toLocaleString() || '0'}</p>
                <div className={`ml-2 flex items-center text-sm ${growthData.products >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {growthData.products >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                  {formatPercentage(growthData.products)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Health */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Platform Health Overview</h3>
          <Package className="h-5 w-5 text-gray-400" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{moderationStats?.activeProducts || 0}</div>
            <div className="text-sm text-gray-600">Active Products</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{moderationStats?.pendingProducts || 0}</div>
            <div className="text-sm text-gray-600">Pending Review</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{moderationStats?.flaggedProducts || 0}</div>
            <div className="text-sm text-gray-600">Flagged Products</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{analytics?.pendingVerifications || 0}</div>
            <div className="text-sm text-gray-600">Pending Verifications</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity Summary</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm text-gray-900">New user registrations</span>
            </div>
            <span className="text-sm font-medium text-gray-900">{analytics?.totalClients || 0} clients, {analytics?.totalDesigners || 0} designers</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-sm text-gray-900">Products uploaded</span>
            </div>
            <span className="text-sm font-medium text-gray-900">{moderationStats?.totalProducts || 0} total</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-purple-400 rounded-full"></div>
              <span className="text-sm text-gray-900">Orders processed</span>
            </div>
            <span className="text-sm font-medium text-gray-900">{analytics?.totalOrders || 0} orders</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span className="text-sm text-gray-900">Revenue generated</span>
            </div>
            <span className="text-sm font-medium text-gray-900">{formatCurrency(analytics?.totalRevenue || 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformAnalytics;
