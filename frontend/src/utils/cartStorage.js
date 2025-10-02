/**
 * Cart localStorage persistence utilities
 * Syncs cart between localStorage (guest) and database (logged-in users)
 */

const CART_STORAGE_KEY = 'mithaas_cart';

/**
 * Save cart to localStorage
 */
export const saveCartToLocalStorage = (cartItems) => {
  try {
    const cartData = {
      items: cartItems,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData));
  } catch (error) {
    console.error('Error saving cart to localStorage:', error);
  }
};

/**
 * Load cart from localStorage
 */
export const loadCartFromLocalStorage = () => {
  try {
    const cartData = localStorage.getItem(CART_STORAGE_KEY);
    if (!cartData) return [];
    
    const parsed = JSON.parse(cartData);
    // Check if cart is not older than 7 days
    const timestamp = new Date(parsed.timestamp);
    const now = new Date();
    const daysDiff = (now - timestamp) / (1000 * 60 * 60 * 24);
    
    if (daysDiff > 7) {
      clearCartFromLocalStorage();
      return [];
    }
    
    return parsed.items || [];
  } catch (error) {
    console.error('Error loading cart from localStorage:', error);
    return [];
  }
};

/**
 * Clear cart from localStorage
 */
export const clearCartFromLocalStorage = () => {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing cart from localStorage:', error);
  }
};

/**
 * Merge guest cart with user cart on login
 * Combines items by product_id + variant_weight
 */
export const mergeGuestCartWithUserCart = (guestCart, userCart) => {
  const merged = [...userCart];
  
  guestCart.forEach(guestItem => {
    const existingIndex = merged.findIndex(
      item => item.product_id === guestItem.product_id && 
              item.variant_weight === guestItem.variant_weight
    );
    
    if (existingIndex >= 0) {
      // Item exists, increase quantity
      merged[existingIndex].quantity += guestItem.quantity;
    } else {
      // New item, add to cart
      merged.push(guestItem);
    }
  });
  
  return merged;
};

/**
 * Validate cart items against current product catalog
 * Removes unavailable items
 */
export const validateCartItems = async (cartItems, apiClient) => {
  const validItems = [];
  const removedItems = [];
  
  for (const item of cartItems) {
    try {
      const response = await apiClient.get(`/products/${item.product_id}`);
      const product = response.data;
      
      // Check if product exists and is available
      if (!product.is_available || product.is_sold_out) {
        removedItems.push(item);
        continue;
      }
      
      // Check if variant exists and is available
      const variant = product.variants.find(v => v.weight === item.variant_weight);
      if (!variant || !variant.is_available || variant.stock <= 0) {
        removedItems.push(item);
        continue;
      }
      
      // Update price if changed
      item.price = variant.price;
      validItems.push(item);
    } catch (error) {
      // Product not found or error, remove from cart
      removedItems.push(item);
    }
  }
  
  return { validItems, removedItems };
};
