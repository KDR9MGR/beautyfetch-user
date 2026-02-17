-- Fix critical security issue: Enable RLS on system_audit_log table
-- This table contains sensitive administrative data and must be protected

-- Enable Row Level Security on system_audit_log table
ALTER TABLE system_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policy to restrict access to administrators only
CREATE POLICY "Admins only - system_audit_log" ON system_audit_log
    FOR ALL USING (is_admin(auth.uid()));

-- Add comment for documentation
COMMENT ON TABLE system_audit_log IS 'System audit log - Contains sensitive administrative data, restricted to admins only';