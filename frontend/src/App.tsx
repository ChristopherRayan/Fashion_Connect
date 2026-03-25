import { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import RoleSelectionPage from './pages/auth/RoleSelectionPage';
import BuyerRegisterPage from './pages/auth/BuyerRegisterPage';
import DesignerRegisterPage from './pages/auth/DesignerRegisterPage';
import EmailVerificationPage from './pages/auth/EmailVerificationPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import TailorSetup from './pages/TailorSetup';
import NotFoundPage from './pages/NotFoundPage';
import TestPage from './pages/TestPage';
import LoadingSpinner from './components/common/LoadingSpinner';
import { UserRole } from './types';
import ProtectedRoute from './components/routing/ProtectedRoute';
import ClientLayout from './layouts/ClientLayout';
import DesignerLayout from './layouts/DesignerLayout';
import AdminLayout from './layouts/AdminLayout';
import TailorLayout from './layouts/TailorLayout';
import NotificationToast from './components/common/NotificationToast';
import Features from './pages/Features';
import HowItWorks from './pages/HowItWorks';
import DebugTailorProfile from './components/designer/DebugTailorProfile';

// Client pages
const ClientDashboard = lazy(() => import('./pages/client/Dashboard'));
const BrowseProducts = lazy(() => import('./pages/client/BrowseProducts'));

const ClientOrders = lazy(() => import('./pages/client/Orders'));
const ClientMessages = lazy(() => import('./pages/client/Messages'));
const ClientProfile = lazy(() => import('./pages/client/Profile'));
const ClientReviews = lazy(() => import('./pages/client/Reviews'));
const ClientFavorites = lazy(() => import('./pages/client/Favorites'));
const ProductDetail = lazy(() => import('./pages/client/ProductDetail'));
const DesignerCollection = lazy(() => import('./pages/client/DesignerCollection'));
const Designers = lazy(() => import('./pages/client/Designers'));
const PaymentSuccess = lazy(() => import('./pages/client/PaymentSuccess'));
const PaymentCancelled = lazy(() => import('./pages/client/PaymentCancelled'));
const Payments = lazy(() => import('./pages/client/Payments'));
const ClientReports = lazy(() => import('./pages/client/Reports'));
const EmailVerification = lazy(() => import('./components/auth/EmailVerification'));
const EmailVerificationRequest = lazy(() => import('./pages/auth/EmailVerificationRequest'));
const Cart = lazy(() => import('./pages/client/Cart'));
const Checkout = lazy(() => import('./pages/client/Checkout'));

// Designer pages
const DesignerDashboard = lazy(() => import('./pages/designer/Dashboard'));
const ProductManagement = lazy(() => import('./pages/designer/ProductManagement'));
const DesignerPortfolio = lazy(() => import('./pages/designer/Portfolio'));
const DesignerMessages = lazy(() => import('./pages/designer/Messages'));
const DesignerAnalytics = lazy(() => import('./pages/designer/Analytics'));
const DesignerProfile = lazy(() => import('./pages/designer/Profile'));
const DesignerReports = lazy(() => import('./pages/designer/Reports'));
const OrderReports = lazy(() => import('./pages/designer/OrderReports'));
const OrderDetails = lazy(() => import('./pages/designer/OrderDetails'));
const DesignerOrders = lazy(() => import('./pages/designer/Orders'));
const ProfileManagement = lazy(() => import('./pages/designer/ProfileManagement'));
const DesignerReviews = lazy(() => import('./pages/designer/Reviews'));
const DesignerPayments = lazy(() => import('./pages/designer/Payments'));
const CustomOrders = lazy(() => import('./pages/designer/CustomOrders'));
const TailorManagement = lazy(() => import('./components/designer/TailorManagement'));

// Tailor pages
const TailorDashboard = lazy(() => import('./pages/tailor/Dashboard'));
const TailorOrders = lazy(() => import('./pages/tailor/Orders'));
const TailorOrderDetail = lazy(() => import('./pages/tailor/OrderDetail'));
const TailorMessages = lazy(() => import('./pages/tailor/Messages'));
const TailorProfile = lazy(() => import('./pages/tailor/Profile'));

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const DesignerVerification = lazy(() => import('./pages/admin/DesignerVerification'));
const ContentModeration = lazy(() => import('./pages/admin/ContentModeration'));
const Orders = lazy(() => import('./pages/admin/Orders'));
const PlatformAnalytics = lazy(() => import('./pages/admin/PlatformAnalytics'));
const SystemSettings = lazy(() => import('./pages/admin/SystemSettings'));
const Reports = lazy(() => import('./pages/admin/Reports'));

function App() {
  const { user, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <>
      <NotificationToast />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/features" element={<Features />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/test" element={<TestPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RoleSelectionPage />} />
        <Route path="/register/buyer" element={<BuyerRegisterPage />} />
        <Route path="/register/designer" element={<DesignerRegisterPage />} />
        <Route path="/register/verify-email" element={
          <Suspense fallback={<LoadingSpinner />}>
            <EmailVerificationRequest />
          </Suspense>
        } />
        <Route path="/register/old" element={<RegisterPage />} />
        <Route
          path="/verify-email"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <EmailVerification />
            </Suspense>
          }
        />
        <Route
          path="/request-verification"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <EmailVerificationRequest />
            </Suspense>
          }
        />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/tailor/setup" element={<TailorSetup />} />
        <Route path="/debug-tailor" element={
          <ProtectedRoute allowedRoles={['TAILOR', 'DESIGNER', 'ADMIN']}>
            <DebugTailorProfile />
          </ProtectedRoute>
        } />

        {/* Client Routes */}
        <Route
          path="/client"
          element={
            <ProtectedRoute allowedRoles={[UserRole.CLIENT]}>
              <ClientLayout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <BrowseProducts />
              </Suspense>
            }
          />
          <Route
            path="dashboard"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <ClientDashboard />
              </Suspense>
            }
          />
          <Route
            path="browse"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <BrowseProducts />
              </Suspense>
            }
          />
          <Route
            path="product/:id"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <ProductDetail />
              </Suspense>
            }
          />
          <Route
            path="designer/:designerId"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <DesignerCollection />
              </Suspense>
            }
          />
          <Route
            path="designers"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <Designers />
              </Suspense>
            }
          />
          <Route
            path="orders/:orderId/payment-success"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <PaymentSuccess />
              </Suspense>
            }
          />
          <Route
            path="orders/:orderId/payment-cancelled"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <PaymentCancelled />
              </Suspense>
            }
          />
          <Route
            path="payments"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <Payments />
              </Suspense>
            }
          />
          <Route
            path="reports"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <ClientReports />
              </Suspense>
            }
          />

          <Route 
            path="orders" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <ClientOrders />
              </Suspense>
            } 
          />
          <Route 
            path="messages" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <ClientMessages />
              </Suspense>
            } 
          />
          <Route 
            path="profile" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <ClientProfile />
              </Suspense>
            } 
          />
          <Route 
            path="reviews" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <ClientReviews />
              </Suspense>
            } 
          />
          <Route
            path="favorites"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <ClientFavorites />
              </Suspense>
            }
          />
          <Route
            path="cart"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <Cart />
              </Suspense>
            }
          />
          <Route
            path="checkout"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <Checkout />
              </Suspense>
            }
          />
        </Route>

        {/* Designer Routes */}
        <Route 
          path="/designer" 
          element={
            <ProtectedRoute allowedRoles={[UserRole.DESIGNER]}>
              <DesignerLayout />
            </ProtectedRoute>
          }
        >
          <Route 
            index 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <DesignerDashboard />
              </Suspense>
            } 
          />
          <Route 
            path="products" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <ProductManagement />
              </Suspense>
            } 
          />
          <Route 
            path="products/new" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <ProductManagement />
              </Suspense>
            } 
          />
          <Route
            path="orders"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <DesignerOrders />
              </Suspense>
            }
          />
          <Route
            path="order-reports"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <OrderReports />
              </Suspense>
            }
          />
          <Route
            path="custom-orders"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <CustomOrders />
              </Suspense>
            }
          />
          <Route
            path="custom-orders/:orderId"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <CustomOrders />
              </Suspense>
            }
          />
          <Route
            path="tailors"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <TailorManagement />
              </Suspense>
            }
          />
          <Route
            path="orders/:orderId"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <OrderDetails />
              </Suspense>
            }
          />
          <Route 
            path="portfolio" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <DesignerPortfolio />
              </Suspense>
            } 
          />
          <Route 
            path="messages" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <DesignerMessages />
              </Suspense>
            } 
          />
          <Route 
            path="analytics" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <DesignerAnalytics />
              </Suspense>
            } 
          />
          <Route
            path="profile"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <DesignerProfile />
              </Suspense>
            }
          />
          <Route
            path="profile-management"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <ProfileManagement />
              </Suspense>
            }
          />
          <Route
            path="reviews"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <DesignerReviews />
              </Suspense>
            }
          />
          <Route
            path="reports"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <DesignerReports />
              </Suspense>
            }
          />
          <Route
            path="payments"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <DesignerPayments />
              </Suspense>
            }
          />
        </Route>

        {/* Tailor Routes */}
        <Route 
          path="/tailor" 
          element={
            <ProtectedRoute allowedRoles={[UserRole.TAILOR]}>
              <TailorLayout />
            </ProtectedRoute>
          }
        >
          <Route 
            index 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <TailorDashboard />
              </Suspense>
            } 
          />
          <Route 
            path="orders" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <TailorOrders />
              </Suspense>
            } 
          />
          <Route 
            path="orders/:orderId" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <TailorOrderDetail />
              </Suspense>
            } 
          />
          <Route 
            path="messages" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <TailorMessages />
              </Suspense>
            } 
          />
          <Route 
            path="profile" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <TailorProfile />
              </Suspense>
            } 
          />
        </Route>

        {/* Admin Routes */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route 
            index 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <AdminDashboard />
              </Suspense>
            } 
          />
          <Route 
            path="users" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <UserManagement />
              </Suspense>
            } 
          />
          <Route 
            path="designer-verification" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <DesignerVerification />
              </Suspense>
            } 
          />
          <Route 
            path="content-moderation" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <ContentModeration />
              </Suspense>
            } 
          />
          <Route
            path="orders"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <Orders />
              </Suspense>
            }
          />
          <Route 
            path="analytics" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <PlatformAnalytics />
              </Suspense>
            } 
          />
          <Route 
            path="settings" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <SystemSettings />
              </Suspense>
            } 
          />
          <Route 
            path="reports" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <Reports />
              </Suspense>
            } 
          />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default App;
 