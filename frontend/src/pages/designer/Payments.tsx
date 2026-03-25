import  { useState, useEffect } from 'react';
import { Download, Filter, ChevronDown, ChevronUp, DollarSign, CreditCard, Calendar, ArrowRight, ArrowLeft, Clock, CheckCircle, X, ExternalLink, Phone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency } from '../../utils/helpers';

interface Transaction {
  id: string;
  type: 'payment' | 'withdrawal' | 'fee';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  description: string;
  createdAt: string;
  orderId?: string;
  paymentMethod?: string;
}

interface PaymentMethod {
  id: string;
  type: 'mobile_money' | 'bank';
  name: string;
  details: {
    accountNumber?: string;
    phoneNumber?: string;
    bankName?: string;
    accountName?: string;
  };
  isDefault: boolean;
}

// Mock data for demonstration
const mockTransactions: Transaction[] = [
  {
    id: 'txn1',
    type: 'payment',
    amount: 35000,
    status: 'completed',
    description: 'Payment for Order #ORD12346',
    createdAt: '2025-12-01T14:30:00Z',
    orderId: 'ORD12346',
    paymentMethod: 'Airtel Money'
  },
  {
    id: 'txn2',
    type: 'fee',
    amount: -1750,
    status: 'completed',
    description: 'Platform fee for Order #ORD12346 (5%)',
    createdAt: '2025-12-01T14:30:00Z',
    orderId: 'ORD12346'
  },
  {
    id: 'txn3',
    type: 'payment',
    amount: 75000,
    status: 'completed',
    description: 'Payment for Order #ORD12347',
    createdAt: '2025-11-22T11:30:00Z',
    orderId: 'ORD12347',
    paymentMethod: 'Bank Transfer'
  },
  {
    id: 'txn4',
    type: 'fee',
    amount: -3750,
    status: 'completed',
    description: 'Platform fee for Order #ORD12347 (5%)',
    createdAt: '2025-11-22T11:30:00Z',
    orderId: 'ORD12347'
  },
  {
    id: 'txn5',
    type: 'withdrawal',
    amount: -40000,
    status: 'completed',
    description: 'Withdrawal to Mpamba',
    createdAt: '2025-11-15T09:45:00Z',
    paymentMethod: 'Mpamba'
  },
  {
    id: 'txn6',
    type: 'payment',
    amount: 36000,
    status: 'completed',
    description: 'Payment for Order #ORD12348',
    createdAt: '2025-11-10T15:20:00Z',
    orderId: 'ORD12348',
    paymentMethod: 'Cash on Delivery'
  },
  {
    id: 'txn7',
    type: 'fee',
    amount: -1800,
    status: 'completed',
    description: 'Platform fee for Order #ORD12348 (5%)',
    createdAt: '2025-11-10T15:20:00Z',
    orderId: 'ORD12348'
  },
  {
    id: 'txn8',
    type: 'withdrawal',
    amount: -60000,
    status: 'pending',
    description: 'Withdrawal to Standard Bank',
    createdAt: '2025-12-04T10:15:00Z',
    paymentMethod: 'Bank Transfer'
  }
];

const mockPaymentMethods: PaymentMethod[] = [
  {
    id: 'pm1',
    type: 'mobile_money',
    name: 'Mpamba',
    details: {
      phoneNumber: '+265 991234567'
    },
    isDefault: true
  },
  {
    id: 'pm2',
    type: 'mobile_money',
    name: 'Airtel Money',
    details: {
      phoneNumber: '+265 881234567'
    },
    isDefault: false
  },
  {
    id: 'pm3',
    type: 'bank',
    name: 'Standard Bank',
    details: {
      accountNumber: '1234567890',
      accountName: 'Thoko Banda',
      bankName: 'Standard Bank Malawi'
    },
    isDefault: false
  }
];

type TransactionFilter = 'all' | 'payments' | 'withdrawals' | 'fees';
type StatusFilter = 'all' | 'completed' | 'pending' | 'failed';
type TimeFilter = '7days' | '30days' | '90days' | 'all';

