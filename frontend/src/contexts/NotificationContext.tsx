import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { ToastNotification } from '../types';
import { generateId } from '../utils/helpers';

interface NotificationContextType {
  toasts: ToastNotification[];
  addToast: (type: ToastNotification['type'], message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = useCallback((type: ToastNotification['type'], message: string, duration = 1500) => {
    const id = generateId('toast_');
    const toast: ToastNotification = { id, type, message, duration };
    
    setToasts(prevToasts => [...prevToasts, toast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  const value = {
    toasts,
    addToast,
    removeToast,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
 