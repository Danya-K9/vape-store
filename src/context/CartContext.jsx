import { createContext, useContext, useState, useEffect } from 'react';
import { getToken } from '../lib/api';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cart') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, quantity = 1) => {
    setCart((prev) => {
      const exists = prev.find((x) => x.id === product.id);
      if (exists) {
        return prev.map((x) =>
          x.id === product.id ? { ...x, quantity: x.quantity + quantity } : x
        );
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((x) => x.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) return removeFromCart(productId);
    setCart((prev) =>
      prev.map((x) => (x.id === productId ? { ...x, quantity } : x))
    );
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce((sum, x) => sum + x.price * x.quantity, 0);
  const count = cart.reduce((sum, x) => sum + x.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
