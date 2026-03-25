import  { useState, useEffect } from 'react';
import { Calendar, Download, TrendingUp, Users, DollarSign, ShoppingBag, ShoppingCart, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { mockDesignerAnalytics } from '../../data/mockData';
import { formatCurrency } from '../../utils/helpers';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

type DateRange = '7days' | '30days' | '90days' | '12months';

const DesignerAnalytics = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [dateRange, setDateRange] = useState<DateRange>('30days');
  const [activeTab, setActiveTab] = useState('sales');
  const [showDataTable, setShowDataTable] = useState(false);
  
  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setAnalytics(mockDesignerAnalytics);
      setLoading(false);
    }, 800);
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  const generateDateLabels = () => {
    const today = new Date();
    const labels = [];

    switch (dateRange) {
      case '7days':
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }
        break;
      case '30days':
        for (let i = 0; i < 4; i++) {
          const startDate = new Date(today);
          startDate.setDate(today.getDate() - (i * 7 + 7));
          const endDate = new Date(today);
          endDate.setDate(today.getDate() - (i * 7));
          labels.push(`${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`);
        }
        labels.reverse();
        break;
      case '90days':
        for (let i = 0; i < 3; i++) {
          const month = new Date(today);
          month.setMonth(today.getMonth() - i);
          labels.push(month.toLocaleDateString('en-US', { month: 'long' }));
        }
        labels.reverse();
        break;
      case '12months':
        for (let i = 0; i < 12; i++) {
          const month = new Date(today);
          month.setMonth(today.getMonth() - i);
          labels.push(month.toLocaleDateString('en-US', { month: 'short' }));
        }
        labels.reverse();
        break;
    }

    return labels;
  };

  const generateRandomData = (min: number, max: number, count: number) => {
    return Array.from({ length: count }, () => Math.floor(Math.random() * (max - min + 1)) + min);
  };

  // Revenue data
  const revenueData = {
    labels: generateDateLabels(),
    datasets: [
      {
        label: t('analytics.revenue'),
        data: dateRange === '7days' 
          ? generateRandomData(5000, 25000, 7)
          : dateRange === '30days'
          ? generateRandomData(20000, 80000, 4)
          : dateRange === '90days'
          ? generateRandomData(50000, 200000, 3)
          : analytics.monthlySales.map((item: any) => item.revenue),
        borderColor: 'rgba(14, 165, 233, 1)',
        backgroundColor: 'rgba(14, 165, 233, 0.2)',
        fill: true,
        tension: 0.4,
      }
    ]
  };

  // Orders data
  const ordersData = {
    labels: generateDateLabels(),
    datasets: [
      {
        label: t('analytics.orders'),
        data: dateRange === '7days' 
          ? generateRandomData(1, 10, 7)
          : dateRange === '30days'
          ? generateRandomData(5, 30, 4)
          : dateRange === '90days'
          ? generateRandomData(15, 60, 3)
          : analytics.monthlySales.map((item: any) => item.sales),
        borderColor: 'rgba(244, 63, 94, 1)',
        backgroundColor: 'rgba(244, 63, 94, 0.5)',
        barPercentage: 0.6,
        categoryPercentage: 0.7,
      }
    ]
  };

  // Product Categories data
  const categoryData = {
    labels: ['Traditional', 'Contemporary', 'Casual', 'Formal', 'Accessories'],
    datasets: [
      {
        data: [35, 25, 20, 15, 5],
        backgroundColor: [
          'rgba(14, 165, 233, 0.8)',
          'rgba(244, 63, 94, 0.8)',
          'rgba(234, 179, 8, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(168, 85, 247, 0.8)',
        ],
        borderColor: [
          'rgba(14, 165, 233, 1)',
          'rgba(244, 63, 94, 1)',
          'rgba(234, 179, 8, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(168, 85, 247, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Traffic Sources data
  const trafficData = {
    labels: ['Direct', 'Search', 'Social', 'Referral', 'Email'],
    datasets: [
      {
        data: [40, 30, 15, 10, 5],
        backgroundColor: [
          'rgba(14, 165, 233, 0.8)',
          'rgba(244, 63, 94, 0.8)',
          'rgba(234, 179, 8, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(168, 85, 247, 0.8)',
        ],
        borderColor: [
          'rgba(14, 165, 233, 1)',
          'rgba(244, 63, 94, 1)',
          'rgba(234, 179, 8, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(168, 85, 247, 1)',
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('designer.analytics')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('designer.analyticsDescription')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm font-medium text-gray-700 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="7days">{t('analytics.last7Days')}</option>
              <option value="30days">{t('analytics.last30Days')}</option>
              <option value="90days">{t('analytics.last90Days')}</option>
              <option value="12months">{t('analytics.last12Months')}</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Download className="mr-2 h-4 w-4" />
            {t('analytics.exportData')}
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-md bg-primary-100 text-primary-600">
              <DollarSign className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">{t('analytics.totalRevenue')}</h3>
              <p className="text-xl font-semibold text-gray-900">{formatCurrency(analytics.revenue)}</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-500">+12.5% {t('analytics.fromPrevious')}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-md bg-accent-100 text-accent-600">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">{t('analytics.totalOrders')}</h3>
              <p className="text-xl font-semibold text-gray-900">{analytics.orders}</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-500">+8.2% {t('analytics.fromPrevious')}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-md bg-green-100 text-green-600">
              <Users className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">{t('analytics.totalCustomers')}</h3>
              <p className="text-xl font-semibold text-gray-900">{analytics.customers}</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-500">+5.3% {t('analytics.fromPrevious')}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-md bg-yellow-100 text-yellow-600">
              <Clock className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">{t('analytics.avgOrderValue')}</h3>
              <p className="text-xl font-semibold text-gray-900">{formatCurrency(analytics.averageOrderValue)}</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-500">+3.7% {t('analytics.fromPrevious')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('sales')}
              className={`${
                activeTab === 'sales'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {t('analytics.salesAnalytics')}
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`${
                activeTab === 'products'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {t('analytics.productAnalytics')}
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`${
                activeTab === 'customers'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {t('analytics.customerAnalytics')}
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'sales' && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">{t('analytics.revenueOverTime')}</h2>
              <div className="h-80">
                <Line options={chartOptions} data={revenueData} />
              </div>
              
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">{t('analytics.ordersOverTime')}</h2>
                  <button
                    type="button"
                    onClick={() => setShowDataTable(!showDataTable)}
                    className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500"
                  >
                    {showDataTable ? t('analytics.hideTable') : t('analytics.showTable')}
                    {showDataTable ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
                  </button>
                </div>
                <div className="h-80">
                  <Bar options={chartOptions} data={ordersData} />
                </div>
                
                {showDataTable && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('analytics.period')}
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('analytics.orders')}
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('analytics.revenue')}
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('analytics.avgOrderValue')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {generateDateLabels().map((label, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{label}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ordersData.datasets[0].data[index]}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(revenueData.datasets[0].data[index] as number)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(Math.round((revenueData.datasets[0].data[index] as number) / (ordersData.datasets[0].data[index] as number)))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">{t('analytics.salesByCategory')}</h2>
                  <div className="h-80 flex items-center justify-center">
                    <Doughnut options={doughnutOptions} data={categoryData} />
                  </div>
                </div>
                
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">{t('analytics.topProducts')}</h2>
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('analytics.product')}
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('analytics.sold')}
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('analytics.revenue')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {analytics.topProducts.map((product: any) => (
                          <tr key={product.productId}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 p-2 rounded-md bg-gray-100">
                                  <ShoppingBag className="h-5 w-5 text-gray-600" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.sales}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(product.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">{t('analytics.inventoryStatus')}</h2>
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('analytics.product')}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('analytics.category')}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('analytics.inStock')}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('analytics.status')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">Traditional Chitenge Dress</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Traditional</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">8</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {t('analytics.good')}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">Modern African Print Blazer</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Contemporary</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">3</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            {t('analytics.low')}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">Handcrafted Beaded Necklace</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Accessories</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">15</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {t('analytics.good')}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">Custom Tailored Suit</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Formal</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">0</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            {t('analytics.outOfStock')}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'customers' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">{t('analytics.customerAcquisition')}</h2>
                  <div className="h-80 flex items-center justify-center">
                    <Doughnut options={doughnutOptions} data={trafficData} />
                  </div>
                </div>
                
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">{t('analytics.topCustomers')}</h2>
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('analytics.customer')}
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('analytics.orders')}
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('analytics.totalSpent')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <img className="h-10 w-10 rounded-full" src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80" alt="" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">Chikondi Banda</div>
                                <div className="text-sm text-gray-500">chikondi@example.com</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">8</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(195000)}</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <img className="h-10 w-10 rounded-full" src="https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80" alt="" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">Tiyamike Nkhoma</div>
                                <div className="text-sm text-gray-500">tiyamike@example.com</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">6</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(145000)}</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <img className="h-10 w-10 rounded-full" src="https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80" alt="" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">Kondwani Phiri</div>
                                <div className="text-sm text-gray-500">kondwani@example.com</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">5</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(120000)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">{t('analytics.customerRetention')}</h2>
                <div className="h-80">
                  <Line
                    options={chartOptions}
                    data={{
                      labels: generateDateLabels(),
                      datasets: [
                        {
                          label: t('analytics.newCustomers'),
                          data: dateRange === '7days' 
                            ? generateRandomData(1, 5, 7)
                            : dateRange === '30days'
                            ? generateRandomData(5, 15, 4)
                            : dateRange === '90days'
                            ? generateRandomData(10, 30, 3)
                            : generateRandomData(20, 50, 12),
                          borderColor: 'rgba(14, 165, 233, 1)',
                          backgroundColor: 'rgba(14, 165, 233, 0.5)',
                        },
                        {
                          label: t('analytics.returningCustomers'),
                          data: dateRange === '7days' 
                            ? generateRandomData(3, 8, 7)
                            : dateRange === '30days'
                            ? generateRandomData(10, 25, 4)
                            : dateRange === '90days'
                            ? generateRandomData(20, 45, 3)
                            : generateRandomData(30, 70, 12),
                          borderColor: 'rgba(244, 63, 94, 1)',
                          backgroundColor: 'rgba(244, 63, 94, 0.5)',
                        }
                      ]
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DesignerAnalytics;
 