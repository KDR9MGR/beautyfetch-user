import { supabase } from '@/integrations/supabase/client.ts';
import { toast } from '@/components/ui/sonner';

export interface CartValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export const validateCartBeforeCheckout = async (
  cartItems: Array<{
    productId: string;
    quantity: number;
    storeId: string;
    price: number;
  }>
): Promise<CartValidationResult> => {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Check 1: Ensure all items are from the same store
    const uniqueStores = [...new Set(cartItems.map(item => item.storeId))];
    if (uniqueStores.length > 1) {
      errors.push('All items must be from the same store');
    }

    // Check 2: Validate stock availability for all items
    for (const item of cartItems) {
      const { data: stockData, error: stockError } = await supabase
        .from('store_products')
        .select('inventory_quantity, price')
        .eq('product_id', item.productId)
        .eq('store_id', item.storeId)
        .maybeSingle();

      if (stockError || !stockData) {
        errors.push(`Product ${item.productId} not available in store`);
        continue;
      }

      if (stockData.inventory_quantity < item.quantity) {
        errors.push(`Only ${stockData.inventory_quantity} available for product ${item.productId}`);
      }

      // Check 3: Validate price hasn't changed
      if (stockData.price !== item.price) {
        warnings.push(`Price changed for product ${item.productId}`);
      }
    }

    // Check 4: Validate minimum order amount (if applicable)
    const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (totalAmount < 10) { // Minimum $10 order
      errors.push('Minimum order amount is $10');
    }

    // Check 5: Validate store is open and accepting orders
    if (uniqueStores.length === 1) {
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('status, business_hours')
        .eq('id', uniqueStores[0])
        .maybeSingle();

      if (storeError || !storeData) {
        errors.push('Store not found');
      } else if (storeData.status !== 'active') {
        errors.push('Store is not currently accepting orders');
      } else {
        // Check business hours
        const now = new Date();
        const currentDay = now.getDay(); // 0 = Sunday
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        if (storeData.business_hours) {
          const todayHours = storeData.business_hours[currentDay.toString()];
          if (todayHours?.closed) {
            errors.push('Store is closed today');
          } else if (todayHours?.open && todayHours?.close) {
            const [openHour, openMinute] = todayHours.open.split(':').map(Number);
            const [closeHour, closeMinute] = todayHours.close.split(':').map(Number);
            const openTime = openHour * 60 + openMinute;
            const closeTime = closeHour * 60 + closeMinute;
            
            if (currentTime < openTime || currentTime > closeTime) {
              errors.push('Store is currently closed');
            }
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  } catch (error) {
    console.error('Cart validation error:', error);
    return {
      isValid: false,
      errors: ['Cart validation failed'],
      warnings: []
    };
  }
};

export const persistCartToBackend = async (
  userId: string,
  cartItems: Array<{
    productId: string;
    quantity: number;
    storeId: string;
  }>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_carts')
      .upsert({
        user_id: userId,
        items: cartItems,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Cart persistence error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Cart persistence exception:', error);
    return false;
  }
};

export const loadCartFromBackend = async (
  userId: string
): Promise<Array<{
  productId: string;
  quantity: number;
  storeId: string;
}> | null> => {
  try {
    const { data, error } = await supabase
      .from('user_carts')
      .select('items')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Cart loading error:', error);
      return null;
    }

    return data?.items || null;
  } catch (error) {
    console.error('Cart loading exception:', error);
    return null;
  }
};

export const preventDuplicateOrder = async (
  userId: string,
  cartItems: Array<{
    productId: string;
    quantity: number;
    storeId: string;
  }>
): Promise<{
  allowed: boolean;
  reason?: string;
}> => {
  try {
    // Check for recent orders with same items
    const { data: recentOrders, error } = await supabase
      .from('orders')
      .select(`
        id,
        created_at,
        order_items(
          product_id,
          quantity
        )
      `)
      .eq('customer_id', userId)
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Duplicate order check error:', error);
      return { allowed: false, reason: 'Order validation failed' };
    }

    // Check if any recent order has the same items
    for (const order of recentOrders || []) {
      const orderItems = order.order_items.map((item: any) => ({
        productId: item.product_id,
        quantity: item.quantity
      }));

      const cartItemsNormalized = cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }));

      const isDuplicate = orderItems.length === cartItemsNormalized.length &&
        orderItems.every((orderItem: any) => 
          cartItemsNormalized.some(cartItem => 
            cartItem.productId === orderItem.productId && 
            cartItem.quantity === orderItem.quantity
          )
        );

      if (isDuplicate) {
        return { 
          allowed: false, 
          reason: 'Similar order placed recently. Please wait a few minutes.' 
        };
      }
    }

    return { allowed: true };
  } catch (error) {
    console.error('Duplicate order check exception:', error);
    return { allowed: false, reason: 'Order validation failed' };
  }
};