-- Create subcategories table
CREATE TABLE IF NOT EXISTS subcategories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create catalog_products table
CREATE TABLE IF NOT EXISTS catalog_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  photo TEXT,
  description TEXT,
  category_id UUID REFERENCES categories(id),
  subcategory_id UUID REFERENCES subcategories(id),
  variants JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_catalog_products_category_id ON catalog_products(category_id);
CREATE INDEX IF NOT EXISTS idx_catalog_products_subcategory_id ON catalog_products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_catalog_products_name ON catalog_products(name);

-- Add some sample subcategories
INSERT INTO subcategories (name, slug, category_id, description) 
SELECT 
  'Hair Extensions', 'hair-extensions', c.id, 'Various types of hair extensions'
FROM categories c 
WHERE c.name = 'Hair' 
ON CONFLICT (slug) DO NOTHING;

INSERT INTO subcategories (name, slug, category_id, description) 
SELECT 
  'Wigs', 'wigs', c.id, 'Different styles of wigs'
FROM categories c 
WHERE c.name = 'Hair' 
ON CONFLICT (slug) DO NOTHING;

INSERT INTO subcategories (name, slug, category_id, description) 
SELECT 
  'Foundation', 'foundation', c.id, 'Various foundation products'
FROM categories c 
WHERE c.name = 'Makeup' 
ON CONFLICT (slug) DO NOTHING;

INSERT INTO subcategories (name, slug, category_id, description) 
SELECT 
  'Lipstick', 'lipstick', c.id, 'Different lipstick products'
FROM categories c 
WHERE c.name = 'Makeup' 
ON CONFLICT (slug) DO NOTHING;

INSERT INTO subcategories (name, slug, category_id, description) 
SELECT 
  'Moisturizers', 'moisturizers', c.id, 'Various moisturizing products'
FROM categories c 
WHERE c.name = 'Skincare' 
ON CONFLICT (slug) DO NOTHING;

INSERT INTO subcategories (name, slug, category_id, description) 
SELECT 
  'Cleansers', 'cleansers', c.id, 'Different cleansing products'
FROM categories c 
WHERE c.name = 'Skincare' 
ON CONFLICT (slug) DO NOTHING;