# BeautyFetch Advanced Customization System

## Overview

The BeautyFetch platform now includes a comprehensive customization system that allows you to control every aspect of your website's appearance through an intuitive admin interface.

## Features

### 🎨 Complete Theme Control
- **Colors**: Customize 15+ color values including primary, secondary, accent, backgrounds, text colors, and more
- **Typography**: Control fonts, sizes, weights, line heights, and letter spacing
- **Spacing**: Adjust container widths, padding, margins for sections, cards, and buttons
- **Border Radius**: Define rounded corners for different elements (sm, md, lg, xl, full)
- **Shadows**: Customize box shadows for depth and elevation

### 📄 Page-Specific Customization
- **Homepage Layout**: Control visibility and order of all homepage sections:
  - Hero Banner
  - Category Section
  - Featured Products
  - Collections
  - Nearby Stores
  - Featured Stores
  - Testimonials
  - Blog Preview

### 🔧 Component-Level Customization (Coming Soon)
- Individual customization for headers, footers, buttons, cards, and more
- Component-specific overrides of global settings

### ✨ Interactive Features
- **Live Preview**: See changes in real-time before saving
- **Theme Presets**: Quick apply Light, Dark, or Vibrant themes
- **Import/Export**: Save and share your customization configurations
- **Reset**: Quickly revert to default settings
- **Device Preview**: Preview changes on desktop, tablet, and mobile views

## Getting Started

### 1. Access the Customization Panel

1. Log in as an admin user
2. Navigate to `/admin`
3. Click on the **"Customization"** tab

### 2. Understanding the Interface

The customization interface is divided into 4 main tabs:

#### **Theme Tab**
Customize your website's visual appearance:

- **Colors Section**: 15+ customizable color properties
  - Each color has a color picker and hex input
  - Real-time preview shows how colors look together

- **Spacing & Layout Section**: Control spacing throughout the site
  - Container max width
  - Section padding (vertical and horizontal)
  - Card padding
  - Button padding

- **Border Radius Section**: Define rounded corners
  - Small (sm)
  - Medium (md)
  - Large (lg)
  - Extra Large (xl)
  - Full (pill-shaped)

- **Box Shadows Section**: Add depth with shadows
  - Small, Medium, Large, Extra Large presets

#### **Typography Tab**
Control all text styling:

- **Font Families**
  - Heading font (7 options: Inter, Roboto, Playfair Display, etc.)
  - Body font (6 options: Inter, Roboto, Lato, etc.)

- **Font Sizes**: 8 size presets (xs to display)
- **Font Weights**: Normal, Medium, Semibold, Bold
- **Line Heights**: Tight, Normal, Relaxed, Loose
- **Letter Spacing**: Tight, Normal, Wide

#### **Layout Tab**
Configure homepage sections:

- Toggle visibility for each section
- Change display order (1-8)
- Sections automatically reorder based on your preferences

#### **Components Tab**
(Coming Soon) Customize individual components like buttons, cards, headers, etc.

### 3. Making Changes

1. **Select a tab** (Theme, Typography, Layout, or Components)
2. **Adjust settings** using:
   - Color pickers
   - Text inputs
   - Dropdowns
   - Sliders
   - Switches

3. **Preview changes** in the Live Preview panel (right side)

4. **Save changes** by clicking "Save All Changes" button

### 4. Using Quick Actions

**Theme Presets**
- Click "Light Theme", "Dark Theme", or "Vibrant Theme" for instant transformations
- Presets can be further customized before saving

**Import/Export**
- **Export**: Download your customization as a JSON file
- **Import**: Upload a previously exported configuration

**Reset**
- Revert all changes to default settings
- Requires confirmation to prevent accidental resets

**Reload**
- Refresh settings from the database
- Useful if changes were made in another tab/browser

## Technical Implementation

### Architecture

#### Database Schema
All customization settings are stored in the `site_customization` table:

```sql
- id (UUID)
- setting_key (TEXT, UNIQUE) - Identifier like 'global_theme', 'homepage_layout'
- setting_value (JSONB) - The actual settings data
- setting_type (TEXT) - 'global', 'page', or 'component'
- scope (TEXT) - Page or component name for specific settings
- created_at, updated_at, updated_by
```

#### Context Provider
The `CustomizationContext` ([src/contexts/CustomizationContext.tsx](src/contexts/CustomizationContext.tsx)):
- Loads settings from Supabase on app initialization
- Applies settings as CSS variables to the DOM
- Provides real-time updates via Supabase subscriptions
- Exposes settings to all components via `useCustomization()` hook

#### Admin Interface
The `EnhancedCustomization` component ([src/components/admin/EnhancedCustomization.tsx](src/components/admin/EnhancedCustomization.tsx)):
- Interactive UI with tabs for different customization areas
- Live preview panel showing real-time changes
- Import/export functionality for configurations
- Theme presets for quick styling

#### Homepage Integration
The `Index` component ([src/pages/Index.tsx](src/pages/Index.tsx)):
- Reads homepage layout settings from CustomizationContext
- Dynamically renders sections based on visibility settings
- Automatically sorts sections by order
- Respects location-based logic (nearby vs featured stores)

### CSS Variables

