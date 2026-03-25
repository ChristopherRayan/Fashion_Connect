import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { orderService } from '../services/orderService';
import { productService } from '../services/productService';

interface OrderNotificationContextType {
  newOrdersCount: number;
  outOfStockCount: number;
  refreshCounts: () => void;
  markOrdersAsSeen: () => void;
}

const OrderNotificationContext = createContext<OrderNotificationContextType | undefined>(undefined);

export const useOrderNotification = () => {
  const context = useContext(OrderNotificationContext);
  if (!context) {
    throw new Error('useOrderNotification must be used within an OrderNotificationProvider');
  }
  return context;
};

interface OrderNotificationProviderProps {
  children: React.ReactNode;
}

export const OrderNotificationProvider: React.FC<OrderNotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [outOfStockCount, setOutOfStockCount] = useState(0);

  const refreshCounts = async () => {
    if (!user) return;

    try {
      // For clients - count their pending orders
      if (user.role === 'CLIENT') {
        const response = await orderService.getMyOrders({
          page: 1,
          limit: 100,
          status: 'pending'
        });
        setNewOrdersCount(response.docs?.length || 0);
      }

      // For designers - count new orders for their products and out of stock items
      else if (user.role === 'DESIGNER') {
        const response = await orderService.getDesignerOrders({
          page: 1,
          limit: 100,
          status: 'pending'
        });
        setNewOrdersCount(response.docs?.length || 0);

        // Get out of stock products count
        try {
          const outOfStockResponse = await productService.getOutOfStockCount();
          setOutOfStockCount(outOfStockResponse.count || 0);
        } catch (stockError) {
          console.error('Error fetching out of stock count:', stockError);
          setOutOfStockCount(0);
        }
      }

      // For admins - count all pending orders
      else if (user.role === 'ADMIN') {
        // This would need admin order endpoints
        setNewOrdersCount(0);
      }
    } catch (error) {
      console.error('Error fetching order counts:', error);
    }
  };

  useEffect(() => {
    refreshCounts();
    
    // Refresh counts every 30 seconds
    const interval = setInterval(refreshCounts, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  const markOrdersAsSeen = () => {
    setNewOrdersCount(0);
  };

  const value = {
    newOrdersCount,
    outOfStockCount,
    refreshCounts,
    markOrdersAsSeen
  };

  return (
    <OrderNotificationContext.Provider value={value}>
      {children}
    </OrderNotificationContext.Provider>
  );
};
