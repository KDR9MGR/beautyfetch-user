-- CRITICAL SECURITY FIX: Enable RLS on all unprotected tables and create proper policies

-- Enable RLS on all tables that currently don't have it
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_survey_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_store_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_cost_breakdown ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_fraud_assessment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_analytics_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;

-- CRITICAL: Fix role escalation vulnerability - prevent users from updating their own role
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile except role" ON public.profiles
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  role = (SELECT role FROM public.profiles WHERE id = auth.uid())
);

-- Admin-only policies for sensitive tables
CREATE POLICY "Admins only - admin_settings" ON public.admin_settings
FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins only - approval_requests" ON public.approval_requests
FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins only - approval_survey_templates" ON public.approval_survey_templates
FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins only - commission_tracking" ON public.commission_tracking
FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins only - delivery_announcements" ON public.delivery_announcements
FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins only - driver_applications" ON public.driver_applications
FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins only - merchant_applications" ON public.merchant_applications
FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins only - merchant_store_updates" ON public.merchant_store_updates
FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins only - order_cost_breakdown" ON public.order_cost_breakdown
FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins only - order_fraud_assessment" ON public.order_fraud_assessment
FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins only - order_status_history" ON public.order_status_history
FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins only - store_analytics" ON public.store_analytics
FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins only - store_analytics_summary" ON public.store_analytics_summary
FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins only - store_commissions" ON public.store_commissions
FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins only - store_hours" ON public.store_hours
FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins only - store_managers" ON public.store_managers
FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins only - store_products" ON public.store_products
FOR ALL USING (is_admin(auth.uid()));

-- User-specific policies for user data
CREATE POLICY "Users can manage own payment methods" ON public.payment_methods
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own customer messages" ON public.customer_messages
FOR SELECT 
USING (auth.uid() = customer_id);

CREATE POLICY "Admins can manage customer messages" ON public.customer_messages
FOR ALL 
USING (is_admin(auth.uid()));

CREATE POLICY "Users and admins can manage merchant messages" ON public.merchant_messages
FOR ALL 
USING (auth.uid() = recipient_id OR auth.uid() = sender_id OR is_admin(auth.uid()));

CREATE POLICY "Users and admins can manage message replies" ON public.message_replies
FOR ALL 
USING (auth.uid() = sender_id OR is_admin(auth.uid()));

-- Product categories - store owners and admins
CREATE POLICY "Store owners and admins can manage product categories" ON public.product_categories
FOR ALL 
USING (
  is_admin(auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM products p 
    JOIN stores s ON s.id = p.store_id 
    WHERE p.id = product_categories.product_id 
    AND s.owner_id = auth.uid()
  )
);

CREATE POLICY "Anyone can view product categories" ON public.product_categories
FOR SELECT 
USING (true);