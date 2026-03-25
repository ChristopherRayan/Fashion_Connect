import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import { authService } from '../services/authService';

// Types
interface SocketMessage {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar: string;
  };
  receiver: {
    id: string;
    name: string;
    avatar: string;
  };
  timestamp: string;
  read: boolean;
  conversationId: string;
}

interface TypingUser {
  userId: string;
  userName: string;
}

interface UserStatus {
  userId: string;
  status: 'online' | 'offline';
  lastSeen: string;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: string[];
  typingUsers: Map<string, TypingUser[]>;
  sendMessage: (data: {
    conversationId?: string;
    receiverId: string;
    content: string;
    productId?: string;
  }) => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  markMessagesAsRead: (conversationId: string) => void;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
  onNewMessage: (callback: (message: SocketMessage) => void) => void;
  onMessageSent: (callback: (message: SocketMessage) => void) => void;
  onMessageError: (callback: (error: { error: string }) => void) => void;
  onUserStatusUpdate: (callback: (status: UserStatus) => void) => void;
  onMessageNotification: (callback: (notification: any) => void) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { addToast } = useNotification();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingUser[]>>(new Map());

  // Get token once and memoize it to prevent unnecessary re-renders
  const [token] = useState(() => authService.getStoredToken());

  // Event callbacks
  const [messageCallbacks, setMessageCallbacks] = useState<((message: SocketMessage) => void)[]>([]);
  const [messageSentCallbacks, setMessageSentCallbacks] = useState<((message: SocketMessage) => void)[]>([]);
  const [messageErrorCallbacks, setMessageErrorCallbacks] = useState<((error: { error: string }) => void)[]>([]);
  const [userStatusCallbacks, setUserStatusCallbacks] = useState<((status: UserStatus) => void)[]>([]);
  const [notificationCallbacks, setNotificationCallbacks] = useState<((notification: any) => void)[]>([]);

