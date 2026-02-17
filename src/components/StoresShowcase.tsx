
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFeaturedStores } from "@/hooks/useStores";

export function StoresShowcase() {
  const { data: stores, isLoading, error } = useFeaturedStores();

  if (error) {
    console.error("Error loading stores:", error);
    return (
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-gray-600">Unable to load stores at the moment.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-14 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-beauty-purple">Stores</p>
            <h2 className="text-3xl md:text-4xl font-bold">Featured stores near you</h2>
            <p className="text-gray-600 mt-2 max-w-2xl">
              Shop trusted local stores with fast delivery and curated selections.
            </p>
          </div>
          <Link to="/stores">
            <Button variant="outline">View All Stores</Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="beauty-card h-64 md:h-80 overflow-hidden rounded-2xl">
                <Skeleton className="h-full w-full" />
              </div>
            ))
          ) : stores && stores.length > 0 ? (
            stores.map((store) => (
              <div 
                key={store.id}
                className="relative h-64 md:h-80 overflow-hidden rounded-2xl beauty-card"
              >
                <img
                  src={store.cover_image_url || "https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"}
                  alt={store.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col justify-end p-6">
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-2">{store.name}</h3>
                  <p className="text-white/80 text-sm mb-4 line-clamp-2">
                    {store.description || "Discover amazing beauty products"}
                  </p>
                  <Button asChild size="sm" className="w-fit">
                    <Link to={`/stores/${store.slug}`}>Visit Store</Link>
                  </Button>
                </div>
              </div>
            ))
          ) : (
            // No stores available
            <div className="col-span-3 text-center py-12">
              <p className="text-gray-600">No featured stores available at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
