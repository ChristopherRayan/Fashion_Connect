import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { messageService } from '../services/messageService';

interface UnreadCountContextType {
  totalUnreadCount: number;
  updateUnreadCount: (conversationId: string, count: number) => void;
  incrementUnreadCount: (conversationId: string) => void;
  resetUnreadCount: (conversationId: string) => void;
  refreshUnreadCounts: () => Promise<void>;
}

const UnreadCountContext = createContext<UnreadCountContextType | null>(null);

export const useUnreadCount = () => {
  const context = useContext(UnreadCountContext);
  if (!context) {
    throw new Error('useUnreadCount must be used within an UnreadCountProvider');
  }
  return context;
};

interface UnreadCountProviderProps {
  children: React.ReactNode;
}

export const UnreadCountProvider: React.FC<UnreadCountProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [conversationUnreadCounts, setConversationUnreadCounts] = useState<Map<string, number>>(new Map());
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  // Calculate total unread count whenever conversation counts change
  useEffect(() => {
    const total = Array.from(conversationUnreadCounts.values()).reduce((sum, count) => sum + count, 0);
    setTotalUnreadCount(total);
  }, [conversationUnreadCounts]);

  // Refresh unread counts from server
  const refreshUnreadCounts = async () => {
    if (!user) return;

    try {
      const conversations = await messageService.getConversations({}, false); // Don't use cache
      const newCounts = new Map<string, number>();
      
      conversations.forEach(conv => {
        if (conv.unreadCount > 0) {
          newCounts.set(conv.id, conv.unreadCount);
        }
      });
      
      setConversationUnreadCounts(newCounts);
    } catch (error) {
      console.error('Failed to refresh unread counts:', error);
    }
  };

  // Update unread count for a specific conversation
  const updateUnreadCount = (conversationId: string, count: number) => {
    setConversationUnreadCounts(prev => {
      const newCounts = new Map(prev);
      if (count > 0) {
        newCounts.set(conversationId, count);
      } else {
        newCounts.delete(conversationId);
      }
      return newCounts;
    });
  };

  // Increment unread count for a conversation
  const incrementUnreadCount = (conversationId: string) => {
    setConversationUnreadCounts(prev => {
      const newCounts = new Map(prev);
      const currentCount = newCounts.get(conversationId) || 0;
      newCounts.set(conversationId, currentCount + 1);
      return newCounts;
    });
  };

  // Reset unread count for a conversation
  const resetUnreadCount = (conversationId: string) => {
    setConversationUnreadCounts(prev => {
      const newCounts = new Map(prev);
      newCounts.delete(conversationId);
      return newCounts;
    });
  };

  // Load initial unread counts when user logs in
  useEffect(() => {
    if (user) {
      refreshUnreadCounts();
    } else {
      setConversationUnreadCounts(new Map());
    }
  }, [user]);

  const value: UnreadCountContextType = {
    totalUnreadCount,
    updateUnreadCount,
    incrementUnreadCount,
    resetUnreadCount,
    refreshUnreadCounts
  };

  return (
    <UnreadCountContext.Provider value={value}>
      {children}
    </UnreadCountContext.Provider>
  );
};
