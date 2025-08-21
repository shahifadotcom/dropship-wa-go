import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Cart, CartItem, Product, ProductVariant } from '@/lib/types';

interface CartContextType {
  cart: Cart;
  addToCart: (product: Product, quantity?: number, variant?: ProductVariant) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

type CartAction =
  | { type: 'ADD_ITEM'; product: Product; quantity: number; variant?: ProductVariant }
  | { type: 'REMOVE_ITEM'; itemId: string }
  | { type: 'UPDATE_QUANTITY'; itemId: string; quantity: number }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; cart: Cart };

function cartReducer(state: Cart, action: CartAction): Cart {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItemIndex = state.items.findIndex(
        item => 
          item.productId === action.product.id &&
          item.variant?.id === action.variant?.id
      );

      if (existingItemIndex > -1) {
        const newItems = [...state.items];
        newItems[existingItemIndex].quantity += action.quantity;
        return calculateTotals({ ...state, items: newItems });
      }

      const newItem: CartItem = {
        id: `${action.product.id}-${action.variant?.id || 'default'}-${Date.now()}`,
        productId: action.product.id,
        product: action.product,
        quantity: action.quantity,
        variant: action.variant,
        price: action.variant?.price || action.product.price
      };

      return calculateTotals({
        ...state,
        items: [...state.items, newItem]
      });
    }

    case 'REMOVE_ITEM':
      return calculateTotals({
        ...state,
        items: state.items.filter(item => item.id !== action.itemId)
      });

    case 'UPDATE_QUANTITY':
      if (action.quantity <= 0) {
        return calculateTotals({
          ...state,
          items: state.items.filter(item => item.id !== action.itemId)
        });
      }

      return calculateTotals({
        ...state,
        items: state.items.map(item =>
          item.id === action.itemId
            ? { ...item, quantity: action.quantity }
            : item
        )
      });

    case 'CLEAR_CART':
      return {
        items: [],
        subtotal: 0,
        tax: 0,
        shipping: 0,
        total: 0
      };

    case 'LOAD_CART':
      return action.cart;

    default:
      return state;
  }
}

function calculateTotals(cart: Cart): Cart {
  const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.1; // 10% tax
  const shipping = subtotal > 100 ? 0 : 9.99; // Free shipping over $100
  const total = subtotal + tax + shipping;

  return {
    ...cart,
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    shipping: Math.round(shipping * 100) / 100,
    total: Math.round(total * 100) / 100
  };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, dispatch] = useReducer(cartReducer, {
    items: [],
    subtotal: 0,
    tax: 0,
    shipping: 0,
    total: 0
  });

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', cart: parsedCart });
      } catch (error) {
        console.error('Failed to parse saved cart:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product, quantity = 1, variant?: ProductVariant) => {
    dispatch({ type: 'ADD_ITEM', product, quantity, variant });
  };

  const removeFromCart = (itemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', itemId });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', itemId, quantity });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const getCartTotal = () => cart.total;
  
  const getCartItemCount = () => cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartItemCount
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}