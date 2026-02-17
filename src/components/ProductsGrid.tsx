import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFeaturedProducts } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { ShoppingCart, Heart } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Tables } from "@/integrations/supabase/types";

interface FeaturedProduct extends Tables<'products'> {
  stores: {
    id?: string;
    name: string;
    slug: string;
    logo_url: string | null;
  } | null;
  categories: {
    name: string;
    slug: string;
  } | null;
  product_images: Array<{
    image_url: string;
    alt_text: string | null;
    is_primary: boolean | null;
  }>;
}

export function ProductsGrid() {
  const { data: products, isLoading, error } = useFeaturedProducts();
  const { addToCart, getItemByProduct } = useCart();

  if (error) {
    console.error("Error loading products:", error);
    return null;
  }

  const handleAddToCart = (product: FeaturedProduct) => {
    // Create a completely new object matching cart expectations
    const transformedProduct = {
      // Copy all product properties manually to avoid type conflicts
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      short_description: product.short_description,
      price: product.price,
      compare_price: product.compare_price,
      cost_price: product.cost_price,
      cost_per_item: product.cost_per_item,
      sku: product.sku,
      barcode: product.barcode,
      inventory_quantity: product.inventory_quantity,
      track_inventory: product.track_inventory,
      continue_selling_when_out_of_stock: product.continue_selling_when_out_of_stock,
      weight: product.weight,
      dimensions: product.dimensions,
      status: product.status,
      featured: product.featured,
      tags: product.tags,
      meta_title: product.meta_title,
      meta_description: product.meta_description,
      margin_percentage: product.margin_percentage,
      store_id: product.store_id,
      category_id: product.category_id,
      created_at: product.created_at,
      updated_at: product.updated_at,
      // Transform images from product_images to the expected images array
      images: (product.product_images || []).map((img, index) => ({
        id: `${product.id}_${index}`,
        product_id: product.id,
        image_url: img.image_url,
        alt_text: img.alt_text,
        is_primary: img.is_primary,
        sort_order: img.is_primary ? 0 : index + 1,
        created_at: new Date().toISOString()
      })) as Tables<'product_images'>[],
      store: {
        id: product.stores?.id || 'unknown',
        name: product.stores?.name || 'Unknown Store',
        slug: product.stores?.slug || 'unknown',
        logo_url: product.stores?.logo_url || '',
        description: '',
        address: {},
        contact_info: {},
        business_hours: {},
        cover_image_url: '',
        featured: false,
        status: 'active' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        owner_id: '',
        rating: 0,
        total_reviews: 0
      } as Tables<'stores'>
    } as Tables<'products'> & { 
      store: Tables<'stores'>; 
      images: Tables<'product_images'>[] 
    };
    
    addToCart(transformedProduct, 1);
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Featured Products</h2>
          <Link to="/explore">
            <Button variant="outline">View All</Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="beauty-card overflow-hidden">
                <Skeleton className="aspect-square w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </div>
            ))
          ) : products && products.length > 0 ? (
            products.map((product) => {
              const primaryImage = product.product_images?.find(img => img.is_primary) || product.product_images?.[0];
              const cartItem = getItemByProduct(product.id);
              
              return (
                <Link key={product.id} to={`/product/${product.slug}`} className="beauty-card overflow-hidden group block">
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={primaryImage?.image_url || "https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80"}
                      alt={primaryImage?.alt_text || product.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.compare_price && product.compare_price > product.price && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                        {Math.round(((product.compare_price - product.price) / product.compare_price) * 100)}% OFF
                      </div>
                    )}
                    
                    {/* Store badge */}
                    <div className="absolute top-2 right-2">
                      <span className="bg-white/80 text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm">
                        {product.stores?.name}
                      </span>
                    </div>

                    {/* Wishlist button */}
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute top-10 right-2 h-8 w-8 rounded-full bg-white/80 hover:bg-white"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toast.success(`${product.name} added to wishlist!`);
                      }}
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
                    <p className="text-xs text-beauty-purple mb-2">{product.categories?.name}</p>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg font-bold text-beauty-purple">
                        ${product.price.toFixed(2)}
                      </span>
                      {product.compare_price && product.compare_price > product.price && (
                        <span className="text-sm text-gray-500 line-through">
                          ${product.compare_price.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <Button 
                      className="w-full bg-beauty-purple hover:bg-beauty-purple-dark" 
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      disabled={cartItem && cartItem.quantity > 0}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {cartItem && cartItem.quantity > 0 ? `In Cart (${cartItem.quantity})` : 'Add to Cart'}
                    </Button>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-600">No featured products available.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
