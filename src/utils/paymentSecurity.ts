import { supabase } from '@/integrations/supabase/client.ts';
import { User } from '@supabase/supabase-js';

export interface PaymentVerificationResult {
  success: boolean;
  paymentIntentId?: string;
  amount?: number;
  currency?: string;
  status?: string;
  error?: string;
}

interface ShippingAddress {
  first_name?: string;
  last_name?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
}

export const verifyPaymentServerSide = async (
  paymentIntentId: string,
  expectedAmount: number,
  orderId: string
): Promise<PaymentVerificationResult> => {
  try {
    // Call Supabase edge function for secure payment verification
    const { data, error } = await supabase.functions.invoke('verify-payment', {
      body: {
        paymentIntentId,
        expectedAmount,
        orderId
      }
    });

    if (error) {
      console.error('Payment verification error:', error);
      return { 
        success: false, 
        error: error.message || 'Payment verification failed' 
      };
    }

    if (data?.error) {
      return { 
        success: false, 
        error: data.error 
      };
    }

    return {
      success: true,
      paymentIntentId: data.paymentIntentId,
      amount: data.amount,
      currency: data.currency,
      status: data.status
    };
  } catch (error) {
    console.error('Payment verification exception:', error);
    return { 
      success: false, 
      error: 'Payment verification service unavailable' 
    };
  }
};

const generateOrderNumber = () => `BF-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

export const createOrderWithPayment = async (
  orderData: {
    userId: string;
    items: Array<{ productId: string; quantity: number; price: number; storeId: string }>;
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
    shippingAddress: ShippingAddress;
    paymentIntentId: string;
    paymentMethod: 'stripe' | 'cash_on_delivery';
  }
): Promise<{ success: boolean; orderId?: string; error?: string }> => {
  try {
    const orderNumber = generateOrderNumber();
    const { data, error } = await supabase.functions.invoke('create-order', {
      body: {
        orderNumber,
        items: orderData.items,
        subtotal: orderData.subtotal,
        tax: orderData.tax,
        shipping: orderData.shipping,
        total: orderData.total,
        shippingAddress: orderData.shippingAddress,
        paymentIntentId: orderData.paymentIntentId,
        paymentMethod: orderData.paymentMethod
      }
    });

    if (error) {
      return { success: false, error: error.message || 'Order creation failed' };
    }

    if (!data?.orderId) {
      return { success: false, error: data?.error || 'Order creation failed' };
    }

    return { success: true, orderId: data.orderId };
  } catch (error) {
    console.error('Order creation error:', error);
    return { success: false, error: 'Failed to create order' };
  }
};

export const preventDuplicatePayment = async (
  userId: string,
  orderId: string,
  amount: number
): Promise<{ allowed: boolean; reason?: string }> => {
  try {
    const { data, error } = await supabase
      .rpc('check_duplicate_payment', {
        p_user_id: userId,
        p_order_id: orderId,
        p_amount: amount
      });

    if (error) {
      console.error('Duplicate payment check error:', error);
      return { allowed: false, reason: 'Payment validation failed' };
    }

    return {
      allowed: data.allowed,
      reason: data.reason
    };
  } catch (error) {
    console.error('Duplicate payment check exception:', error);
    return { allowed: false, reason: 'Payment validation unavailable' };
  }
};

export const handlePaymentFailure = async (
  orderId: string,
  paymentIntentId: string,
  failureReason: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .rpc('handle_payment_failure', {
        p_order_id: orderId,
        p_payment_intent_id: paymentIntentId,
        p_failure_reason: failureReason
      });

    if (error) {
      console.error('Payment failure handling error:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Payment failure handling exception:', error);
    return false;
  }
};
