import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const allowedTransitions: Record<string, string[]> = {
  created: ['payment_pending', 'cancelled', 'failed'],
  payment_pending: ['payment_success', 'cancelled', 'failed'],
  payment_success: ['merchant_accepted', 'cancelled', 'failed'],
  merchant_accepted: ['driver_assigned', 'cancelled', 'failed'],
  driver_assigned: ['picked_up', 'cancelled', 'failed'],
  waiting_for_driver: ['driver_assigned', 'cancelled', 'failed'],
  picked_up: ['out_for_delivery', 'failed'],
  out_for_delivery: ['delivered', 'failed'],
  delivered: [],
  cancelled: [],
  failed: [],
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'failed'],
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, status, reason, force, deliveryId, deliveryStatus } = await req.json();
    if (!orderId || !status) {
      throw new Error('Missing orderId or status');
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

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .maybeSingle();

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id,status,customer_id')
      .eq('id', orderId)
      .maybeSingle();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    const isAdmin = profile?.role === 'admin';
    const isCustomer = profile?.role === 'customer' && order.customer_id === authData.user.id;
    const allowedRoles = ['store_owner', 'driver', 'admin', 'customer'];
    if (!allowedRoles.includes(profile?.role ?? '')) {
      throw new Error('Unauthorized');
    }

    if (!force) {
      const currentStatus = order.status ?? 'pending';
      const allowed = allowedTransitions[currentStatus] || [];
      if (!allowed.includes(status)) {
        throw new Error(`Invalid status transition from ${currentStatus} to ${status}`);
      }
      if (status === 'merchant_accepted' && profile?.role !== 'store_owner' && !isAdmin) {
        throw new Error('Only merchants can accept orders');
      }
      if (['picked_up', 'out_for_delivery', 'delivered'].includes(status) && profile?.role !== 'driver' && !isAdmin) {
        throw new Error('Only drivers can update delivery status');
      }
      if (status === 'cancelled' && !isCustomer && profile?.role !== 'store_owner' && !isAdmin) {
        throw new Error('Unauthorized cancellation');
      }
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ status, updated_at: now })
      .eq('id', orderId);

    if (updateError) {
      throw new Error(updateError.message || 'Failed to update order');
    }

    await supabaseAdmin.from('order_status_history').insert({
      order_id: orderId,
      old_status: order.status,
      new_status: status,
      change_reason: reason ?? null,
      automated: false,
      changed_by: authData.user.id,
      created_at: now
    });

    if (deliveryId && deliveryStatus) {
      await supabaseAdmin
        .from('deliveries')
        .update({
          status: deliveryStatus,
          updated_at: now,
          actual_delivery_time: deliveryStatus === 'delivered' ? now : undefined
        })
        .eq('id', deliveryId);

      await supabaseAdmin.from('delivery_tracking').insert({
        delivery_id: deliveryId,
        status: deliveryStatus,
        location: {},
        notes: reason ?? null,
        created_at: now
      });
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to update order' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
