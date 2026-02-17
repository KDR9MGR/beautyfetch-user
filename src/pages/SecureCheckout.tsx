import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useCart, Address } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, CreditCard, AlertTriangle } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { StripeProvider } from '@/components/payment/StripeProvider';
import { EnhancedPaymentForm } from '@/components/payment/EnhancedPaymentForm';
import { validateCartBeforeCheckout, preventDuplicateOrder } from '@/utils/cartValidation';
import { validateServiceability } from '@/utils/serviceability';
import { verifyPaymentServerSide, createOrderWithPayment } from '@/utils/paymentSecurity';
import { validateStockAvailability } from '@/utils/stockValidation';
import { setupSessionMonitoring } from '@/utils/sessionSecurity';
import { supabase } from '@/integrations/supabase/client.ts';
import { calculateDeliveryFeeForAddress, getDefaultDeliveryFeeSettings } from '@/lib/googleMapsService';

interface ServiceabilityResult {
  isServiceable: boolean;
  reason?: string;
}

interface AppSettings {
  delivery_base_fee?: number;
  delivery_per_mile_rate?: number;
  delivery_min_fee?: number;
  delivery_max_fee?: number;
  free_delivery_threshold?: number;
  delivery_surge_multiplier?: number;
  delivery_surge_active?: boolean;
  delivery_distance_tiers?: Array<{ upToMiles: number; fee: number }>;
  delivery_zones?: Array<{ radiusMiles: number; baseFee: number; perMileRate: number }>;
  min_order_amount?: number;
  max_delivery_distance?: number;
  stripe_enabled?: boolean;
  cash_on_delivery_enabled?: boolean;
}

