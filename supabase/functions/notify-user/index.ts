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
    const { userId, title, message, type = 'in_app' } = await req.json();
    if (!userId || !title || !message) {
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

    const { data: preferences } = await supabaseAdmin
      .from('notification_preferences')
      .select('email_enabled,push_enabled,in_app_enabled,order_updates_enabled')
      .eq('user_id', userId)
      .maybeSingle();

    if (preferences && preferences.order_updates_enabled === false) {
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const channels = preferences
      ? {
          in_app: preferences.in_app_enabled,
          email: preferences.email_enabled,
          push: preferences.push_enabled,
        }
      : { in_app: true, email: true, push: false };

    const records = Object.entries(channels)
      .filter(([, enabled]) => enabled)
      .map(([channel]) => ({
        user_id: userId,
        title,
        message,
        type: channel,
        read: false,
      }));

    if (records.length > 0) {
      const { error } = await supabaseAdmin.from('notifications').insert(records);
      if (error) {
        throw new Error(error.message || 'Failed to create notifications');
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message || 'Failed to notify user' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
