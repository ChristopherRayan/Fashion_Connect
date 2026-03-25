import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { CartProvider } from './contexts/CartContext';
import { SocketProvider } from './contexts/SocketContext';
import { UnreadCountProvider } from './contexts/UnreadCountContext';
import { OrderNotificationProvider } from './contexts/OrderNotificationContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { FollowDesignersProvider } from './contexts/FollowDesignersContext';
import { FloatingButtonsProvider } from './contexts/FloatingButtonsContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <LanguageProvider>
        <NotificationProvider>
          <AuthProvider>
            <FavoritesProvider>
              <FollowDesignersProvider>
                <CartProvider>
                <SocketProvider>
                  <UnreadCountProvider>
                    <OrderNotificationProvider>
                      <FloatingButtonsProvider>
                        <App />
                      </FloatingButtonsProvider>
                    </OrderNotificationProvider>
                  </UnreadCountProvider>
                </SocketProvider>
                </CartProvider>
              </FollowDesignersProvider>
            </FavoritesProvider>
          </AuthProvider>
        </NotificationProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>
);
 