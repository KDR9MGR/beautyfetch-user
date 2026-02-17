import { supabase } from '@/integrations/supabase/client.ts';
import { calculateDeliveryFeeForAddress, formatAddress, getDefaultDeliveryFeeSettings } from '@/lib/googleMapsService';
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

const getNotificationPreferences = async (userId: string) => {
  const supabaseAny = supabase as any;
  const { data } = await supabaseAny
    .from('notification_preferences')
    .select('email_enabled,push_enabled,in_app_enabled,order_updates_enabled')
    .eq('user_id', userId)
    .maybeSingle();
  return (
    data ?? {
      email_enabled: true,
      push_enabled: false,
      in_app_enabled: true,
      order_updates_enabled: true,
    }
  );
};

const createNotificationsForUser = async (
  userId: string,
  title: string,
  message: string
) => {
  const preferences = await getNotificationPreferences(userId);
  if (!preferences.order_updates_enabled) return;
  const supabaseAny = supabase as any;
  const records = [];
  if (preferences.in_app_enabled) {
    records.push({
      user_id: userId,
      title,
      message,
      type: 'in_app',
      read: false,
    });
  }
  if (preferences.email_enabled) {
    records.push({
      user_id: userId,
      title,
      message,
      type: 'email',
      read: false,
    });
  }
  if (preferences.push_enabled) {
    records.push({
      user_id: userId,
      title,
      message,
      type: 'push',
      read: false,
    });
  }
  if (records.length > 0) {
    await supabaseAny.from('notifications').insert(records);
  }
};

const logOrderEvent = async (userId: string, action: string, metadata: Record<string, unknown>) => {
  const supabaseAny = supabase as any;
  await supabaseAny.from('user_activity_log').insert({
    user_id: userId,
    action_type: action,
    metadata,
  });
};

