
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories } from "@/hooks/useCategories";
import type { Tables } from "@/integrations/supabase/types";

type Category = Tables<'categories'>;

export function CategorySection() {
  const { data: categoriesData, isLoading, error } = useCategories();

  if (error) {
    console.error("Error loading categories:", error);
    return null;
  }

  // Type cast and filter only parent categories (root categories) for the main display
  const categories = categoriesData as Category[] | undefined;
  const parentCategories = categories?.filter(category => !category.parent_id) || [];

  return (
    <section className="py-14">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-beauty-purple">Categories</p>
            <h2 className="text-3xl md:text-4xl font-bold">Shop by Category</h2>
            <p className="text-gray-600 mt-2 max-w-2xl">
              Explore curated categories to find your next beauty essential in minutes.
            </p>
          </div>
          <Link
            to="/explore"
            className="text-sm font-medium text-beauty-purple hover:text-beauty-purple/80"
          >
            View all categories →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="aspect-[4/3] relative overflow-hidden rounded-2xl bg-gray-100">
                <Skeleton className="h-full w-full" />
              </div>
            ))
          ) : (
            parentCategories.slice(0, 6).map((category) => (
              <Link 
                to={`/explore?category=${category.slug}`} 
                key={category.id} 
                className="group rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="aspect-[4/3] relative overflow-hidden rounded-xl bg-gray-100">
                  {category.image_url ? (
                    <img 
                      src={category.image_url} 
                      alt={category.name} 
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-beauty-purple/20 to-beauty-pink/20 flex items-center justify-center">
                      <span className="text-4xl opacity-30">📦</span>
                    </div>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">{category.name}</h3>
                  <span className="text-xs text-gray-500 group-hover:text-beauty-purple">Shop</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
