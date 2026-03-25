import { useState, useEffect, useCallback } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { useUnreadCount } from '../contexts/UnreadCountContext';
import UnreadBadge from '../components/ui/UnreadBadge';
import Logo from '../components/common/Logo';
import {
  Bell, Menu, X, Home,
  Package, MessageCircle,
  Scissors, LogOut, Globe,
  ChevronLeft, ChevronRight, User, Settings
} from 'lucide-react';
import ComplaintModal from '../components/common/ComplaintModal';

const TailorLayout = () => {
  const { user, logout } = useAuth();
  const { t, locale, changeLocale } = useLanguage();
  const { addToast } = useNotification();
  const { totalUnreadCount } = useUnreadCount();
  const location = useLocation();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  
  // Reset scroll position when route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle window resize
  const handleResize = useCallback(() => {
    const newWidth = window.innerWidth;

    // Auto-collapse sidebar on smaller screens
    if (newWidth < 1024) {
      setIsSidebarCollapsed(true);
      setIsMobileMenuOpen(false);
    } else if (newWidth >= 1280) {
      setIsSidebarCollapsed(false);
    }
  }, []);

  useEffect(() => {
    // Set initial state based on screen size
    handleResize();

    // Add resize listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);
  
  const handleLogout = () => {
    logout();
    addToast('success', t('auth.logoutSuccess'));
  };
  
  const toggleLanguage = () => {
    const newLocale = locale === 'en' ? 'ny' : 'en';
    changeLocale(newLocale);
    addToast('info', `Language changed to ${newLocale === 'en' ? 'English' : 'Chichewa'}`);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };
  
  const navigation = [
    { name: t('nav.dashboard'), icon: Home, href: '/tailor', current: location.pathname === '/tailor' },
    { name: 'My Orders', icon: Package, href: '/tailor/orders', current: location.pathname.startsWith('/tailor/orders') },
    { name: t('nav.messages'), icon: MessageCircle, href: '/tailor/messages', current: location.pathname === '/tailor/messages', badge: totalUnreadCount },
    { name: 'Profile', icon: User, href: '/tailor/profile', current: location.pathname === '/tailor/profile' },
  ];
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile navigation drawer */}
      <div className={`fixed inset-0 z-50 flex md:hidden ${isMobileMenuOpen ? 'visible' : 'invisible'}`}>
        {/* Overlay */}
        <div 
          className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ${
            isMobileMenuOpen ? 'opacity-100 ease-out duration-300' : 'opacity-0 ease-in duration-200'
          }`} 
          onClick={() => setIsMobileMenuOpen(false)}
        />
        
        {/* Mobile sidebar */}
        <div className={`relative flex-1 flex flex-col max-w-xs w-full bg-gray-900 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-400"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <X className="h-6 w-6 text-indigo-400" />
            </button>
          </div>

          <div className="flex-1 h-0 pt-6 pb-4 overflow-y-auto border-r-2 border-indigo-400">
            <nav className="px-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`sidebar-link ${item.current ? 'sidebar-link-active' : 'sidebar-link-inactive'} relative`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.name}</span>
                  {item.badge && item.badge > 0 && (
                    <div className="absolute -top-1 -right-1">
                      <UnreadBadge count={item.badge} size="sm" />
                    </div>
                  )}
                </Link>
              ))}
              
              <div className="pt-4 mt-4 border-t-2 border-indigo-400">
                <button
                  type="button"
                  onClick={toggleLanguage}
                  className="sidebar-link sidebar-link-inactive w-full text-left"
                >
                  <Globe className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{locale === 'en' ? 'Switch to Chichewa' : 'Switch to English'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="sidebar-link sidebar-link-inactive w-full text-left"
                >
                  <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{t('auth.logout')}</span>
                </button>
              </div>
            </nav>
          </div>
        </div>
      </div>

      {/* Fixed top navigation */}
      <div className="fixed top-0 left-0 right-0 z-40 flex h-16 bg-gray-900 shadow-lg border-b-2 border-indigo-400">
        {/* Mobile menu button */}
        <button
          type="button"
          className="md:hidden px-4 text-indigo-400 hover:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-colors"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-6 w-6" />
        </button>

        <div className="flex-1 px-4 flex justify-between items-center">
          {/* Logo in top navigation */}
          <div className="flex items-center">
            <Logo size="md" variant="dark" showIcon={false} />
          </div>

          <div className="ml-4 flex items-center space-x-4">
            {/* Language toggle */}
            <button
              type="button"
              className="p-2 rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              onClick={toggleLanguage}
              title="Change language"
            >
              <Globe className="h-5 w-5" />
            </button>

            {/* Notifications */}
            <button
              type="button"
              className="p-2 rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 relative transition-colors"
              title="View notifications"
            >
              <Bell className="h-5 w-5" />
              {totalUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 block h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold border-2 border-gray-900">
                  {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                </span>
              )}
            </button>

            {/* Profile - Clickable */}
            <Link
              to="/tailor/profile"
              className="flex items-center space-x-3 hover:bg-gray-800 rounded-lg px-2 py-1 transition-colors duration-200"
            >
              <div className="h-8 w-8 rounded-full bg-indigo-400 flex items-center justify-center text-gray-900 text-sm font-bold border-2 border-gray-700">
                <Scissors className="h-4 w-4" />
              </div>
              <div className="hidden lg:block">
                <div className="text-sm font-medium text-indigo-400 truncate max-w-[120px]">
                  {user?.name}
                </div>
                <div className="text-xs text-gray-400 truncate max-w-[120px]">
                  Tailor
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Layout container with proper spacing for fixed header */}
      <div className="pt-16 md:flex">
        {/* Fixed Desktop Sidebar */}
        <div className={`hidden md:block fixed left-0 top-16 bottom-0 bg-gray-900 border-r-2 border-indigo-400 transition-all duration-300 ease-in-out z-30 ${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        }`}>
          <div className="flex flex-col h-full">
            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-3">
              <nav className={`space-y-0.5 ${isSidebarCollapsed ? 'px-2' : 'px-2.5'}`}>
                {/* Dashboard with collapse button */}
                <div className="relative flex items-center">
                  <Link
                    to="/tailor"
                    className={`sidebar-link group flex-1 ${
                      location.pathname === '/tailor' ? 'sidebar-link-active' : 'sidebar-link-inactive'
                    } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                    title={isSidebarCollapsed ? t('nav.dashboard') : ''}
                  >
                    <Home className={`h-4 w-4 flex-shrink-0 ${isSidebarCollapsed ? '' : 'mr-2.5'}`} />
                    {!isSidebarCollapsed && <span>{t('nav.dashboard')}</span>}
                  </Link>

                  {/* Collapse button beside Dashboard */}
                  {!isSidebarCollapsed && (
                    <button
                      type="button"
                      onClick={toggleSidebar}
                      className="ml-2 p-1 rounded-md text-indigo-400 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors"
                      title="Collapse sidebar"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  )}

                  {/* Expand button when collapsed */}
                  {isSidebarCollapsed && (
                    <button
                      type="button"
                      onClick={toggleSidebar}
                      className="absolute -right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full bg-gray-800 text-indigo-400 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors border border-indigo-400 z-10"
                      title="Expand sidebar"
                    >
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* Other navigation items */}
                {navigation.slice(1).map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`sidebar-link group relative ${
                      item.current ? 'sidebar-link-active' : 'sidebar-link-inactive'
                    } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                    title={isSidebarCollapsed ? item.name : ''}
                  >
                    <item.icon className={`h-4 w-4 flex-shrink-0 ${isSidebarCollapsed ? '' : 'mr-2.5'}`} />
                    {!isSidebarCollapsed && <span>{item.name}</span>}

                    {/* Badge for unread messages */}
                    {item.badge && item.badge > 0 && (
                      <div className={`absolute ${isSidebarCollapsed ? '-top-1 -right-1' : '-top-1 -right-1'}`}>
                        <UnreadBadge count={item.badge} size="sm" />
                      </div>
                    )}

                    {/* Tooltip for collapsed state */}
                    {isSidebarCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        {item.name}
                        {item.badge && item.badge > 0 && ` (${item.badge})`}
                      </div>
                    )}
                  </Link>
                ))}
                
                {/* Separator */}
                <div className={`border-t border-gray-200 ${isSidebarCollapsed ? 'mx-2' : 'mx-2.5'} my-3`} />
                
                {/* Language toggle */}
                <button
                  type="button"
                  onClick={toggleLanguage}
                  className={`sidebar-link sidebar-link-inactive w-full text-left group relative ${
                    isSidebarCollapsed ? 'justify-center' : ''
                  }`}
                  title={isSidebarCollapsed ? (locale === 'en' ? 'Switch to Chichewa' : 'Switch to English') : ''}
                >
                  <Globe className={`h-4 w-4 flex-shrink-0 ${isSidebarCollapsed ? '' : 'mr-2.5'}`} />
                  {!isSidebarCollapsed && (
                    <span>{locale === 'en' ? 'Switch to Chichewa' : 'Switch to English'}</span>
                  )}
                  
                  {isSidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      {locale === 'en' ? 'Switch to Chichewa' : 'Switch to English'}
                    </div>
                  )}
                </button>

                {/* Logout */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className={`sidebar-link sidebar-link-inactive w-full text-left group relative ${
                    isSidebarCollapsed ? 'justify-center' : ''
                  }`}
                  title={isSidebarCollapsed ? t('auth.logout') : ''}
                >
                  <LogOut className={`h-4 w-4 flex-shrink-0 ${isSidebarCollapsed ? '' : 'mr-2.5'}`} />
                  {!isSidebarCollapsed && <span>{t('auth.logout')}</span>}

                  {isSidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      {t('auth.logout')}
                    </div>
                  )}
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Main content area with proper margin for sidebar */}
        <div className={`flex flex-col flex-1 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
        } min-w-0`}>
          <main className="flex-1 relative overflow-y-auto focus:outline-none p-4 md:p-6 min-h-0 bg-gray-50">
            <div className="max-w-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* Complaint Modal */}
      <ComplaintModal
        isOpen={showComplaintModal}
        onClose={() => setShowComplaintModal(false)}
      />
    </div>
  );
};

export default TailorLayout;