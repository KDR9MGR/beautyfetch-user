import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();
    if (!orderId) {
      throw new Error('Missing orderId');
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
    if (profile?.role !== 'admin' && profile?.role !== 'store_owner') {
      throw new Error('Unauthorized');
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id,status,shipping_address')
      .eq('id', orderId)
      .maybeSingle();
    if (orderError || !order) {
      throw new Error('Order not found');
    }

    if (order.status !== 'merchant_accepted') {
      throw new Error('Order not ready for driver assignment');
    }

    const { data: drivers } = await supabaseAdmin
      .from('driver_status')
      .select('driver_id,last_location,updated_at')
      .eq('is_online', true);

    if (!drivers || drivers.length === 0) {
      await supabaseAdmin
        .from('orders')
        .update({ status: 'waiting_for_driver', updated_at: new Date().toISOString() })
        .eq('id', orderId);

      return new Response(
        JSON.stringify({ assigned: false, reason: 'No drivers available' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const selectedDriver = drivers.sort((a, b) => {
      const aTime = a.updated_at ? Date.parse(a.updated_at) : 0;
      const bTime = b.updated_at ? Date.parse(b.updated_at) : 0;
      return bTime - aTime;
    })[0];

    const now = new Date().toISOString();
    const { data: delivery, error: deliveryError } = await supabaseAdmin
      .from('deliveries')
      .insert({
        order_id: orderId,
        driver_id: selectedDriver.driver_id,
        status: 'assigned',
        pickup_address: {},
        delivery_address: order.shipping_address,
        assigned_at: now,
        estimated_delivery_time: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
        created_at: now,
        updated_at: now
      })
      .select('id')
      .single();

    if (deliveryError) {
      throw new Error(deliveryError.message || 'Failed to create delivery');
    }

    await supabaseAdmin
      .from('orders')
      .update({ status: 'driver_assigned', updated_at: now })
      .eq('id', orderId);

    return new Response(
      JSON.stringify({ assigned: true, driverId: selectedDriver.driver_id, deliveryId: delivery.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ assigned: false, error: error.message || 'Driver assignment failed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
