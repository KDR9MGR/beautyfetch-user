import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useBrowseProducts = (limit: number = 60) => {
  return useQuery({
    queryKey: ['browse-products', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(
          `
          *,
          stores (
            id,
            name,
            slug,
            logo_url
          ),
          categories!products_category_id_fkey (
            name,
            slug
          ),
          product_images (
            image_url,
            alt_text,
            is_primary
          )
        `
        )
        .eq('status', 'active')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
  });
};

