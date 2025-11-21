# BeautyFetch Customization - Code Reference & Examples

## Key Code Snippets

### 1. Admin Customization Component Structure

**File**: `src/components/admin/AdminCustomization.tsx`

#### Type Definitions
```typescript
interface ColorSettings {
  background: string;
  primary: string;
  secondary: string;
  text: string;
  header: string;
  footer: string;
  accent: string;
}

interface FontSettings {
  headingFont: string;
  bodyFont: string;
  fontSize: string;
  lineSpacing: string;
}

interface SectionVisibility {
  heroBanner: boolean;
  featuredProducts: boolean;
  collections: boolean;
  stores: boolean;
  testimonials: boolean;
  blog: boolean;
}
```

#### Load Settings Method
```typescript
const loadSettings = async () => {
  try {
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from('site_customization')
      .select('*');
    
    if (error) throw error;
    
    if (data) {
      data.forEach(setting => {
        switch (setting.setting_key) {
          case 'colors':
            setColors(setting.setting_value as unknown as ColorSettings);
            break;
          case 'fonts':
            setFonts(setting.setting_value as unknown as FontSettings);
            break;
          case 'homepage_sections':
            setHomepageSections(setting.setting_value as unknown as SectionVisibility);
            break;
        }
      });
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  } finally {
    setIsLoading(false);
  }
};
```

#### Save Settings Method
```typescript
const handleSaveSettings = async () => {
  setIsSaving(true);
  try {
    // Save colors
    const { error: colorsError } = await supabase
      .from('site_customization')
      .upsert([{
        setting_key: 'colors',
        setting_value: colors as any,
      }], {
        onConflict: 'setting_key'
      });
    
    if (colorsError) throw colorsError;

    // Save fonts
    const { error: fontsError } = await supabase
      .from('site_customization')
      .upsert([{
        setting_key: 'fonts',
        setting_value: fonts as any,
      }], {
        onConflict: 'setting_key'
      });
    
    if (fontsError) throw fontsError;

    // Save homepage sections
    const { error: sectionsError } = await supabase
      .from('site_customization')
      .upsert([{
        setting_key: 'homepage_sections',
        setting_value: homepageSections as any,
      }], {
        onConflict: 'setting_key'
      });
    
    if (sectionsError) throw sectionsError;
  } catch (error) {
    console.error('Error saving settings:', error);
  } finally {
    setIsSaving(false);
  }
};
```

---

### 2. Database Schema & RLS Policies

**File**: `supabase/migrations/20251028202918_cdbb494f-0589-4d0e-9c34-5c4aa18f8fd6.sql`

#### Table Creation
```sql
CREATE TABLE IF NOT EXISTS public.site_customization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.site_customization ENABLE ROW LEVEL SECURITY;
```

#### RLS Policy - Admin Full Access
```sql
CREATE POLICY "Admins can manage site customization"
  ON public.site_customization
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

#### RLS Policy - Public Read Access
```sql
CREATE POLICY "Everyone can view site customization"
  ON public.site_customization
  FOR SELECT
  USING (true);
```

#### Auto-Update Trigger
```sql
CREATE OR REPLACE FUNCTION update_site_customization_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER site_customization_updated_at
  BEFORE UPDATE ON public.site_customization
  FOR EACH ROW
  EXECUTE FUNCTION update_site_customization_timestamp();
```

#### Default Data Seeding
```sql
INSERT INTO public.site_customization (setting_key, setting_value) VALUES
  ('colors', '{
    "background": "#ffffff",
    "primary": "#ec4899",
    "secondary": "#f3f4f6",
    "text": "#111827",
    "header": "#ffffff",
    "footer": "#1f2937",
    "accent": "#ec4899"
  }'::jsonb),
  ('fonts', '{
    "headingFont": "Inter",
    "bodyFont": "Inter",
    "fontSize": "16",
    "lineSpacing": "1.5"
  }'::jsonb),
  ('homepage_sections', '{
    "heroBanner": true,
    "featuredProducts": true,
    "collections": true,
    "stores": true,
    "testimonials": false,
    "blog": true
  }'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;
```

---

### 3. Current CSS Variable System

**File**: `src/index.css`

#### Root Variables (Light Mode)
```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    
    --primary: 262 83% 75%;
    --primary-foreground: 210 40% 98%;
    
    --secondary: 260 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    
    --accent: 262 83% 96%;
    --accent-foreground: 222.2 47.4% 11.2%;
    
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 262 83% 75%;
    
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... dark mode variables ... */
  }
}
```

---

### 4. Tailwind Configuration

**File**: `tailwind.config.ts`

#### Color Theme Extension
```typescript
extend: {
  colors: {
    border: 'hsl(var(--border))',
    input: 'hsl(var(--input))',
    ring: 'hsl(var(--ring))',
    background: 'hsl(var(--background))',
    foreground: 'hsl(var(--foreground))',
    
    primary: {
      DEFAULT: 'hsl(var(--primary))',
      foreground: 'hsl(var(--primary-foreground))'
    },
    secondary: {
      DEFAULT: 'hsl(var(--secondary))',
      foreground: 'hsl(var(--secondary-foreground))'
    },
    accent: {
      DEFAULT: 'hsl(var(--accent))',
      foreground: 'hsl(var(--accent-foreground))'
    },
    // ... other color definitions
  }
}
```

---

### 5. Admin Dashboard Integration

**File**: `src/pages/Admin.tsx`

#### Component Import
```typescript
import { AdminCustomization } from "@/components/admin/AdminCustomization";
```

#### Tab Configuration
```typescript
<Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
  <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground min-w-max">
    {/* ... other tabs ... */}
    <TabsTrigger value="customization" className="whitespace-nowrap">Customization</TabsTrigger>
    {/* ... other tabs ... */}
  </TabsList>

  {/* ... other tab contents ... */}
  
  <TabsContent value="customization">
    <AdminCustomization />
  </TabsContent>

  {/* ... other tab contents ... */}
