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

  const clampToStock = (product, desiredQty) => {
    const stock = product?.stock;
    if (typeof stock !== 'number' || !Number.isFinite(stock)) return desiredQty;
    return Math.min(desiredQty, Math.max(0, stock));
  };

  const addToCart = (product, quantity = 1) => {
    setCart((prev) => {
      const exists = prev.find((x) => x.id === product.id);
      if (exists) {
        const nextQty = clampToStock(product, (exists.quantity || 0) + quantity);
        return prev.map((x) => (
          x.id === product.id ? { ...x, quantity: Math.max(1, nextQty) } : x
        ));
      }
      const nextQty = clampToStock(product, quantity);
      return nextQty <= 0 ? prev : [...prev, { ...product, quantity: Math.max(1, nextQty) }];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((x) => x.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) return removeFromCart(productId);
    setCart((prev) =>
      prev.map((x) => {
        if (x.id !== productId) return x;
        const nextQty = clampToStock(x, quantity);
        if (nextQty <= 0) return { ...x, quantity: 1 };
        return { ...x, quantity: nextQty };
      })
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
