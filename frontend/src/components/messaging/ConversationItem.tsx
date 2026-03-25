import React, { memo } from 'react';
import { Conversation } from '../../services/messageService';

// Helper function to get full image URL
const getImageUrl = (imagePath: string | undefined): string => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  return `http://localhost:8000${imagePath}`;
};

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: (conversationId: string) => void;
}

const ConversationItem: React.FC<ConversationItemProps> = memo(({ 
  conversation, 
  isSelected, 
  onClick 
}) => {
  const otherParticipant = conversation.participants[0];
  
  const handleClick = () => {
    onClick(conversation.id);
  };

  return (
    <div
      onClick={handleClick}
      className={`p-2.5 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
        isSelected ? 'bg-yellow-50 border-yellow-200' : ''
      }`}
    >
      <div className="flex items-center space-x-2">
        <div className="relative">
          <img
            src={getImageUrl(otherParticipant?.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherParticipant?.name || 'Unknown')}&background=000000&color=fff`}
            alt={otherParticipant?.name || 'Unknown'}
            className="h-8 w-8 rounded-full object-cover"
            loading="lazy"
          />
          {conversation.unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs rounded-full h-3.5 w-3.5 flex items-center justify-center font-bold text-xs">
              {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {otherParticipant?.name || 'Unknown User'}
              </h3>
              {/* Online status indicator or last seen */}
              {otherParticipant?.isOnline ? (
                <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
              ) : otherParticipant?.lastSeen ? (
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(otherParticipant.lastSeen).toLocaleDateString() === new Date().toLocaleDateString()
                    ? `${new Date(otherParticipant.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : `${new Date(otherParticipant.lastSeen).toLocaleDateString()}`
                  }
                </span>
              ) : null}
            </div>
            {conversation.lastMessage && (
              <span className="text-xs text-gray-500 flex-shrink-0">
                {new Date(conversation.lastMessage.timestamp).toLocaleDateString() === new Date().toLocaleDateString()
                  ? new Date(conversation.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : new Date(conversation.lastMessage.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })
                }
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mt-0.5">
            {/* Show message preview */}
            <p className="text-xs text-gray-600 truncate flex-1">
              {conversation.lastMessage?.content || 'No messages yet'}
            </p>
            {otherParticipant?.role === 'DESIGNER' && (
              <span className="text-xs bg-yellow-100 text-black px-1.5 py-0.5 rounded-full ml-1.5 flex-shrink-0 font-medium">
                Designer
              </span>
            )}
          </div>
          
          {conversation.productContext && (
            <div className="mt-1.5 flex items-center space-x-1.5">
              <img
                src={conversation.productContext.image}
                alt={conversation.productContext.name}
                className="h-5 w-5 rounded object-cover"
                loading="lazy"
              />
              <span className="text-xs text-gray-500 truncate">
                About: {conversation.productContext.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ConversationItem.displayName = 'ConversationItem';

export default ConversationItem;