</Tabs>
```

---

### 6. Homepage Structure

**File**: `src/pages/Index.tsx`

#### Current Sections (Hard-coded, No Visibility Check)
```typescript
const Index = () => {
  const { userLocation } = useLocation();

  return (
    <div className="min-h-screen bg-white">
      <SafeComponent name="Header">
        <Header />
      </SafeComponent>
      
      <main className="flex-grow">
        <SafeComponent name="HeroSection">
          <HeroSection />                    {/* No visibility check */}
        </SafeComponent>
        
        <SafeComponent name="CategorySection">
          <CategorySection />                {/* No visibility check */}
        </SafeComponent>
        
        <SafeComponent name="StoresSection">
          {userLocation ? <NearbyStores /> : <FeaturedStores />}
                                             {/* No visibility check */}
        </SafeComponent>
        
        <SafeComponent name="FeaturedProducts">
          <FeaturedProducts />               {/* No visibility check */}
        </SafeComponent>
        
        <SafeComponent name="CollectionsShowcase">
          <CollectionsShowcase />            {/* No visibility check */}
        </SafeComponent>
        
        <SafeComponent name="ReviewsSection">
          <ReviewsSection />                 {/* No visibility check */}
        </SafeComponent>
        
        <SafeComponent name="BlogPreview">
          <BlogPreview />                    {/* No visibility check */}
        </SafeComponent>
      </main>
      
      <SafeComponent name="Footer">
        <Footer />
      </SafeComponent>
    </div>
  );
};
```

---

## What Needs to Be Built

### To Make Customization Work End-to-End:

#### 1. Custom Hook for Customization
```typescript
// src/hooks/useCustomization.ts - NEEDS TO BE CREATED
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CustomizationSettings {
  colors: ColorSettings;
  fonts: FontSettings;
  sections: SectionVisibility;
}

export const useCustomization = () => {
  const [settings, setSettings] = useState<CustomizationSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomization();
  }, []);

  const loadCustomization = async () => {
    try {
      const { data } = await supabase
        .from('site_customization')
        .select('*');
      
      // Process and set customization...
      applyCustomization(data);
    } catch (error) {
      console.error('Error loading customization:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyCustomization = (data: any) => {
    // 1. Inject CSS variables for colors
    // 2. Load fonts dynamically
    // 3. Return visibility settings
  };

  return { settings, loading };
};
```

#### 2. CSS Variable Injection
```typescript
// Apply colors to DOM
const applyColors = (colors: ColorSettings) => {
  const root = document.documentElement;
  // Convert hex to HSL and set variables
  root.style.setProperty('--primary', hexToHsl(colors.primary));
  root.style.setProperty('--secondary', hexToHsl(colors.secondary));
  // ... etc
};
```

#### 3. Font Loading
```typescript
// Load Google Fonts dynamically
const loadFonts = (fonts: FontSettings) => {
  const link = document.createElement('link');
  link.href = `https://fonts.googleapis.com/css2?family=${fonts.headingFont}:wght@400;700`;
  document.head.appendChild(link);
};
```

#### 4. Update Index.tsx
```typescript
// Check visibility settings before rendering
const Index = () => {
  const { settings } = useCustomization();

  return (
    <div>
      <Header />
      <main>
        {settings?.sections.heroBanner && <HeroSection />}
        {settings?.sections.featuredProducts && <FeaturedProducts />}
        {/* ... conditional rendering for each section ... */}
      </main>
      <Footer />
    </div>
  );
};
```

---

## Query Examples

### Fetch Current Customization
```typescript
const { data } = await supabase
  .from('site_customization')
  .select('*')
  .eq('setting_key', 'colors')
  .single();

// Result:
// {
//   id: "uuid",
//   setting_key: "colors",
//   setting_value: {
//     background: "#ffffff",
//     primary: "#ec4899",
//     // ...
//   },
//   updated_at: "2025-11-18T...",
//   updated_by: "user-uuid"
// }
```

### Update Settings
```typescript
await supabase
  .from('site_customization')
  .upsert({
    setting_key: 'colors',
    setting_value: {
      background: "#f3f4f6",
      primary: "#9333ea",
      // ...
    }
  }, {
    onConflict: 'setting_key'
  });
```

### Real-time Subscription (Future Implementation)
```typescript
const subscription = supabase
  .channel('customization_changes')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'site_customization'
    },
    (payload) => {
      // Reload customization on changes
      loadCustomization();
    }
  )
  .subscribe();
```

---

## Architecture Diagram

```
Admin Dashboard
    ↓
AdminCustomization Component
    ├─ Colors Tab (UI input)
    ├─ Typography Tab (UI input)
    └─ Layout Tab (UI input)
    
    ↓ Save/Load via Supabase
    
    ↓
site_customization Table
    ├─ colors → JSONB
    ├─ fonts → JSONB
    └─ homepage_sections → JSONB
    
    ↓ RLS Policy Check (admin-only for write)
    ↓ RLS Policy (everyone can read)
    
    ↓ FUTURE: useCustomization Hook
    
    ↓ Apply to Frontend
    ├─ CSS Variable Injection (colors)
    ├─ Font Loading (fonts)
    └─ Conditional Rendering (sections)
    
    ↓
Homepage & Other Pages (display customized)
```

