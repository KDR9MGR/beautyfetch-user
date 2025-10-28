-- Create site_customization table for storing website appearance settings
CREATE TABLE IF NOT EXISTS public.site_customization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.site_customization ENABLE ROW LEVEL SECURITY;

-- Allow admins to read and update customization settings
CREATE POLICY "Admins can manage site customization"
  ON public.site_customization
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow everyone to read customization settings (for displaying on the site)
CREATE POLICY "Everyone can view site customization"
  ON public.site_customization
  FOR SELECT
  USING (true);

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_site_customization_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER site_customization_updated_at
  BEFORE UPDATE ON public.site_customization
  FOR EACH ROW
  EXECUTE FUNCTION update_site_customization_timestamp();

-- Insert default customization settings
INSERT INTO public.site_customization (setting_key, setting_value) VALUES
  ('colors', '{
    "background": "#ffffff",
    "primary": "#ec4899",
    "secondary": "#f3f4f6",
    "text": "#111827",
    "header": "#ffffff",
    "footer": "#1f2937",
    "accent": "#ec4899"
  }'::jsonb),
  ('fonts', '{
    "headingFont": "Inter",
    "bodyFont": "Inter",
    "fontSize": "16",
    "lineSpacing": "1.5"
  }'::jsonb),
  ('homepage_sections', '{
    "heroBanner": true,
    "featuredProducts": true,
    "collections": true,
    "stores": true,
    "testimonials": false,
    "blog": true
  }'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;