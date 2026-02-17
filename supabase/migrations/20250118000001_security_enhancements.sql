-- Create user_sessions table for session management
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  device_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_last_activity ON user_sessions(last_activity);

-- Create user_carts table for cart persistence
CREATE TABLE IF NOT EXISTS user_carts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_user_carts_user_id ON user_carts(user_id);

-- Create payments table for payment tracking
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  payment_intent_id VARCHAR(255) NOT NULL,
  amount INTEGER NOT NULL, -- Amount in cents
  currency VARCHAR(3) NOT NULL DEFAULT 'usd',
  status VARCHAR(50) NOT NULL,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_payment_intent_id ON payments(payment_intent_id);
CREATE INDEX idx_payments_status ON payments(status);

-- Create order_status_history table for audit trail
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  change_reason TEXT,
  automated BOOLEAN DEFAULT FALSE,
  changed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX idx_order_status_history_created_at ON order_status_history(created_at);

-- Create order_cost_breakdown table
CREATE TABLE IF NOT EXISTS order_cost_breakdown (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  store_commission DECIMAL(10,2) NOT NULL DEFAULT 0,
  platform_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_processing_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  delivery_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  gross_profit DECIMAL(10,2) NOT NULL DEFAULT 0,
  net_profit DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(order_id)
);

CREATE INDEX idx_order_cost_breakdown_order_id ON order_cost_breakdown(order_id);

-- Create product_edit_history table for audit trail
CREATE TABLE IF NOT EXISTS product_edit_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  field_name VARCHAR(100) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  merchant_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_edit_history_product_id ON product_edit_history(product_id);
CREATE INDEX idx_product_edit_history_store_id ON product_edit_history(store_id);
CREATE INDEX idx_product_edit_history_created_at ON product_edit_history(created_at);

-- Create order_cancellation_history table
CREATE TABLE IF NOT EXISTS order_cancellation_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  cancelled_by UUID REFERENCES profiles(id),
  cancelled_by_type VARCHAR(20) NOT NULL CHECK (cancelled_by_type IN ('merchant', 'customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_cancellation_history_order_id ON order_cancellation_history(order_id);
CREATE INDEX idx_order_cancellation_history_store_id ON order_cancellation_history(store_id);

-- Create admin_audit_logs table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id UUID NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX idx_admin_audit_logs_target ON admin_audit_logs(target_type, target_id);
CREATE INDEX idx_admin_audit_logs_created_at ON admin_audit_logs(created_at);

-- Create driver_applications table if not exists
CREATE TABLE IF NOT EXISTS driver_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address JSONB NOT NULL DEFAULT '{}'::jsonb,
  vehicle_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  documents JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'needs_info')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_driver_applications_email ON driver_applications(email);
CREATE INDEX idx_driver_applications_status ON driver_applications(status);

-- Add missing columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_payment_intent_id ON orders(payment_intent_id);
CREATE INDEX idx_orders_is_archived ON orders(is_archived);

-- Add fraud risk level to orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS fraud_risk_level VARCHAR(20) DEFAULT 'low' CHECK (fraud_risk_level IN ('low', 'medium', 'high'));

CREATE INDEX idx_orders_fraud_risk_level ON orders(fraud_risk_level);

-- Add delivery SLA fields to stores
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS delivery_radius INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) DEFAULT 5.99,
ADD COLUMN IF NOT EXISTS preparation_time_minutes INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{}'::jsonb;

-- Add stock management fields to store_products
ALTER TABLE store_products 
ADD COLUMN IF NOT EXISTS reserved_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_stock_update TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX idx_store_products_reserved_quantity ON store_products(reserved_quantity);

-- Create RPC functions for stock management
CREATE OR REPLACE FUNCTION reserve_stock(
  p_product_id UUID,
  p_quantity INTEGER,
  p_order_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  -- Check if enough stock is available
  IF (SELECT inventory_quantity - reserved_quantity >= p_quantity 
      FROM store_products 
      WHERE product_id = p_product_id) THEN
    
    -- Reserve the stock
    UPDATE store_products 
    SET reserved_quantity = reserved_quantity + p_quantity,
        last_stock_update = NOW()
    WHERE product_id = p_product_id;
    
    -- Log the reservation
    INSERT INTO stock_reservations (product_id, order_id, quantity, created_at)
    VALUES (p_product_id, p_order_id, p_quantity, NOW());
    
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION release_stock(
  p_product_id UUID,
  p_quantity INTEGER,
  p_order_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  -- Release the reserved stock
  UPDATE store_products 
  SET reserved_quantity = GREATEST(reserved_quantity - p_quantity, 0),
      last_stock_update = NOW()
  WHERE product_id = p_product_id;
  
  -- Remove the reservation
  DELETE FROM stock_reservations 
  WHERE product_id = p_product_id AND order_id = p_order_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION deduct_stock(
  p_product_id UUID,
  p_quantity INTEGER
) RETURNS BOOLEAN AS $$
BEGIN
  -- Deduct from available inventory
  UPDATE store_products 
  SET inventory_quantity = GREATEST(inventory_quantity - p_quantity, 0),
      reserved_quantity = GREATEST(reserved_quantity - p_quantity, 0),
      last_stock_update = NOW()
  WHERE product_id = p_product_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create stock_reservations table
CREATE TABLE IF NOT EXISTS stock_reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES store_products(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 minutes',
  UNIQUE(product_id, order_id)
);

CREATE INDEX idx_stock_reservations_product_id ON stock_reservations(product_id);
CREATE INDEX idx_stock_reservations_order_id ON stock_reservations(order_id);
CREATE INDEX idx_stock_reservations_expires_at ON stock_reservations(expires_at);

-- Create function to clean expired reservations
CREATE OR REPLACE FUNCTION clean_expired_reservations() RETURNS INTEGER AS $$
DECLARE
  cleaned_count INTEGER;
BEGIN
  -- Clean expired reservations and release stock
  WITH expired_reservations AS (
    DELETE FROM stock_reservations 
    WHERE expires_at < NOW()
    RETURNING product_id, quantity
  )
  UPDATE store_products sp
  SET reserved_quantity = GREATEST(sp.reserved_quantity - er.quantity, 0),
      last_stock_update = NOW()
  FROM expired_reservations er
  WHERE sp.id = er.product_id;
  
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;