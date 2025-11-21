-- Enhanced Site Customization System
-- This migration creates a comprehensive customization system for the BeautyFetch platform

-- Drop existing table if it exists
DROP TABLE IF EXISTS site_customization CASCADE;

-- Create enhanced site_customization table
CREATE TABLE site_customization (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  setting_type text NOT NULL DEFAULT 'global', -- 'global', 'page', 'component'
  scope text, -- page name or component name
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Create indexes for better query performance
CREATE INDEX idx_site_customization_key ON site_customization(setting_key);
CREATE INDEX idx_site_customization_type ON site_customization(setting_type);
CREATE INDEX idx_site_customization_scope ON site_customization(scope);
CREATE INDEX idx_site_customization_value ON site_customization USING gin(setting_value);

-- Enable RLS
ALTER TABLE site_customization ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read customization settings (needed for public site)
CREATE POLICY "Anyone can view customization settings"
  ON site_customization
  FOR SELECT
  USING (true);

-- Only admins can modify customization settings
CREATE POLICY "Admins can manage customization settings"
  ON site_customization
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_site_customization_updated_at
  BEFORE UPDATE ON site_customization
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default global theme settings
INSERT INTO site_customization (setting_key, setting_type, setting_value) VALUES
  ('global_theme', 'global', jsonb_build_object(
    'colors', jsonb_build_object(
      'primary', '#ec4899',
      'secondary', '#8b5cf6',
      'accent', '#10b981',
      'background', '#ffffff',
      'foreground', '#111827',
      'muted', '#f3f4f6',
      'mutedForeground', '#6b7280',
      'card', '#ffffff',
      'cardForeground', '#111827',
      'popover', '#ffffff',
      'popoverForeground', '#111827',
      'border', '#e5e7eb',
      'input', '#e5e7eb',
      'ring', '#ec4899',
      'destructive', '#ef4444',
      'destructiveForeground', '#ffffff'
    ),
    'spacing', jsonb_build_object(
      'containerMaxWidth', '1280px',
      'sectionPaddingY', '4rem',
      'sectionPaddingX', '1rem',
      'cardPadding', '1.5rem',
      'buttonPaddingX', '1.5rem',
      'buttonPaddingY', '0.5rem'
    ),
    'borderRadius', jsonb_build_object(
      'sm', '0.25rem',
      'md', '0.5rem',
      'lg', '0.75rem',
      'xl', '1rem',
      'full', '9999px'
    ),
    'shadows', jsonb_build_object(
      'sm', '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      'md', '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      'lg', '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      'xl', '0 20px 25px -5px rgb(0 0 0 / 0.1)'
    )
  )),
  ('global_typography', 'global', jsonb_build_object(
    'fontFamily', jsonb_build_object(
      'heading', 'Inter',
      'body', 'Inter',
      'mono', 'monospace'
    ),
    'fontSize', jsonb_build_object(
      'xs', '0.75rem',
      'sm', '0.875rem',
      'base', '1rem',
      'lg', '1.125rem',
      'xl', '1.25rem',
      'xxl', '1.5rem',
      'xxxl', '1.875rem',
      'display', '2.25rem'
    ),
    'fontWeight', jsonb_build_object(
      'normal', '400',
      'medium', '500',
      'semibold', '600',
      'bold', '700'
    ),
    'lineHeight', jsonb_build_object(
      'tight', '1.25',
      'normal', '1.5',
      'relaxed', '1.75',
      'loose', '2'
    ),
    'letterSpacing', jsonb_build_object(
      'tight', '-0.025em',
      'normal', '0',
      'wide', '0.025em'
    )
  )),
  ('homepage_layout', 'page', jsonb_build_object(
    'sections', jsonb_build_object(
      'heroBanner', jsonb_build_object('visible', true, 'order', 1),
      'categorySection', jsonb_build_object('visible', true, 'order', 2),
      'featuredProducts', jsonb_build_object('visible', true, 'order', 3),
      'collections', jsonb_build_object('visible', true, 'order', 4),
      'nearbyStores', jsonb_build_object('visible', true, 'order', 5),
      'featuredStores', jsonb_build_object('visible', true, 'order', 6),
      'testimonials', jsonb_build_object('visible', false, 'order', 7),
      'blog', jsonb_build_object('visible', true, 'order', 8)
    )
  ))
ON CONFLICT (setting_key) DO NOTHING;

-- Insert component-specific default settings
INSERT INTO site_customization (setting_key, setting_type, scope, setting_value) VALUES
  ('component_header', 'component', 'Header', jsonb_build_object(
    'backgroundColor', '#ffffff',
    'textColor', '#111827',
    'height', '4rem',
    'sticky', true,
    'showLogo', true,
    'showSearch', true,
    'showCart', true,
    'logoSize', 'medium'
  )),
  ('component_footer', 'component', 'Footer', jsonb_build_object(
    'backgroundColor', '#1f2937',
    'textColor', '#f3f4f6',
    'showSocialLinks', true,
    'showNewsletter', true,
    'columns', 4
  )),
  ('component_button', 'component', 'Button', jsonb_build_object(
    'primaryColor', '#ec4899',
    'hoverEffect', 'scale',
    'borderRadius', '0.5rem',
    'fontWeight', '600'
  )),
  ('component_card', 'component', 'Card', jsonb_build_object(
    'backgroundColor', '#ffffff',
    'borderColor', '#e5e7eb',
    'borderRadius', '0.75rem',
    'shadow', 'md',
    'hoverEffect', 'lift'
  ))
ON CONFLICT (setting_key) DO NOTHING;

-- Create a view for easy querying of settings by type
CREATE OR REPLACE VIEW customization_settings_view AS
SELECT
  setting_type,
  scope,
  jsonb_object_agg(setting_key, setting_value) as settings
FROM site_customization
GROUP BY setting_type, scope;

-- Grant permissions
GRANT SELECT ON customization_settings_view TO anon, authenticated;

COMMENT ON TABLE site_customization IS 'Stores all customization settings for the BeautyFetch platform including themes, layouts, and component styles';
COMMENT ON COLUMN site_customization.setting_type IS 'Type of setting: global (site-wide), page (page-specific), or component (component-specific)';
COMMENT ON COLUMN site_customization.scope IS 'Scope identifier - page name for page settings, component name for component settings, null for global';
