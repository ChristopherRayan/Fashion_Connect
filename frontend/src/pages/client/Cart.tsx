import { useState } from 'react';
import CartModal from '../../components/cart/CartModal';

// Default Cart component for backward compatibility
const Cart = () => {
  const [isOpen, setIsOpen] = useState(true);

  return <CartModal isOpen={isOpen} onClose={() => window.history.back()} />;
};

export default Cart;
