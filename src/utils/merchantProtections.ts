import { supabase } from '@/integrations/supabase/client.ts';
import { toast } from '@/components/ui/sonner';

export interface MerchantProtectionResult {
  success: boolean;
  message?: string;
  data?: any;
}

export const validateMerchantPermissions = async (
  merchantId: string,
  requiredPermission: string
): Promise<{
  allowed: boolean;
  reason?: string;
}> => {
  try {
    const { data, error } = await supabase
      .rpc('validate_merchant_permissions', {
        p_merchant_id: merchantId,
        p_required_permission: requiredPermission
      });

    if (error) {
      console.error('Merchant permission validation error:', error);
      return { allowed: false, reason: 'Permission validation failed' };
    }

    return {
      allowed: data.allowed,
      reason: data.reason
    };
  } catch (error) {
    console.error('Merchant permission validation exception:', error);
    return { allowed: false, reason: 'Permission validation unavailable' };
  }
};

export const enforceStoreHours = async (
  storeId: string
): Promise<{
  isOpen: boolean;
  reason?: string;
  nextOpenTime?: string;
}> => {
  try {
    const { data, error } = await supabase
      .rpc('enforce_store_hours', {
        p_store_id: storeId
      });

    if (error) {
      console.error('Store hours enforcement error:', error);
      return { isOpen: false, reason: 'Unable to check store hours' };
    }

    return {
      isOpen: data.is_open,
      reason: data.reason,
      nextOpenTime: data.next_open_time
    };
  } catch (error) {
    console.error('Store hours enforcement exception:', error);
    return { isOpen: false, reason: 'Store hours check unavailable' };
  }
};

export const preventStockRaceConditions = async (
  productId: string,
  storeId: string,
  requestedQuantity: number,
  operation: 'add' | 'subtract'
): Promise<{
  success: boolean;
  newQuantity?: number;
  reason?: string;
}> => {
  try {
    const { data, error } = await supabase
      .rpc('prevent_stock_race_condition', {
        p_product_id: productId,
        p_store_id: storeId,
        p_requested_quantity: requestedQuantity,
        p_operation: operation
      });

    if (error) {
      console.error('Stock race condition prevention error:', error);
      return { success: false, reason: 'Stock operation failed' };
    }

    return {
      success: data.success,
      newQuantity: data.new_quantity,
      reason: data.reason
    };
  } catch (error) {
    console.error('Stock race condition prevention exception:', error);
    return { success: false, reason: 'Stock operation unavailable' };
  }
};

export const validatePriceUpdate = async (
  productId: string,
  storeId: string,
  newPrice: number,
  oldPrice: number
): Promise<{
  allowed: boolean;
  reason?: string;
  maxChangePercent?: number;
}> => {
  try {
    const { data, error } = await supabase
      .rpc('validate_price_update', {
        p_product_id: productId,
        p_store_id: storeId,
        p_new_price: newPrice,
        p_old_price: oldPrice
      });

    if (error) {
      console.error('Price update validation error:', error);
      return { allowed: false, reason: 'Price validation failed' };
    }

    return {
      allowed: data.allowed,
      reason: data.reason,
      maxChangePercent: data.max_change_percent
    };
  } catch (error) {
    console.error('Price update validation exception:', error);
    return { allowed: false, reason: 'Price validation unavailable' };
  }
};

export const trackProductEditHistory = async (
  productId: string,
  storeId: string,
  fieldName: string,
  oldValue: any,
  newValue: any,
  merchantId: string
): Promise<void> => {
  try {
    await supabase
      .from('product_edit_history')
      .insert({
        product_id: productId,
        store_id: storeId,
        field_name: fieldName,
        old_value: oldValue,
        new_value: newValue,
        merchant_id: merchantId,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Product edit history tracking error:', error);
  }
};

export const setOrderAcceptanceTimeLimit = async (
  orderId: string,
  storeId: string,
  timeLimitMinutes: number = 30
): Promise<{
  success: boolean;
  expiresAt?: string;
  reason?: string;
}> => {
  try {
    const { data, error } = await supabase
      .rpc('set_order_acceptance_time_limit', {
        p_order_id: orderId,
        p_store_id: storeId,
        p_time_limit_minutes: timeLimitMinutes
      });

    if (error) {
      console.error('Order acceptance time limit error:', error);
      return { success: false, reason: 'Failed to set time limit' };
    }

    return {
      success: data.success,
      expiresAt: data.expires_at,
      reason: data.reason
    };
  } catch (error) {
    console.error('Order acceptance time limit exception:', error);
    return { success: false, reason: 'Time limit service unavailable' };
  }
};

export const autoCancelInactiveOrders = async (
  storeId: string
): Promise<{
  cancelledCount: number;
  cancelledOrders: string[];
}> => {
  try {
    const { data, error } = await supabase
      .rpc('auto_cancel_inactive_orders', {
        p_store_id: storeId
      });

    if (error) {
      console.error('Auto cancel inactive orders error:', error);
      return { cancelledCount: 0, cancelledOrders: [] };
    }

    return {
      cancelledCount: data.cancelled_count,
      cancelledOrders: data.cancelled_orders
    };
  } catch (error) {
    console.error('Auto cancel inactive orders exception:', error);
    return { cancelledCount: 0, cancelledOrders: [] };
  }
};

export const trackOrderCancellation = async (
  orderId: string,
  storeId: string,
  reason: string,
  cancelledBy: string,
  cancelledByType: 'merchant' | 'customer' | 'admin'
): Promise<void> => {
  try {
    await supabase
      .from('order_cancellation_history')
      .insert({
        order_id: orderId,
        store_id: storeId,
        reason,
        cancelled_by: cancelledBy,
        cancelled_by_type: cancelledByType,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Order cancellation tracking error:', error);
  }
};

export const trackOrderPreparationTime = async (
  orderId: string,
  storeId: string,
  startTime: string,
  endTime?: string
): Promise<{
  preparationTimeMinutes?: number;
  isWithinSLA?: boolean;
  slaMinutes?: number;
}> => {
  try {
    const { data, error } = await supabase
      .rpc('track_order_preparation_time', {
        p_order_id: orderId,
        p_store_id: storeId,
        p_start_time: startTime,
        p_end_time: endTime
      });

    if (error) {
      console.error('Order preparation time tracking error:', error);
      return {};
    }

    return {
      preparationTimeMinutes: data.preparation_time_minutes,
      isWithinSLA: data.is_within_sla,
      slaMinutes: data.sla_minutes
    };
  } catch (error) {
    console.error('Order preparation time tracking exception:', error);
    return {};
  }
};