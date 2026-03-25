import React, { useState } from 'react';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, X, Heart, Share2, Check } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { formatCurrency } from '../../utils/helpers';
import { useNotification } from '../../contexts/NotificationContext';
import { orderService, CreateOrderRequest } from '../../services/orderService';
import { messageService } from '../../services/messageService';
import { useAuth } from '../../contexts/AuthContext';
import PaymentModal from '../payment/PaymentModal';

// Helper function to extract image URL from ProductImage object or string
const getProductImageUrl = (image: any): string => {
  if (!image) return '/placeholder-image.svg';
  
  // If it's a ProductImage object, extract the URL
  if (typeof image === 'object' && image.url) {
    return image.url;
  }
  
  // If it's a string, return it directly
  if (typeof image === 'string') {
    return image;
  }
  
  return '/placeholder-image.svg';
};

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose }) => {
  const { items, totalItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const { addToast } = useNotification();
  const { user } = useAuth();
  const [selectAll, setSelectAll] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>(() => items.map(item => item.id));
  const [selectedPayment, setSelectedPayment] = useState<string>('cash_on_delivery');
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    country: 'Malawi',
    postalCode: ''
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string>('');
  const [currentOrderAmount, setCurrentOrderAmount] = useState<number>(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, name: string} | null>(null);

  // Group items by designer with proper error handling
  const itemsByDesigner = items.reduce((acc, item) => {
    // Handle cases where designer might be undefined or null
    const designer = item.product?.designer;
    const designerId = designer?._id || 'unknown';
    const designerName = designer?.name || 'Unknown Designer';

    if (!acc[designerId]) {
      acc[designerId] = {
        name: designerName,
        items: []
      };
    }
    acc[designerId].items.push(item);
    return acc;
  }, {} as Record<string, { name: string; items: typeof items }>);

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
      return;
    }

    // Find the cart item to get product and size info
    const cartItem = items.find(item => item.id === itemId);
    if (!cartItem) return;

    // Custom orders don't have stock limitations
    if (cartItem.isCustomOrder) {
      updateQuantity(itemId, newQuantity);
      return;
    }

    // Get maximum available stock for regular products
    let maxStock = cartItem.product.stockQuantity || 1;
    if (cartItem.size && (cartItem.product as any).sizeStock) {
      const sizeStockItem = (cartItem.product as any).sizeStock.find((item: any) => item.size === cartItem.size);
      maxStock = sizeStockItem?.quantity || 0;
    }

    // Validate quantity doesn't exceed available stock
    const validQuantity = Math.min(newQuantity, maxStock);

    if (validQuantity !== newQuantity) {
      addToast('warning', `Only ${maxStock} items available${cartItem.size ? ` in size ${cartItem.size}` : ''}`);
    }

    updateQuantity(itemId, validQuantity);
  };

  const handleRemoveItem = (itemId: string, productName: string) => {
    setItemToDelete({ id: itemId, name: productName });
    setShowDeleteConfirm(true);
  };

  const confirmDeleteItem = () => {
    if (itemToDelete) {
      removeFromCart(itemToDelete.id);
      addToast('success', `${itemToDelete.name} removed from cart`);
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    }
  };

  const cancelDeleteItem = () => {
    setShowDeleteConfirm(false);
    setItemToDelete(null);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems(items.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
    setSelectAll(!selectAll);
  };

  const handleSelectItem = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  const selectedItemsData = items.filter(item => selectedItems.includes(item.id));
  const selectedTotal = selectedItemsData.reduce((sum, item) => {
    const basePrice = (item.product?.discountPrice || item.product?.price || 0) * item.quantity;
    const deliveryTimePrice = item.isCustomOrder && item.customOrderData?.deliveryTimePrice ? item.customOrderData.deliveryTimePrice : 0;
    return sum + basePrice + deliveryTimePrice;
  }, 0);
  const itemsDiscount = selectedItemsData.reduce((sum, item) => {
    if (item.product?.discountPrice && item.product?.price) {
      return sum + ((item.product.price - item.product.discountPrice) * item.quantity);
    }
    return sum;
  }, 0);
  const shippingCost = selectedTotal > 150000 ? 0 : 15000;
  const extraDiscounts = 0; // Can be calculated based on promotions
  const finalTotal = selectedTotal + shippingCost - extraDiscounts;

  // Handle checkout process
  const handleCheckout = async () => {
    if (selectedItems.length === 0) {
      addToast('error', 'Please select items to checkout');
      return;
    }

    if (!user) {
      addToast('error', 'Please login to place an order');
      return;
    }

    setShowShippingForm(true);
  };

  const handlePlaceOrder = async () => {
    if (!shippingAddress.street || !shippingAddress.city) {
      addToast('error', 'Please fill in all shipping address fields');
      return;
    }

    try {
      setIsProcessingOrder(true);

      // Group selected items by designer
      const ordersByDesigner = selectedItemsData.reduce((acc, item) => {
        const designerId = item.product?.designer?._id || 'unknown';
        if (!acc[designerId]) {
          acc[designerId] = [];
        }
        acc[designerId].push(item);
        return acc;
      }, {} as Record<string, typeof selectedItemsData>);

      // Create separate orders for each designer
      const orderPromises = Object.entries(ordersByDesigner).map(async ([designerId, designerItems]) => {
        const designerTotal = designerItems.reduce((sum, item) => {
          const price = item.product?.discountPrice || item.product?.price || 0;
          return sum + (price * item.quantity);
        }, 0);

        // Separate regular products from custom orders
        const regularItems = designerItems.filter(item => !item.isCustomOrder);
        const customOrderItems = designerItems.filter(item => item.isCustomOrder);

        // Process each custom order individually as real orders
        const allOrderPromises: Promise<any>[] = [];

        // Create regular order if there are regular items
        if (regularItems.length > 0) {
          const regularOrderData: CreateOrderRequest = {
            items: regularItems.map(item => ({
              product: item.product._id,
              name: item.product.name,
              price: item.product.discountPrice || item.product.price,
              quantity: item.quantity,
              color: item.color,
              size: item.size,
              image: typeof item.product.images?.[0] === 'string' 
                ? item.product.images[0] 
                : item.product.images?.[0]?.url || '',
              customizations: {},
              deliveryInfo: item.deliveryInfo
            })),
            shippingAddress,
            paymentMethod: selectedPayment,
            notes: `Customer: ${user?.name}, Phone: ${user?.phone || 'Not provided'}, Email: ${user?.email}`,
            isCustomOrder: false
          };
          
          allOrderPromises.push(orderService.createOrder(regularOrderData));
        }

        // Create individual custom orders
        for (const customItem of customOrderItems) {
          const customOrderData: CreateOrderRequest = {
            items: [{
              product: customItem.product._id,
              name: customItem.product.name,
              price: customItem.product.discountPrice || customItem.product.price,
              quantity: customItem.quantity,
              color: customItem.color,
              size: customItem.size,
              image: typeof customItem.product.images?.[0] === 'string' 
                ? customItem.product.images[0] 
                : customItem.product.images?.[0]?.url || '',
              customizations: customItem.customOrderData || {}
            }],
            shippingAddress,
            paymentMethod: selectedPayment,
            notes: `CUSTOM ORDER - Customer: ${user?.name}, Phone: ${user?.phone || 'Not provided'}, Email: ${user?.email}
            
Measurements: ${JSON.stringify(customItem.customOrderData?.measurements || {}, null, 2)}
Delivery Type: ${customItem.customOrderData?.deliveryType || 'Standard'}
Expected Delivery: ${customItem.customOrderData?.expectedDeliveryDate || 'TBD'}
Delivery Location: ${customItem.customOrderData?.deliveryLocation || 'TBD'}
Additional Notes: ${customItem.customOrderData?.additionalNotes || 'None'}`,
            isCustomOrder: true,
            customDetails: customItem.customOrderData
          };
          
          allOrderPromises.push(orderService.createOrder(customOrderData));
        }

        if (allOrderPromises.length === 0) {
          return Promise.resolve(null);
        }

        return Promise.all(allOrderPromises).then(results => results.filter(result => result !== null)[0] || null);
      });

      // Wait for all orders to be created
      const createdOrders = await Promise.all(orderPromises);

      // Filter out null orders
      const validOrders = createdOrders.filter(order => order !== null);

      // If only one order and payment method is not COD, show payment modal
      if (validOrders.length === 1 && ['card', 'airtel'].includes(selectedPayment)) {
        const order = validOrders[0];
        setCurrentOrderId(order._id);
        setCurrentOrderAmount(order.totalAmount);
        setShowPaymentModal(true);
        setShowShippingForm(false);
      } else {
        // Multiple orders or COD - complete checkout

        // For COD orders, send custom order messages immediately
        if (selectedPayment === 'cash_on_delivery') {
          await sendCustomOrderMessages();
        }

        clearCart();

        // Create success message
        const successMessage = `${validOrders.length} order(s) placed successfully! ${
          selectedPayment === 'cash_on_delivery'
            ? 'You can pay when your order is delivered.'
            : 'Designers will review and approve your orders.'
        }`;

        addToast('success', successMessage);

        // Close modal and reset forms
        onClose();
        setShowShippingForm(false);
        resetForm();
      }

    } catch (error) {
      console.error('Error placing order:', error);
      addToast('error', 'Failed to place order. Please try again.');
    } finally {
      setIsProcessingOrder(false);
    }
  };

  // Send custom order messages to designers
  const sendCustomOrderMessages = async () => {
    try {
      console.log('📨 Sending custom order messages to designers...');
      
      // Get custom order items grouped by designer
      const customOrderItems = selectedItemsData.filter(item => item.isCustomOrder);
      const customOrdersByDesigner = customOrderItems.reduce((acc, item) => {
        const designerId = item.product?.designer?._id;
        if (!designerId) return acc;
        
        if (!acc[designerId]) {
          acc[designerId] = {
            designerName: item.product.designer.name,
            items: []
          };
        }
        acc[designerId].items.push(item);
        return acc;
      }, {} as Record<string, { designerName: string; items: typeof customOrderItems }>);

      // Send message to each designer with custom order details
      for (const [designerId, { designerName, items }] of Object.entries(customOrdersByDesigner)) {
        try {
          // Create or get conversation with the designer
          const conversation = await messageService.createOrGetConversation(designerId);
          
          // Format custom order details message
          const orderDetails = items.map(item => {
            const measurements = item.customOrderData?.measurements || {};
            const measurementText = Object.entries(measurements)
              .map(([key, value]) => `${key}: ${value}`)
              .join(', ');
            
            return `
🎨 **${item.product.name}**
📏 Measurements: ${measurementText || 'Not specified'}
🎨 Color: ${item.color || 'Not specified'}
📐 Size: ${item.size || 'Not specified'}
📦 Quantity: ${item.quantity}
⏰ Delivery Type: ${item.customOrderData?.deliveryType || 'Standard'}
📅 Expected Delivery: ${item.customOrderData?.expectedDeliveryDate || 'TBD'}
📍 Delivery Location: ${item.customOrderData?.deliveryLocation || 'TBD'}
💰 Price: MWK ${((item.product?.discountPrice || item.product?.price || 0) * item.quantity).toLocaleString()}
${item.customOrderData?.deliveryTimePrice ? `⚡ Rush Delivery Fee: MWK ${item.customOrderData.deliveryTimePrice.toLocaleString()}` : ''}

📝 Additional Notes: ${item.customOrderData?.additionalNotes || 'None'}
            `.trim();
          }).join('\n\n---\n\n');

          const messageContent = `
🛍️ **NEW CUSTOM ORDER REQUEST**

Hello ${designerName}! You have received a new custom order from ${user?.name || 'a customer'}.

**Customer Details:**
👤 Name: ${user?.name || 'Not provided'}
📧 Email: ${user?.email || 'Not provided'}
📱 Phone: ${user?.phone || 'Not provided'}

**Shipping Address:**
📍 ${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.state}, ${shippingAddress.country} ${shippingAddress.postalCode}

**Order Details:**
${orderDetails}

**Payment Method:** ${selectedPayment === 'cash_on_delivery' ? 'Cash on Delivery' : selectedPayment}

Please review the order details and confirm if you can fulfill this custom order. If you have any questions about the measurements or requirements, feel free to ask!

Thank you! 🙏
          `.trim();

          // Send the message with product image attachment
          const firstItem = items[0];
          const productImage = firstItem.product.images?.[0];
          
          console.log('🔍 Custom order message debug:', {
            firstItem: firstItem.product.name,
            productImages: firstItem.product.images,
            productImage,
            isCustomOrder: firstItem.isCustomOrder,
            customColorImage: firstItem.customOrderData?.customColor?.referenceImage
          });
          
          // Prepare message data with product image
          const messageData: any = {
            content: messageContent,
            receiverId: designerId,
            type: 'text',
            productId: firstItem.product._id || firstItem.product.id
          };

          // Add product image if available
          if (productImage) {
            const imageUrl = typeof productImage === 'object' && productImage.url 
              ? productImage.url 
              : typeof productImage === 'string' 
                ? productImage 
                : null;
                
            if (imageUrl) {
              messageData.productImage = imageUrl;
              console.log('🖼️ Adding product image to message:', imageUrl);
            }
          } else {
            console.log('❌ No product image found for message');
          }

          await messageService.sendMessage(conversation.id, messageData);

          console.log(`✅ Custom order message sent to designer ${designerName}`);
        } catch (error) {
          console.error(`❌ Failed to send message to designer ${designerName}:`, error);
          // Don't throw error here, just log it so other messages can still be sent
        }
      }

      console.log('✅ All custom order messages sent successfully');
    } catch (error) {
      console.error('❌ Error sending custom order messages:', error);
      // Don't throw error to prevent order completion from failing
      addToast('warning', 'Orders placed successfully, but failed to notify some designers. They will still see your orders in their dashboard.');
    }
  };

  const resetForm = () => {
    setShippingAddress({
      street: '',
      city: '',
      state: '',
      country: 'Malawi',
      postalCode: ''
    });
    setSelectedPayment('cash_on_delivery');
    setShowPaymentModal(false);
    setCurrentOrderId('');
    setCurrentOrderAmount(0);
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    console.log('Payment successful:', paymentData);

    // Send custom order messages for paid orders
    await sendCustomOrderMessages();

    clearCart();
    addToast('success', 'Payment completed successfully! Your order has been confirmed.');
    onClose();
    resetForm();
  };

  const handlePaymentError = (error: string) => {
    addToast('error', `Payment failed: ${error}`);
    // Keep the order but mark payment as failed
    // User can try payment again from orders page
  };

  // Update selected items when cart items change
  React.useEffect(() => {
    if (items && items.length > 0) {
      setSelectedItems(items.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  }, [items]);

  // Close modal on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white shadow-2xl transform transition-all w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col shadow-yellow-400/20">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b-2 border-yellow-400 bg-black text-white flex-shrink-0">
            <div className="flex items-center space-x-3">
              <h1 className="text-lg font-bold text-white">Cart ({totalItems})</h1>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  title="Select all items"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="w-3 h-3 text-yellow-400 border-gray-300 rounded focus:ring-yellow-500"
                />
                <span className="text-xs text-gray-300">Select all items</span>
                <button
                  type="button"
                  title="Delete selected items"
                  className="text-yellow-400 hover:text-yellow-300 text-xs font-medium"
                >
                  Delete selected items
                </button>
              </div>
            </div>
            <button
              type="button"
              title="Close cart"
              onClick={onClose}
              className="rounded-md text-gray-300 hover:text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <h2 className="text-base font-bold text-gray-900 mb-2">Your cart is empty</h2>
                <p className="text-gray-500 mb-4 text-xs">Start shopping to add items to your cart</p>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center px-3 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors text-xs"
                >
                  <ArrowLeft className="mr-1 h-3 w-3" />
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-full">
                {/* Cart Items - Scrollable */}
                <div className="lg:col-span-3 overflow-y-auto max-h-[calc(95vh-120px)] p-4 space-y-3">
                  {/* Group items by designer */}
                  {items.length > 0 && Object.entries(itemsByDesigner).map(([designerId, designerData]) => (
                    <div key={designerId} className="border border-gray-200 rounded-md overflow-hidden mb-3">
                      {/* Designer Header */}
                      <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            title={`Select all items from ${designerData.name}`}
                            className="w-3 h-3 text-red-600 border-gray-300 rounded focus:ring-red-500"
                          />
                          <span className="font-medium text-gray-900 text-sm">{designerData.name}</span>
                        </div>
                      </div>

                      {/* Designer Items */}
                      <div className="divide-y divide-gray-200">
                        {designerData.items.map((item) => (
                          <div key={item.id} className="p-3">
                            <div className="flex items-start space-x-3">
                              {/* Checkbox */}
                              <input
                                type="checkbox"
                                title={`Select ${item.product.name}`}
                                checked={selectedItems.includes(item.id)}
                                onChange={() => handleSelectItem(item.id)}
                                className="w-3 h-3 text-red-600 border-gray-300 rounded focus:ring-red-500 mt-1"
                              />

                              {/* Product Image */}
                              <div className="flex-shrink-0">
                                <img
                                  src={getProductImageUrl(item.product.images?.[0])}
                                  alt={item.product.name}
                                  className="w-16 h-16 object-cover rounded-md"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/placeholder-image.svg';
                                  }}
                                />
                              </div>

                              {/* Product Details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    {item.product.discountPrice && (
                                      <span className="inline-block bg-red-100 text-red-800 text-xs px-1.5 py-0.5 rounded mb-1">
                                        Savings
                                      </span>
                                    )}
                                    <h3 className="text-xs font-medium text-gray-900 mb-1 line-clamp-2">
                                      {item.product.name}
                                      {item.isCustomOrder && (
                                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                          Custom
                                        </span>
                                      )}
                                    </h3>
                                    <div className="flex items-center space-x-2 mb-1">
                                      {item.color && (
                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                          {item.color}
                                        </span>
                                      )}
                                      {item.size && (
                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                          Size: {item.size}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-1 mb-1">
                                      <span className="text-sm font-bold text-red-600">
                                        {formatCurrency(item.product.discountPrice || item.product.price)}
                                      </span>
                                      {item.product.discountPrice && (
                                        <span className="text-xs text-gray-500 line-through">
                                          {formatCurrency(item.product.price)}
                                        </span>
                                      )}
                                    </div>
                                    {item.isCustomOrder && item.customOrderData?.deliveryTimePrice && item.customOrderData.deliveryTimePrice > 0 && (
                                      <div className="text-xs text-gray-600 mb-1">
                                        <span className="font-medium">Delivery Time:</span> +{formatCurrency(item.customOrderData.deliveryTimePrice)}
                                      </div>
                                    )}
                                    {!item.isCustomOrder && item.deliveryInfo && (
                                      <div className="text-xs text-gray-600 mb-1">
                                        <span className="font-medium">{item.deliveryInfo.type.charAt(0).toUpperCase() + item.deliveryInfo.type.slice(1)} Delivery:</span> 
                                        {item.deliveryInfo.price > 0 ? ` +${formatCurrency(item.deliveryInfo.price)}` : ' FREE'} 
                                        <span className="text-gray-500">({item.deliveryInfo.days} day{item.deliveryInfo.days !== 1 ? 's' : ''})</span>
                                      </div>
                                    )}
                                    {item.product.discountPrice && (
                                      <p className="text-xs text-green-600 mb-1">
                                        Save {formatCurrency(item.product.price - item.product.discountPrice)}
                                      </p>
                                    )}
                                    <p className="text-xs text-gray-500">
                                      {item.isCustomOrder ? 'Custom order pricing' : 'Free shipping'}
                                    </p>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center space-x-1 ml-2">
                                    <button
                                      type="button"
                                      title="Add to wishlist"
                                      className="p-1 text-gray-400 hover:text-gray-600"
                                    >
                                      <Heart className="h-3 w-3" />
                                    </button>
                                    <button
                                      type="button"
                                      title="Share product"
                                      className="p-1 text-gray-400 hover:text-gray-600"
                                    >
                                      <Share2 className="h-3 w-3" />
                                    </button>
                                    <button
                                      type="button"
                                      title="Remove from cart"
                                      onClick={() => handleRemoveItem(item.id, item.product.name)}
                                      className="p-1 text-gray-400 hover:text-red-600"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>

                                {/* Quantity Controls */}
                                <div className="flex items-center justify-between mt-2">
                                  <div className="flex items-center border border-gray-300 rounded text-xs">
                                    <button
                                      type="button"
                                      title="Decrease quantity"
                                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                      className="px-2 py-1 hover:bg-gray-50 transition-colors text-gray-600"
                                    >
                                      <Minus className="h-3 w-3" />
                                    </button>
                                    <span className="px-3 py-1 text-center min-w-[2rem] text-xs border-x border-gray-300">
                                      {item.quantity}
                                    </span>
                                    <button
                                      type="button"
                                      title="Increase quantity"
                                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                      disabled={(() => {
                                        // Custom orders don't have stock limitations
                                        if (item.isCustomOrder) {
                                          return false;
                                        }
                                        let maxStock = item.product.stockQuantity || 1;
                                        if (item.size && (item.product as any).sizeStock) {
                                          const sizeStockItem = (item.product as any).sizeStock.find((stockItem: any) => stockItem.size === item.size);
                                          maxStock = sizeStockItem?.quantity || 0;
                                        }
                                        return item.quantity >= maxStock;
                                      })()}
                                      className="px-2 py-1 hover:bg-gray-50 transition-colors text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </button>
                                  </div>
                                  {!item.product.inStock && !item.isCustomOrder && (
                                    <span className="text-xs text-orange-600">Almost sold out</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="lg:col-span-2 border-l border-gray-200">
                  <div className="bg-white p-4 h-full flex flex-col">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Summary</h2>

                    {/* Product thumbnails */}
                    <div className="flex space-x-1 mb-4 overflow-x-auto">
                      {selectedItemsData.slice(0, 5).map((item) => (
                        <img
                          key={item.id}
                          src={getProductImageUrl(item.product.images?.[0])}
                          alt={item.product.name}
                          className="w-8 h-8 object-cover rounded flex-shrink-0"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder-image.svg';
                          }}
                        />
                      ))}
                      {selectedItemsData.length > 5 && (
                        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500 flex-shrink-0">
                          +{selectedItemsData.length - 5}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Items total</span>
                        <span className="font-medium">{formatCurrency(selectedTotal + itemsDiscount)}</span>
                      </div>

                      {itemsDiscount > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Items discount</span>
                          <span className="text-red-600">-{formatCurrency(itemsDiscount)}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">{formatCurrency(selectedTotal)}</span>
                      </div>

                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Shipping</span>
                        <span className="font-medium">{formatCurrency(shippingCost)}</span>
                      </div>

                      {extraDiscounts > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Extra discounts</span>
                          <span className="text-red-600">-{formatCurrency(extraDiscounts)}</span>
                        </div>
                      )}

                      <div className="border-t border-gray-200 pt-2">
                        <div className="flex justify-between text-sm font-bold">
                          <span>Estimated total</span>
                          <span>{formatCurrency(finalTotal)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="mb-3">
                      <h3 className="text-xs font-medium text-gray-900 mb-2">Payment Method</h3>
                      <div className="space-y-1.5 bg-gray-50 p-2 rounded-md">
                        <label className="flex items-center space-x-2 cursor-pointer hover:bg-white p-1.5 rounded transition-colors">
                          <input
                            type="radio"
                            name="payment"
                            value="card"
                            checked={selectedPayment === 'card'}
                            onChange={(e) => setSelectedPayment(e.target.value)}
                            className="w-3 h-3 text-blue-600"
                          />
                          <div className="flex items-center space-x-2">
                            <div className="w-7 h-4 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
                              CARD
                            </div>
                            <span className="text-xs text-gray-700">Credit/Debit Card</span>
                          </div>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer hover:bg-white p-1.5 rounded transition-colors">
                          <input
                            type="radio"
                            name="payment"
                            value="airtel"
                            checked={selectedPayment === 'airtel'}
                            onChange={(e) => setSelectedPayment(e.target.value)}
                            className="w-3 h-3 text-red-600"
                          />
                          <div className="flex items-center space-x-2">
                            <div className="w-10 h-4 bg-red-600 rounded text-white text-xs flex items-center justify-center font-bold">
                              Airtel
                            </div>
                            <span className="text-xs text-gray-700">Airtel Money</span>
                          </div>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer hover:bg-white p-1.5 rounded transition-colors">
                          <input
                            type="radio"
                            name="payment"
                            value="cash_on_delivery"
                            checked={selectedPayment === 'cash_on_delivery'}
                            onChange={(e) => setSelectedPayment(e.target.value)}
                            className="w-3 h-3 text-green-600"
                          />
                          <div className="flex items-center space-x-2">
                            <div className="w-7 h-4 bg-green-600 rounded text-white text-xs flex items-center justify-center font-bold">
                              COD
                            </div>
                            <span className="text-xs text-gray-700">Cash on Delivery</span>
                          </div>
                        </label>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCheckout}
                      disabled={selectedItems.length === 0 || isProcessingOrder}
                      className="w-full bg-red-600 text-white py-2 px-3 rounded-md font-medium hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed mb-3 text-xs"
                    >
                      <div className="flex flex-col items-center">
                        <span>
                          {isProcessingOrder ? 'Processing...' : `Checkout (${selectedItems.length})`}
                        </span>
                        <span className="text-xs opacity-90">Almost sold out!</span>
                      </div>
                    </button>

                    {/* Buyer Protection */}
                    <div className="bg-gray-50 rounded-md p-2 mt-auto">
                      <h3 className="text-xs font-medium text-gray-900 mb-1">Buyer protection</h3>
                      <div className="flex items-start space-x-1">
                        <Check className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-gray-600 leading-tight">
                          Get a full refund if the item is not as described or not delivered
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shipping Address Modal */}
      {showShippingForm && (
        <div className="fixed inset-0 z-60 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowShippingForm(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white shadow-xl transform transition-all w-full max-w-md rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Shipping Address</h2>
                <button
                  type="button"
                  title="Close shipping form"
                  onClick={() => setShowShippingForm(false)}
                  className="rounded-md text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.street}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, street: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Enter your street address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="City"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State/Region
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="State/Region"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <select
                      title="Select country"
                      value={shippingAddress.country}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="Malawi">Malawi</option>
                      <option value="Zambia">Zambia</option>
                      <option value="Zimbabwe">Zimbabwe</option>
                      <option value="South Africa">South Africa</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.postalCode}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Postal Code"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-md">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Order Summary</h3>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Items ({selectedItems.length})</span>
                      <span>{formatCurrency(selectedTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>{formatCurrency(shippingCost)}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-1">
                      <span>Total</span>
                      <span>{formatCurrency(finalTotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Payment Method</span>
                      <span className="capitalize">{selectedPayment}</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowShippingForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={isProcessingOrder || !shippingAddress.street || !shippingAddress.city}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    {isProcessingOrder ? 'Placing Order...' : 'Place Order'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        orderId={currentOrderId}
        amount={currentOrderAmount}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                  Remove Item from Cart
                </h3>
                <p className="text-sm text-gray-500 text-center mb-6">
                  Are you sure you want to remove "{itemToDelete?.name}" from your cart? This action cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={cancelDeleteItem}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeleteItem}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    Remove Item
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartModal;
