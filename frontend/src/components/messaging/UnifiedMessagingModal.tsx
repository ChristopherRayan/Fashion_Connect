import React, { useState, useEffect, useRef } from 'react';
import { X, Send, ArrowLeft, MessageCircle, User, Search, Star } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useNotification } from '../../contexts/NotificationContext';
import { messageService, type Message, type Conversation } from '../../services/messageService';
import { designerService } from '../../services/designerService';
import { formatDate } from '../../utils/helpers';
import LoadingSpinner from '../common/LoadingSpinner';

interface Designer {
  _id?: string;
  name: string;
  businessName?: string;
  bio?: string;
  specialty?: string;
  location?: string;
  profileImage?: string;
  rating?: number;
  customOrdersAvailable?: boolean;
  turnaroundTime?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

interface UnifiedMessagingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'designers' | 'chat';
  initialDesignerId?: string;
  initialDesignerName?: string;
}

const UnifiedMessagingModal: React.FC<UnifiedMessagingModalProps> = ({
  isOpen,
  onClose,
  initialView = 'designers',
  initialDesignerId,
  initialDesignerName
}) => {
  const { user } = useAuth();
  const { addToast } = useNotification();
  const [currentView, setCurrentView] = useState<'designers' | 'chat'>(initialView);
  const [selectedDesigner, setSelectedDesigner] = useState<{
    id: string;
    name: string;
    isOnline?: boolean;
    lastSeen?: string;
  } | null>(null);
  
  // Designer list state
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [loadingDesigners, setLoadingDesigners] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    isConnected, 
    sendMessage, 
    joinConversation, 
    leaveConversation,
    onNewMessage,
    onMessageSent
  } = useSocket();

  // Initialize with initial designer if provided
  useEffect(() => {
    if (initialDesignerId && initialDesignerName) {
      setSelectedDesigner({ id: initialDesignerId, name: initialDesignerName });
      setCurrentView('chat');
    }
  }, [initialDesignerId, initialDesignerName]);

  // Load designers when modal opens
  useEffect(() => {
    if (isOpen && currentView === 'designers') {
      fetchDesigners();
    }
  }, [isOpen, currentView]);

  // Load conversation when designer is selected
  useEffect(() => {
    if (isOpen && currentView === 'chat' && selectedDesigner) {
      loadConversation();
    }
  }, [isOpen, currentView, selectedDesigner]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket connection for real-time messaging
  useEffect(() => {
    if (conversationId) {
      console.log('🔌 Setting up socket connection for conversation:', conversationId);

      if (isConnected) {
        joinConversation(conversationId);
      }

      const handleNewMessage = (message: any) => {
        console.log('📨 New message received:', message);
        const messageConversationId = message.conversationId || message.conversation?._id || message.conversation;

        if (messageConversationId === conversationId) {
          // Remove any optimistic messages with same content and timestamp
          setMessages(prev => {
            const filtered = prev.filter(msg =>
              !(msg.id.startsWith('temp-') && msg.content === message.content)
            );

            // Check if message already exists (avoid duplicates)
            const messageId = message.id;
            const exists = filtered.some(msg => msg.id === messageId);
            if (!exists) {
              return [...filtered, message];
            }
            return filtered;
          });
          scrollToBottom();
        }
      };

      const handleMessageSent = (message: any) => {
        console.log('✅ Message sent confirmation:', message);
        const messageConversationId = message.conversationId || message.conversation?._id || message.conversation;

        if (messageConversationId === conversationId) {
          // Replace optimistic message with real one
          setMessages(prev => {
            const filtered = prev.filter(msg =>
              !(msg.id.startsWith('temp-') && msg.content === message.content)
            );

            // Check if message already exists (avoid duplicates)
            const messageId = message.id;
            const exists = filtered.some(msg => msg.id === messageId);
            if (!exists) {
              return [...filtered, message];
            }
            return filtered;
          });
          scrollToBottom();
        }
      };

      onNewMessage(handleNewMessage);
      onMessageSent(handleMessageSent);

      return () => {
        if (isConnected) {
          leaveConversation(conversationId);
        }
      };
    }
  }, [conversationId, isConnected, joinConversation, leaveConversation, onNewMessage, onMessageSent]);

  const fetchDesigners = async () => {
    try {
      setLoadingDesigners(true);
      console.log('🔄 Fetching designers for messaging...');
      
      const response = await designerService.getDesigners({
        page: 1,
        limit: 50,
        sortBy: 'rating',
        sortType: 'desc'
      });

      console.log('✅ Designers fetched:', response.docs.length);
      setDesigners(response.docs);
    } catch (error) {
      console.error('❌ Error fetching designers:', error);
      addToast('error', 'Failed to load designers');
    } finally {
      setLoadingDesigners(false);
    }
  };

  const loadConversation = async () => {
    if (!selectedDesigner) return;
    
    try {
      setLoadingMessages(true);
      console.log('🔄 Loading conversation with designer:', selectedDesigner.name);

      // Get existing conversations
      const conversations = await messageService.getConversations({}, false);
      console.log('🔍 Looking for conversation with designer ID:', selectedDesigner.id);
      console.log('📋 Available conversations:', conversations.map(c => ({
        id: c.id,
        participants: c.participants.map(p => ({ id: p.id, name: p.name }))
      })));

      let conversation = conversations.find((conv: Conversation) =>
        conv.participants.some((p: any) => p.id === selectedDesigner.id || p._id === selectedDesigner.id)
      );

      if (!conversation) {
        // Start new conversation
        console.log('💬 Starting new conversation with designer');
        await messageService.startConversationWithDesigner({
          designerId: selectedDesigner.id,
          initialMessage: 'Hello! I\'m interested in your designs.'
        });

        // The result is a Message, we need to get the conversation again
        console.log('📨 Initial message sent, refetching conversations...');
        const updatedConversations = await messageService.getConversations({}, false);
        console.log('🔄 Updated conversations after creating new one:', updatedConversations.length);
        conversation = updatedConversations.find((conv: Conversation) =>
          conv.participants.some((p: any) => p.id === selectedDesigner.id || p._id === selectedDesigner.id)
        );

        if (!conversation) {
          throw new Error('Failed to create conversation');
        }
      }

      setConversationId(conversation.id);

      // Load messages using the correct method
      const messagesResponse = await messageService.getConversationMessages(conversation.id, {
        page: 1,
        limit: 50
      });
      console.log('📨 Messages loaded:', messagesResponse.messages?.length || 0);
      setMessages(messagesResponse.messages || []);

      console.log('✅ Conversation loaded:', conversation.id);
    } catch (error) {
      console.error('❌ Error loading conversation:', error);
      addToast('error', 'Failed to load conversation');
    } finally {
      setLoadingMessages(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversationId) return;

    const messageContent = newMessage.trim();
    
    // Ensure we have selectedDesigner info before sending
    if (!selectedDesigner) {
      addToast('error', 'No recipient selected. Please try again.');
      return;
    }

    setNewMessage('');

    try {
      // Create optimistic message for immediate UI update
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        content: messageContent,
        sender: { id: user?._id || '', name: user?.name || '', avatar: '' },
        receiver: { id: selectedDesigner?.id || '', name: selectedDesigner?.name || '', avatar: '' },
        senderId: user?._id || '',
        receiverId: selectedDesigner?.id || '',
        timestamp: new Date().toISOString(),
        read: false,
        conversationId
      };

      // Add optimistic message to UI immediately
      setMessages(prev => [...prev, optimisticMessage as any]);
      scrollToBottom();

      if (isConnected) {
        // Send via WebSocket for real-time delivery
        sendMessage({
          conversationId,
          receiverId: selectedDesigner?.id || '',
          content: messageContent
        });
        console.log('📤 Message sent via WebSocket');
      } else {
        // Fallback to HTTP API if WebSocket not connected
        try {
          const sentMessage = await messageService.sendMessage(conversationId, {
            content: messageContent
          });

          // Add the sent message to the UI immediately
          setMessages(prev => {
            const filtered = prev.filter(msg => !msg.id.startsWith('temp-'));
            return [...filtered, sentMessage];
          });
          scrollToBottom();

          console.log('📤 Message sent via HTTP API');
        } catch (apiError) {
          console.error('HTTP API send failed:', apiError);
          throw apiError;
        }
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      addToast('error', 'Failed to send message');

      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
      setNewMessage(messageContent); // Restore message on error
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSelectDesigner = (designer: Designer) => {
    console.log('👨‍🎨 Designer selected:', designer.name);
    setSelectedDesigner({
      id: designer._id || '',
      name: designer.name,
      isOnline: designer.isOnline,
      lastSeen: designer.lastSeen
    });
    setCurrentView('chat');
  };

  const handleBackToDesigners = () => {
    setCurrentView('designers');
    setSelectedDesigner(null);
    setConversationId(null);
    setMessages([]);
  };

  const filteredDesigners = designers.filter(designer =>
    designer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    designer.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    designer.specialty?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden">
      {/* Background overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed bottom-4 right-4 w-80 h-96 bg-white rounded-lg shadow-2xl flex flex-col border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-lg">
          <div className="flex items-center space-x-2">
            {currentView === 'chat' && (
              <button
                onClick={handleBackToDesigners}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                {currentView === 'designers' ? (
                  <MessageCircle className="h-3 w-3 text-white" />
                ) : (
                  <User className="h-3 w-3 text-white" />
                )}
              </div>
              <div>
                <h3 className="text-xs font-medium text-white">
                  {currentView === 'designers' ? 'Choose Designer' : selectedDesigner?.name}
                </h3>
                <p className="text-xs text-blue-100">
                  {currentView === 'chat' ? (
                    selectedDesigner?.isOnline ? (
                      <span className="flex items-center space-x-1">
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        <span>Online</span>
                      </span>
                    ) : selectedDesigner?.lastSeen ? (
                      `Last seen ${new Date(selectedDesigner.lastSeen).toLocaleDateString() === new Date().toLocaleDateString()
                        ? `today at ${new Date(selectedDesigner.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : `on ${new Date(selectedDesigner.lastSeen).toLocaleDateString()}`
                      }`
                    ) : 'Offline'
                  ) : 'Select to chat'}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {currentView === 'designers' ? (
            // Designer List View
            <div className="h-full flex flex-col">
              {/* Search */}
              <div className="p-3 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search designers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                  />
                </div>
              </div>

              {/* Designer List */}
              <div className="flex-1 overflow-y-auto">
                {loadingDesigners ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : filteredDesigners.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                    <MessageCircle className="h-8 w-8 mb-3" />
                    <p className="text-xs">No designers found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredDesigners.map((designer) => (
                      <div
                        key={designer._id}
                        onClick={() => handleSelectDesigner(designer)}
                        className="px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            {designer.profileImage ? (
                              <img
                                className="h-8 w-8 rounded-full object-cover"
                                src={designer.profileImage}
                                alt={designer.name}
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-xs">
                                {designer.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="ml-2 flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-medium text-gray-900 truncate">
                                {designer.name}
                              </p>
                              {designer.rating && (
                                <div className="flex items-center">
                                  <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                  <span className="ml-1 text-xs text-gray-600">
                                    {designer.rating.toFixed(1)}
                                  </span>
                                </div>
                              )}
                            </div>
                            {designer.specialty && (
                              <p className="text-xs text-gray-500 truncate">
                                {designer.specialty}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Chat View
            <div className="h-full flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <MessageCircle className="h-8 w-8 mb-2" />
                    <p className="text-xs text-center">Start a conversation with {selectedDesigner?.name}</p>
                  </div>
                ) : (
                  messages.map((message: any, index: number) => {
                    const messageId = message._id || message.id;
                    const senderId = (message.sender?._id || message.sender?.id || message.senderId)?.toString();
                    const currentUserId = (user?._id || user?.id)?.toString();
                    const isMyMessage = senderId === currentUserId;
                    const timestamp = message.createdAt || message.timestamp;
                    
                    // Debug logging for the first message to help diagnose ID issues
                    if (index === 0) {
                      console.log('🔍 UnifiedMessagingModal message ownership debug:', {
                        currentUserId,
                        senderId,
                        isMyMessage,
                        userRole: user?.role,
                        userName: user?.name
                      });
                    }

                    return (
                      <div
                        key={messageId}
                        className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] px-2 py-1.5 rounded-lg text-xs ${
                            isMyMessage
                              ? 'bg-yellow-400 text-gray-900'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="font-bold">{message.content}</p>
                          <p className={`text-xs font-bold mt-0.5 ${
                            isMyMessage ? 'text-red-600' : 'text-blue-800'
                          }`}>
                            {formatDate(timestamp)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-3 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                    disabled={!isConnected || loadingMessages}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || !isConnected || loadingMessages}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="h-3 w-3" />
                  </button>
                </div>
                {!isConnected && (
                  <p className="text-xs text-red-500 mt-1">Connecting to chat...</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedMessagingModal;
