-- Temporarily allow NULL for category_id
ALTER TABLE products ALTER COLUMN category_id DROP NOT NULL;

-- Clear foreign key references
UPDATE products SET category_id = NULL, subcategory_id = NULL;

-- Clear existing category data
DELETE FROM product_categories;
DELETE FROM store_categories;
DELETE FROM categories;

-- Insert main categories
INSERT INTO categories (id, name, slug, description, is_active, sort_order) VALUES
(gen_random_uuid(), 'HUMAN HAIR', 'human-hair', 'Human hair products and extensions', true, 1),
(gen_random_uuid(), 'SYNTHETIC HAIR', 'synthetic-hair', 'Synthetic hair products and accessories', true, 2),
(gen_random_uuid(), 'HAIR ACCESSORIES', 'hair-accessories', 'Hair styling accessories and tools', true, 3),
(gen_random_uuid(), 'HAIR PRODUCTS', 'hair-products', 'Hair care and styling products', true, 4),
(gen_random_uuid(), 'STYLING TOOLS', 'styling-tools', 'Hair styling tools and equipment', true, 5),
(gen_random_uuid(), 'NAILS', 'nails', 'Nail care and nail art products', true, 6),
(gen_random_uuid(), 'SKIN CARE', 'skin-care', 'Skin care products and treatments', true, 7),
(gen_random_uuid(), 'BODY CARE', 'body-care', 'Body care and personal hygiene products', true, 8),
(gen_random_uuid(), 'MAKEUP', 'makeup', 'Cosmetics and makeup products', true, 9),
(gen_random_uuid(), 'JEWELRY', 'jewelry', 'Fashion jewelry and accessories', true, 10),
(gen_random_uuid(), 'LASHES', 'lashes', 'Eyelash products and supplies', true, 11);

-- Insert subcategories for HUMAN HAIR (prefix with parent slug)
INSERT INTO categories (id, name, slug, parent_id, is_active, sort_order) 
SELECT 
  gen_random_uuid(),
  subcategory,
  'human-hair-' || LOWER(REPLACE(REPLACE(subcategory, '&', 'and'), ' ', '-')),
  (SELECT id FROM categories WHERE name = 'HUMAN HAIR'),
  true,
  ROW_NUMBER() OVER()
FROM (VALUES 
  ('Bundles'), ('Braiding Hair'), ('Tape Ins'), ('Clip Ins'), ('Pack Hair'), 
  ('Frontals'), ('Closures'), ('Wigs'), ('Fusion'), ('Ponytails'), 
  ('Toppers'), ('Other')
) AS t(subcategory);

-- Insert subcategories for SYNTHETIC HAIR
INSERT INTO categories (id, name, slug, parent_id, is_active, sort_order) 
SELECT 
  gen_random_uuid(),
  subcategory,
  'synthetic-hair-' || LOWER(REPLACE(REPLACE(subcategory, '&', 'and'), ' ', '-')),
  (SELECT id FROM categories WHERE name = 'SYNTHETIC HAIR'),
  true,
  ROW_NUMBER() OVER()
FROM (VALUES 
  ('Braiding Hair'), ('Crochet Hair'), ('Locs'), ('Bundles'), ('Wigs'), 
  ('Ponytails'), ('Toppers'), ('Other')
) AS t(subcategory);

