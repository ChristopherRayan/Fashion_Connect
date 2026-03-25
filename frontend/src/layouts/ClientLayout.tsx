import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  Heart,
  Bell,
  User,
  ChevronDown,
  Home,
  Star,
  Globe,
  AlertCircle,
  LogOut,
  Package,
  Tag,
  MessageSquare
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import Logo from '../components/common/Logo';
import FloatingMessageButton from '../components/messaging/FloatingMessageButton';
import FloatingCustomOrderButton from '../components/common/FloatingCustomOrderButton';
import ChatbotFloatingButton from '../components/messaging/ChatbotFloatingButton';
import Badge from '../components/common/Badge';
import ComplaintModal from '../components/common/ComplaintModal';
import CartModal from '../components/cart/CartModal';
import { FloatingButtonsProvider, useFloatingButtons } from '../contexts/FloatingButtonsContext';

const FloatingButtonsWrapper = () => {
  const { isFloatingButtonsVisible } = useFloatingButtons();

  if (!isFloatingButtonsVisible) return null;

  return (
    <>
      <FloatingMessageButton unreadCount={0} />
      <FloatingCustomOrderButton />
      <ChatbotFloatingButton />
    </>
  );
};

const ClientLayout = () => {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const { favorites } = useFavorites();
  const { locale, changeLocale } = useLanguage();
  const { addToast } = useNotification();
  const navigate = useNavigate();

  // State management
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategoriesSidebar, setShowCategoriesSidebar] = useState(false);

  // Mock notifications
  const [notifications] = useState([
    {
      id: 1,
      title: 'Order Confirmed',
      message: 'Your order #12345 has been confirmed and is being processed.',
      time: '2 minutes ago',
      read: false,
      type: 'order'
    }
  ]);

  const unreadNotifications = notifications.filter(n => !n.read).length;

  const toggleLanguage = () => {
    const newLocale = locale === 'en' ? 'ny' : 'en';
    changeLocale(newLocale);
    addToast('info', `Language changed to ${newLocale === 'en' ? 'English' : 'Chichewa'}`);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth/login');
      addToast('success', 'Logged out successfully');
    } catch (error) {
      addToast('error', 'Failed to logout');
    }
  };

  const handleNotificationClick = (notification?: any) => {
    setShowNotificationDropdown(false);
    
    if (notification) {
      console.log('Notification clicked:', notification);
      
      // Mark notification as read
      if (notification.id) {
        // TODO: Call API to mark notification as read
        // notificationService.markAsRead(notification.id);
      }
      
      // Navigate based on notification type
      switch (notification.type) {
        case 'ORDER_UPDATE':
          navigate(`/client/orders/${notification.orderId}`);
          break;
        case 'MESSAGE':
          navigate('/client/messages');
          break;
        case 'PAYMENT':
          navigate('/client/payments');
          break;
        case 'REVIEW':
          navigate(`/client/reviews`);
          break;
        default:
          // For other types, just close the dropdown
          break;
      }
    }
  };

  return (
    <FloatingButtonsProvider>
      <div className="min-h-screen bg-gray-50">
        {/* NOVA-Style Navigation */}
        <div className="sticky top-0 z-20 flex-shrink-0 bg-black shadow-sm border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-14 items-center justify-between">
              {/* Left side - Logo and Search */}
              <div className="flex items-center space-x-6">
                {/* Logo */}
                <Logo size="sm" variant="default" showIcon={false} />

                {/* Search - moved after logo */}
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                      <Search className="h-3.5 w-3.5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && searchQuery.trim()) {
                          window.location.href = `/client/browse?search=${encodeURIComponent(searchQuery.trim())}`;
                        }
                      }}
                      className="block w-full pl-8 pr-3 py-1.5 border border-gray-600 rounded-md leading-4 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-300 focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 text-xs"
                    />
                  </div>
                </div>



                {/* Navigation Links - moved after search */}
                <nav className="flex items-center space-x-6">
                  <Link to="/client/browse?superdeals=true" className="text-xs font-medium text-yellow-400 hover:text-yellow-300 transition-colors duration-200 flex items-center space-x-1">
                    <Tag className="h-3 w-3" />
                    <span>SUPER DEALS</span>
                  </Link>
                  <Link to="/client/designers" className="text-xs font-medium text-gray-300 hover:text-white transition-colors duration-200">
                    DESIGNERS
                  </Link>
                  <Link to="/client/browse?customizable=true" className="text-xs font-medium text-gray-300 hover:text-white transition-colors duration-200">
                    CUSTOMS
                  </Link>
                  <Link to="/client/browse?category=Men" className="text-xs font-medium text-gray-300 hover:text-white transition-colors duration-200">
                    MEN
                  </Link>
                  <Link to="/client/browse?category=Women" className="text-xs font-medium text-gray-300 hover:text-white transition-colors duration-200">
                    WOMEN
                  </Link>
                  <Link to="/client/browse?category=Kids" className="text-xs font-medium text-gray-300 hover:text-white transition-colors duration-200">
                    KIDS
                  </Link>
                  <Link to="/client/browse?category=Traditional Wear" className="text-xs font-medium text-gray-300 hover:text-white transition-colors duration-200">
                    TRADITIONAL
                  </Link>
                  <Link to="/client/browse?category=Accessories" className="text-xs font-medium text-gray-300 hover:text-white transition-colors duration-200">
                    ACCESSORIES
                  </Link>
                </nav>
              </div>

              {/* Right side - User actions */}
              <div className="flex items-center space-x-2 ml-auto">
                {/* Cart */}
                <button
                  onClick={() => setShowCartModal(true)}
                  className="relative p-2 text-gray-300 hover:text-yellow-400 transition-colors duration-200"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {totalItems > 0 && (
                    <div className="absolute -top-1 -right-1">
                      <Badge count={totalItems} />
                    </div>
                  )}
                </button>

                {/* Favorites */}
                <Link
                  to="/client/favorites"
                  className="relative p-2 text-gray-300 hover:text-yellow-400 transition-colors duration-200"
                >
                  <Heart className="h-4 w-4" />
                  {favorites.length > 0 && (
                    <div className="absolute -top-1 -right-1">
                      <Badge count={favorites.length} />
                    </div>
                  )}
                </Link>

                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                    className="relative p-2 text-gray-300 hover:text-yellow-400 transition-colors duration-200"
                  >
                    <Bell className="h-4 w-4" />
                    {unreadNotifications > 0 && (
                      <div className="absolute -top-1 -right-1">
                        <Badge count={unreadNotifications} />
                      </div>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {showNotificationDropdown && (
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
                      <div className="p-3 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                                !notification.read ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div className="flex items-start space-x-2">
                                <div className={`flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5 ${
                                  !notification.read ? 'bg-blue-500' : 'bg-gray-300'
                                }`} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-900 truncate">
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {notification.time}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-gray-500">
                            <Bell className="h-6 w-6 mx-auto text-gray-300 mb-2" />
                            <p className="text-xs">No notifications yet</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="flex items-center space-x-1 p-1.5 text-gray-300 hover:text-yellow-400 transition-colors duration-200"
                  >
                    <div className="w-5 h-5 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center text-black text-xs font-medium">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <ChevronDown className="h-3 w-3" />
                  </button>

                  {/* Profile Dropdown Menu */}
                  {showProfileDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <div className="p-3 border-b border-gray-100">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate">
                              {user?.name || 'User'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {user?.email || 'user@example.com'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="py-2">
                        <Link
                          to="/client/dashboard"
                          className="flex items-center w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                          onClick={() => setShowProfileDropdown(false)}
                        >
                          <Home className="h-3 w-3 mr-2 text-gray-500" />
                          <span>Dashboard</span>
                        </Link>
                        <Link
                          to="/client/orders"
                          className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                          onClick={() => setShowProfileDropdown(false)}
                        >
                          <Package className="h-4 w-4 mr-3 text-gray-500" />
                          <span>My Orders</span>
                        </Link>
                        <Link
                          to="/client/reviews"
                          className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                          onClick={() => setShowProfileDropdown(false)}
                        >
                          <Star className="h-4 w-4 mr-3 text-gray-500" />
                          <span>Reviews</span>
                        </Link>
                        <Link
                          to="/client/messages"
                          className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                          onClick={() => setShowProfileDropdown(false)}
                        >
                          <MessageSquare className="h-4 w-4 mr-3 text-gray-500" />
                          <span>Messages</span>
                        </Link>
                        <Link
                          to="/client/reports"
                          className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                          onClick={() => setShowProfileDropdown(false)}
                        >
                          <AlertCircle className="h-4 w-4 mr-3 text-gray-500" />
                          <span>My Reports</span>
                        </Link>
                        <div className="border-t border-gray-100 my-1"></div>
                        <Link
                          to="/client/profile"
                          className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                          onClick={() => setShowProfileDropdown(false)}
                        >
                          <User className="h-4 w-4 mr-3 text-gray-500" />
                          <span>Profile Settings</span>
                        </Link>
                        <button
                          onClick={toggleLanguage}
                          className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                        >
                          <Globe className="h-4 w-4 mr-3 text-gray-500" />
                          <span>{locale === 'en' ? 'Switch to Chichewa' : 'Switch to English'}</span>
                        </button>
                        <div className="border-t border-gray-100 my-1"></div>
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                        >
                          <LogOut className="h-4 w-4 mr-3 text-gray-500" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Sidebar */}
        {showCategoriesSidebar && (
          <div className="fixed inset-0 z-[60] flex">
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setShowCategoriesSidebar(false)}
            />

            {/* Sidebar - Reduced by 30% */}
            <div className="relative flex flex-col w-52 bg-white shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between p-2 border-b border-gray-200 bg-black">
                <h2 className="text-sm font-semibold text-white">Categories</h2>
                <button
                  onClick={() => setShowCategoriesSidebar(false)}
                  className="p-0.5 text-gray-300 hover:text-white transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Categories List */}
              <div className="flex-1 overflow-y-auto p-2">
                <div className="space-y-1">
                  {/* All Products */}
                  <Link
                    to="/client/browse"
                    className="block border border-yellow-300 rounded p-1.5 hover:bg-yellow-100 transition-colors bg-yellow-50 border-2"
                    onClick={() => setShowCategoriesSidebar(false)}
                  >
                    <h3 className="text-xs font-semibold text-gray-900 flex items-center">
                      <span className="text-xs mr-1">🛍️</span>
                      All Products
                    </h3>
                    <p className="text-xs text-gray-600 mt-0.5">Clear filters & browse all items</p>
                  </Link>

                  {/* Main Categories */}
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider px-1.5 py-1">Main Categories</h4>
                    
                    {/* Men */}
                    <Link
                      to="/client/browse?category=Men"
                      className="block border border-gray-200 rounded p-1.5 hover:bg-yellow-100 transition-colors"
                      onClick={() => setShowCategoriesSidebar(false)}
                    >
                      <h3 className="text-xs font-medium text-gray-900 flex items-center">
                        <span className="text-xs mr-1">👨</span>
                        Men
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">All men's clothing</p>
                    </Link>

                    {/* Women */}
                    <Link
                      to="/client/browse?category=Women"
                      className="block border border-gray-200 rounded p-1.5 hover:bg-yellow-100 transition-colors"
                      onClick={() => setShowCategoriesSidebar(false)}
                    >
                      <h3 className="text-xs font-medium text-gray-900 flex items-center">
                        <span className="text-xs mr-1">👩</span>
                        Women
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">All women's clothing</p>
                    </Link>

                    {/* Adult */}
                    <Link
                      to="/client/browse?category=Adult"
                      className="block border border-gray-200 rounded p-1.5 hover:bg-yellow-100 transition-colors"
                      onClick={() => setShowCategoriesSidebar(false)}
                    >
                      <h3 className="text-xs font-medium text-gray-900 flex items-center">
                        <span className="text-xs mr-1">👥</span>
                        Adult
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">Mature adult fashion</p>
                    </Link>

                    {/* Kids */}
                    <Link
                      to="/client/browse?category=Kids"
                      className="block border border-gray-200 rounded p-1.5 hover:bg-yellow-100 transition-colors"
                      onClick={() => setShowCategoriesSidebar(false)}
                    >
                      <h3 className="text-xs font-medium text-gray-900 flex items-center">
                        <span className="text-xs mr-1">👶</span>
                        Kids
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">Children's clothing</p>
                    </Link>
                  </div>

                  {/* Specific Categories Section */}
                  <div className="space-y-1 mt-2">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider px-1.5 py-1">Specific Categories</h4>
                    
                    {/* Men's Subcategories */}
                    <div className="border border-gray-200 rounded">
                      <div className="p-1.5 bg-gray-50">
                        <h3 className="text-xs font-medium text-gray-900 flex items-center">
                          <span className="text-xs mr-1">👨</span>
                          Men's Fashion
                        </h3>
                      </div>
                      <div className="p-1 space-y-0.5">
                        <Link
                          to="/client/browse?category=Men's - Top"
                          className="block px-1.5 py-1 text-xs text-gray-600 hover:text-black hover:bg-yellow-100 rounded transition-colors"
                          onClick={() => setShowCategoriesSidebar(false)}
                        >
                          Tops & Shirts
                        </Link>
                        <Link
                          to="/client/browse?category=Men's - Bottom"
                          className="block px-1.5 py-1 text-xs text-gray-600 hover:text-black hover:bg-yellow-100 rounded transition-colors"
                          onClick={() => setShowCategoriesSidebar(false)}
                        >
                          Bottoms & Pants
                        </Link>
                      </div>
                    </div>

                    {/* Women's Subcategories */}
                    <div className="border border-gray-200 rounded">
                      <div className="p-1.5 bg-gray-50">
                        <h3 className="text-xs font-medium text-gray-900 flex items-center">
                          <span className="text-xs mr-1">👩</span>
                          Women's Fashion
                        </h3>
                      </div>
                      <div className="p-1 space-y-0.5">
                        <Link
                          to="/client/browse?category=Women's - Top"
                          className="block px-1.5 py-1 text-xs text-gray-600 hover:text-black hover:bg-yellow-100 rounded transition-colors"
                          onClick={() => setShowCategoriesSidebar(false)}
                        >
                          Tops & Dresses
                        </Link>
                        <Link
                          to="/client/browse?category=Women's - Bottom"
                          className="block px-1.5 py-1 text-xs text-gray-600 hover:text-black hover:bg-yellow-100 rounded transition-colors"
                          onClick={() => setShowCategoriesSidebar(false)}
                        >
                          Bottoms & Skirts
                        </Link>
                      </div>
                    </div>

                    {/* Unisex Subcategories */}
                    <div className="border border-gray-200 rounded">
                      <div className="p-1.5 bg-gray-50">
                        <h3 className="text-xs font-medium text-gray-900 flex items-center">
                          <span className="text-xs mr-1">⚲</span>
                          Unisex Fashion
                        </h3>
                      </div>
                      <div className="p-1 space-y-0.5">
                        <Link
                          to="/client/browse?category=Unisex - Top"
                          className="block px-1.5 py-1 text-xs text-gray-600 hover:text-black hover:bg-yellow-100 rounded transition-colors"
                          onClick={() => setShowCategoriesSidebar(false)}
                        >
                          Unisex Tops
                        </Link>
                        <Link
                          to="/client/browse?category=Unisex - Bottom"
                          className="block px-1.5 py-1 text-xs text-gray-600 hover:text-black hover:bg-yellow-100 rounded transition-colors"
                          onClick={() => setShowCategoriesSidebar(false)}
                        >
                          Unisex Bottoms
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Style Categories Section */}
                  <div className="space-y-1 mt-2">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider px-1.5 py-1">Style Categories</h4>
                    
                    {/* Formal Wear Category */}
                    <Link
                      to="/client/browse?category=Formal Wear"
                      className="block border border-gray-200 rounded p-1.5 hover:bg-yellow-100 transition-colors"
                      onClick={() => setShowCategoriesSidebar(false)}
                    >
                      <h3 className="text-xs font-medium text-gray-900 flex items-center">
                        <span className="text-xs mr-1">👔</span>
                        Formal Wear
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">Professional & Business Attire</p>
                    </Link>

                    {/* Traditional Wear Category */}
                    <Link
                      to="/client/browse?category=Traditional Wear"
                      className="block border border-gray-200 rounded p-1.5 hover:bg-yellow-100 transition-colors"
                      onClick={() => setShowCategoriesSidebar(false)}
                    >
                      <h3 className="text-xs font-medium text-gray-900 flex items-center">
                        <span className="text-xs mr-1">🎭</span>
                        Traditional Wear
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">Cultural & Traditional Clothing</p>
                    </Link>

                    {/* Suits Category */}
                    <Link
                      to="/client/browse?category=Suit"
                      className="block border border-gray-200 rounded p-1.5 hover:bg-yellow-100 transition-colors"
                      onClick={() => setShowCategoriesSidebar(false)}
                    >
                      <h3 className="text-xs font-medium text-gray-900 flex items-center">
                        <span className="text-xs mr-1">🤵</span>
                        Suits
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">Complete Suit Sets</p>
                    </Link>

                    {/* Accessories Category */}
                    <Link
                      to="/client/browse?category=Accessories"
                      className="block border border-gray-200 rounded p-1.5 hover:bg-yellow-100 transition-colors"
                      onClick={() => setShowCategoriesSidebar(false)}
                    >
                      <h3 className="text-xs font-medium text-gray-900 flex items-center">
                        <span className="text-xs mr-1">👜</span>
                        Accessories
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">Bags, Jewelry, Watches</p>
                    </Link>

                    {/* Footwear Category */}
                    <Link
                      to="/client/browse?category=Footwear"
                      className="block border border-gray-200 rounded p-1.5 hover:bg-yellow-100 transition-colors"
                      onClick={() => setShowCategoriesSidebar(false)}
                    >
                      <h3 className="text-xs font-medium text-gray-900 flex items-center">
                        <span className="text-xs mr-1">👠</span>
                        Footwear
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">Shoes, Sandals & Boots</p>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1">
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <Outlet context={{ showCategoriesSidebar, setShowCategoriesSidebar }} />
          </main>
        </div>

        {/* Floating Buttons */}
        <FloatingButtonsWrapper />

        {/* Complaint Modal */}
        <ComplaintModal
          isOpen={showComplaintModal}
          onClose={() => setShowComplaintModal(false)}
        />

        {/* Cart Modal */}
        <CartModal
          isOpen={showCartModal}
          onClose={() => setShowCartModal(false)}
        />
      </div>
    </FloatingButtonsProvider>
  );
};

export default ClientLayout;