Customization settings are injected as CSS variables:

**Colors:**
```css
--color-primary: #ec4899
--color-secondary: #8b5cf6
--color-background: #ffffff
/* ...and 12+ more */
```

**Typography:**
```css
--font-heading: Inter
--font-body: Inter
--font-size-base: 1rem
--font-weight-bold: 700
/* ...and more */
```

**Spacing:**
```css
--spacing-container-max-width: 1280px
--spacing-section-padding-y: 4rem
/* ...and more */
```

**Border Radius:**
```css
--radius-sm: 0.25rem
--radius-md: 0.5rem
--radius-lg: 0.75rem
/* ...and more */
```

**Shadows:**
```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1)
/* ...and more */
```

### Using Customization in Your Components

#### Access Theme Settings
```tsx
import { useCustomization } from '@/contexts/CustomizationContext';

function MyComponent() {
  const { theme, typography, isLoading } = useCustomization();

  if (isLoading) return <Loader />;

  return (
    <div style={{
      backgroundColor: theme?.colors.primary,
      fontFamily: typography?.fontFamily.heading
    }}>
      Customized Content
    </div>
  );
}
```

#### Use CSS Variables (Recommended)
```tsx
function MyComponent() {
  return (
    <div style={{
      backgroundColor: 'var(--color-primary)',
      fontFamily: 'var(--font-heading)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-lg)'
    }}>
      Customized Content
    </div>
  );
}
```

#### Check Section Visibility
```tsx
import { useCustomization } from '@/contexts/CustomizationContext';

function HomePage() {
  const { homepageLayout } = useCustomization();

  return (
    <>
      {homepageLayout?.sections.heroBanner.visible && <HeroSection />}
      {homepageLayout?.sections.featuredProducts.visible && <FeaturedProducts />}
    </>
  );
}
```

## Migration

### Running the Migration

To apply the customization database schema, run:

```bash
# If using Supabase CLI
npx supabase migration up

# Or apply via Supabase Dashboard
# Go to Database > Migrations > Upload the migration file
```

The migration file is located at:
[supabase/migrations/20250118000000_enhanced_customization.sql](supabase/migrations/20250118000000_enhanced_customization.sql)

### What the Migration Does

1. Creates the `site_customization` table with proper indexes
2. Sets up Row Level Security (RLS) policies:
   - Anyone can read customization (needed for public site)
   - Only admins can modify settings
3. Inserts default theme and layout settings
4. Creates a helper view for querying settings by type

## Best Practices

### Performance
- CSS variables are applied once on load and updated on change
- Real-time subscriptions ensure changes propagate immediately
- Settings are cached in memory via Context

### Customization Tips
1. **Start with a preset**: Use Light, Dark, or Vibrant as a base
2. **Test on multiple devices**: Use the device preview
3. **Export regularly**: Save backups of your customizations
4. **Use consistent spacing**: Stick to your spacing scale
5. **Maintain contrast**: Ensure text is readable on backgrounds

### Development
- Customization settings load asynchronously
- Always check `isLoading` state before accessing settings
- Use CSS variables for better performance
- Real-time updates work across all tabs/browsers

## Troubleshooting

### Settings Not Applying
1. Check browser console for errors
2. Verify CustomizationProvider is in App.tsx
3. Ensure database migration has been run
4. Check RLS policies allow reading settings

### Live Preview Not Updating
1. Make sure you've clicked in the input/changed the value
2. Check that the preview panel is visible
3. Try refreshing the page

### Import/Export Issues
- Ensure JSON file is valid
- Check file was exported from BeautyFetch
- Verify all required fields are present

## Roadmap

### Coming Soon
- **Component-specific customization**: Headers, footers, buttons, cards
- **Page-specific themes**: Different themes for different pages
- **Animation controls**: Customize transitions and effects
- **Mobile-specific overrides**: Different settings for mobile devices
- **A/B testing**: Test multiple theme variations
- **Theme marketplace**: Share and download themes

### Future Enhancements
- **Visual editor**: Click-to-edit components directly on the page
- **Undo/Redo**: Track change history
- **Scheduled themes**: Automatically switch themes based on time/date
- **User preferences**: Let users choose their preferred theme

## Support

For issues or feature requests:
1. Check this documentation first
2. Review the technical implementation files
3. Check browser console for errors
4. Create an issue in your project repository

## File Reference

### Core Files
- [src/contexts/CustomizationContext.tsx](src/contexts/CustomizationContext.tsx) - Main context provider
- [src/components/admin/EnhancedCustomization.tsx](src/components/admin/EnhancedCustomization.tsx) - Admin UI
- [src/pages/Index.tsx](src/pages/Index.tsx) - Homepage with dynamic sections
- [src/App.tsx](src/App.tsx) - CustomizationProvider integration
- [supabase/migrations/20250118000000_enhanced_customization.sql](supabase/migrations/20250118000000_enhanced_customization.sql) - Database schema

### Legacy Files (Replaced)
- [src/components/admin/AdminCustomization.tsx](src/components/admin/AdminCustomization.tsx) - Old customization component (reference only)

---

**Version**: 1.0.0
**Last Updated**: January 18, 2025
**License**: MIT
