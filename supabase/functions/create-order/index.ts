import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@13.11.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderItemInput {
  productId: string;
  variantId?: string | null;
  storeId: string;
  quantity: number;
  price: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      orderNumber,
      items,
      subtotal,
      tax,
      shipping,
      total,
      shippingAddress,
      paymentIntentId,
      paymentMethod
    } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Missing order items');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!supabaseUrl || !anonKey || !serviceKey) {
      throw new Error('Supabase environment not configured');
    }

    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
    });
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    const { data: authData, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !authData.user) {
      throw new Error('Unauthorized');
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    let stripe: Stripe | null = null;
    if (paymentMethod === 'stripe') {
      const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
      if (!stripeSecretKey) {
        throw new Error('Stripe secret key not configured');
      }
      stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (!paymentIntent || paymentIntent.status !== 'succeeded') {
        throw new Error('Payment not verified');
      }
      if (paymentIntent.amount !== Math.round(Number(total) * 100)) {
        throw new Error('Payment amount mismatch');
      }
    }

    const now = new Date().toISOString();
    const status = paymentMethod === 'stripe' ? 'payment_success' : 'payment_pending';
    const paymentStatus = paymentMethod === 'stripe' ? 'paid' : 'pending';

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: authData.user.id,
        subtotal,
        tax_amount: tax,
        shipping_amount: shipping,
        total_amount: total,
        payment_intent_id: paymentIntentId,
        payment_status: paymentStatus,
        status,
        shipping_address: shippingAddress,
        created_at: now,
        updated_at: now
      })
      .select('id')
      .single();

    if (orderError || !order) {
      throw new Error(orderError?.message || 'Failed to create order');
    }

    if (stripe) {
      await stripe.paymentIntents.update(paymentIntentId, {
        metadata: {
          orderId: order.id
        }
      });
    }

    const orderItems = (items as OrderItemInput[]).map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      variant_id: item.variantId ?? null,
      store_id: item.storeId,
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity,
      created_at: now
    }));

    const { error: itemsError } = await supabaseAdmin.from('order_items').insert(orderItems);
    if (itemsError) {
      throw new Error(itemsError.message || 'Failed to create order items');
    }

    const storeTotals = orderItems.reduce<Record<string, number>>((acc, item) => {
      acc[item.store_id] = (acc[item.store_id] || 0) + Number(item.total || 0);
      return acc;
    }, {});
    const storeIds = Object.keys(storeTotals);
    if (storeIds.length > 0) {
      const { data: stores } = await supabaseAdmin
        .from('stores')
        .select('id, commission_rate')
        .in('id', storeIds);
      const commissionRecords = (stores || []).map((store) => {
        const rate = Number(store.commission_rate || 0);
        const storeTotal = storeTotals[store.id] || 0;
        return {
          store_id: store.id,
          order_id: order.id,
          commission_rate: rate,
          commission_amount: (storeTotal * rate) / 100,
          calculated_at: now,
          payment_status: 'pending'
        };
      });
      if (commissionRecords.length > 0) {
        await supabaseAdmin.from('commission_tracking').insert(commissionRecords);
      }
    }

    await supabaseAdmin.from('order_status_history').insert({
      order_id: order.id,
      old_status: null,
      new_status: status,
      change_reason: 'Order created after payment verification',
      automated: true,
      created_at: now
    });

    const uniqueProductIds = [...new Set(orderItems.map((item) => item.product_id))];
    for (const productId of uniqueProductIds) {
      const quantity = orderItems
        .filter((item) => item.product_id === productId)
        .reduce((sum, item) => sum + item.quantity, 0);
      await supabaseAdmin.rpc('deduct_stock', {
        p_product_id: productId,
        p_quantity: quantity
      });
    }

    return new Response(
      JSON.stringify({ orderId: order.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'Order creation failed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