const SecureCheckout = () => {
  const navigate = useNavigate();
  const { state, selectedAddress, setSelectedAddress, setTip, setShipping, clearCart } = useCart();
  const { user, profile, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState<'address' | 'payment' | 'review'>('address');
  const [addressForm, setAddressForm] = useState<Address>({
    first_name: '',
    last_name: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
    phone: '',
  });
  const [email, setEmail] = useState('');
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState('');
  const [tipAmount, setTipAmount] = useState(0);
  const [selectedTipType, setSelectedTipType] = useState<'percentage' | 'custom'>('percentage');
  const [isLoading, setIsLoading] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [serviceabilityResult, setServiceabilityResult] = useState<ServiceabilityResult | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'cash_on_delivery'>('stripe');
  const [deliveryFeeInfo, setDeliveryFeeInfo] = useState<{ fee: number; distance: number; duration: number } | null>(null);
  const [deliveryFeeLoading, setDeliveryFeeLoading] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);

  // Setup session monitoring on mount
  useEffect(() => {
    setupSessionMonitoring();
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'app_settings')
        .maybeSingle();
      if (data?.setting_value) {
        setAppSettings(data.setting_value);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    const calculateFee = async () => {
      const hasAddress =
        addressForm.address_line_1 &&
        addressForm.city &&
        addressForm.state &&
        addressForm.postal_code;
      const store = state.items[0]?.product?.store;
      if (!hasAddress || !store) return;
      setDeliveryFeeLoading(true);
      try {
        const baseSettings = getDefaultDeliveryFeeSettings();
        const settings = {
          baseFee: appSettings?.delivery_base_fee ?? baseSettings.baseFee,
          perMileRate: appSettings?.delivery_per_mile_rate ?? baseSettings.perMileRate,
          minFee: appSettings?.delivery_min_fee ?? baseSettings.minFee,
          maxFee: appSettings?.delivery_max_fee ?? baseSettings.maxFee,
          freeDeliveryThreshold: appSettings?.free_delivery_threshold ?? baseSettings.freeDeliveryThreshold,
          surgeMultiplier: appSettings?.delivery_surge_multiplier ?? baseSettings.surgeMultiplier,
          surgeActive: appSettings?.delivery_surge_active ?? baseSettings.surgeActive,
          distanceTiers: appSettings?.delivery_distance_tiers ?? baseSettings.distanceTiers,
        };
        const result = await calculateDeliveryFeeForAddress(store.address, addressForm, settings);
        let fee = result.fee;
        const zones = appSettings?.delivery_zones;
        if (zones && zones.length > 0) {
          const zone = zones
            .slice()
            .sort((a, b) => a.radiusMiles - b.radiusMiles)
            .find((z) => result.distance <= z.radiusMiles);
          if (zone) {
            fee = zone.baseFee + result.distance * zone.perMileRate;
          }
        }
        if (settings.surgeActive && settings.surgeMultiplier > 1) {
          fee *= settings.surgeMultiplier;
        }
        fee = Math.max(settings.minFee, fee);
        fee = Math.min(settings.maxFee, fee);
        fee = state.subtotal >= settings.freeDeliveryThreshold ? 0 : fee;
        setShipping(Number(fee.toFixed(2)), true);
        setDeliveryFeeInfo({ fee, distance: result.distance, duration: result.duration });
      } catch (error) {
        console.error('Delivery fee calculation error:', error);
      } finally {
        setDeliveryFeeLoading(false);
      }
    };
    calculateFee();
  }, [addressForm, state.items, state.subtotal, appSettings, setShipping]);

  // Auto-fill user information when logged in
  useEffect(() => {
    if (user && profile) {
      console.log('Auto-filling user information:', { user, profile });
      setEmail(user.email || '');
      
      // Pre-fill address form with profile data if available
      if (profile.first_name || profile.last_name) {
        setAddressForm(prev => ({
          ...prev,
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          phone: profile.phone || ''
        }));
      }
    }
  }, [user, profile]);

  // Validate cart before allowing checkout
  useEffect(() => {
    const validateCart = async () => {
      if (state.items.length === 0) {
        toast.error('Your cart is empty');
        navigate('/cart');
        return;
      }

      const cartItems = state.items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        storeId: item.product.store.id,
        price: item.variant?.price || item.product.price
      }));

      const validation = await validateCartBeforeCheckout(cartItems);
      
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        validation.errors.forEach(error => toast.error(error));
        
        if (validation.errors.includes('All items must be from the same store')) {
          navigate('/cart');
        }
      }
    };

    validateCart();
  }, [state.items, navigate]);

  const tipPercentages = [10, 15, 18, 20];

  const handleTipSelection = (percentage: number) => {
    const tip = (state.subtotal * percentage) / 100;
    setTipAmount(tip);
    setTip(tip);
    setSelectedTipType('percentage');
  };

  const handleCustomTip = (amount: number) => {
    setTipAmount(amount);
    setTip(amount);
    setSelectedTipType('custom');
  };

  const validateAddress = async (): Promise<boolean> => {
    const required = ['first_name', 'last_name', 'address_line_1', 'city', 'state', 'postal_code'];
    for (const field of required) {
      if (!addressForm[field as keyof Address]) {
        toast.error(`Please fill in ${field.replace('_', ' ')}`);
        return false;
      }
    }

    if (appSettings?.min_order_amount && state.subtotal < appSettings.min_order_amount) {
      toast.error(`Minimum order amount is $${appSettings.min_order_amount}`);
      return false;
    }
    
    // Email validation (only for guest users)
    if (!user) {
      if (!email) {
        toast.error('Please enter your email address');
        return false;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error('Please enter a valid email address');
        return false;
      }
      
      // Password validation if creating account
      if (createAccount && (!password || password.length < 8)) {
        toast.error('Password must be at least 8 characters long');
        return false;
      }
    }
    
    // Basic postal code validation for US
    const postalCodeRegex = /^\d{5}(-\d{4})?$/;
    if (!postalCodeRegex.test(addressForm.postal_code)) {
      toast.error('Please enter a valid ZIP code');
      return false;
    }

    // Basic phone validation
    if (addressForm.phone && !/^\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/.test(addressForm.phone)) {
      toast.error('Please enter a valid phone number');
      return false;
    }

    // Serviceability check
    if (state.items.length > 0) {
      const storeId = state.items[0].product.store.id;
      const serviceability = (await validateServiceability(addressForm, storeId)) as ServiceabilityResult;
      setServiceabilityResult(serviceability);
      
      if (!serviceability.isServiceable) {
        toast.error(serviceability.reason || 'Delivery not available to this address');
        return false;
      }
    }

    if (deliveryFeeInfo && appSettings?.max_delivery_distance) {
      if (deliveryFeeInfo.distance > appSettings.max_delivery_distance) {
        toast.error('Delivery address is beyond the maximum delivery distance');
        return false;
      }
    }

    return true;
  };

  const handleAddressSubmit = async () => {
    if (await validateAddress()) {
      setSelectedAddress(addressForm);
      setCurrentStep('payment');
    }
  };

  const handlePaymentSuccess = async (paymentIntent: { id: string }) => {
    console.log('Payment successful:', paymentIntent);
    setPaymentCompleted(true);
    setPaymentIntentId(paymentIntent.id);
    toast.success('Payment processed successfully!');
    setCurrentStep('review');
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment failed:', error);
    toast.error(`Payment failed: ${error}`);
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error('You must be logged in to place an order');
      return;
    }

    if (paymentMethod === 'stripe' && !paymentIntentId) {
      toast.error('Payment not completed');
      return;
    }

    if (!selectedAddress) {
      toast.error('Please provide a delivery address');
      return;
    }

    if (paymentMethod === 'stripe' && appSettings?.stripe_enabled === false) {
      toast.error('Card payments are currently disabled');
      return;
    }

    if (paymentMethod === 'cash_on_delivery' && appSettings?.cash_on_delivery_enabled === false) {
      toast.error('Cash on delivery is currently disabled');
      return;
    }

    setIsLoading(true);
    
    try {
      // Prevent duplicate orders
      const cartItems = state.items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        storeId: item.product.store.id
      }));

      const duplicateCheck = await preventDuplicateOrder(user.id, cartItems);
      if (!duplicateCheck.allowed) {
        toast.error(duplicateCheck.reason || 'Duplicate order detected');
        return;
      }

      if (paymentMethod === 'stripe') {
        const paymentVerification = await verifyPaymentServerSide(
          paymentIntentId || '',
          Math.round(state.total * 100),
          'pending'
        );
        if (!paymentVerification.success) {
          toast.error(paymentVerification.error || 'Payment verification failed');
          return;
        }
      }

      // Create order with payment
      const orderData = {
        userId: user.id,
        items: state.items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.variant?.price || item.product.price,
          storeId: item.product.store.id
        })),
        subtotal: state.subtotal,
        tax: state.tax,
        shipping: state.shipping,
        total: state.total,
        shippingAddress: selectedAddress,
        paymentIntentId: paymentMethod === 'stripe' ? (paymentIntentId || '') : 'cash_on_delivery',
        paymentMethod
      };

      const orderResult = await createOrderWithPayment(orderData);

      if (!orderResult.success) {
        toast.error(orderResult.error || 'Order creation failed');
        return;
      }

      // Clear cart and show success
      clearCart();
      toast.success('Order placed successfully!');
      
      // Navigate to order confirmation
      navigate(`/order-confirmation/${orderResult.orderId}`);
      
    } catch (error) {
      console.error('Order placement error:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while auth is being determined
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-beauty-purple"></div>
      </div>
    );
  }

  // Require authentication for checkout
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please log in to continue with your purchase.</p>
          <Button onClick={() => navigate('/auth?redirect=/checkout')}>
            Log In
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  // Show validation errors if any
  if (validationErrors.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Checkout Validation Failed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {validationErrors.map((error, index) => (
                  <div key={index} className="text-red-600">• {error}</div>
                ))}
              </div>
              <Button 
                onClick={() => navigate('/cart')} 
                className="mt-4"
              >
                Return to Cart
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className={`flex items-center ${currentStep === 'address' ? 'text-beauty-purple' : 'text-gray-500'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'address' ? 'bg-beauty-purple text-white' : 'bg-gray-200'}`}>
                  1
                </div>
                <span className="ml-2 font-medium">Address</span>
              </div>
              <div className="flex-1 h-1 bg-gray-200 mx-4"></div>
              <div className={`flex items-center ${currentStep === 'payment' ? 'text-beauty-purple' : 'text-gray-500'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'payment' ? 'bg-beauty-purple text-white' : 'bg-gray-200'}`}>
                  2
                </div>
                <span className="ml-2 font-medium">Payment</span>
              </div>
              <div className="flex-1 h-1 bg-gray-200 mx-4"></div>
              <div className={`flex items-center ${currentStep === 'review' ? 'text-beauty-purple' : 'text-gray-500'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'review' ? 'bg-beauty-purple text-white' : 'bg-gray-200'}`}>
                  3
                </div>
                <span className="ml-2 font-medium">Review</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {currentStep === 'address' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Delivery Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="first_name">First Name *</Label>
                        <Input
                          id="first_name"
                          value={addressForm.first_name}
                          onChange={(e) => setAddressForm(prev => ({ ...prev, first_name: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="last_name">Last Name *</Label>
                        <Input
                          id="last_name"
                          value={addressForm.last_name}
                          onChange={(e) => setAddressForm(prev => ({ ...prev, last_name: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="address_line_1">Address Line 1 *</Label>
                      <Input
                        id="address_line_1"
                        value={addressForm.address_line_1}
                        onChange={(e) => setAddressForm(prev => ({ ...prev, address_line_1: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="address_line_2">Address Line 2</Label>
                      <Input
                        id="address_line_2"
                        value={addressForm.address_line_2}
                        onChange={(e) => setAddressForm(prev => ({ ...prev, address_line_2: e.target.value }))}
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          value={addressForm.city}
                          onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State *</Label>
                        <Input
                          id="state"
                          value={addressForm.state}
                          onChange={(e) => setAddressForm(prev => ({ ...prev, state: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="postal_code">ZIP Code *</Label>
                        <Input
                          id="postal_code"
                          value={addressForm.postal_code}
                          onChange={(e) => setAddressForm(prev => ({ ...prev, postal_code: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        value={addressForm.phone}
                        onChange={(e) => setAddressForm(prev => ({ ...prev, phone: e.target.value }))}
                        required
                      />
                    </div>

                    {serviceabilityResult && !serviceabilityResult.isServiceable && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-medium">Delivery Not Available</span>
                        </div>
                        <p className="text-red-600 mt-1">{serviceabilityResult.reason}</p>
                      </div>
                    )}

                    <Button 
                      onClick={handleAddressSubmit} 
                      className="w-full"
                      disabled={isLoading}
                    >
                      Continue to Payment
                    </Button>
                  </CardContent>
                </Card>
              )}

              {currentStep === 'payment' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <Label className="mb-2 block">Payment Method</Label>
                        <RadioGroup
                          value={paymentMethod}
                          onValueChange={(value) => {
                            const next = value as 'stripe' | 'cash_on_delivery';
                            setPaymentMethod(next);
                            if (next === 'cash_on_delivery') {
                              setPaymentCompleted(true);
                              setPaymentIntentId('cash_on_delivery');
                            } else {
                              setPaymentCompleted(false);
                              setPaymentIntentId(null);
                            }
                          }}
                          className="space-y-3"
                        >
                          <div className="flex items-center space-x-3 rounded-lg border p-3">
                            <RadioGroupItem
                              value="stripe"
                              id="payment-stripe"
                              disabled={appSettings?.stripe_enabled === false}
                            />
                            <Label htmlFor="payment-stripe" className="flex-1 cursor-pointer">
                              Pay with card
                            </Label>
                            {appSettings?.stripe_enabled === false && (
                              <Badge variant="outline">Disabled</Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-3 rounded-lg border p-3">
                            <RadioGroupItem
                              value="cash_on_delivery"
                              id="payment-cod"
                              disabled={appSettings?.cash_on_delivery_enabled === false}
                            />
                            <Label htmlFor="payment-cod" className="flex-1 cursor-pointer">
                              Cash on delivery
                            </Label>
                            {appSettings?.cash_on_delivery_enabled === false && (
                              <Badge variant="outline">Disabled</Badge>
                            )}
                          </div>
                        </RadioGroup>
                      </div>

                      {paymentMethod === 'stripe' ? (
                        <StripeProvider>
                          <EnhancedPaymentForm
                            amount={Math.round(state.total * 100)}
                            onSuccess={handlePaymentSuccess}
                            onError={handlePaymentError}
                            customerEmail={user.email || email}
                            loading={isLoading}
                            orderDetails={{
                              orderNumber: `BF${Date.now().toString().slice(-6)}`,
                              items: state.items,
                              shippingAddress: selectedAddress
                            }}
                          />
                        </StripeProvider>
                      ) : (
                        <div className="rounded-lg border border-dashed p-4 text-sm text-gray-600">
                          Pay in cash when your order arrives. You can review and place the order now.
                        </div>
                      )}
                      <Button
                        onClick={() => setCurrentStep('review')}
                        disabled={!paymentCompleted || isLoading}
                        className="w-full"
                      >
                        Review Order
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentStep === 'review' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Order Review</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium mb-2">Delivery Address</h3>
                        <p className="text-sm text-gray-600">
                          {selectedAddress?.first_name} {selectedAddress?.last_name}<br />
                          {selectedAddress?.address_line_1}<br />
                          {selectedAddress?.address_line_2 && <>{selectedAddress.address_line_2}<br /></>}
                          {selectedAddress?.city}, {selectedAddress?.state} {selectedAddress?.postal_code}<br />
                          {selectedAddress?.phone}
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-2">Payment Method</h3>
                        <p className="text-sm text-gray-600">
                          {paymentMethod === 'stripe' ? 'Card payment' : 'Cash on delivery'}
                        </p>
                      </div>
                      
                      <Button 
                        onClick={handlePlaceOrder}
                        className="w-full"
                        disabled={isLoading || !paymentCompleted}
                      >
                        {isLoading ? 'Placing Order...' : 'Place Order'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {state.items.map((item) => (
                      <div key={`${item.product.id}_${item.variant?.id || 'default'}`} className="flex justify-between text-sm">
                        <div>
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-medium">
                          ${((item.variant?.price || item.product.price) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>${state.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax</span>
                        <span>${state.tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Shipping</span>
                        <span>${state.shipping.toFixed(2)}</span>
                      </div>
                      {deliveryFeeLoading && (
                        <div className="text-xs text-gray-500">Calculating delivery fee...</div>
                      )}
                      {!deliveryFeeLoading && deliveryFeeInfo && (
                        <div className="text-xs text-gray-500">
                          {deliveryFeeInfo.distance.toFixed(1)} mi • {Math.round(deliveryFeeInfo.duration)} min
                        </div>
                      )}
                      {state.tip > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Tip</span>
                          <span>${state.tip.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>${state.total.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {currentStep === 'payment' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Add Tip</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-4 gap-2">
                        {tipPercentages.map((percentage) => (
                          <Button
                            key={percentage}
                            variant={selectedTipType === 'percentage' && tipAmount === (state.subtotal * percentage) / 100 ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleTipSelection(percentage)}
                          >
                            {percentage}%
                          </Button>
                        ))}
                      </div>
                      
                      <div>
                        <Label htmlFor="customTip">Custom Amount</Label>
                        <Input
                          id="customTip"
                          type="number"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          value={selectedTipType === 'custom' ? tipAmount : ''}
                          onChange={(e) => handleCustomTip(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default SecureCheckout;
