import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import UnreadBadge from '../ui/UnreadBadge';
import UnifiedMessagingModal from './UnifiedMessagingModal';

interface FloatingMessageButtonProps {
  unreadCount?: number;
}

const FloatingMessageButton: React.FC<FloatingMessageButtonProps> = ({
  unreadCount = 0
}) => {
  const [showModal, setShowModal] = useState(false);

  const handleMessageClick = () => {
    console.log('💬 Message button clicked - showing unified modal');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    console.log('❌ Closing modal');
    setShowModal(false);
  };

  return (
    <>
      {/* Floating Message Button */}
      <div className="fixed bottom-4 right-4 z-40 group">
        <button
          onClick={handleMessageClick}
          className="relative bg-black hover:bg-gray-800 text-yellow-400 p-3 rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-110 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-yellow-500/50 border-2 border-yellow-400/30"
          aria-label="Open messages"
          style={{
            boxShadow: '0 0 20px rgba(234, 179, 8, 0.3), 0 4px 15px rgba(0, 0, 0, 0.3)'
          }}
        >
          {/* Main icon with chat bubbles effect */}
          <div className="relative">
            <MessageCircle className="h-5 w-5" />
            {/* Small chat bubble indicators */}
            <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></div>
            <div className="absolute -bottom-1 -left-1 w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          </div>

          {/* Unread badge */}
          {unreadCount > 0 && (
            <div className="absolute -top-2 -right-2">
              <UnreadBadge count={unreadCount} size="sm" />
            </div>
          )}

          {/* Pulse animation for unread messages */}
          {unreadCount > 0 && (
            <div className="absolute inset-0 rounded-xl bg-yellow-400 animate-ping opacity-20"></div>
          )}

          {/* Enhanced Tooltip - positioned to the left */}
          <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 px-3 py-1.5 bg-black text-yellow-400 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap border border-yellow-400/30"
               style={{
                 boxShadow: '0 0 15px rgba(234, 179, 8, 0.2), 0 2px 10px rgba(0, 0, 0, 0.3)'
               }}>
            <div className="flex items-center space-x-1.5">
              <MessageCircle className="h-3 w-3 text-yellow-400" />
              <span className="font-medium">Chat with Designers</span>
            </div>
            {/* Arrow pointing right */}
            <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-r-0 border-t-4 border-b-4 border-transparent border-l-black"></div>
          </div>
        </button>

      </div>

      {/* Unified Messaging Modal */}
      <UnifiedMessagingModal
        isOpen={showModal}
        onClose={handleCloseModal}
        initialView="designers"
      />
    </>
  );
};

export default FloatingMessageButton;
