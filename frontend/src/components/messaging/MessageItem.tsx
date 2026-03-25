import React, { memo, useState } from 'react';
import { Check, CheckCheck, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ImageGrid from './ImageGrid';
import ImageLightbox from './ImageLightbox';
import { Message } from '../../services/messageService';

// Helper function to get full image URL
const getImageUrl = (imagePath: string | undefined): string => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  return `http://localhost:8000${imagePath}`;
};

interface MessageItemProps {
  message: Message;
  isCurrentUser: boolean;
  showDate: boolean;
  previousMessage?: Message;
}

const MessageItem: React.FC<MessageItemProps> = memo(({
  message,
  isCurrentUser,
  showDate,
  previousMessage
}) => {
  const navigate = useNavigate();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const handleImageClick = (_imageUrl: string, index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleProductClick = () => {
    if (message.productReference?.productId) {
      console.log('🔍 Product ID type:', typeof message.productReference.productId);
      console.log('🔍 Product ID value:', message.productReference.productId);

      // Handle both string and object cases
      let productId: string = message.productReference.productId;
      if (typeof productId === 'object' && productId !== null) {
        // If it's an object, try to get the _id or id property
        productId = (productId as any)._id || (productId as any).id || String(productId);
      }

      console.log('🔍 Final product ID:', productId);
      navigate(`/client/product/${productId}`);
    }
  };

  const getStatusIcon = () => {
    if (!isCurrentUser) return null;

    switch (message.status) {
      case 'sending':
        return <Clock className="h-3 w-3 text-gray-400" />;
      case 'sent':
        return <Check className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-yellow-500" />;
      default:
        return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  // Check if we should show the avatar (first message in a group from this sender)
  const showAvatar = !previousMessage ||
    previousMessage.senderId !== message.senderId ||
    new Date(message.timestamp).getTime() - new Date(previousMessage.timestamp).getTime() > 300000; // 5 minutes

  return (
    <div className="animate-in slide-in-from-bottom-2 duration-300">
      {showDate && (
        <div className="flex justify-center my-6">
          <div className="bg-white shadow-sm border border-gray-200 rounded-full px-4 py-2 text-xs font-medium text-gray-600">
            {new Date(message.timestamp).toLocaleDateString([], {
              weekday: 'long',
              month: 'short',
              day: 'numeric'
            })}
          </div>
        </div>
      )}

      <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-3' : 'mt-1'} px-1`}>
        <div className={`flex items-end space-x-2 ${
          message.attachments && message.attachments.length > 0
            ? 'max-w-sm lg:max-w-md' // Wider for images
            : 'max-w-xs lg:max-w-sm'  // Normal width for text
        } ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
          {!isCurrentUser && (
            <div className={`flex-shrink-0 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
              <img
                src={getImageUrl(message.sender?.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.name || 'Unknown')}&background=000000&color=fff`}
                alt={message.sender?.name || 'Unknown'}
                className="h-6 w-6 rounded-full object-cover border border-white shadow-sm"
                loading="lazy"
              />
            </div>
          )}
          <div
            className={`px-2 py-1.5 rounded-2xl shadow-sm relative transition-all duration-200 hover:shadow-md ${
              isCurrentUser
                ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300'  // Yellow for sent messages
                : 'bg-white text-gray-900 border border-gray-200 hover:border-gray-300'  // White for received messages
            } ${
              isCurrentUser
                ? showAvatar ? 'rounded-br-md' : ''
                : showAvatar ? 'rounded-bl-md' : ''
            }`}
          >
            {/* Message tail/pointer */}
            {showAvatar && (
              <div className={`absolute bottom-0 ${
                isCurrentUser
                  ? '-right-2 border-l-8 border-l-yellow-400 border-t-8 border-t-transparent border-b-8 border-b-transparent'
                  : '-left-2 border-r-8 border-r-white border-t-8 border-t-transparent border-b-8 border-b-transparent'
              } w-0 h-0`}></div>
            )}

            {/* Sender name for group chats */}
            {!isCurrentUser && showAvatar && (
              <div className="text-xs font-semibold text-blue-600 mb-1">
                {message.sender?.name || 'Unknown'}
              </div>
            )}

            {/* Product Reference - Show product image at the top */}
            {(() => {
              if (message.productReference) {
                console.log('🖼️ Rendering product reference:', message.productReference);
              }
              return message.productReference;
            })() && (
              <div className={`mb-3 rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md ${
                isCurrentUser
                  ? 'border-2 border-gray-700 hover:border-gray-600'
                  : 'border-2 border-gray-300 hover:border-gray-400'
              }`}>
                {/* Product Image at the top - Clickable */}
                <div
                  className="aspect-square bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={handleProductClick}
                  title="Click to view product details"
                >
                  <img
                    src={getImageUrl(message.productReference?.productImage)}
                    alt={message.productReference?.productName || 'Product'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Failed to load product image:', message.productReference?.productImage);
                      e.currentTarget.src = '/api/placeholder/300/300';
                    }}
                  />
                </div>
                {/* Product details below image */}
                <div className={`p-2 ${
                  isCurrentUser
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-50 text-gray-900'
                }`}>
                  <p
                    className="text-xs font-medium truncate cursor-pointer hover:underline"
                    onClick={handleProductClick}
                    title="Click to view product details"
                  >
                    {message.productReference?.productName}
                  </p>
                  <p className={`text-xs ${
                    isCurrentUser ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    MWK {message.productReference?.productPrice?.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {/* Message content */}
            {message.attachments && message.attachments.length > 0 ? (
              <div className="space-y-2">
                {/* Filter and display image attachments using ImageGrid */}
                {(() => {
                  const imageAttachments = message.attachments.filter(att => att.type === 'image');
                  const otherAttachments = message.attachments.filter(att => att.type !== 'image');

                  return (
                    <>
                      {/* Image Grid for image attachments */}
                      {imageAttachments.length > 0 && (
                        <ImageGrid
                          images={imageAttachments}
                          timestamp={message.timestamp}
                          isCurrentUser={isCurrentUser}
                          onImageClick={handleImageClick}
                        />
                      )}

                      {/* Other file types */}
                      {otherAttachments.map((attachment, index) => (
                        <div key={index} className="flex items-center space-x-2 p-2 bg-gray-100 rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{attachment.name}</p>
                            {attachment.size && (
                              <p className="text-xs text-gray-500">
                                {(attachment.size / 1024 / 1024).toFixed(1)} MB
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  );
                })()}

                {/* Display text content if present along with attachments */}
                {message.content && message.content.trim() && !message.content.startsWith('📷 Image:') && (
                  <p className="text-sm font-medium whitespace-pre-wrap break-words leading-snug mt-1.5">
                    {message.content}
                  </p>
                )}
              </div>
            ) : (
              /* Regular text message */
              <p className="text-sm font-medium whitespace-pre-wrap break-words leading-snug">{message.content}</p>
            )}

            {/* Message metadata - only show for text messages or messages with text content */}
            {(!message.attachments || message.attachments.length === 0 ||
              (message.content && !message.content.startsWith('📷 Image:'))) && (
              <div className="flex items-center justify-end mt-0.5 space-x-1 text-xs">
                <span className={`font-medium ${
                  isCurrentUser ? 'text-gray-600' : 'text-gray-500'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                {getStatusIcon()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      {message.attachments && message.attachments.length > 0 && (
        <ImageLightbox
          images={message.attachments.filter(att => att.type === 'image')}
          initialIndex={lightboxIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

export default MessageItem;
