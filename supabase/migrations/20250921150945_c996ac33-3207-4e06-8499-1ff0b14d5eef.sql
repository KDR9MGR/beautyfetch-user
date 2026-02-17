-- Add subcategory_id column to products table
ALTER TABLE public.products 
ADD COLUMN subcategory_id uuid REFERENCES public.categories(id);