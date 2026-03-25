import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, Users, AlertCircle, DollarSign, Package, CheckCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { adminService, AdminAnalytics, ModerationStats } from '../../services/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency } from '../../utils/helpers';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AdminDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { addToast } = useNotification();

  // State
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [moderationStats, setModerationStats] = useState<ModerationStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [analyticsData, moderationData] = await Promise.all([
        adminService.getAnalytics(),
        adminService.getModerationStats()
      ]);

      setAnalytics(analyticsData);
      setModerationStats(moderationData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      addToast('error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };
  
  // Mock chart data for now (can be enhanced with real time-series data later)
  const userGrowthData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Clients',
        data: analytics ? [analytics.totalClients * 0.6, analytics.totalClients * 0.7, analytics.totalClients * 0.8, analytics.totalClients * 0.85, analytics.totalClients * 0.9, analytics.totalClients] : [0, 0, 0, 0, 0, 0],
        backgroundColor: 'rgba(14, 165, 233, 0.8)',
      },
      {
        label: 'Designers',
        data: analytics ? [analytics.totalDesigners * 0.5, analytics.totalDesigners * 0.6, analytics.totalDesigners * 0.7, analytics.totalDesigners * 0.8, analytics.totalDesigners * 0.9, analytics.totalDesigners] : [0, 0, 0, 0, 0, 0],
        backgroundColor: 'rgba(244, 63, 94, 0.8)',
      },
    ],
  };
  
  // Mock sales data for now (can be enhanced with real sales data later)
  const salesByCategoryData = {
    labels: ['Fashion', 'Accessories', 'Footwear', 'Custom'],
    datasets: [
      {
        data: moderationStats ? [
          moderationStats.activeProducts * 0.4,
          moderationStats.activeProducts * 0.3,
          moderationStats.activeProducts * 0.2,
          moderationStats.activeProducts * 0.1
        ] : [0, 0, 0, 0],
        backgroundColor: [
          'rgba(14, 165, 233, 0.8)',
          'rgba(244, 63, 94, 0.8)',
          'rgba(234, 179, 8, 0.8)',
          'rgba(34, 197, 94, 0.8)',
        ],
        borderColor: [
          'rgba(14, 165, 233, 1)',
          'rgba(244, 63, 94, 1)',
          'rgba(234, 179, 8, 1)',
          'rgba(34, 197, 94, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };
  
  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: false,
      },
    },
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 shadow rounded-lg p-6 border border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {t('admin.welcome')} {user?.name}
            </h1>
            <p className="mt-1 text-gray-300">
              Here's an overview of the platform's performance.
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-yellow-500 hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-md bg-primary-100 text-primary-600">
              <Users className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
              <p className="text-xl font-semibold text-gray-900">{analytics?.totalUsers.toLocaleString() || '0'}</p>
              <p className="text-xs text-gray-600">{analytics?.totalClients || 0} clients, {analytics?.totalDesigners || 0} designers</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-md bg-accent-100 text-accent-600">
              <Package className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Products</h3>
              <p className="text-xl font-semibold text-gray-900">{moderationStats?.totalProducts.toLocaleString() || '0'}</p>
              <p className="text-xs text-green-600">{moderationStats?.activeProducts || 0} active</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-md bg-green-100 text-green-600">
              <DollarSign className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Revenue</h3>
              <p className="text-xl font-semibold text-gray-900">{formatCurrency(analytics?.totalRevenue || 0)}</p>
              <p className="text-xs text-gray-600">From {analytics?.totalOrders || 0} orders</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-md bg-yellow-100 text-yellow-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Pending Verifications</h3>
              <p className="text-xl font-semibold text-gray-900">{analytics?.pendingVerifications || 0}</p>
              <p className="text-xs text-yellow-600">Requires attention</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{t('admin.userEngagement')}</h2>
            <Link to="/admin/analytics" className="text-sm font-medium text-primary-600 hover:text-primary-500 flex items-center">
              View Details
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <div className="h-80">
            <Bar options={chartOptions} data={userGrowthData} />
          </div>
        </div>
        
        {/* Sales by Category */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{t('admin.salesStatistics')}</h2>
            <Link to="/admin/analytics" className="text-sm font-medium text-primary-600 hover:text-primary-500 flex items-center">
              View Details
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <div className="h-80 flex items-center justify-center">
            <Doughnut options={doughnutOptions} data={salesByCategoryData} />
          </div>
        </div>
      </div>
      
      {/* Recent Activities */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('admin.recentActivities')}</h2>
        </div>
        
        <div className="flow-root">
          <ul className="-mb-8">
            <li>
              <div className="relative pb-8">
                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                <div className="relative flex space-x-3">
                  <div>
                    <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        Designer <span className="font-medium text-gray-900">Grace Banda</span> was verified
                      </p>
                    </div>
                    <div className="text-right text-sm whitespace-nowrap text-gray-500">
                      1h ago
                    </div>
                  </div>
                </div>
              </div>
            </li>
            
            <li>
              <div className="relative pb-8">
                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                <div className="relative flex space-x-3">
                  <div>
                    <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                      <Package className="h-5 w-5 text-white" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        New order <span className="font-medium text-gray-900">#12345</span> was placed
                      </p>
                    </div>
                    <div className="text-right text-sm whitespace-nowrap text-gray-500">
                      3h ago
                    </div>
                  </div>
                </div>
              </div>
            </li>
            
            <li>
              <div className="relative pb-8">
                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                <div className="relative flex space-x-3">
                  <div>
                    <span className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center ring-8 ring-white">
                      <AlertCircle className="h-5 w-5 text-white" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        Content was flagged for <span className="font-medium text-gray-900">review</span>
                      </p>
                    </div>
                    <div className="text-right text-sm whitespace-nowrap text-gray-500">
                      5h ago
                    </div>
                  </div>
                </div>
              </div>
            </li>
            
            <li>
              <div className="relative pb-8">
                <div className="relative flex space-x-3">
                  <div>
                    <span className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center ring-8 ring-white">
                      <Users className="h-5 w-5 text-white" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        <span className="font-medium text-gray-900">10 new users</span> registered
                      </p>
                    </div>
                    <div className="text-right text-sm whitespace-nowrap text-gray-500">
                      1d ago
                    </div>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-5 bg-primary-600 text-white">
            <CheckCircle className="h-6 w-6" />
            <h3 className="mt-2 text-lg font-medium">Designer Verification</h3>
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-500">
              Review and approve designer verification requests.
            </p>
            <Link
              to="/admin/designer-verification"
              className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              View Requests
            </Link>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-5 bg-accent-600 text-white">
            <AlertCircle className="h-6 w-6" />
            <h3 className="mt-2 text-lg font-medium">Content Moderation</h3>
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-500">
              Review flagged content and take appropriate action.
            </p>
            <Link
              to="/admin/content-moderation"
              className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-accent-700 bg-accent-100 hover:bg-accent-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500"
            >
              Moderate Content
            </Link>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-5 bg-green-600 text-white">
            <TrendingUp className="h-6 w-6" />
            <h3 className="mt-2 text-lg font-medium">Reports</h3>
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-500">
              Generate and download platform performance reports.
            </p>
            <Link
              to="/admin/reports"
              className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Generate Reports
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
 