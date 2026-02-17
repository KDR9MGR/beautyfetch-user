import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';

type StoreInfo = {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
} | null;

type CategoryInfo = {
  name: string;
  slug: string;
} | null;

type ProductImage = {
  image_url: string;
  alt_text: string | null;
  is_primary: boolean | null;
};

export type HomeProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_price?: number | null;
  stores: StoreInfo;
  categories: CategoryInfo;
  product_images: ProductImage[];
};

export function HomeProductCard({ product }: { product: HomeProduct }) {
  const images = Array.isArray(product.product_images) ? product.product_images : [];
  const primaryImage = images.find((img) => img.is_primary) || images[0];
  const imageUrl =
    primaryImage?.image_url ||
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80';

  const reviews = 557;

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group block rounded-xl bg-white shadow-sm ring-1 ring-black/5 transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-beauty-purple"
    >
      <div className="aspect-square overflow-hidden rounded-t-xl bg-gray-100">
        <img
          src={imageUrl}
          alt={primaryImage?.alt_text || product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="p-3">
        <div className="text-sm font-semibold text-gray-900 line-clamp-1">{product.name}</div>
        <div className="mt-0.5 text-xs text-gray-500 line-clamp-1">{product.stores?.name || 'Store'}</div>

        <div className="mt-2 flex items-center justify-between">
          <div className="text-sm font-semibold text-red-500">${product.price.toFixed(2)}</div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span className="inline-flex items-center gap-0.5 text-amber-500">
              {Array.from({ length: 4 }).map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-current" />
              ))}
              <Star className="h-3 w-3 text-amber-300 fill-current" />
            </span>
            <span className="text-gray-400">{reviews}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
