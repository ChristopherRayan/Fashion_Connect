import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, MapPin, User, Phone, Mail, CheckCircle } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useNotification } from '../../contexts/NotificationContext';
import { formatCurrency } from '../../utils/helpers';
import { orderService, CreateOrderRequest } from '../../services/orderService';
import { customOrderService } from '../../services/customOrderService';
import { getFirstProductImageUrl } from '../../utils/productImageUtils';

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { addToast } = useNotification();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    postalCode: '',
    paymentMethod: 'mobile_money'
  });

  const [isProcessing, setIsProcessing] = useState(false);

  const shippingCost = totalPrice > 50000 ? 0 : 5000;
  const finalTotal = totalPrice + shippingCost;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'district'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      addToast('error', `Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      addToast('error', 'Please enter a valid email address');
      return;
    }

    // Validate phone format (basic validation)
    if (formData.phone.length < 8) {
      addToast('error', 'Please enter a valid phone number');
      return;
    }

    setIsProcessing(true);

    try {
      // Separate regular items and custom orders
      const regularItems = items.filter(item => !item.isCustomOrder);
      const customOrderItems = items.filter(item => item.isCustomOrder);
      
      // Process regular orders
      if (regularItems.length > 0) {
        const regularOrderData: CreateOrderRequest = {
          items: regularItems.map(item => ({
            product: item.product._id,
            name: item.product.name,
            price: item.product.discountPrice || item.product.price,
            quantity: item.quantity,
            color: item.color,
            size: item.size,
            image: getFirstProductImageUrl(item.product.images, ''),
            customizations: {}
          })),
          shippingAddress: {
            street: formData.address,
            city: formData.city,
            state: formData.district,
            country: 'Malawi',
            postalCode: formData.postalCode || ''
          },
          paymentMethod: formData.paymentMethod,
          notes: `Customer: ${formData.firstName} ${formData.lastName}, Phone: ${formData.phone}, Email: ${formData.email}`,
          isCustomOrder: false
        };
        
        console.log('🛒 Creating regular order with data:', regularOrderData);
        await orderService.createOrder(regularOrderData);
        console.log('✅ Regular order created successfully');
      }
      
      console.log('🎯 Processing custom orders:', customOrderItems.length);
      console.log('📋 All cart items:', items.map(item => ({ id: item.id, isCustomOrder: item.isCustomOrder, productName: item.product.name })));

      // Process custom orders individually - create BOTH message AND custom order record
      for (const customItem of customOrderItems) {
        console.log('📦 Processing custom item:', customItem.id, 'isCustomOrder:', customItem.isCustomOrder);
        // First, create the custom order record for the designer's custom orders page
        const customOrderData = {
          productType: customItem.customOrderData?.productType || customItem.product.name,
          description: customItem.customOrderData?.additionalNotes || `Custom order for ${customItem.product.name}`,
          designer: typeof customItem.product.designer === 'object' ? customItem.product.designer._id : customItem.product.designer,
          color: customItem.color || 'Not specified',
          measurements: customItem.customOrderData?.measurements || {},
          expectedDeliveryDate: customItem.customOrderData?.expectedDeliveryDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          deliveryLocation: customItem.customOrderData?.deliveryLocation || `${formData.city}, ${formData.district}, Malawi`,
          additionalNotes: `Customer: ${formData.firstName} ${formData.lastName}, Phone: ${formData.phone}, Email: ${formData.email}
Delivery Type: ${customItem.customOrderData?.deliveryType || 'Standard'}
Payment Method: ${formData.paymentMethod}

${customItem.customOrderData?.additionalNotes || ''}`,
          estimatedPrice: customItem.customOrderData?.estimatedPrice || customItem.product.price,
          productReference: {
            productId: customItem.product._id,
            productName: customItem.product.name,
            productImage: getFirstProductImageUrl(customItem.product.images, '')
          },
          // Add missing delivery and collection fields
          deliveryType: customItem.customOrderData?.deliveryType || 'standard',
          deliveryTimePrice: customItem.customOrderData?.deliveryTimePrice || 0,
          collectionMethod: customItem.customOrderData?.collectionMethod || 'delivery',
          designerShopAddress: customItem.customOrderData?.designerShopAddress || ''
        };

        console.log('🎨 Creating custom order record with data:', customOrderData);
        try {
          await customOrderService.createCustomOrder(customOrderData);
          console.log('✅ Custom order record created successfully');
        } catch (customOrderError) {
          console.error('❌ Failed to create custom order record:', customOrderError);
          // Don't fail the entire checkout if custom order creation fails
        }

        // Then, create the message to the designer (existing behavior)
        const regularOrderData: CreateOrderRequest = {
          items: [{
            product: customItem.product._id,
            name: customItem.product.name,
            price: customItem.product.discountPrice || customItem.product.price,
            quantity: customItem.quantity,
            color: customItem.color,
            size: customItem.size,
            image: getFirstProductImageUrl(customItem.product.images, ''),
            customizations: customItem.customOrderData || {}
          }],
          shippingAddress: {
            street: formData.address,
            city: formData.city,
            state: formData.district,
            country: 'Malawi',
            postalCode: formData.postalCode || ''
          },
          paymentMethod: formData.paymentMethod,
          notes: `CUSTOM ORDER - Customer: ${formData.firstName} ${formData.lastName}, Phone: ${formData.phone}, Email: ${formData.email}

Measurements: ${JSON.stringify(customItem.customOrderData?.measurements || {}, null, 2)}
Delivery Type: ${customItem.customOrderData?.deliveryType || 'Standard'}
Expected Delivery: ${customItem.customOrderData?.expectedDeliveryDate || 'TBD'}
Delivery Location: ${customItem.customOrderData?.deliveryLocation || 'TBD'}
Additional Notes: ${customItem.customOrderData?.additionalNotes || 'None'}`,
          isCustomOrder: true
        };

        console.log('📨 Creating custom order message with data:', regularOrderData);
        await orderService.createOrder(regularOrderData);
        console.log('✅ Custom order message sent successfully');
      }

      // Clear cart and show success message
      clearCart();
      addToast('success', 'Order placed successfully! You will receive a confirmation email shortly.');
      navigate('/client/orders');

    } catch (error) {
      console.error('Error creating order:', error);

      // Enhanced error handling with more specific messages
      let errorMessage = 'Failed to place order. Please try again.';
      
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        
        if (error.message.includes('Network Error') || error.message.includes('timeout')) {
          errorMessage = 'Network error occurred. Please check your internet connection and try again.';
          addToast('warning', 'Network error occurred. Please check your orders page to see if the order was created.');
          return; // Don't show additional error message
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          errorMessage = 'Please log in again to place your order.';
        } else if (error.message.includes('400') || error.message.includes('Bad Request') || error.message.includes('validation')) {
          errorMessage = 'Invalid order data. Please check your cart items and shipping details.';
        } else if (error.message.includes('500')) {
          errorMessage = 'Server error. Please try again in a few moments.';
        } else {
          errorMessage = `Order failed: ${error.message}`;
        }
      } else if (typeof error === 'object' && error !== null) {
        // Handle API error objects
        const apiError = error as any;
        if (apiError.message) {
          errorMessage = `Order failed: ${apiError.message}`;
        } else if (apiError.statusCode) {
          errorMessage = `Order failed with status ${apiError.statusCode}`;
        }
      }

      addToast('error', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <CheckCircle className="mx-auto h-24 w-24 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-8">Add some items to your cart before checkout</p>
          <Link
            to="/client"
            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center mb-8">
        <Link
          to="/client/cart"
          className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back to Cart
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <User className="mr-2 h-5 w-5 text-primary-600" />
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <MapPin className="mr-2 h-5 w-5 text-primary-600" />
                Shipping Address
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      District *
                    </label>
                    <select
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Select District</option>
                      <option value="Lilongwe">Lilongwe</option>
                      <option value="Blantyre">Blantyre</option>
                      <option value="Mzuzu">Mzuzu</option>
                      <option value="Zomba">Zomba</option>
                      <option value="Kasungu">Kasungu</option>
                      <option value="Mangochi">Mangochi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <CreditCard className="mr-2 h-5 w-5 text-primary-600" />
                Payment Method
              </h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="mobile_money"
                    name="paymentMethod"
                    value="mobile_money"
                    checked={formData.paymentMethod === 'mobile_money'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <label htmlFor="mobile_money" className="ml-3 text-sm font-medium text-gray-700">
                    Mobile Money (Airtel Money, TNM Mpamba)
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="bank_transfer"
                    name="paymentMethod"
                    value="bank_transfer"
                    checked={formData.paymentMethod === 'bank_transfer'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <label htmlFor="bank_transfer" className="ml-3 text-sm font-medium text-gray-700">
                    Bank Transfer
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="cash_on_delivery"
                    name="paymentMethod"
                    value="cash_on_delivery"
                    checked={formData.paymentMethod === 'cash_on_delivery'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <label htmlFor="cash_on_delivery" className="ml-3 text-sm font-medium text-gray-700">
                    Cash on Delivery
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>
              
              {/* Order Items */}
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <img
                      src={getFirstProductImageUrl(item.product.images)}
                      alt={item.product.name}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.product.name}
                      </p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(item.product.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-3 mb-6 border-t border-gray-200 pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(totalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {shippingCost === 0 ? 'Free' : formatCurrency(shippingCost)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-gray-900">{formatCurrency(finalTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-5 w-5" />
                    Place Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
