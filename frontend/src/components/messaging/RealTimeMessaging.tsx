import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Send, Search, User, MoreVertical, Image, Paperclip, Smile, ChevronUp, AlertCircle, RefreshCw, Wifi, WifiOff, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useUnreadCount } from '../../contexts/UnreadCountContext';
import { useFloatingButtons } from '../../contexts/FloatingButtonsContext';
import { messageService, type Conversation, type Message } from '../../services/messageService';
import { productService, type Product } from '../../services/productService';
import { API_CONFIG } from '../../config/api';
import { getFirstProductImageUrl } from '../../utils/productImageUtils';
import MessageLoadingSpinner from './MessageLoadingSpinner';
import MessageErrorBoundary from './MessageErrorBoundary';
import MessageItem from './MessageItem';
import ConversationItem from './ConversationItem';

interface RealTimeMessagingProps {
  designerId?: string;
  productId?: string;
}

// Helper function to get full image URL
const getImageUrl = (imagePath: string | undefined): string => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  const baseUrl = API_CONFIG.BASE_URL.replace('/api/v1', '');
  return `${baseUrl}${imagePath}`;
};

const RealTimeMessaging: React.FC<RealTimeMessagingProps> = ({ designerId, productId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { hideFloatingButtons, showFloatingButtons } = useFloatingButtons();

  // Helper function to get user ID (handle both id and _id properties)
  const getUserId = useCallback(() => {
    // Try different ID properties that might exist
    const id = user?._id || user?.id;
    const stringId = id?.toString();

    // Store in localStorage for persistence across page refreshes
    if (stringId) {
      localStorage.setItem('currentUserId', stringId);
    }

    // Fallback to localStorage if user context is not available
    const fallbackId = !stringId ? localStorage.getItem('currentUserId') : null;
    const finalId = stringId || fallbackId;

    console.log('🔍 getUserId called:', {
      userId: finalId,
      userEmail: user?.email,
      userName: user?.name,
      hasId: !!user?.id,
      has_id: !!user?._id
    });

    return finalId; // Ensure it's always a string
  }, [user]);
  
  const { 
    isConnected, 
    sendMessage, 
    joinConversation, 
    leaveConversation, 
    markMessagesAsRead,
    startTyping,
    stopTyping,
    onNewMessage,
    onMessageSent,
    onMessageError,
    typingUsers
  } = useSocket();
  const { addToast } = useNotification();
  const { updateUnreadCount, incrementUnreadCount, resetUnreadCount } = useUnreadCount();

  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [productContext, setProductContext] = useState<Product | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<number>();

  // Memoized current user ID to avoid recalculation and ensure consistency
  const currentUserId = useMemo(() => {
    const id = getUserId();
    console.log('🔍 Memoized currentUserId calculated:', {
      id,
      userExists: !!user,
      userEmail: user?.email
    });
    return id || '';
  }, [getUserId, user]);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Fetch conversations with debouncing and retry logic
  const fetchConversations = useCallback(async (useCache: boolean = true, retryCount: number = 0) => {
    const currentUserId = getUserId();
    console.log('🚀 fetchConversations called with:', { useCache, retryCount, userId: currentUserId });

    if (!currentUserId) {
      console.log('❌ No user ID, returning early');
      setLoading(false); // Make sure to set loading to false
      return;
    }

    try {
      setLoading(true);
      console.log(`🔄 Fetching conversations... (attempt ${retryCount + 1})`);
      console.log('👤 Current user:', currentUserId, user?.name);

      console.log('📡 About to call messageService.getConversations...');
      const conversationsData = await messageService.getConversations({}, useCache);
      console.log('📋 Raw conversations data:', conversationsData);

      const formattedConversations = conversationsData.map(conv =>
        messageService.formatConversationForDisplay(conv, currentUserId)
      );
      console.log('✨ Formatted conversations:', formattedConversations);

      setConversations(formattedConversations);

      // Update global unread counts
      formattedConversations.forEach(conv => {
        if (conv.unreadCount > 0) {
          updateUnreadCount(conv.id, conv.unreadCount);
        }
      });

      // Auto-select conversation if designerId is provided
      if (designerId) {
        const existingConversation = formattedConversations.find(conv =>
          conv.participants.some(p => p.id === designerId)
        );

        if (existingConversation) {
          setSelectedConversation(existingConversation.id);
        }
      } else if (formattedConversations.length > 0 && !selectedConversation) {
        setSelectedConversation(formattedConversations[0].id);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);

      // Retry logic for network errors
      if (retryCount < 2 && errorMessage.includes('network')) {
        console.log(`🔄 Retrying conversation fetch in ${(retryCount + 1) * 1000}ms...`);
        setTimeout(() => {
          setError(null); // Clear error before retry
          fetchConversations(false, retryCount + 1); // Don't use cache on retry
        }, (retryCount + 1) * 1000);
        return;
      }

      addToast('error', 'Failed to load conversations. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [getUserId, designerId, selectedConversation, addToast]);

  // Fetch conversations when component mounts or connection is established
  useEffect(() => {
    const userId = getUserId();

    console.log('🔍 RealTimeMessaging useEffect triggered - SMOOTH MESSAGING VERSION!');
    console.log('🔍 Checking conditions for fetching conversations:', {
      userId: userId,
      userName: user?.name,
      isConnected,
      hasUser: !!user,
      hasUserId: !!userId,
      userObject: user,
      userIdProperty: user?.id,
      user_idProperty: user?._id,
      isConnectedType: typeof isConnected,
      isConnectedValue: isConnected
    });

    // Always try to fetch conversations if user exists, regardless of socket connection
    // The socket connection is mainly for real-time updates, not for initial data loading
    if (userId) {
      console.log('✅ User exists, fetching conversations immediately for smooth experience...');
      // Force fresh data immediately to prevent "recipient not found" issues
      fetchConversations(false);
    } else {
      console.log('❌ No user ID, cannot fetch conversations');
    }
  }, [user, fetchConversations]); // Watch user object changes

  // Hide floating buttons when messaging is open
  useEffect(() => {
    hideFloatingButtons();
    return () => {
      showFloatingButtons();
    };
  }, [hideFloatingButtons, showFloatingButtons]);

  // Separate effect for socket connection status
  useEffect(() => {
    if (isConnected) {
      console.log('✅ Socket connected - real-time features enabled');
    } else {
      console.log('❌ Socket disconnected - real-time features disabled');
    }
  }, [isConnected]);

  // Fetch product context when productId is provided
  useEffect(() => {
    const fetchProductContext = async () => {
      if (productId) {
        try {
          console.log('🛍️ Fetching product context for:', productId);
          const product = await productService.getProductById(productId);
          setProductContext(product);
          console.log('✅ Product context loaded:', product.name);
        } catch (error) {
          console.error('❌ Failed to fetch product context:', error);
        }
      }
    };

    fetchProductContext();
  }, [productId]);

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      setMessagesLoading(true);
      console.log('📨 Fetching messages for conversation:', conversationId);
      
      const messagesResponse = await messageService.getConversationMessages(conversationId);
      const messagesData = messagesResponse.messages;
      console.log('📨 Messages fetched:', messagesData);
      
      setMessages(messagesData);
      
      // Mark messages as read (check if message is not read by current user)
      const unreadMessages = messagesData.filter(msg => 
        msg.senderId !== currentUserId && !msg.read
      );
      
      if (unreadMessages.length > 0) {
        await messageService.markMessagesAsRead(conversationId);
        markMessagesAsRead?.(conversationId);
      }
      
      // Scroll to bottom after messages load
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error fetching messages:', error);
      addToast('error', 'Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  }, [currentUserId, markMessagesAsRead, scrollToBottom, addToast]);

  // Handle conversation selection
  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversation(conversationId);

    // Reset unread count for this conversation
    resetUnreadCount(conversationId);

    // Update local conversation state
    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversationId
          ? { ...conv, unreadCount: 0 }
          : conv
      )
    );

    // Fetch messages for this conversation
    fetchMessages(conversationId);

    // Join the conversation for real-time updates
    if (isConnected) {
      joinConversation?.(conversationId);
    }
  };

  // Fetch messages when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    } else {
      setMessages([]);
    }
  }, [selectedConversation, fetchMessages]);

  // Socket event handlers
  useEffect(() => {
    if (!isConnected) return;

    const handleNewMessage = (message: Message) => {
      console.log('📨 New message received:', message);
      
      // Add to messages if it's for the current conversation
      if (message.conversationId === selectedConversation) {
        setMessages(prev => {
          // Check if message already exists (avoid duplicates)
          const exists = prev.some(m => m.id === message.id);
          if (exists) return prev;
          return [...prev, message];
        });
        
        // Mark as read if conversation is active
        if (selectedConversation && message.senderId !== currentUserId) {
          markMessagesAsRead?.(selectedConversation);
        }
        
        // Scroll to bottom
        setTimeout(scrollToBottom, 100);
      }
      
      // Update conversations list
      fetchConversations(false);
    };

    const handleMessageSent = (message: Message) => {
      console.log('📨 Message sent confirmed:', message);
      
      // Replace temporary message with real one - improved matching for messages with attachments
      setMessages(prev => 
        prev.map(m => {
          // Match temp messages by content and sender, or if both have attachments
          const isMatch = m.id.startsWith('temp_') && (
            (m.content === message.content && m.senderId === message.senderId) ||
            (m.attachments?.length > 0 && message.attachments?.length > 0 && m.senderId === message.senderId)
          );
          
          if (isMatch) {
            console.log('🔄 Replacing temp message with real message:', {
              tempId: m.id,
              realId: message.id,
              hasAttachments: !!message.attachments?.length
            });
            
            // Clean up blob URLs from optimistic message
            m.attachments?.forEach(att => {
              if (att.url.startsWith('blob:')) {
                URL.revokeObjectURL(att.url);
              }
            });
            
            // Use server response - server URLs are more reliable than optimistic blob URLs
            return message;
          }
          return m;
        })
      );
    };

    const handleMessageError = (error: any) => {
      console.error('📨 Message error:', error);
      addToast('error', 'Message failed to send');
    };

    // Set up socket listeners
    onNewMessage?.(handleNewMessage);
    onMessageSent?.(handleMessageSent);
    onMessageError?.(handleMessageError);

    return () => {
      // Clean up listeners if needed
      if (selectedConversation) {
        leaveConversation?.(selectedConversation);
      }
    };
  }, [isConnected, selectedConversation, currentUserId, onNewMessage, onMessageSent, onMessageError, markMessagesAsRead, scrollToBottom, fetchConversations, addToast, leaveConversation]);

  // Handle sending a message
  const handleSendMessage = useCallback(async () => {
    if ((!newMessage.trim() && selectedFiles.length === 0) || !selectedConversation) return;

    const tempId = `temp_${Date.now()}`;
    
    // Find the receiver (other participant in the conversation)
    let conversation = conversations.find(c => c.id === selectedConversation);
    let receiverId = conversation?.participants.find(p => p.id !== currentUserId)?.id;
    
    console.log('🔍 Conversation lookup:', {
      selectedConversation,
      conversationFound: !!conversation,
      conversationParticipants: conversation?.participants?.map(p => ({ id: p.id, name: p.name })),
      currentUserId,
      receiverId
    });
    
    // If no recipient found, try refreshing conversations first
    if (!receiverId) {
      console.log('🔄 No recipient found, refreshing conversations...');
      try {
        await fetchConversations(false); // Force refresh without cache
        // Get fresh conversations state
        const freshConversations = conversations;
        const updatedConversation = freshConversations.find(c => c.id === selectedConversation);
        receiverId = updatedConversation?.participants.find(p => p.id !== currentUserId)?.id;
        conversation = updatedConversation;
        
        console.log('🔄 After refresh:', {
          freshConversationsCount: freshConversations.length,
          updatedConversationFound: !!updatedConversation,
          newReceiverId: receiverId
        });
      } catch (error) {
        console.error('❌ Failed to refresh conversations:', error);
      }
    }
    
    if (!receiverId) {
      console.error('❌ No receiverId found after all attempts');
      addToast('error', 'Could not find recipient for this conversation. Please try refreshing the page.');
      return;
    }

    const messageData = {
      conversationId: selectedConversation,
      content: newMessage.trim(),
      receiverId: receiverId,
      attachments: selectedFiles.length > 0 ? selectedFiles : undefined,
      productReference: productContext ? {
        productId: productContext._id,
        productName: productContext.name,
        productImage: getFirstProductImageUrl(productContext.images),
        productPrice: productContext.discountPrice || productContext.price
      } : undefined
    };

    console.log('📤 Preparing to send message:', messageData);

    // Optimistic update
    const tempMessage: Message = {
      id: tempId,
      conversationId: selectedConversation,
      senderId: currentUserId,
      receiverId: receiverId,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      read: false,
      sender: {
        id: currentUserId,
        name: user?.name || 'You',
        avatar: user?.profileImage || '',
        role: user?.role || 'CLIENT'
      },
      receiver: {
        id: receiverId,
        name: conversation?.participants.find(p => p.id === receiverId)?.name || 'Unknown',
        avatar: conversation?.participants.find(p => p.id === receiverId)?.avatar || '',
        role: conversation?.participants.find(p => p.id === receiverId)?.role || 'USER'
      },
      // Add attachments to optimistic message
      attachments: selectedFiles.length > 0 ? selectedFiles.map(file => ({
        type: file.type.startsWith('image/') ? 'image' as const : 'file' as const,
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size
      })) : undefined,
      // Add product reference if available
      productReference: productContext ? {
        productId: productContext._id,
        productName: productContext.name,
        productImage: getFirstProductImageUrl(productContext.images),
        productPrice: productContext.discountPrice || productContext.price
      } : undefined
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    
    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      stopTyping?.(selectedConversation);
    }

    try {
      // Always use HTTP API for messages with attachments, otherwise prefer socket
      if (selectedFiles.length > 0) {
        // Force HTTP API for file uploads
        console.log('🌐 Sending message with attachments via HTTP API:', selectedFiles.length);
        const detectedType = selectedFiles[0]?.type.startsWith('image/') ? 'image' : 'file';
        console.log('🔍 File type detection:', {
          fileName: selectedFiles[0]?.name,
          mimeType: selectedFiles[0]?.type,
          detectedType: detectedType
        });
        
        const messagePayload: any = {
          content: messageData.content,
          receiverId: receiverId,
          type: detectedType,
          attachments: selectedFiles,
          productReference: messageData.productReference
        };
        
        await messageService.sendMessage(selectedConversation, messagePayload);
      } else if (isConnected && sendMessage) {
        // Use socket for text-only messages
        console.log('📡 Sending text message via socket:', messageData);
        sendMessage(messageData); // Socket emit doesn't return Promise
      } else {
        // Fallback to HTTP API for text messages when socket unavailable
        console.log('🌐 Sending text message via HTTP API');
        
        // For text-only messages, use simple JSON payload
        const response = await fetch(`${API_CONFIG.BASE_URL}/messages/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify({
            content: messageData.content,
            receiverId: receiverId,
            conversationId: selectedConversation,
            type: 'text'
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ HTTP API Error:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          });
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        console.log('✅ Text message sent via HTTP API');
      }
      
      // Clear files only after successful send
      setSelectedFiles([]);
      
      // Update conversation list
      fetchConversations(false);
      
      // Scroll to bottom
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('❌ Error sending message:', error);
      console.error('❌ Full error details:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        selectedConversation,
        receiverId,
        hasAttachments: selectedFiles.length > 0,
        isConnected,
        messageData
      });
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
      
      // Restore message content and files
      setNewMessage(messageData.content);
      // Don't clear selectedFiles here - keep them for retry
      
      const errorMessage = error instanceof Error 
        ? `Failed to send message: ${error.message}` 
        : 'Failed to send message. Please try again.';
      
      addToast('error', errorMessage);
    }
  }, [newMessage, selectedFiles, selectedConversation, currentUserId, user, conversations, isConnected, sendMessage, isTyping, stopTyping, fetchConversations, scrollToBottom, addToast]);

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv =>
    conv.participants.some(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)] flex items-center justify-center">
        <MessageLoadingSpinner size="lg" text="Loading conversations..." />
      </div>
    );
  }

  return (
    <MessageErrorBoundary>
      <div className="h-[calc(100vh-12rem)] md:h-[calc(100vh-8rem)] flex flex-col md:flex-row min-h-0 bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Conversations List */}
        <div className="w-full md:w-1/3 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Messages
              {!isConnected && (
                <WifiOff className="h-4 w-4 ml-2 text-red-500" title="Offline" />
              )}
            </h2>
            
            {/* Search */}
            <div className="mt-3 relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {error && (
              <div className="p-4 bg-red-50 border-b border-red-200">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                  <p className="text-sm text-red-700">{error}</p>
                  <button
                    onClick={() => {
                      setError(null);
                      fetchConversations(false);
                    }}
                    className="ml-auto p-1 hover:bg-red-100 rounded"
                  >
                    <RefreshCw className="h-3 w-3 text-red-500" />
                  </button>
                </div>
              </div>
            )}
            
            {filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">
                  {conversations.length === 0 ? 'No conversations yet' : 'No matches found'}
                </p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  isSelected={selectedConversation === conversation.id}
                  onClick={() => handleConversationSelect(conversation.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* Back button for mobile */}
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="md:hidden p-2 hover:bg-gray-100 rounded-full"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    
                    {(() => {
                      const conversation = conversations.find(c => c.id === selectedConversation);
                      const otherParticipant = conversation?.participants.find(p => p.id !== currentUserId);
                      return (
                        <>
                          <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
                            {otherParticipant?.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">
                              {otherParticipant?.name || 'Unknown User'}
                            </h3>
                            <div className="flex items-center space-x-2">
                              <p className="text-xs text-gray-500">
                                {otherParticipant?.role || 'User'}
                              </p>
                              {isConnected ? (
                                <Wifi className="h-3 w-3 text-green-500" title="Online" />
                              ) : (
                                <WifiOff className="h-3 w-3 text-red-500" title="Offline" />
                              )}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  
                  <button className="p-2 hover:bg-gray-100 rounded-full">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {messagesLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <MessageLoadingSpinner size="md" text="Loading messages..." />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const previousMessage = index > 0 ? messages[index - 1] : undefined;
                    const currentDate = new Date(message.timestamp).toDateString();
                    const previousDate = previousMessage ? new Date(previousMessage.timestamp).toDateString() : null;
                    const showDate = !previousMessage || currentDate !== previousDate;
                    
                    // Robust user ID comparison - handle both string and object IDs
                    const messageSenderId = (message.senderId || message.sender?.id || message.sender?._id)?.toString();
                    const isCurrentUser = messageSenderId === currentUserId?.toString();
                    
                    // Debug logging for ID mismatch issues
                    if (index === 0) {
                      console.log('🔍 Message ownership debug:', {
                        currentUserId,
                        currentUserIdType: typeof currentUserId,
                        messageSenderId,
                        messageSenderIdType: typeof messageSenderId,
                        isCurrentUser,
                        messageContent: message.content?.substring(0, 20),
                        userName: user?.name,
                        userRole: user?.role
                      });
                    }
                    
                    return (
                      <MessageItem
                        key={message.id}
                        message={message}
                        isCurrentUser={isCurrentUser}
                        showDate={showDate}
                        previousMessage={previousMessage}
                      />
                    );
                  })
                )}
                
                {/* Typing indicator */}
                {typingUsers && typingUsers.length > 0 && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-4 py-2">
                      <p className="text-xs text-gray-500">
                        {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                      </p>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 bg-white">
                {/* Product Context Indicator */}
                {productContext && (
                  <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                    <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0">
                      <img
                        src={getFirstProductImageUrl(productContext.images)}
                        alt={productContext.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-blue-800 truncate">
                        Product context: {productContext.name}
                      </p>
                      <p className="text-xs text-blue-600">
                        Messages will include product reference
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-end space-x-2">
                  {/* File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setSelectedFiles(files);
                    }}
                    className="hidden"
                  />
                  
                  {/* Attachment Button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title="Attach files"
                  >
                    <Paperclip className="h-4 w-4 text-gray-500" />
                  </button>
                  
                  {/* Message Input */}
                  <div className="flex-1 relative">
                    <textarea
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        
                        // Handle typing indicators
                        if (!isTyping) {
                          setIsTyping(true);
                          if (selectedConversation) {
                            startTyping?.(selectedConversation);
                          }
                        }
                        
                        // Reset typing timeout
                        if (typingTimeoutRef.current) {
                          clearTimeout(typingTimeoutRef.current);
                        }
                        
                        typingTimeoutRef.current = window.setTimeout(() => {
                          setIsTyping(false);
                          if (selectedConversation) {
                            stopTyping?.(selectedConversation);
                          }
                        }, 1000);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type your message..."
                      className="w-full resize-none border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={1}
                      style={{ minHeight: '40px', maxHeight: '120px' }}
                    />
                    
                    {/* Emoji Button */}
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="absolute right-2 top-2 p-1 hover:bg-gray-100 rounded transition-colors"
                      title="Add emoji"
                    >
                      <Smile className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                  
                  {/* Send Button */}
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() && selectedFiles.length === 0}
                    className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                
                {/* Selected Files Preview */}
                {selectedFiles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="h-16 w-16 object-cover rounded border"
                        />
                        <button
                          onClick={() => {
                            setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                          }}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </MessageErrorBoundary>
  );
};

export default RealTimeMessaging;
