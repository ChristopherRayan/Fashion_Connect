import React, { useState } from 'react';
import { X, Send, MessageCircle, User, Package } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { messageService } from '../../services/messageService';
import { useNavigate } from 'react-router-dom';

interface ContactDesignerModalProps {
  isOpen: boolean;
  onClose: () => void;
  designer: {
    id: string;
    name: string;
    avatar: string;
    rating?: number;
  };
  product: {
    id: string;
    name: string;
    image: string;
    price: number;
  };
}

const ContactDesignerModal: React.FC<ContactDesignerModalProps> = ({
  isOpen,
  onClose,
  designer,
  product
}) => {
  const { user } = useAuth();
  const { addToast } = useNotification();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Pre-filled message templates
  const messageTemplates = [
    `Hi ${designer.name}! I'm interested in your "${product.name}". Could you tell me more about customization options?`,
    `Hello! I love the "${product.name}". Is it available in different sizes/colors?`,
    `Hi there! I'd like to know more about the "${product.name}". What's the delivery time?`,
    `Hello ${designer.name}! Can you provide more details about the materials used in "${product.name}"?`
  ];

  const handleSendMessage = async () => {
    if (!message.trim()) {
      addToast('error', 'Please enter a message');
      return;
    }

    if (!user) {
      addToast('error', 'Please log in to send messages');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🚀 Sending message to designer:', {
        designerId: designer.id,
        productId: product.id,
        initialMessage: message.trim()
      });

      // Start a new conversation with the designer
      const sentMessage = await messageService.startConversationWithDesigner({
        designerId: designer.id,
        productId: product.id,
        initialMessage: message.trim()
      });

      console.log('✅ Message sent successfully:', sentMessage);
      addToast('success', `Message sent to ${designer.name}!`);
      setMessage(''); // Clear the message
      onClose();

      // Navigate to the messages page after a short delay
      setTimeout(() => {
        navigate('/client/messages');
      }, 500);
    } catch (error) {
      console.error('❌ Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message. Please try again.';
      addToast('error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = (template: string) => {
    setMessage(template);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClose = () => {
    setMessage(''); // Clear message when closing
    setIsLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <MessageCircle className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  Contact Designer
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Designer Info */}
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg mb-4">
              <img
                src={designer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(designer.name)}&background=6366f1&color=fff`}
                alt={designer.name}
                className="h-10 w-10 rounded-full object-cover"
              />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">{designer.name}</h4>
                <p className="text-sm text-gray-500">Fashion Designer</p>
                {designer.rating && (
                  <div className="flex items-center mt-1">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`h-3 w-3 ${
                            i < Math.floor(designer.rating!) ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="ml-1 text-xs text-gray-500">({designer.rating})</span>
                  </div>
                )}
              </div>
            </div>

            {/* Product Context */}
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg mb-4">
              <img
                src={product.image}
                alt={product.name}
                className="h-12 w-12 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">{product.name}</h4>
                <p className="text-sm text-primary-600 font-medium">
                  MWK {product.price.toLocaleString()}
                </p>
              </div>
              <Package className="h-5 w-5 text-blue-500" />
            </div>

            {/* Message Templates */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick message templates:
              </label>
              <div className="space-y-2">
                {messageTemplates.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => handleTemplateSelect(template)}
                    className="w-full text-left p-2 text-sm text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    "{template}"
                  </button>
                ))}
              </div>
            </div>

            {/* Message Input */}
            <div className="mb-4">
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Your message:
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message to the designer..."
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
              <p className="mt-1 text-xs text-gray-500">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={!message.trim() || isLoading}
              className="w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactDesignerModal;
