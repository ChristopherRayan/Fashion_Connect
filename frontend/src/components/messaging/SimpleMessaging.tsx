import React, { useState, useEffect } from 'react';
import { Send, MessageCircle, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

interface SimpleMessage {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
  };
  timestamp: string;
}

interface SimpleConversation {
  id: string;
  participants: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  lastMessage?: {
    content: string;
    timestamp: string;
  };
}

const SimpleMessaging: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useNotification();
  const [conversations, setConversations] = useState<SimpleConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string>('');
  const [messages, setMessages] = useState<SimpleMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Mock data for testing
  useEffect(() => {
    const mockConversations: SimpleConversation[] = [
      {
        id: 'conv1',
        participants: [
          { id: 'user1', name: 'John Designer', role: 'DESIGNER' },
          { id: user?.id || 'current', name: user?.name || 'You', role: 'CLIENT' }
        ],
        lastMessage: {
          content: 'Hello! I saw your product and I\'m interested.',
          timestamp: new Date().toISOString()
        }
      },
      {
        id: 'conv2',
        participants: [
          { id: 'user2', name: 'Sarah Fashion', role: 'DESIGNER' },
          { id: user?.id || 'current', name: user?.name || 'You', role: 'CLIENT' }
        ],
        lastMessage: {
          content: 'Can you customize this design?',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        }
      }
    ];

    const mockMessages: SimpleMessage[] = [
      {
        id: 'msg1',
        content: 'Hello! I saw your product and I\'m interested.',
        sender: { id: user?.id || 'current', name: user?.name || 'You' },
        timestamp: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: 'msg2',
        content: 'Great! I\'d be happy to help. What specific customizations are you looking for?',
        sender: { id: 'user1', name: 'John Designer' },
        timestamp: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'msg3',
        content: 'I need it in a different color and size. Is that possible?',
        sender: { id: user?.id || 'current', name: user?.name || 'You' },
        timestamp: new Date(Date.now() - 1800000).toISOString()
      }
    ];

    setConversations(mockConversations);
    setSelectedConversation('conv1');
    setMessages(mockMessages);
  }, [user]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const message: SimpleMessage = {
      id: `msg_${Date.now()}`,
      content: newMessage.trim(),
      sender: { id: user?.id || 'current', name: user?.name || 'You' },
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    addToast('success', 'Message sent!');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getOtherParticipant = (conversation: SimpleConversation) => {
    return conversation.participants.find(p => p.id !== user?.id);
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Conversations List */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <MessageCircle className="h-5 w-5 mr-2" />
            Messages
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <User className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No conversations yet</p>
            </div>
          ) : (
            conversations.map((conversation) => {
              const otherParticipant = getOtherParticipant(conversation);
              return (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation.id)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedConversation === conversation.id ? 'bg-primary-50 border-primary-200' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
                      {otherParticipant?.name.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {otherParticipant?.name || 'Unknown User'}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.lastMessage?.content || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
                  {getOtherParticipant(conversations.find(c => c.id === selectedConversation)!)?.name.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    {getOtherParticipant(conversations.find(c => c.id === selectedConversation)!)?.name || 'Unknown User'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {getOtherParticipant(conversations.find(c => c.id === selectedConversation)!)?.role || 'User'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => {
                const isCurrentUser = message.sender.id === user?.id;
                return (
                  <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isCurrentUser
                        ? 'bg-yellow-400 text-gray-900'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm font-bold whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs font-bold mt-1 ${
                        isCurrentUser ? 'text-red-600' : 'text-blue-800'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={1}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleMessaging;
