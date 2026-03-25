import React, { useState, useEffect, useRef } from 'react';
import { X, Send, ArrowLeft, MessageCircle, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useSocket } from '../../contexts/SocketContext';
import { type Message } from '../../services/messageService';

interface QuickChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  designerId: string;
  designerName: string;
}

const QuickChatModal: React.FC<QuickChatModalProps> = ({
  isOpen,
  onClose,
  onBack,
  designerId,
  designerName
}) => {
  const { user } = useAuth();
  const { addToast } = useNotification();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { isConnected, sendMessage } = useSocket();

  useEffect(() => {
    if (isOpen && designerId) {
      console.log('🔄 Loading conversation for designer:', designerId);
      loadConversation();
    }
  }, [isOpen, designerId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket event handlers
  useEffect(() => {
    if (!isConnected) return;

    const handleNewMessage = (message: any) => {
      if (message.senderId === designerId || message.receiverId === designerId) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
    };

    // Set up socket listeners
    // onNewMessage?.(handleNewMessage);

    return () => {
      // Clean up listeners if needed
    };
  }, [isConnected, designerId]);

  const loadConversation = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading conversation with designer:', designerId);

      // For now, just simulate loading
      setTimeout(() => {
        setLoading(false);
        console.log('✅ Conversation loaded (simulated)');
      }, 1000);
    } catch (error) {
      console.error('❌ Error loading conversation:', error);
      addToast('error', 'Failed to load conversation');
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    console.log('📤 Sending message:', messageContent, 'from user:', user.name);

    // Create a temporary message for immediate UI feedback
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      sender: {
        id: user.id || user._id || '',
        name: user.name,
        avatar: user.avatar || ''
      },
      receiver: {
        id: designerId,
        name: designerName,
        avatar: ''
      },
      senderId: user.id || user._id || '',
      receiverId: designerId,
      timestamp: new Date().toISOString(),
      read: false,
      status: 'sending'
    };

    // Add message to UI immediately
    setMessages(prev => [...prev, tempMessage]);

    addToast('success', 'Message sent (demo mode)');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  console.log('🔍 QuickChatModal render:', { isOpen, designerId, designerName, user: user?.name });

  if (!isOpen) {
    console.log('❌ QuickChatModal not open, returning null');
    return null;
  }

  if (!user) {
    console.log('❌ No user authenticated, returning null');
    return null;
  }

  console.log('✅ QuickChatModal rendering modal');

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden">
      {/* Background overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed bottom-4 right-4 w-80 h-96 bg-white rounded-lg shadow-2xl flex flex-col border-2 border-red-500">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-lg">
          <div className="flex items-center space-x-2">
            <button
              onClick={onBack}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <User className="h-3 w-3 text-white" />
              </div>
              <div>
                <h3 className="text-xs font-medium text-white">{designerName}</h3>
                <p className="text-xs text-blue-100">
                  {isConnected ? 'Online' : 'Connecting...'}
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

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <MessageCircle className="h-8 w-8 mb-2" />
              <p className="text-xs text-center">Start a conversation with {designerName}</p>
            </div>
          ) : (
            <div className="text-xs text-gray-500 text-center">
              Messages will appear here
            </div>
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
              disabled={!isConnected || loading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !isConnected || loading}
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
    </div>
  );
};

export default QuickChatModal;
