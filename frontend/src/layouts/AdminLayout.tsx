import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import Logo from '../components/common/Logo';
import UnreadBadge from '../components/ui/UnreadBadge';
import { adminService } from '../services/adminService';
import {
  Bell, Menu, X, Home,
  Users, Shield,
  BarChart2, Settings, FileText, Flag, LogOut, Globe,
  ChevronLeft, ChevronRight, Package
} from 'lucide-react';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const { t, locale, changeLocale } = useLanguage();
  const { addToast } = useNotification();
  const location = useLocation();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [unreadNotifications] = useState(12);
  const [pendingDesignerCount, setPendingDesignerCount] = useState(0);
  const [newProductsCount, setNewProductsCount] = useState(0);
  
  // Reset scroll position when route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Fetch pending designer count and new products count
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Fetch pending designers
        const pendingDesigners = await adminService.getPendingDesigners();
        setPendingDesignerCount(pendingDesigners.length);

        // Fetch moderation stats for new products
        const moderationStats = await adminService.getModerationStats();
        setNewProductsCount(moderationStats.newProducts);
      } catch (error) {
        console.error('Error fetching admin counts:', error);
      }
    };

    fetchCounts();

    // Refresh counts every 30 seconds
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);
  
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
    { name: t('nav.dashboard'), icon: Home, href: '/admin', current: location.pathname === '/admin' },
    {
      name: t('nav.userManagement'),
      icon: Users,
      href: '/admin/users',
      current: location.pathname === '/admin/users',
      badge: pendingDesignerCount > 0 ? pendingDesignerCount : undefined
    },
    { name: t('nav.designerVerification'), icon: Shield, href: '/admin/designer-verification', current: location.pathname === '/admin/designer-verification' },
    {
      name: t('nav.contentModeration'),
      icon: Flag,
      href: '/admin/content-moderation',
      current: location.pathname === '/admin/content-moderation',
      badge: newProductsCount > 0 ? newProductsCount : undefined
    },
    { name: 'Orders', icon: Package, href: '/admin/orders', current: location.pathname === '/admin/orders' },
    { name: t('nav.platformAnalytics'), icon: BarChart2, href: '/admin/analytics', current: location.pathname === '/admin/analytics' },
    { name: t('nav.settings'), icon: Settings, href: '/admin/settings', current: location.pathname === '/admin/settings' },
    { name: t('nav.reports'), icon: FileText, href: '/admin/reports', current: location.pathname === '/admin/reports' },
  ];
  
  return (
    <div className="min-h-screen bg-gray-100">
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
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-yellow-500"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <X className="h-6 w-6 text-white" />
            </button>
          </div>

          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex flex-col items-center px-4 mb-6">
              <Logo size="md" variant="default" showIcon={false} />
            </div>
            
            <nav className="px-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`sidebar-link ${item.current ? 'sidebar-link-active' : 'sidebar-link-inactive'} relative`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span>{item.name}</span>
                  {item.badge && item.badge > 0 && (
                    <div className="absolute -top-1 -right-1">
                      <UnreadBadge count={item.badge} size="sm" />
                    </div>
                  )}
                </Link>
              ))}
              
              <div className="pt-4 mt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={toggleLanguage}
                  className="sidebar-link sidebar-link-inactive w-full text-left"
                >
                  <Globe className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span>{locale === 'en' ? 'Switch to Chichewa' : 'Switch to English'}</span>
                </button>
                
                <button
                  type="button"
                  onClick={handleLogout}
                  className="sidebar-link sidebar-link-inactive w-full text-left"
                >
                  <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span>{t('auth.logout')}</span>
                </button>
              </div>
            </nav>
          </div>
        </div>
      </div>

      {/* Fixed top navigation */}
      <div className="fixed top-0 left-0 right-0 z-40 flex h-16 bg-black shadow-sm border-b border-gray-800">
        {/* Mobile menu button */}
        <button
          type="button"
          className="md:hidden px-4 text-gray-400 hover:text-yellow-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-yellow-500"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-6 w-6" />
        </button>

        {/* Desktop sidebar toggle */}
        <button
          type="button"
          className="hidden md:flex px-4 text-gray-400 hover:text-yellow-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-yellow-500 items-center"
          onClick={toggleSidebar}
        >
          <span className="sr-only">Toggle sidebar</span>
          {isSidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>

        <div className="flex-1 px-4 flex justify-between items-center">
          {/* Logo only */}
          <div className="flex items-center">
            <Logo size="sm" variant="default" showIcon={false} />
          </div>

          <div className="ml-4 flex items-center space-x-2">
            {/* Language toggle */}
            <button
              type="button"
              className="p-2 rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors"
              onClick={toggleLanguage}
              title="Change language"
            >
              <Globe className="h-5 w-5" />
            </button>

            {/* Notifications */}
            <button
              type="button"
              className="p-2 rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 relative transition-colors"
              title="View notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 block h-4 w-4 rounded-full bg-yellow-500 text-black text-xs flex items-center justify-center font-medium">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </button>

            {/* Profile - Just avatar, no name/email */}
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center text-black text-sm font-bold">
                {user?.name.charAt(0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Layout container with proper spacing for fixed header */}
      <div className="pt-16 md:flex">
        {/* Fixed Desktop Sidebar */}
        <div className={`hidden md:block fixed left-0 top-16 bottom-0 bg-gray-900 border-r border-gray-800 transition-all duration-300 ease-in-out z-30 ${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        }`}>
          <div className="flex flex-col h-full">
            {/* Sidebar header - removed since logo is now in main header */}
            <div className={`flex items-center justify-center h-4 ${
              isSidebarCollapsed ? 'px-2' : 'px-4'
            }`}>
              {/* Empty space - logo moved to main header */}
            </div>
            
            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-4">
              <nav className={`space-y-1 ${isSidebarCollapsed ? 'px-2' : 'px-3'}`}>
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`sidebar-link group relative ${
                      item.current ? 'sidebar-link-active' : 'sidebar-link-inactive'
                    } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                    title={isSidebarCollapsed ? item.name : ''}
                  >
                    <item.icon className={`h-5 w-5 flex-shrink-0 ${isSidebarCollapsed ? '' : 'mr-3'}`} />
                    {!isSidebarCollapsed && <span>{item.name}</span>}

                    {/* Badge for pending items */}
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
                <div className={`border-t border-gray-200 ${isSidebarCollapsed ? 'mx-2' : 'mx-3'} my-4`} />
                
                {/* Language toggle */}
                <button
                  type="button"
                  onClick={toggleLanguage}
                  className={`sidebar-link sidebar-link-inactive w-full text-left group relative ${
                    isSidebarCollapsed ? 'justify-center' : ''
                  }`}
                  title={isSidebarCollapsed ? (locale === 'en' ? 'Switch to Chichewa' : 'Switch to English') : ''}
                >
                  <Globe className={`h-5 w-5 flex-shrink-0 ${isSidebarCollapsed ? '' : 'mr-3'}`} />
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
                  <LogOut className={`h-5 w-5 flex-shrink-0 ${isSidebarCollapsed ? '' : 'mr-3'}`} />
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
        }`}>
          <main className="flex-1 relative overflow-y-auto focus:outline-none p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;