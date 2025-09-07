import { supabase } from '@/integrations/supabase/client.ts';

// Interface for payment intent creation
interface CreatePaymentIntentParams {
  amount: number;
  currency?: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}

// Secure payment intent creation using Supabase edge function
export const createPaymentIntent = async ({
  amount,
  currency = 'usd',
  customerEmail,
  metadata = {}
}: CreatePaymentIntentParams) => {
  try {
    console.log('Creating payment intent for amount:', amount);
    
    // Call secure Supabase edge function instead of exposing secret key
    const { data, error } = await supabase.functions.invoke('stripe-payment', {
      body: {
        amount,
        currency,
        customerEmail,
        metadata
      }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(error.message || 'Failed to create payment intent');
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    console.log('Payment intent created:', data.paymentIntentId);
    
    return {
      client_secret: data.clientSecret,
      id: data.paymentIntentId
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

// Function to retrieve payment intent (removed - not secure to expose secret key)
// Payment intent status should be handled via webhooks or server-side validation

// Payment method types supported
export const SUPPORTED_PAYMENT_METHODS = [
  'card',
  'link',
  'apple_pay',
  'google_pay',
  'klarna',
  'afterpay_clearpay',
  'us_bank_account'
];

// Helper function to format currency
export const formatCurrency = (amount: number, currency: string = 'usd') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}; 