const DesignerPayments = () => {
  const { user } = useAuth();
  const { addToast } = useNotification();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [balance, setBalance] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);
  
  // Filters
  const [transactionFilter, setTransactionFilter] = useState<TransactionFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('30days');
  const [showFilters, setShowFilters] = useState(false);
  
  // Modals
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isAddMethodModalOpen, setIsAddMethodModalOpen] = useState(false);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  
  // New payment method form
  const [newMethod, setNewMethod] = useState<{
    type: PaymentMethod['type'];
    name: string;
    phoneNumber?: string;
    accountNumber?: string;
    accountName?: string;
    bankName?: string;
  }>({
    type: 'mobile_money',
    name: 'Mpamba',
    phoneNumber: ''
  });
  
  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setTransactions(mockTransactions);
      setPaymentMethods(mockPaymentMethods);
      
      // Calculate balance
      const completedTransactions = mockTransactions.filter(txn => txn.status === 'completed');
      const balanceAmount = completedTransactions.reduce((sum, txn) => sum + txn.amount, 0);
      setBalance(balanceAmount);
      
      // Calculate pending balance
      const pendingTransactions = mockTransactions.filter(txn => txn.status === 'pending');
      const pendingAmount = pendingTransactions.reduce((sum, txn) => sum + txn.amount, 0);
      setPendingBalance(pendingAmount);
      
      setLoading(false);
    }, 800);
  }, []);

  const handleAddPaymentMethod = () => {
    // Validate form
    if (newMethod.type === 'mobile_money' && (!newMethod.phoneNumber || !newMethod.phoneNumber.trim())) {
      addToast('error', t('payments.phoneNumberRequired'));
      return;
    }
    
    if (newMethod.type === 'bank') {
      if (!newMethod.accountNumber || !newMethod.accountNumber.trim()) {
        addToast('error', t('payments.accountNumberRequired'));
        return;
      }
      
      if (!newMethod.accountName || !newMethod.accountName.trim()) {
        addToast('error', t('payments.accountNameRequired'));
        return;
      }
      
      if (!newMethod.bankName || !newMethod.bankName.trim()) {
        addToast('error', t('payments.bankNameRequired'));
        return;
      }
    }
    
    // Create new payment method
    const newPaymentMethod: PaymentMethod = {
      id: `pm${Date.now()}`,
      type: newMethod.type,
      name: newMethod.name,
      details: newMethod.type === 'mobile_money'
        ? { phoneNumber: newMethod.phoneNumber }
        : {
            accountNumber: newMethod.accountNumber,
            accountName: newMethod.accountName,
            bankName: newMethod.bankName
          },
      isDefault: paymentMethods.length === 0 // Set as default if it's the first payment method
    };
    
    setPaymentMethods(prev => [...prev, newPaymentMethod]);
    setIsAddMethodModalOpen(false);
    addToast('success', t('payments.methodAdded'));
    
    // Reset form
    setNewMethod({
      type: 'mobile_money',
      name: 'Mpamba',
      phoneNumber: ''
    });
  };

  const handleMakeDefault = (methodId: string) => {
    setPaymentMethods(prev => 
      prev.map(method => ({
        ...method,
        isDefault: method.id === methodId
      }))
    );
    
    addToast('success', t('payments.defaultMethodUpdated'));
  };

  const handleDeleteMethod = (methodId: string) => {
    const method = paymentMethods.find(m => m.id === methodId);
    
    if (method?.isDefault) {
      addToast('error', t('payments.cannotDeleteDefault'));
      return;
    }
    
    setPaymentMethods(prev => prev.filter(method => method.id !== methodId));
    addToast('success', t('payments.methodDeleted'));
  };

  const handleWithdraw = () => {
    // Validate form
    if (!selectedMethodId) {
      addToast('error', t('payments.selectPaymentMethod'));
      return;
    }
    
    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount <= 0) {
      addToast('error', t('payments.invalidAmount'));
      return;
    }
    
    if (amount > balance) {
      addToast('error', t('payments.insufficientBalance'));
      return;
    }
    
    // Create new withdrawal transaction
    const selectedMethod = paymentMethods.find(method => method.id === selectedMethodId);
    const newTransaction: Transaction = {
      id: `txn${Date.now()}`,
      type: 'withdrawal',
      amount: -amount,
      status: 'pending',
      description: `Withdrawal to ${selectedMethod?.name}`,
      createdAt: new Date().toISOString(),
      paymentMethod: selectedMethod?.name
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
    setPendingBalance(prev => prev + newTransaction.amount);
    setBalance(prev => prev + newTransaction.amount);
    
    setIsWithdrawModalOpen(false);
    setSelectedMethodId(null);
    setWithdrawalAmount('');
    
    addToast('success', t('payments.withdrawalInitiated'));
  };

  const getFilteredTransactions = () => {
    return transactions.filter(transaction => {
      // Apply transaction type filter
      if (transactionFilter !== 'all') {
        if (transactionFilter === 'payments' && transaction.type !== 'payment') return false;
        if (transactionFilter === 'withdrawals' && transaction.type !== 'withdrawal') return false;
        if (transactionFilter === 'fees' && transaction.type !== 'fee') return false;
      }
      
      // Apply status filter
      if (statusFilter !== 'all' && transaction.status !== statusFilter) return false;
      
      // Apply time filter
      if (timeFilter !== 'all') {
        const txnDate = new Date(transaction.createdAt);
        const today = new Date();
        
        if (timeFilter === '7days') {
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(today.getDate() - 7);
          if (txnDate < sevenDaysAgo) return false;
        } else if (timeFilter === '30days') {
          const thirtyDaysAgo = new Date(today);
          thirtyDaysAgo.setDate(today.getDate() - 30);
          if (txnDate < thirtyDaysAgo) return false;
        } else if (timeFilter === '90days') {
          const ninetyDaysAgo = new Date(today);
          ninetyDaysAgo.setDate(today.getDate() - 90);
          if (txnDate < ninetyDaysAgo) return false;
        }
      }
      
      return true;
    });
  };

  const getSortedTransactions = () => {
    return [...getFilteredTransactions()].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  const getTransactionIcon = (transaction: Transaction) => {
    if (transaction.type === 'payment') {
      return <DollarSign className="h-5 w-5 text-green-500" />;
    } else if (transaction.type === 'withdrawal') {
      return <CreditCard className="h-5 w-5 text-blue-500" />;
    } else if (transaction.type === 'fee') {
      return <DollarSign className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <X className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {getStatusIcon(status)}
            <span className="ml-1">{t('payments.completed')}</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            {getStatusIcon(status)}
            <span className="ml-1">{t('payments.pending')}</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            {getStatusIcon(status)}
            <span className="ml-1">{t('payments.failed')}</span>
          </span>
        );
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t('designer.payments')}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {t('designer.paymentsDescription')}
        </p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-sm font-medium text-gray-500">{t('payments.availableBalance')}</h2>
          <div className="mt-1 flex items-end">
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(balance)}</p>
            {pendingBalance < 0 && (
              <p className="ml-2 text-sm text-gray-500">
                {formatCurrency(pendingBalance)} {t('payments.pending')}
              </p>
            )}
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setIsWithdrawModalOpen(true)}
              disabled={balance <= 0}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('payments.withdraw')}
            </button>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-sm font-medium text-gray-500">{t('payments.paymentMethods')}</h2>
          <div className="mt-4 space-y-3">
            {paymentMethods.length === 0 ? (
              <p className="text-sm text-gray-500">{t('payments.noPaymentMethods')}</p>
            ) : (
              paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-gray-100 rounded-md">
                      {method.type === 'mobile_money' ? (
                        <Phone className="h-5 w-5 text-gray-600" />
                      ) : (
                        <CreditCard className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {method.name}
                        {method.isDefault && (
                          <span className="ml-2 text-xs font-medium text-primary-600">
                            {t('payments.default')}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        {method.type === 'mobile_money'
                          ? method.details.phoneNumber
                          : `${method.details.bankName} - ${method.details.accountNumber}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {!method.isDefault && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleMakeDefault(method.id)}
                          className="text-xs text-primary-600 hover:text-primary-500"
                        >
                          {t('payments.makeDefault')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMethod(method.id)}
                          className="text-xs text-red-600 hover:text-red-500"
                        >
                          {t('common.delete')}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setIsAddMethodModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {t('payments.addPaymentMethod')}
            </button>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-lg font-medium text-gray-900">
              {t('payments.transactionHistory')}
            </h2>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Filter className="mr-1.5 h-4 w-4" />
                {t('common.filters')}
                {showFilters ? <ChevronUp className="ml-1.5 h-4 w-4" /> : <ChevronDown className="ml-1.5 h-4 w-4" />}
              </button>
              <button
                type="button"
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Download className="mr-1.5 h-4 w-4" />
                {t('common.export')}
              </button>
            </div>
          </div>
          
          <div className={`mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 ${showFilters ? 'block' : 'hidden'}`}>
            <div>
              <label htmlFor="transaction-filter" className="block text-sm font-medium text-gray-700 mb-1">
                {t('payments.transactionType')}
              </label>
              <select
                id="transaction-filter"
                value={transactionFilter}
                onChange={(e) => setTransactionFilter(e.target.value as TransactionFilter)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="all">{t('common.all')}</option>
                <option value="payments">{t('payments.payments')}</option>
                <option value="withdrawals">{t('payments.withdrawals')}</option>
                <option value="fees">{t('payments.fees')}</option>
              </select>
            </div>
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                {t('payments.status')}
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="all">{t('common.all')}</option>
                <option value="completed">{t('payments.completed')}</option>
                <option value="pending">{t('payments.pending')}</option>
                <option value="failed">{t('payments.failed')}</option>
              </select>
            </div>
            <div>
              <label htmlFor="time-filter" className="block text-sm font-medium text-gray-700 mb-1">
                {t('payments.timeFrame')}
              </label>
              <select
                id="time-filter"
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="7days">{t('payments.last7Days')}</option>
                <option value="30days">{t('payments.last30Days')}</option>
                <option value="90days">{t('payments.last90Days')}</option>
                <option value="all">{t('payments.allTime')}</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('payments.transaction')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('payments.date')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('payments.amount')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('payments.status')}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getSortedTransactions().length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center">
                    <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">{t('payments.noTransactions')}</h3>
                    <p className="mt-1 text-sm text-gray-500">{t('payments.noTransactionsDescription')}</p>
                  </td>
                </tr>
              ) : (
                getSortedTransactions().map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {getTransactionIcon(transaction)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                          {transaction.paymentMethod && (
                            <div className="text-xs text-gray-500">{transaction.paymentMethod}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(transaction.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        transaction.amount > 0 
                          ? 'text-green-600' 
                          : transaction.type === 'fee'
                          ? 'text-gray-600'
                          : 'text-red-600'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(transaction.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {transaction.orderId && (
                        <a
                          href={`/designer/orders`}
                          className="text-primary-600 hover:text-primary-900 inline-flex items-center"
                        >
                          {t('payments.viewOrder')}
                          <ExternalLink className="ml-1 h-4 w-4" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {getSortedTransactions().length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  {t('common.showing')} <span className="font-medium">1</span> {t('common.to')} <span className="font-medium">{getSortedTransactions().length}</span> {t('common.of')}{' '}
                  <span className="font-medium">{getSortedTransactions().length}</span> {t('payments.transactions')}
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <a
                    href="#"
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <span className="sr-only">{t('common.previous')}</span>
                    <ArrowLeft className="h-5 w-5" />
                  </a>
                  <a
                    href="#"
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    1
                  </a>
                  <a
                    href="#"
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <span className="sr-only">{t('common.next')}</span>
                    <ArrowRight className="h-5 w-5" />
                  </a>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Withdraw Modal */}
      {isWithdrawModalOpen && (
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
                    <CreditCard className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {t('payments.withdrawFunds')}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {t('payments.withdrawDescription')}
                      </p>
                      
                      <div className="mt-4">
                        <div className="mb-4">
                          <label htmlFor="withdrawal-amount" className="block text-sm font-medium text-gray-700">
                            {t('payments.amount')}
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">MWK</span>
                            </div>
                            <input
                              type="text"
                              name="withdrawal-amount"
                              id="withdrawal-amount"
                              value={withdrawalAmount}
                              onChange={(e) => {
                                // Allow only numbers and decimal point
                                const regex = /^[0-9]*\.?[0-9]*$/;
                                if (regex.test(e.target.value) || e.target.value === '') {
                                  setWithdrawalAmount(e.target.value);
                                }
                              }}
                              className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-12 pr-12 sm:text-sm border-gray-300 rounded-md"
                              placeholder="0.00"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                              <button
                                type="button"
                                onClick={() => setWithdrawalAmount(balance.toString())}
                                className="text-xs font-medium text-primary-600 hover:text-primary-500"
                              >
                                {t('payments.max')}
                              </button>
                            </div>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            {t('payments.availableBalance')}: {formatCurrency(balance)}
                          </p>
                        </div>
                        
                        <div>
                          <label htmlFor="payment-method" className="block text-sm font-medium text-gray-700">
                            {t('payments.withdrawTo')}
                          </label>
                          <select
                            id="payment-method"
                            name="payment-method"
                            value={selectedMethodId || ''}
                            onChange={(e) => setSelectedMethodId(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                          >
                            <option value="">{t('payments.selectMethod')}</option>
                            {paymentMethods.map((method) => (
                              <option key={method.id} value={method.id}>
                                {method.name} - {method.type === 'mobile_money'
                                  ? method.details.phoneNumber
                                  : `${method.details.bankName} (${method.details.accountNumber})`}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleWithdraw}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {t('payments.withdraw')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsWithdrawModalOpen(false);
                    setSelectedMethodId(null);
                    setWithdrawalAmount('');
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Method Modal */}
      {isAddMethodModalOpen && (
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
                    <CreditCard className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {t('payments.addPaymentMethod')}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {t('payments.addPaymentMethodDescription')}
                      </p>
                      
                      <div className="mt-4 space-y-4">
                        <div>
                          <label htmlFor="payment-type" className="block text-sm font-medium text-gray-700">
                            {t('payments.paymentType')}
                          </label>
                          <select
                            id="payment-type"
                            name="payment-type"
                            value={newMethod.type}
                            onChange={(e) => setNewMethod({
                              ...newMethod,
                              type: e.target.value as PaymentMethod['type'],
                              // Set default name based on type
                              name: e.target.value === 'mobile_money' ? 'Mpamba' : ''
                            })}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                          >
                            <option value="mobile_money">{t('payments.mobileMoney')}</option>
                            <option value="bank">{t('payments.bankAccount')}</option>
                          </select>
                        </div>
                        
                        {newMethod.type === 'mobile_money' ? (
                          <>
                            <div>
                              <label htmlFor="mobile-money-provider" className="block text-sm font-medium text-gray-700">
                                {t('payments.provider')}
                              </label>
                              <select
                                id="mobile-money-provider"
                                name="mobile-money-provider"
                                value={newMethod.name}
                                onChange={(e) => setNewMethod({ ...newMethod, name: e.target.value })}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                              >
                                <option value="Mpamba">Mpamba</option>
                                <option value="Airtel Money">Airtel Money</option>
                              </select>
                            </div>
                            
                            <div>
                              <label htmlFor="phone-number" className="block text-sm font-medium text-gray-700">
                                {t('payments.phoneNumber')}
                              </label>
                              <input
                                type="text"
                                name="phone-number"
                                id="phone-number"
                                value={newMethod.phoneNumber || ''}
                                onChange={(e) => setNewMethod({ ...newMethod, phoneNumber: e.target.value })}
                                className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                placeholder="+265 xxxxxxxxx"
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <label htmlFor="bank-name" className="block text-sm font-medium text-gray-700">
                                {t('payments.bankName')}
                              </label>
                              <input
                                type="text"
                                name="bank-name"
                                id="bank-name"
                                value={newMethod.bankName || ''}
                                onChange={(e) => setNewMethod({ ...newMethod, bankName: e.target.value })}
                                className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                placeholder={t('payments.bankNamePlaceholder')}
                              />
                            </div>
                            
                            <div>
                              <label htmlFor="account-name" className="block text-sm font-medium text-gray-700">
                                {t('payments.accountName')}
                              </label>
                              <input
                                type="text"
                                name="account-name"
                                id="account-name"
                                value={newMethod.accountName || ''}
                                onChange={(e) => setNewMethod({ ...newMethod, accountName: e.target.value })}
                                className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                placeholder={t('payments.accountNamePlaceholder')}
                              />
                            </div>
                            
                            <div>
                              <label htmlFor="account-number" className="block text-sm font-medium text-gray-700">
                                {t('payments.accountNumber')}
                              </label>
                              <input
                                type="text"
                                name="account-number"
                                id="account-number"
                                value={newMethod.accountNumber || ''}
                                onChange={(e) => setNewMethod({ ...newMethod, accountNumber: e.target.value })}
                                className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                placeholder={t('payments.accountNumberPlaceholder')}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleAddPaymentMethod}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {t('common.add')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddMethodModalOpen(false);
                    setNewMethod({
                      type: 'mobile_money',
                      name: 'Mpamba',
                      phoneNumber: ''
                    });
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignerPayments;
 