const assignDriverForOrder = async (
  orderId: string,
  storeAddress: unknown,
  deliveryAddress: unknown
): Promise<string | null> => {
  const supabaseAny = supabase as any;
  const { data: driverStatuses } = await supabaseAny
    .from('driver_status')
    .select('driver_id,is_online,last_location')
    .eq('is_online', true);
  if (!driverStatuses || driverStatuses.length === 0) {
    return null;
  }

  const deliveryAddressString = formatAddress(deliveryAddress);
  const storeAddressString = formatAddress(storeAddress);
  const pickupAddress = storeAddress || { address_line_1: storeAddressString };
  const dropoffAddress = deliveryAddress || { address_line_1: deliveryAddressString };
  const driverCandidates = driverStatuses.filter((driver: any) => driver.is_online);
  if (!deliveryAddressString || !storeAddressString) {
    const driver = driverCandidates[0];
    await supabaseAny.from('deliveries').insert({
      order_id: orderId,
      driver_id: driver.driver_id,
      status: 'assigned',
      pickup_address: pickupAddress,
      delivery_address: dropoffAddress,
      assigned_at: new Date().toISOString(),
      estimated_delivery_time: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    });
    return driver.driver_id;
  }

  const distanceResults = await Promise.all(
    driverCandidates.map(async (driver: any) => {
      if (!driver.last_location) {
        return { driverId: driver.driver_id, distance: Number.POSITIVE_INFINITY };
      }
      const deliveryFeeSettings = getDefaultDeliveryFeeSettings();
      const { distance } = await calculateDeliveryFeeForAddress(driver.last_location, deliveryAddress, deliveryFeeSettings);
      return { driverId: driver.driver_id, distance };
    })
  );
  const bestDriver = distanceResults.sort((a, b) => a.distance - b.distance)[0];
  const assignedDriverId = bestDriver?.driverId || driverCandidates[0].driver_id;
  let estimatedDeliveryAt = new Date(Date.now() + 45 * 60 * 1000).toISOString();
  try {
    const deliveryFeeSettings = getDefaultDeliveryFeeSettings();
    const { duration } = await calculateDeliveryFeeForAddress(storeAddress, deliveryAddress, deliveryFeeSettings);
    if (duration) {
      estimatedDeliveryAt = new Date(Date.now() + Math.round(duration) * 60 * 1000).toISOString();
    }
  } catch (error) {
    console.error('Estimated delivery time calculation failed:', error);
  }
  await supabaseAny.from('deliveries').insert({
    order_id: orderId,
    driver_id: assignedDriverId,
    status: 'assigned',
    pickup_address: pickupAddress,
    delivery_address: dropoffAddress,
    assigned_at: new Date().toISOString(),
    estimated_delivery_time: estimatedDeliveryAt,
  });
  return assignedDriverId;
};

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
    const supabaseAny = supabase as any;
    const orderNumber = generateOrderNumber();
    const { data: rpcData, error: rpcError } = await supabaseAny
      .rpc('create_order_with_payment', {
        p_user_id: orderData.userId,
        p_items: orderData.items,
        p_total_amount: orderData.total,
        p_shipping_address: orderData.shippingAddress,
        p_payment_intent_id: orderData.paymentIntentId,
      })
      .maybeSingle();

    let orderId = rpcData ?? null;
    if (rpcError || !orderId) {
      const { data: order, error: orderError } = await supabaseAny
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_id: orderData.userId,
          subtotal: orderData.subtotal,
          tax_amount: orderData.tax,
          shipping_amount: orderData.shipping,
          total_amount: orderData.total,
          payment_status: orderData.paymentMethod === 'cash_on_delivery' ? 'pending' : 'paid',
          status: 'confirmed',
          payment_intent_id: orderData.paymentIntentId,
          shipping_address: orderData.shippingAddress,
        })
        .select('id')
        .single();
      if (orderError) {
        return { success: false, error: orderError.message };
      }
      orderId = order.id;

      await supabaseAny.from('order_items').insert(
        orderData.items.map((item) => ({
          order_id: orderId,
          product_id: item.productId,
          store_id: item.storeId,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
        }))
      );
      await supabaseAny.from('order_status_history').insert({
        order_id: orderId,
        status: 'confirmed',
        created_by: orderData.userId,
        notes: 'Order created from checkout',
      });
    }

    const storeIds = Array.from(new Set(orderData.items.map((item) => item.storeId)));
    const { data: stores } = await supabaseAny
      .from('stores')
      .select('id, owner_id, name, address')
      .in('id', storeIds);
    const productIds = Array.from(new Set(orderData.items.map((item) => item.productId)));
    const { data: products } = await supabaseAny.from('products').select('id,name').in('id', productIds);
    const productNameMap = (products || []).reduce((acc: Record<string, string>, product: any) => {
      acc[product.id] = product.name;
      return acc;
    }, {});

    if (stores && stores.length > 0) {
      await Promise.all(
        stores.map(async (store: any) => {
          const storeItems = orderData.items.filter((item) => item.storeId === store.id);
          const itemSummary = storeItems
            .map((item) => `${productNameMap[item.productId] || 'Item'} x${item.quantity}`)
            .join(', ');
          const customerName = `${orderData.shippingAddress?.first_name || ''} ${orderData.shippingAddress?.last_name || ''}`.trim();
          await createNotificationsForUser(
            store.owner_id,
            'New order received',
            `New order ${orderNumber} by ${customerName || 'Customer'}: ${itemSummary} (${new Date().toLocaleString()})`
          );
        })
      );
    }

    const pickupStore = stores?.[0];
    const assignedDriverId = await assignDriverForOrder(orderId, pickupStore?.address, orderData.shippingAddress);
    if (assignedDriverId) {
      await createNotificationsForUser(
        assignedDriverId,
        'New delivery assigned',
        `Order ${orderNumber} is ready for pickup`
      );
    }

    await createNotificationsForUser(
      orderData.userId,
      'Order confirmed',
      `Your order ${orderNumber} has been placed successfully`
    );

    await logOrderEvent(orderData.userId, 'order_created', {
      order_id: orderId,
      order_number: orderNumber,
      store_ids: storeIds,
      total: orderData.total,
    });

    return { success: true, orderId };
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
