import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, MessageCircle, Loader2, Send } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { chatbotService, BotConversation, BotMessage } from '../../services/chatbotService';

interface ChatbotFloatingButtonProps {
  className?: string;
}

interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: string;
  quickReplies?: string[];
  products?: any[];
  designers?: any[];
}

const ChatbotFloatingButton: React.FC<ChatbotFloatingButtonProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<BotConversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuth();
  const { addToast } = useNotification();

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize bot conversation when opened
  useEffect(() => {
    if (isOpen && !conversation && user) {
      initializeBotConversation();
    }
  }, [isOpen, user]);

  const initializeBotConversation = async () => {
    try {
      setIsLoading(true);

      // Create a mock conversation for immediate functionality
      const mockConversation: BotConversation = {
        id: 'mock-conversation-' + Date.now(),
        participants: [],
        lastActivity: new Date().toISOString(),
        unreadCount: 0
      };
      setConversation(mockConversation);

      // Add welcome message
      const welcomeMessage: Message = {
        id: 'welcome-' + Date.now(),
        content: `Hello ${user?.name}! 👋 I'm the FashionConnect Assistant. I'm here to help you find amazing fashion pieces, connect with designers, and answer any questions about our platform. How can I assist you today?`,
        isBot: true,
        timestamp: new Date().toISOString(),
        quickReplies: ['Browse Products', 'Find Designers', 'Help & Support', 'Custom Orders']
      };
      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Error initializing bot conversation:', error);
      addToast('error', 'Failed to start conversation with assistant');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !conversation || isSending) return;

    const messageContent = inputMessage.trim();
    const userMessage: Message = {
      id: 'user-' + Date.now(),
      content: messageContent,
      isBot: false,
      timestamp: new Date().toISOString()
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsSending(true);

    try {
      const response = await chatbotService.sendMessageToBot(conversation.id, messageContent);
      
      // Add bot response
      const botMessage: Message = {
        id: 'bot-' + Date.now(),
        content: response.botMessage.content,
        isBot: true,
        timestamp: new Date().toISOString(),
        quickReplies: response.botResponse?.quickReplies || [],
        products: response.botResponse?.products || [],
        designers: response.botResponse?.designers || []
      };
      
      setMessages(prev => [...prev, botMessage]);
      
    } catch (error) {
      console.error('Error sending message to bot:', error);
      addToast('error', 'Failed to send message to assistant');
      
      // Add error message
      const errorMessage: Message = {
        id: 'error-' + Date.now(),
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again or contact our support team.",
        isBot: true,
        timestamp: new Date().toISOString(),
        quickReplies: ['Try Again', 'Contact Support', 'Browse Products']
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickReply = async (quickReply: string) => {
    if (!conversation || isSending) return;

    // Add user message for the quick reply
    const userMessage: Message = {
      id: 'user-quick-' + Date.now(),
      content: quickReply,
      isBot: false,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsSending(true);

    try {
      const response = await chatbotService.handleQuickReply(conversation.id, quickReply);
      
      // Add bot response
      const botMessage: Message = {
        id: 'bot-quick-' + Date.now(),
        content: response.botMessage.content,
        isBot: true,
        timestamp: new Date().toISOString(),
        quickReplies: response.botResponse?.quickReplies || [],
        products: response.botResponse?.products || [],
        designers: response.botResponse?.designers || []
      };
      
      setMessages(prev => [...prev, botMessage]);
      
    } catch (error) {
      console.error('Error handling quick reply:', error);
      addToast('error', 'Failed to process quick reply');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!user) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <div className={`fixed bottom-28 right-4 z-40 group ${className}`}>
          <button
            onClick={() => setIsOpen(true)}
            className="relative bg-black hover:bg-gray-800 text-yellow-400 p-3 rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-110 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-yellow-500/50 border-2 border-yellow-400/30"
            aria-label="Chat with FashionConnect Assistant"
            title="Chat with FashionConnect Assistant"
            style={{
              boxShadow: '0 0 20px rgba(234, 179, 8, 0.3), 0 4px 15px rgba(0, 0, 0, 0.3)'
            }}
          >
            {/* Main icon with chat effect */}
            <div className="relative">
              <Bot className="h-5 w-5" />
              <MessageCircle className="h-2.5 w-2.5 absolute -top-1 -right-1 text-yellow-400 animate-pulse" />
            </div>

            {/* Pulse animation */}
            <div className="absolute inset-0 rounded-xl bg-yellow-400 animate-ping opacity-10"></div>

            {/* Enhanced Tooltip - positioned to the left */}
            <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 px-3 py-1.5 bg-black text-yellow-400 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap border border-yellow-400/30"
                 style={{
                   boxShadow: '0 0 15px rgba(234, 179, 8, 0.2), 0 2px 10px rgba(0, 0, 0, 0.3)'
                 }}>
              <div className="flex items-center space-x-1.5">
                <Bot className="h-3 w-3 text-yellow-400" />
                <span className="font-medium">Chat Assistant</span>
              </div>
              {/* Tooltip arrow */}
              <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-black border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
            </div>
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-28 right-4 z-50 w-80 h-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black px-4 py-3 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5" />
              <span className="font-medium text-sm">FashionConnect Assistant</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-black hover:text-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-yellow-500" />
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-xs ${message.isBot ? 'bg-white border border-gray-200' : 'bg-yellow-500 text-black'} rounded-lg px-3 py-2 shadow-sm`}>
                    {message.isBot && (
                      <div className="flex items-center space-x-1 mb-1">
                        <Bot className="w-3 h-3 text-yellow-600" />
                        <span className="text-xs font-medium text-gray-600">Assistant</span>
                      </div>
                    )}
                    
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Quick Replies */}
                    {message.quickReplies && message.quickReplies.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.quickReplies.map((reply, index) => (
                          <button
                            key={index}
                            onClick={() => handleQuickReply(reply)}
                            disabled={isSending}
                            className="block w-full text-left px-2 py-1 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded border border-yellow-300 transition-colors disabled:opacity-50"
                          >
                            {reply}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* Products */}
                    {message.products && message.products.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-medium text-gray-600">Products:</p>
                        {message.products.slice(0, 2).map((product, index) => (
                          <div key={index} className="text-xs bg-gray-100 p-2 rounded">
                            <p className="font-medium">{product.name}</p>
                            <p className="text-gray-600">${product.price}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500 mt-1">
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {isSending && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
                  <div className="flex items-center space-x-2 text-gray-500">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="text-xs">Assistant is typing...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-3 bg-white rounded-b-lg">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                disabled={isSending}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isSending}
                className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-black px-3 py-2 rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotFloatingButton;
