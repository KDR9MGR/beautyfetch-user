import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategories } from '@/hooks/useCategories';
import { useBrowseProducts } from '@/hooks/useBrowseProducts';
import { useStores } from '@/hooks/useStores';
import { useLocation } from '@/contexts/LocationContext';
import { HomeProductCard, type HomeProduct } from '@/components/home/HomeProductCard';
import { useCustomization, type HomepageLayout } from '@/contexts/CustomizationContext';
import { Filter, Search } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Category = Tables<'categories'>;
type SectionKey = keyof HomepageLayout['sections'];

export default function Home() {
  const { userLocation, nearbyStores } = useLocation();
  const { homepageLayout } = useCustomization();
  const { data: categoriesData } = useCategories();
  const { data: productsData, isLoading: productsLoading } = useBrowseProducts(80);
  const { data: storesData } = useStores();

  const [searchTerm, setSearchTerm] = useState('');
  const [maxDistance, setMaxDistance] = useState('10');
  const [activeTab, setActiveTab] = useState<string>('hair');
  const [selectedStoreIds, setSelectedStoreIds] = useState<Set<string>>(new Set());
  const [selectedCategorySlugs, setSelectedCategorySlugs] = useState<Set<string>>(new Set());

  const categories = categoriesData as Category[] | undefined;
  const parentCategories = categories?.filter((c) => !c.parent_id) || [];

  const distanceMiles = Number(maxDistance);

  const storesInRange = useMemo(() => {
    if (!userLocation) return [];
    return (nearbyStores || []).filter((s) => (s.distance ?? 0) <= distanceMiles);
  }, [distanceMiles, nearbyStores, userLocation]);

  const allStores = useMemo(() => {
    return (storesData ||
      []) as unknown as { id: string; name: string; slug: string; logo_url?: string | null }[];
  }, [storesData]);

  const storeIdAllowList = useMemo(() => {
    if (!userLocation) return null;
    return new Set(storesInRange.map((s) => s.id));
  }, [storesInRange, userLocation]);

  const products = useMemo(() => {
    return (productsData || []) as unknown as HomeProduct[];
  }, [productsData]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const selectedStores = selectedStoreIds;
    const hasStoreSelection = selectedStores.size > 0;
    const hasCategorySelection = selectedCategorySlugs.size > 0;

    return products.filter((p) => {
      if (storeIdAllowList && p.stores?.id && !storeIdAllowList.has(p.stores.id)) return false;

      if (hasStoreSelection) {
        if (!p.stores?.id || !selectedStores.has(p.stores.id)) return false;
      }

      if (hasCategorySelection) {
        const slug = p.categories?.slug;
        if (!slug || !selectedCategorySlugs.has(slug)) return false;
      }

      if (activeTab === 'lipstick-sale') {
        const nameMatch = p.name.toLowerCase().includes('lip');
        const categoryMatch = (p.categories?.slug || '').toLowerCase().includes('lip');
        if (!nameMatch && !categoryMatch) return false;
      } else if (activeTab !== 'all') {
        const categoryMatch = (p.categories?.slug || '').toLowerCase().includes(activeTab);
        if (!categoryMatch) return false;
      }

      if (!normalizedSearch) return true;
      return (
        p.name.toLowerCase().includes(normalizedSearch) ||
        (p.stores?.name || '').toLowerCase().includes(normalizedSearch) ||
        (p.categories?.name || '').toLowerCase().includes(normalizedSearch)
      );
    });
  }, [activeTab, products, searchTerm, selectedCategorySlugs, selectedStoreIds, storeIdAllowList]);

  const preBannerCount = 8;
  const preBannerProducts = useMemo(() => filteredProducts.slice(0, preBannerCount), [filteredProducts]);
  const postBannerProducts = useMemo(() => filteredProducts.slice(preBannerCount), [filteredProducts]);

  const sectionDefaults = useMemo(
    () => ({
      heroBanner: { visible: true, order: 1 },
      categorySection: { visible: true, order: 2 },
      featuredProducts: { visible: true, order: 3 },
      collections: { visible: true, order: 4 },
      nearbyStores: { visible: true, order: 5 },
      featuredStores: { visible: true, order: 6 },
      testimonials: { visible: false, order: 7 },
      blog: { visible: true, order: 8 },
    }),
    []
  );

  const sectionConfig = useMemo(() => {
    const layoutSections = homepageLayout?.sections;
    return (Object.keys(sectionDefaults) as SectionKey[]).reduce((acc, key) => {
      const override = layoutSections?.[key];
      acc[key] = {
        visible: override?.visible ?? sectionDefaults[key].visible,
        order: override?.order ?? sectionDefaults[key].order,
      };
      return acc;
    }, {} as Record<SectionKey, { visible: boolean; order: number }>);
  }, [homepageLayout, sectionDefaults]);

  const orderedSections = useMemo(
    () =>
      (Object.keys(sectionConfig) as SectionKey[])
        .filter((key) => sectionConfig[key]?.visible)
        .sort((a, b) => sectionConfig[a].order - sectionConfig[b].order),
    [sectionConfig]
  );

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedStoreIds(new Set());
    setSelectedCategorySlugs(new Set());
    setMaxDistance('10');
    setActiveTab('hair');
  };

  const toggleStore = (storeId: string) => {
    setSelectedStoreIds((prev) => {
      const next = new Set(prev);
      if (next.has(storeId)) next.delete(storeId);
      else next.add(storeId);
      return next;
    });
  };

  const toggleCategory = (slug: string) => {
    setSelectedCategorySlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const storeFilterOptions = userLocation ? storesInRange : allStores;

  const FiltersPanel = (
    <div className="space-y-5">
      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <div className="text-sm font-semibold text-gray-900">Filters</div>

        <div className="mt-4 space-y-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Store</div>
            <div className="mt-2 space-y-2">
              {storeFilterOptions.slice(0, 8).map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm text-gray-700">
                  <Checkbox
                    checked={selectedStoreIds.has(s.id)}
                    onCheckedChange={() => toggleStore(s.id)}
                  />
                  <span className="line-clamp-1">{s.name}</span>
                </label>
              ))}
              {userLocation && storesInRange.length === 0 ? (
                <div className="text-sm text-gray-500">No stores within range.</div>
              ) : !userLocation && storeFilterOptions.length === 0 ? (
                <div className="text-sm text-gray-500">No stores available.</div>
              ) : null}
            </div>
          </div>

          {userLocation ? (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Distance</div>
              <div className="mt-2">
                <Select value={maxDistance} onValueChange={setMaxDistance}>
                  <SelectTrigger className="h-9 rounded-lg">
                    <SelectValue placeholder="Within 10 miles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">Within 5 miles</SelectItem>
                    <SelectItem value="10">Within 10 miles</SelectItem>
                    <SelectItem value="25">Within 25 miles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
              Set a location to filter by distance.
            </div>
          )}

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Product</div>
            <div className="mt-2 space-y-2">
              {(parentCategories.slice(0, 6) || []).map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm text-gray-700">
                  <Checkbox
                    checked={selectedCategorySlugs.has(c.slug)}
                    onCheckedChange={() => toggleCategory(c.slug)}
                  />
                  <span className="line-clamp-1">{c.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Color</div>
            <div className="mt-2 flex items-center gap-2">
              {['#111827', '#f43f5e', '#fb7185', '#f97316', '#14b8a6'].map((c) => (
                <button
                  key={c}
                  type="button"
                  className="h-5 w-5 rounded-md ring-1 ring-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Size</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {['S', 'M', 'L', 'XL'].map((s) => (
                <button
                  key={s}
                  type="button"
                  className="h-8 rounded-lg bg-slate-100 px-3 text-xs font-semibold text-slate-800 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={resetFilters}>
            Reset
          </Button>
        </div>
      </div>
    </div>
  );

  const showCollectionsBanner = sectionConfig.collections?.visible ?? true;
  const showCategorySection = sectionConfig.categorySection?.visible ?? true;

  const renderProductsGrid = (items: HomeProduct[]) => (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {productsLoading ? (
        Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/5">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <Skeleton className="mt-3 h-4 w-3/4" />
            <Skeleton className="mt-2 h-3 w-1/2" />
            <Skeleton className="mt-3 h-4 w-1/3" />
          </div>
        ))
      ) : items.length > 0 ? (
        items.map((p) => <HomeProductCard key={p.id} product={p} />)
      ) : (
        <div className="col-span-full rounded-2xl bg-white p-10 text-center text-gray-600 shadow-sm ring-1 ring-black/5">
          No products found for your filters.
        </div>
      )}
    </div>
  );

  const sectionRenderers: Record<SectionKey, () => JSX.Element | null> = {
    heroBanner: () => (
      <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        <div className="relative h-24 sm:h-28 md:h-32">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-accent/60" />
          <img
            src="/placeholder.svg"
            alt=""
            className="absolute left-0 top-0 h-full w-[34%] object-cover opacity-80"
          />
          <img
            src="/placeholder.svg"
            alt=""
            className="absolute right-0 top-0 h-full w-[34%] object-cover opacity-80"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex w-[92%] max-w-4xl items-center justify-between gap-3 rounded-xl bg-white/85 p-3 backdrop-blur">
              <Button variant="outline" className="h-9 rounded-lg bg-white/80 px-4 text-xs font-semibold">
                Profile coupon notes
              </Button>
              <div className="flex items-center gap-2">
                <div className="hidden text-xs font-semibold text-gray-700 sm:block">
                  {userLocation?.address ? userLocation.address : 'Showing all stores'}
                </div>
                <Button
                  className="h-9 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                  onClick={() => {
                    document.getElementById('home-products')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Shop Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    categorySection: () => (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products, stores..."
              className="h-10 rounded-xl bg-white pl-9 shadow-sm ring-1 ring-black/5"
            />
          </div>
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="h-10 rounded-xl">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[320px] p-4">
                <SheetHeader className="mb-4">
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                {FiltersPanel}
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="rounded-xl bg-white p-2 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center gap-2 overflow-x-auto">
            {['Hair', 'Tools', 'Nails', 'Etc..'].map((label) => {
              const key = label.toLowerCase().replace('.', '').replace('..', '');
              const normalizedKey = key === 'etc' ? 'all' : key;
              const active = activeTab === normalizedKey;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setActiveTab(normalizedKey)}
                  className={[
                    'h-9 whitespace-nowrap rounded-lg px-4 text-sm font-semibold transition-colors',
                    active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/40',
                  ].join(' ')}
                >
                  {label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setActiveTab('lipstick-sale')}
              className={[
                'h-9 whitespace-nowrap rounded-lg px-4 text-sm font-semibold transition-colors',
                activeTab === 'lipstick-sale'
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-accent/60 text-foreground hover:bg-accent/80',
              ].join(' ')}
            >
              Lipstick Sale
            </button>
            <div className="ml-auto pr-1 text-sm text-gray-400">›</div>
          </div>
        </div>
      </div>
    ),
    featuredProducts: () => (
      <div className="space-y-4">
        {renderProductsGrid(preBannerProducts)}
        {showCollectionsBanner ? (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            <div className="relative h-24 sm:h-28">
              <div className="absolute inset-0 bg-gradient-to-r from-accent/30 via-primary/20 to-secondary/20" />
              <img
                src="/placeholder.svg"
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-30"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-xl bg-white/80 px-5 py-2 text-xs font-semibold text-gray-700 backdrop-blur">
                  Ad Banner Placement
                </div>
              </div>
            </div>
          </div>
        ) : null}
        <div
          id="home-products"
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        >
          {!productsLoading ? postBannerProducts.map((p) => <HomeProductCard key={p.id} product={p} />) : null}
        </div>
      </div>
    ),
    collections: () => null,
    nearbyStores: () => (
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-900">Nearby Stores</div>
          <Link to="/stores" className="text-xs font-semibold text-primary hover:text-primary/80">
            View all
          </Link>
        </div>
        <div className="mt-4">
          {userLocation ? (
            storesInRange.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {storesInRange.slice(0, 10).map((s) => (
                  <Link
                    key={s.id}
                    to={s.slug ? `/store/${s.slug}` : '/stores'}
                    className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-black/5 transition-colors hover:bg-slate-100"
                  >
                    <div className="h-10 w-10 overflow-hidden rounded-lg bg-white ring-1 ring-black/5">
                      <img src={s.logo_url || '/placeholder.svg'} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <div className="line-clamp-1 text-sm font-semibold text-gray-900">{s.name}</div>
                      <div className="text-xs text-gray-500">
                        {typeof s.distance === 'number' ? `${s.distance.toFixed(1)} mi` : 'Nearby'}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-gray-600">
                No stores found within your current distance filter.
              </div>
            )
          ) : (
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-gray-600">
              Set a location to see nearby stores.
            </div>
          )}
        </div>
      </div>
    ),
    featuredStores: () => (
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-900">All Stores</div>
          <Link to="/stores" className="text-xs font-semibold text-primary hover:text-primary/80">
            View all
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {allStores.length > 0 ? (
            allStores.slice(0, 10).map((s) => (
              <Link
                key={s.id}
                to={s.slug ? `/store/${s.slug}` : '/stores'}
                className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-black/5 transition-colors hover:bg-slate-100"
              >
                <div className="h-10 w-10 overflow-hidden rounded-lg bg-white ring-1 ring-black/5">
                  <img src={s.logo_url || '/placeholder.svg'} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0">
                  <div className="line-clamp-1 text-sm font-semibold text-gray-900">{s.name}</div>
                  <div className="text-xs text-gray-500">Store</div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full rounded-xl bg-slate-50 p-4 text-sm text-gray-600">
              No stores available right now.
            </div>
          )}
        </div>
      </div>
    ),
    testimonials: () => (
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="text-sm font-semibold text-gray-900">Testimonials</div>
        <div className="mt-3 text-sm text-gray-600">
          Highlight customer stories and ratings here.
        </div>
      </div>
    ),
    blog: () => (
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-900">From the Beauty Edit</div>
          <Link to="/blog" className="text-xs font-semibold text-primary hover:text-primary/80">
            Read articles
          </Link>
        </div>
        <div className="mt-3 text-sm text-gray-600">
          Share routines, trends, and expert tips to build trust.
        </div>
      </div>
    ),
  };

  const rightColumnSections = orderedSections.filter(
    (key) => key !== 'heroBanner' && (!showCategorySection ? key !== 'categorySection' : true)
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#efeff1]">
      <Header />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-8">
          {sectionConfig.heroBanner?.visible ? sectionRenderers.heroBanner() : null}

          <div
            className={[
              'mt-6 grid grid-cols-1 gap-5',
              showCategorySection ? 'lg:grid-cols-[260px_1fr]' : '',
            ].join(' ')}
          >
            {showCategorySection ? <div className="hidden lg:block">{FiltersPanel}</div> : null}

            <div className="space-y-4">
              {showCategorySection ? sectionRenderers.categorySection() : null}
              {rightColumnSections.map((key) => {
                const content = sectionRenderers[key]?.();
                if (!content) return null;
                return <div key={key}>{content}</div>;
              })}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
