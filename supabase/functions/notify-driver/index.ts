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

    const { data: delivery } = await supabaseAdmin
      .from('deliveries')
      .select('driver_id')
      .eq('order_id', orderId)
      .maybeSingle();

    if (!delivery?.driver_id) {
      throw new Error('No driver assigned for order');
    }

    const { error } = await supabaseAdmin.from('notifications').insert({
      user_id: delivery.driver_id,
      title,
      message,
      type: 'in_app',
      read: false,
    });

    if (error) {
      throw new Error(error.message || 'Failed to notify driver');
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message || 'Failed to notify driver' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
