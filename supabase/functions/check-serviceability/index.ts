import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address, storeId } = await req.json();

    if (!address) {
      throw new Error('Address is required');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Get store information
    let storeQuery = supabaseClient
      .from('stores')
      .select('id, name, address, delivery_radius, delivery_fee, business_hours, status')
      .eq('status', 'active');

    if (storeId) {
      storeQuery = storeQuery.eq('id', storeId);
    }

    const { data: stores, error: storeError } = await storeQuery;

    if (storeError) {
      throw new Error('Failed to fetch store information');
    }

    if (!stores || stores.length === 0) {
      return new Response(
        JSON.stringify({ 
          isServiceable: false,
          reason: 'No active stores found'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Simple distance calculation (in production, use proper geocoding)
    const checkServiceability = (store: any) => {
      // Check business hours
      if (store.business_hours) {
        const now = new Date();
        const currentDay = now.getDay(); // 0 = Sunday
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        const todayHours = store.business_hours[currentDay.toString()];
        if (todayHours?.closed) {
          return { isServiceable: false, reason: 'Store is closed today' };
        }
        
        if (todayHours?.open && todayHours?.close) {
          const [openHour, openMinute] = todayHours.open.split(':').map(Number);
          const [closeHour, closeMinute] = todayHours.close.split(':').map(Number);
          const openTime = openHour * 60 + openMinute;
          const closeTime = closeHour * 60 + closeMinute;
          
          if (currentTime < openTime || currentTime > closeTime) {
            return { isServiceable: false, reason: 'Store is currently closed' };
          }
        }
      }

      // Check delivery radius (simplified - in production use proper distance calculation)
      const maxRadius = store.delivery_radius || 10; // Default 10 miles
      
      // For now, assume all addresses within radius are serviceable
      // In production, implement proper geocoding and distance calculation
      return {
        isServiceable: true,
        storeId: store.id,
        deliveryFee: store.delivery_fee || 5.99,
        estimatedTime: 30 // minutes
      };
    };

    // Check each store for serviceability
    for (const store of stores) {
      const result = checkServiceability(store);
      if (result.isServiceable) {
        return new Response(
          JSON.stringify(result),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }
    }

    // No serviceable stores found
    return new Response(
      JSON.stringify({ 
        isServiceable: false,
        reason: 'Delivery not available to this address'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Serviceability check error:', error);
    
    return new Response(
      JSON.stringify({ 
        isServiceable: false,
        reason: error.message || 'Serviceability check failed' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});