  // Initialize socket connection
  useEffect(() => {
    if (!user || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Extract base URL from API base URL (remove /api/v1 suffix)
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
    const socketUrl = apiBaseUrl.replace('/api/v1', '');

    const newSocket = io(socketUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true
    });

    console.log('📡 Socket instance created, waiting for connection...');

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ Socket connected successfully');
      console.log('🔍 Setting isConnected to true...');
      setIsConnected(true);
      console.log('� isConnected state should now be true');
      console.log('�📢 Adding success toast...');
      // Removed connection toast to reduce notification noise
      console.log('🎯 Socket connect handler completed');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      console.log('🔍 Setting isConnected to false...');
      setIsConnected(false);
      console.log('🎯 Socket disconnect handler completed');
      // Removed disconnection toast to reduce notification noise
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        fullError: error
      });
      setIsConnected(false);
      addToast('error', 'Failed to connect to messaging service');
    });

    newSocket.on('connect_timeout', () => {
      console.error('⏰ Socket connection timeout');
      setIsConnected(false);
    });

    // Add a manual timeout check
    setTimeout(() => {
      if (!newSocket.connected) {
        console.error('⏰ Manual timeout check: Socket still not connected after 15 seconds');
        console.log('🔍 Socket state:', {
          connected: newSocket.connected,
          disconnected: newSocket.disconnected,
          id: newSocket.id
        });
      }
    }, 15000);

    // Message events
    newSocket.on('new-message', (message: SocketMessage) => {
      console.log('📨 New message received:', message);
      messageCallbacks.forEach(callback => callback(message));
    });

    newSocket.on('message-sent', (message: SocketMessage) => {
      console.log('✅ Message sent confirmation:', message);
      messageSentCallbacks.forEach(callback => callback(message));
    });

    newSocket.on('message-error', (error: { error: string }) => {
      console.error('❌ Message error:', error);
      messageErrorCallbacks.forEach(callback => callback(error));
      addToast('error', error.error);
    });

    // Typing events
    newSocket.on('user-typing', (data: TypingUser & { conversationId?: string }) => {
      const conversationId = data.conversationId || 'default';
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        const currentTyping = newMap.get(conversationId) || [];
        const updatedTyping = [...currentTyping.filter(u => u.userId !== data.userId), data];
        newMap.set(conversationId, updatedTyping);
        return newMap;
      });
    });

    newSocket.on('user-stopped-typing', (data: { userId: string; conversationId?: string }) => {
      const conversationId = data.conversationId || 'default';
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        const currentTyping = newMap.get(conversationId) || [];
        const updatedTyping = currentTyping.filter(u => u.userId !== data.userId);
        newMap.set(conversationId, updatedTyping);
        return newMap;
      });
    });

    // User status events
    newSocket.on('user-status-update', (status: UserStatus) => {
      userStatusCallbacks.forEach(callback => callback(status));
      
      if (status.status === 'online') {
        setOnlineUsers(prev => [...prev.filter(id => id !== status.userId), status.userId]);
      } else {
        setOnlineUsers(prev => prev.filter(id => id !== status.userId));
      }
    });

    // Notification events
    newSocket.on('message-notification', (notification: any) => {
      notificationCallbacks.forEach(callback => callback(notification));
    });

    setSocket(newSocket);

    return () => {
      console.log('🔌 Cleaning up socket connection due to dependency change');
      console.log('🔍 Cleanup triggered by:', { userId: user?.id, hasToken: !!token });
      newSocket.disconnect();
    };
  }, [user?._id || user?.id, user?.email, token]); // Depend on user ID, email and token

  // Socket methods
  const sendMessage = useCallback((data: {
    conversationId?: string;
    receiverId: string;
    content: string;
    productId?: string;
  }) => {
    if (socket && isConnected) {
      socket.emit('send-message', data);
    } else {
      addToast('error', 'Not connected to messaging service');
    }
  }, [socket, isConnected, addToast]);

  const joinConversation = useCallback((conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('join-conversation', conversationId);
    }
  }, [socket, isConnected]);

  const leaveConversation = useCallback((conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('leave-conversation', conversationId);
    }
  }, [socket, isConnected]);

  const markMessagesAsRead = useCallback((conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('mark-messages-read', { conversationId });
    }
  }, [socket, isConnected]);

  const startTyping = useCallback((conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('typing-start', { conversationId });
    }
  }, [socket, isConnected]);

  const stopTyping = useCallback((conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('typing-stop', { conversationId });
    }
  }, [socket, isConnected]);

  // Event subscription methods
  const onNewMessage = useCallback((callback: (message: SocketMessage) => void) => {
    setMessageCallbacks(prev => [...prev, callback]);
    return () => {
      setMessageCallbacks(prev => prev.filter(cb => cb !== callback));
    };
  }, []);

  const onMessageSent = useCallback((callback: (message: SocketMessage) => void) => {
    setMessageSentCallbacks(prev => [...prev, callback]);
    return () => {
      setMessageSentCallbacks(prev => prev.filter(cb => cb !== callback));
    };
  }, []);

  const onMessageError = useCallback((callback: (error: { error: string }) => void) => {
    setMessageErrorCallbacks(prev => [...prev, callback]);
    return () => {
      setMessageErrorCallbacks(prev => prev.filter(cb => cb !== callback));
    };
  }, []);

  const onUserStatusUpdate = useCallback((callback: (status: UserStatus) => void) => {
    setUserStatusCallbacks(prev => [...prev, callback]);
    return () => {
      setUserStatusCallbacks(prev => prev.filter(cb => cb !== callback));
    };
  }, []);

  const onMessageNotification = useCallback((callback: (notification: any) => void) => {
    setNotificationCallbacks(prev => [...prev, callback]);
    return () => {
      setNotificationCallbacks(prev => prev.filter(cb => cb !== callback));
    };
  }, []);

  // Debug log when isConnected changes
  useEffect(() => {
    console.log('🔍 SocketContext isConnected changed to:', isConnected);
  }, [isConnected]);

  const value: SocketContextType = {
    socket,
    isConnected,
    onlineUsers,
    typingUsers,
    sendMessage,
    joinConversation,
    leaveConversation,
    markMessagesAsRead,
    startTyping,
    stopTyping,
    onNewMessage,
    onMessageSent,
    onMessageError,
    onUserStatusUpdate,
    onMessageNotification
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
