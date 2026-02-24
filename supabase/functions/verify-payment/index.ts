import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@13.11.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paymentIntentId, expectedAmount, orderId } = await req.json();

    if (!paymentIntentId || !expectedAmount || !orderId) {
      throw new Error('Missing required parameters');
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

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('Stripe secret key not configured');
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

    // Verify payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent) {
      throw new Error('Payment intent not found');
    }

    // Verify payment status
    if (paymentIntent.status !== 'succeeded') {
      throw new Error(`Payment not successful. Status: ${paymentIntent.status}`);
    }

    // Verify amount matches
    if (paymentIntent.amount !== expectedAmount) {
      throw new Error(`Amount mismatch. Expected: ${expectedAmount}, Actual: ${paymentIntent.amount}`);
    }

    // Verify payment is for the correct order
    if (paymentIntent.metadata.orderId !== orderId) {
      throw new Error(`Order ID mismatch. Expected: ${orderId}, Actual: ${paymentIntent.metadata.orderId}`);
    }

    // Check for duplicate payments
    const { data: existingPayment, error: paymentError } = await supabaseClient
      .from('payments')
      .select('id')
      .eq('payment_intent_id', paymentIntentId)
      .eq('status', 'completed')
      .maybeSingle();

    if (paymentError) {
      throw new Error('Database error checking for duplicate payments');
    }

    if (existingPayment) {
      throw new Error('Payment already processed');
    }

    // Record successful payment
    const { error: recordError } = await supabaseClient
      .from('payments')
      .insert({
        order_id: orderId,
        payment_intent_id: paymentIntentId,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: 'completed',
        completed_at: new Date().toISOString(),
        metadata: paymentIntent.metadata
      });

    if (recordError) {
      throw new Error('Failed to record payment');
    }

    // Update order status to paid
    const { error: orderError } = await supabaseClient
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (orderError) {
      throw new Error('Failed to update order status');
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Payment verification error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Payment verification failed' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
