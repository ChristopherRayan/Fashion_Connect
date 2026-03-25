import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Product } from '../services/productService';
import { useAuth } from './AuthContext';

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  size?: string;
  color?: string;
  isCustomOrder?: boolean;
  deliveryInfo?: {
    type: string;
    days: number;
    price: number;
    description: string;
  };
  customOrderData?: {
    measurements?: Record<string, string>;
    expectedDeliveryDate?: string;
    deliveryLocation?: string;
    additionalNotes?: string;
    productType?: string;
    estimatedPrice?: number;
    deliveryType?: string;
    deliveryTimePrice?: number;
  };
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addToCart: (product: Product, quantity?: number, size?: string, color?: string, deliveryInfo?: CartItem['deliveryInfo']) => void;
  addCustomOrderToCart: (product: Product, customOrderData: CartItem['customOrderData'], color?: string) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);

  // Get cart key based on user
  const getCartKey = () => {
    const userId = user?.id || user?._id;
    return userId ? `fashionconnect_cart_${userId}` : 'fashionconnect_cart_guest';
  };

  // Load cart from localStorage on mount and when user changes
  useEffect(() => {
    const cartKey = getCartKey();
    const savedCart = localStorage.getItem(cartKey);
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setItems(parsedCart);
        console.log(`📦 Cart loaded for ${user ? 'user ' + (user.id || user._id) : 'guest'}:`, parsedCart.length, 'items');
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        setItems([]);
      }
    } else {
      setItems([]);
    }
  }, [user?.id, user?._id]);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    const cartKey = getCartKey();
    localStorage.setItem(cartKey, JSON.stringify(items));
    console.log(`💾 Cart saved for ${user ? 'user ' + (user.id || user._id) : 'guest'}:`, items.length, 'items');
  }, [items, user?.id, user?._id]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => {
    const basePrice = (item.product.discountPrice || item.product.price) * item.quantity;
    const deliveryPrice = item.isCustomOrder 
      ? (item.customOrderData?.deliveryTimePrice || 0)
      : (item.deliveryInfo?.price || 0);
    return sum + basePrice + deliveryPrice;
  }, 0);

  const addToCart = (product: Product, quantity = 1, size?: string, color?: string, deliveryInfo?: CartItem['deliveryInfo']) => {
    setItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(
        item => item.product._id === product._id && 
               item.size === size && 
               item.color === color && 
               !item.isCustomOrder &&
               // Check if delivery options match (for cases where same product has different delivery options)
               item.deliveryInfo?.type === deliveryInfo?.type
      );

      if (existingItemIndex > -1) {
        // Update existing item quantity
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += quantity;
        return updatedItems;
      } else {
        // Add new item
        const newItem: CartItem = {
          id: `${product._id}-${size || 'default'}-${color || 'default'}-${deliveryInfo?.type || 'standard'}-${Date.now()}`,
          product,
          quantity,
          size,
          color,
          deliveryInfo,
          isCustomOrder: false
        };
        return [...prevItems, newItem];
      }
    });
  };

  const addCustomOrderToCart = (product: Product, customOrderData: CartItem['customOrderData'], color?: string) => {
    setItems(prevItems => {
      // Custom orders are always unique (no quantity updates)
      const basePrice = customOrderData?.estimatedPrice || product.price;
      const deliveryTimePrice = customOrderData?.deliveryTimePrice || 0;

      // Use custom color image as product image if available
      const productImages = customOrderData?.customColor?.referenceImage 
        ? [customOrderData.customColor.referenceImage, ...product.images]
        : product.images;

      const newItem: CartItem = {
        id: `custom-${product._id}-${Date.now()}`,
        product: {
          ...product,
          price: basePrice, // Base price without delivery
          images: productImages // Use custom color image first if available
        },
        quantity: 1, // Custom orders are always quantity 1
        color,
        isCustomOrder: true,
        customOrderData: {
          ...customOrderData,
          deliveryTimePrice // Store delivery time price separately
        }
      };
      return [...prevItems, newItem];
    });
  };

  const removeFromCart = (itemId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const isInCart = (productId: string) => {
    return items.some(item => item.product._id === productId);
  };

  const value: CartContextType = {
    items,
    totalItems,
    totalPrice,
    addToCart,
    addCustomOrderToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isInCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
