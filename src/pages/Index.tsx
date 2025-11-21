import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/HeroSection";
import { CategorySection } from "@/components/CategorySection";
import { NearbyStores } from "@/components/NearbyStores";
import { FeaturedStores } from "@/components/FeaturedStores";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { CollectionsShowcase } from "@/components/CollectionsShowcase";
import { ReviewsSection } from "@/components/ReviewsSection";
import { BlogPreview } from "@/components/BlogPreview";
import { useLocation } from "@/contexts/LocationContext";
import { useCustomization } from "@/contexts/CustomizationContext";
import { useMemo } from "react";

// Safe component wrapper to prevent entire page crashes
const SafeComponent = ({ children, name }: { children: React.ReactNode, name: string }) => {
  try {
    return <>{children}</>;
  } catch (error) {
    console.error(`Error in ${name} component:`, error);
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg my-4">
        <p className="text-red-800">⚠️ Error loading {name} component</p>
      </div>
    );
  }
};

const Index = () => {
  console.log('Index component is rendering');

  const { userLocation } = useLocation();
  const { homepageLayout } = useCustomization();

  // Add debug logging
  console.log('User location:', userLocation);
  console.log('Environment check:', {
    mode: import.meta.env.MODE,
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
  });

  // Create sorted sections based on visibility and order
  const sortedSections = useMemo(() => {
    if (!homepageLayout?.sections) {
      // Default sections if no customization is set
      return [
        { id: 'heroBanner', component: <HeroSection />, order: 1 },
        { id: 'categorySection', component: <CategorySection />, order: 2 },
        { id: 'featuredProducts', component: <FeaturedProducts />, order: 3 },
        { id: 'collections', component: <CollectionsShowcase />, order: 4 },
        { id: 'nearbyStores', component: userLocation ? <NearbyStores /> : null, order: 5 },
        { id: 'featuredStores', component: !userLocation ? <FeaturedStores /> : null, order: 6 },
        { id: 'testimonials', component: <ReviewsSection />, order: 7, visible: false },
        { id: 'blog', component: <BlogPreview />, order: 8 },
      ].filter(section => section.visible !== false && section.component !== null);
    }

    const sections = [
      {
        id: 'heroBanner',
        component: <HeroSection />,
        ...homepageLayout.sections.heroBanner
      },
      {
        id: 'categorySection',
        component: <CategorySection />,
        ...homepageLayout.sections.categorySection
      },
      {
        id: 'featuredProducts',
        component: <FeaturedProducts />,
        ...homepageLayout.sections.featuredProducts
      },
      {
        id: 'collections',
        component: <CollectionsShowcase />,
        ...homepageLayout.sections.collections
      },
      {
        id: 'nearbyStores',
        component: <NearbyStores />,
        ...homepageLayout.sections.nearbyStores,
        visible: homepageLayout.sections.nearbyStores.visible && !!userLocation
      },
      {
        id: 'featuredStores',
        component: <FeaturedStores />,
        ...homepageLayout.sections.featuredStores,
        visible: homepageLayout.sections.featuredStores.visible && !userLocation
      },
      {
        id: 'testimonials',
        component: <ReviewsSection />,
        ...homepageLayout.sections.testimonials
      },
      {
        id: 'blog',
        component: <BlogPreview />,
        ...homepageLayout.sections.blog
      },
    ];

    return sections
      .filter(section => section.visible)
      .sort((a, b) => a.order - b.order);
  }, [homepageLayout, userLocation]);

  return (
    <div className="min-h-screen bg-white">
      {/* Debug info for development */}
      {import.meta.env.MODE === 'development' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          background: 'rgba(0,255,0,0.1)',
          padding: '4px 8px',
          fontSize: '10px',
          zIndex: 999,
          color: 'green'
        }}>
          Index loaded ✓
        </div>
      )}
      
      <SafeComponent name="Header">
        <Header />
      </SafeComponent>

      <main className="flex-grow">
        {sortedSections.map((section) => (
          <SafeComponent key={section.id} name={section.id}>
            {section.component}
          </SafeComponent>
        ))}
      </main>

      <SafeComponent name="Footer">
        <Footer />
      </SafeComponent>
    </div>
  );
};

export default Index;
