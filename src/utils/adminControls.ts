import { supabase } from '@/integrations/supabase/client.ts';
import { toast } from '@/components/ui/sonner';

export interface AdminOverrideResult {
  success: boolean;
  message?: string;
  data?: any;
}

export const adminOverrideOrderStatus = async (
  orderId: string,
  newStatus: string,
  reason: string,
  adminId: string
): Promise<AdminOverrideResult> => {
  try {
    const { data, error } = await supabase
      .rpc('admin_override_order_status', {
        p_order_id: orderId,
        p_new_status: newStatus,
        p_reason: reason,
        p_admin_id: adminId
      });

    if (error) {
      console.error('Admin override error:', error);
      return { 
        success: false, 
        message: error.message || 'Failed to override order status' 
      };
    }

    return {
      success: true,
      message: 'Order status overridden successfully',
      data
    };
  } catch (error) {
    console.error('Admin override exception:', error);
    return { 
      success: false, 
      message: 'Admin override service unavailable' 
    };
  }
};

export const adminTriggerRefund = async (
  orderId: string,
  amount: number,
  reason: string,
  adminId: string
): Promise<AdminOverrideResult> => {
  try {
    const { data, error } = await supabase
      .rpc('admin_trigger_refund', {
        p_order_id: orderId,
        p_amount: amount,
        p_reason: reason,
        p_admin_id: adminId
      });

    if (error) {
      console.error('Admin refund error:', error);
      return { 
        success: false, 
        message: error.message || 'Failed to trigger refund' 
      };
    }

    return {
      success: true,
      message: 'Refund triggered successfully',
      data
    };
  } catch (error) {
    console.error('Admin refund exception:', error);
    return { 
      success: false, 
      message: 'Refund service unavailable' 
    };
  }
};

export const adminEmergencyCancel = async (
  orderId: string,
  reason: string,
  adminId: string
): Promise<AdminOverrideResult> => {
  try {
    const { data, error } = await supabase
      .rpc('admin_emergency_cancel', {
        p_order_id: orderId,
        p_reason: reason,
        p_admin_id: adminId
      });

    if (error) {
      console.error('Admin emergency cancel error:', error);
      return { 
        success: false, 
        message: error.message || 'Failed to cancel order' 
      };
    }

    return {
      success: true,
      message: 'Order cancelled successfully',
      data
    };
  } catch (error) {
    console.error('Admin emergency cancel exception:', error);
    return { 
      success: false, 
      message: 'Emergency cancel service unavailable' 
    };
  }
};

export const adminReassignDelivery = async (
  orderId: string,
  newDriverId: string,
  reason: string,
  adminId: string
): Promise<AdminOverrideResult> => {
  try {
    const { data, error } = await supabase
      .rpc('admin_reassign_delivery', {
        p_order_id: orderId,
        p_new_driver_id: newDriverId,
        p_reason: reason,
        p_admin_id: adminId
      });

    if (error) {
      console.error('Admin reassign error:', error);
      return { 
        success: false, 
        message: error.message || 'Failed to reassign delivery' 
      };
    }

    return {
      success: true,
      message: 'Delivery reassigned successfully',
      data
    };
  } catch (error) {
    console.error('Admin reassign exception:', error);
    return { 
      success: false, 
      message: 'Delivery reassignment service unavailable' 
    };
  }
};

export const adminResolvePaymentMismatch = async (
  orderId: string,
  expectedAmount: number,
  actualAmount: number,
  adminId: string
): Promise<AdminOverrideResult> => {
  try {
    const { data, error } = await supabase
      .rpc('admin_resolve_payment_mismatch', {
        p_order_id: orderId,
        p_expected_amount: expectedAmount,
        p_actual_amount: actualAmount,
        p_admin_id: adminId
      });

    if (error) {
      console.error('Admin payment mismatch error:', error);
      return { 
        success: false, 
        message: error.message || 'Failed to resolve payment mismatch' 
      };
    }

    return {
      success: true,
      message: 'Payment mismatch resolved successfully',
      data
    };
  } catch (error) {
    console.error('Admin payment mismatch exception:', error);
    return { 
      success: false, 
      message: 'Payment resolution service unavailable' 
    };
  }
};

export const getAllOrdersRealTime = async (
  filters?: {
    status?: string;
    storeId?: string;
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<any[]> => {
  try {
    let query = supabase
      .from('orders')
      .select(`
        *,
        profiles!orders_customer_id_fkey(first_name, last_name, email),
        order_items(
          *,
          products(name, price),
          stores(name)
        ),
        deliveries(*)
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.storeId) {
      query = query.eq('store_id', filters.storeId);
    }
    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Real-time orders error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Real-time orders exception:', error);
    return [];
  }
};

export const logAdminAction = async (
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  details: any
): Promise<void> => {
  try {
    await supabase
      .from('admin_audit_logs')
      .insert({
        admin_id: adminId,
        action,
        target_type: targetType,
        target_id: targetId,
        details,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Admin audit log error:', error);
  }
};