import { supabase } from '@/integrations/supabase/client.ts';
import { toast } from '@/components/ui/sonner';

export interface StockValidationResult {
  isValid: boolean;
  message?: string;
  availableStock?: number;
}

export const validateStockAvailability = async (
  productId: string, 
  requestedQuantity: number,
  variantId?: string
): Promise<StockValidationResult> => {
  try {
    // Check product/variant stock from store_products table
    const { data, error } = await supabase
      .from('store_products')
      .select('inventory_quantity')
      .eq('product_id', productId)
      .maybeSingle();

    if (error) {
      console.error('Stock validation error:', error);
      return { isValid: false, message: 'Unable to check stock availability' };
    }

    if (!data) {
      return { isValid: false, message: 'Product not found in store inventory' };
    }

    const availableStock = data.inventory_quantity || 0;

    if (availableStock < requestedQuantity) {
      return { 
        isValid: false, 
        message: `Only ${availableStock} items available in stock`,
        availableStock 
      };
    }

    return { isValid: true, availableStock };
  } catch (error) {
    console.error('Stock validation exception:', error);
    return { isValid: false, message: 'Stock validation failed' };
  }
};

export const checkMultipleStock = async (items: Array<{
  productId: string;
  quantity: number;
  variantId?: string;
}>): Promise<StockValidationResult> => {
  try {
    for (const item of items) {
      const validation = await validateStockAvailability(
        item.productId,
        item.quantity,
        item.variantId
      );
      
      if (!validation.isValid) {
        return validation;
      }
    }
    
    return { isValid: true };
  } catch (error) {
    console.error('Multiple stock validation error:', error);
    return { isValid: false, message: 'Stock validation failed' };
  }
};

export const reserveStock = async (
  productId: string,
  quantity: number,
  orderId: string
): Promise<boolean> => {
  try {
    // Start a transaction-like operation using Supabase RPC
    const { data, error } = await supabase
      .rpc('reserve_stock', {
        p_product_id: productId,
        p_quantity: quantity,
        p_order_id: orderId
      });

    if (error) {
      console.error('Stock reservation error:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Stock reservation exception:', error);
    return false;
  }
};

export const releaseStock = async (
  productId: string,
  quantity: number,
  orderId: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .rpc('release_stock', {
        p_product_id: productId,
        p_quantity: quantity,
        p_order_id: orderId
      });

    if (error) {
      console.error('Stock release error:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Stock release exception:', error);
    return false;
  }
};

export const deductStock = async (
  productId: string,
  quantity: number
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .rpc('deduct_stock', {
        p_product_id: productId,
        p_quantity: quantity
      });

    if (error) {
      console.error('Stock deduction error:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Stock deduction exception:', error);
    return false;
  }
};