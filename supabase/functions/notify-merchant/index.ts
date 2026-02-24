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
    const { orderId, title, message } = await req.json();
    if (!orderId || !title || !message) {
      throw new Error('Missing notification fields');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!supabaseUrl || !serviceKey) {
      throw new Error('Supabase environment not configured');
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const { data: items, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .select('store_id')
      .eq('order_id', orderId);

    if (itemsError) {
      throw new Error(itemsError.message || 'Failed to load order items');
    }

    const storeIds = [...new Set((items || []).map((item) => item.store_id))];
    if (storeIds.length === 0) {
      throw new Error('No store found for order');
    }

    const { data: stores } = await supabaseAdmin
      .from('stores')
      .select('owner_id')
      .in('id', storeIds);

    const merchantIds = [...new Set((stores || []).map((store) => store.owner_id).filter(Boolean))];

    const records = merchantIds.map((merchantId) => ({
      user_id: merchantId,
      title,
      message,
      type: 'in_app',
      read: false,
    }));

    if (records.length > 0) {
      const { error } = await supabaseAdmin.from('notifications').insert(records);
      if (error) {
        throw new Error(error.message || 'Failed to notify merchants');
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message || 'Failed to notify merchants' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