-- Insert subcategories for HAIR ACCESSORIES
INSERT INTO categories (id, name, slug, parent_id, is_active, sort_order) 
SELECT 
  gen_random_uuid(),
  subcategory,
  'hair-accessories-' || LOWER(REPLACE(REPLACE(REPLACE(subcategory, '&', 'and'), '''', ''), ' ', '-')),
  (SELECT id FROM categories WHERE name = 'HAIR ACCESSORIES'),
  true,
  ROW_NUMBER() OVER()
FROM (VALUES 
  ('Scarves & Wraps'), ('Pins & Clips'), ('Braid Charms'), ('Barrett''s & Beads'), 
  ('Bands & Ties'), ('Caps'), ('Bows'), ('Other')
) AS t(subcategory);

-- Insert subcategories for HAIR PRODUCTS
INSERT INTO categories (id, name, slug, parent_id, is_active, sort_order) 
SELECT 
  gen_random_uuid(),
  subcategory,
  'hair-products-' || LOWER(REPLACE(REPLACE(REPLACE(subcategory, '&', 'and'), '''', ''), ' ', '-')),
  (SELECT id FROM categories WHERE name = 'HAIR PRODUCTS'),
  true,
  ROW_NUMBER() OVER()
FROM (VALUES 
  ('Shampoo'), ('Conditioner'), ('Mousse'), ('Detangler'), ('Treatments'), 
  ('Hair Masks'), ('Hair Oils'), ('Edge Control'), ('Hair Glue'), ('Hair Spray'), 
  ('Bleach & Developer'), ('Gels & Jams'), ('Hair Removal'), ('Hair Color'), 
  ('Relaxers & Texturizers'), ('Balms & Butters'), ('Other')
) AS t(subcategory);

-- Insert subcategories for STYLING TOOLS
INSERT INTO categories (id, name, slug, parent_id, is_active, sort_order) 
SELECT 
  gen_random_uuid(),
  subcategory,
  'styling-tools-' || LOWER(REPLACE(REPLACE(REPLACE(subcategory, '&', 'and'), '''', ''), ' ', '-')),
  (SELECT id FROM categories WHERE name = 'STYLING TOOLS'),
  true,
  ROW_NUMBER() OVER()
FROM (VALUES 
  ('Brushes'), ('Combs'), ('Sponges'), ('Curling Irons'), ('Flat Irons'), 
  ('Hot Combs'), ('Crimping Irons'), ('Hair Dryers'), ('Scissors & Shears'), 
  ('Clippers & Razors'), ('Rollers & Rods'), ('Gloves & Bowls'), 
  ('Tweezers & Needles'), ('Other')
) AS t(subcategory);

-- Insert subcategories for NAILS
INSERT INTO categories (id, name, slug, parent_id, is_active, sort_order) 
SELECT 
  gen_random_uuid(),
  subcategory,
  'nails-' || LOWER(REPLACE(REPLACE(REPLACE(subcategory, '&', 'and'), '''', ''), ' ', '-')),
  (SELECT id FROM categories WHERE name = 'NAILS'),
  true,
  ROW_NUMBER() OVER()
FROM (VALUES 
  ('Press On''s'), ('Tips'), ('Powders'), ('Nail Care'), ('Nail Polish'), 
  ('Stickers & Charms'), ('Nail Tools & Supplies'), ('Other')
) AS t(subcategory);

-- Insert subcategories for SKIN CARE
INSERT INTO categories (id, name, slug, parent_id, is_active, sort_order) 
SELECT 
  gen_random_uuid(),
  subcategory,
  'skin-care-' || LOWER(REPLACE(REPLACE(REPLACE(subcategory, '&', 'and'), '''', ''), ' ', '-')),
  (SELECT id FROM categories WHERE name = 'SKIN CARE'),
  true,
  ROW_NUMBER() OVER()
FROM (VALUES 
  ('Cleanser'), ('Toner'), ('Serums'), ('Exfoliation'), ('Masks'), 
  ('Moisturizers & Creams'), ('Skin Care Tools'), ('Other')
) AS t(subcategory);

-- Insert subcategories for BODY CARE
INSERT INTO categories (id, name, slug, parent_id, is_active, sort_order) 
SELECT 
  gen_random_uuid(),
  subcategory,
  'body-care-' || LOWER(REPLACE(REPLACE(REPLACE(subcategory, '&', 'and'), '''', ''), ' ', '-')),
  (SELECT id FROM categories WHERE name = 'BODY CARE'),
  true,
  ROW_NUMBER() OVER()
FROM (VALUES 
  ('Lotions & Creams'), ('Butters & Oils'), ('Body Wash & Soap'), 
  ('Body Scrubs & Exfoliants'), ('Bubble Bath & Soaks'), ('Bath Bombs & Steamers'), 
  ('Sponges & brushes'), ('Body Hair Removal'), ('Deodorant'), ('Body Sprays'), 
  ('Perfume'), ('Cologne'), ('Other')
) AS t(subcategory);

-- Insert subcategories for MAKEUP
INSERT INTO categories (id, name, slug, parent_id, is_active, sort_order) 
SELECT 
  gen_random_uuid(),
  subcategory,
  'makeup-' || LOWER(REPLACE(REPLACE(REPLACE(subcategory, '&', 'and'), '''', ''), ' ', '-')),
  (SELECT id FROM categories WHERE name = 'MAKEUP'),
  true,
  ROW_NUMBER() OVER()
FROM (VALUES 
  ('Foundation'), ('Concealer'), ('Primers'), ('Blush'), ('Bronzers'), 
  ('Highlighter'), ('Powders'), ('Sprays'), ('Makeup Remover'), ('Eyeshadow'), 
  ('Mascara'), ('Pencils & Liners'), ('Eyebrows'), ('Lipstick & Gloss'), ('Other')
) AS t(subcategory);

-- Insert subcategories for JEWELRY
INSERT INTO categories (id, name, slug, parent_id, is_active, sort_order) 
SELECT 
  gen_random_uuid(),
  subcategory,
  'jewelry-' || LOWER(REPLACE(REPLACE(REPLACE(subcategory, '&', 'and'), '''', ''), ' ', '-')),
  (SELECT id FROM categories WHERE name = 'JEWELRY'),
  true,
  ROW_NUMBER() OVER()
FROM (VALUES 
  ('Earrings'), ('Bracelets'), ('Necklaces'), ('Rings & Piercings'), ('Watches')
) AS t(subcategory);

-- Insert subcategories for LASHES
INSERT INTO categories (id, name, slug, parent_id, is_active, sort_order) 
SELECT 
  gen_random_uuid(),
  subcategory,
  'lashes-' || LOWER(REPLACE(REPLACE(REPLACE(subcategory, '&', 'and'), '''', ''), ' ', '-')),
  (SELECT id FROM categories WHERE name = 'LASHES'),
  true,
  ROW_NUMBER() OVER()
FROM (VALUES 
  ('Strip Lashes'), ('Cluster Lashes'), ('Lash Glue & Bonder'), ('Lash Primer'), 
  ('Lash Tools'), ('Lash Supplies'), ('Color Lashes'), ('D Curl Lash Trays'), 
  ('DD Curl Lash Trays'), ('C Curl Lash Trays'), ('J Curl Lash Trays'), 
  ('Lash Care'), ('Other')
) AS t(subcategory);