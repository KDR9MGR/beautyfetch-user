# Customization Feature - Quick Start Guide

## Overview
The BeautyFetch customization feature allows admins to modify the website's appearance through three main categories:
- Color Palette
- Typography/Fonts  
- Homepage Section Visibility

## Current Status: PARTIALLY IMPLEMENTED

**What Works**: Admin UI for managing settings + Database storage
**What Doesn't Work**: Frontend consumption of customization (settings not applied to live site)

---

## Quick Facts

| Aspect | Details |
|--------|---------|
| **Admin Component** | `src/components/admin/AdminCustomization.tsx` |
| **Database Table** | `site_customization` (Supabase) |
| **Access Location** | Admin Dashboard → Customization Tab |
| **User Role Required** | Admin only |
| **Data Storage** | JSONB in Supabase |
| **RLS Policies** | Admin read/write + Public read-only |

---

## Data Storage Format

### Colors Setting
```json
{
  "background": "#ffffff",
  "primary": "#ec4899",
  "secondary": "#f3f4f6",
  "text": "#111827",
  "header": "#ffffff",
  "footer": "#1f2937",
  "accent": "#ec4899"
}
```

### Fonts Setting
```json
{
  "headingFont": "Inter",
  "bodyFont": "Inter",
  "fontSize": "16",
  "lineSpacing": "1.5"
}
```

### Homepage Sections Setting
```json
{
  "heroBanner": true,
  "featuredProducts": true,
  "collections": true,
  "stores": true,
  "testimonials": false,
  "blog": true
}
```

---

## File Map

```
Project Root
├── src/
│   ├── components/admin/
│   │   └── AdminCustomization.tsx ⭐ [Main component]
│   ├── pages/
│   │   ├── Admin.tsx [Hosts customization tab]
│   │   └── Index.tsx [Homepage - needs to consume customization]
│   ├── index.css [CSS variables - needs dynamic injection]
│   └── App.tsx [Main router]
├── supabase/
│   └── migrations/
│       └── 20251028202918_...sql [Database schema]
├── tailwind.config.ts [Tailwind theme]
├── CUSTOMIZATION_ANALYSIS.md [Full analysis]
└── CUSTOMIZATION_CODE_REFERENCE.md [Code examples]
```

---

## How to Use the Customization Admin Panel

### 1. Access the Panel
- Go to Admin Dashboard (`/admin`)
- Click "Customization" tab

### 2. Colors Tab
- Click color picker or edit hex value
- Up to 7 colors customizable:
  - Background, Primary, Secondary, Text, Header, Footer, Accent
- Click "Save Changes" to persist

### 3. Typography Tab
- Select heading font from dropdown
- Select body font from dropdown
- Set base font size (12-24px)
- Set line spacing (1.0-2.5)
- Click "Save Changes" to persist

### 4. Layout Tab
- Toggle visibility of homepage sections:
  - Hero Banner
  - Featured Products
  - Collections
  - Stores
  - Testimonials
  - Blog
- Click "Save Changes" to persist

---

## Database Queries (Supabase)

### Read All Customization Settings
```typescript
const { data } = await supabase
  .from('site_customization')
  .select('*');
```

### Read Specific Setting (e.g., colors)
```typescript
const { data } = await supabase
  .from('site_customization')
  .select('*')
  .eq('setting_key', 'colors')
  .single();
```

### Update a Setting
```typescript
await supabase
  .from('site_customization')
  .upsert({
    setting_key: 'colors',
    setting_value: {
      primary: '#9333ea',
      secondary: '#f3f4f6',
      // ... rest of colors
    }
  }, {
    onConflict: 'setting_key'
  });
```

---

## Next Steps to Complete Implementation

### Priority 1: Hook for Customization (Frontend Consumption)
Create `src/hooks/useCustomization.ts` to fetch and provide settings to components.

**What it should do**:
1. Fetch customization from database on app load
2. Cache results
3. Provide settings to components via hook
4. Handle real-time updates (optional)

### Priority 2: Apply Colors
Inject CSS variables into DOM dynamically based on saved colors.

**What it should do**:
1. Convert hex colors to HSL format
2. Set CSS variables on document root
3. Update on settings change

### Priority 3: Load Fonts
Dynamically load selected fonts (e.g., from Google Fonts).

**What it should do**:
1. Generate Google Fonts link
2. Add to document head
3. Apply font-family classes

### Priority 4: Wire Up Section Visibility
Update `Index.tsx` to check `homepage_sections` setting.

**What it should do**:
1. Fetch section visibility settings
2. Conditionally render sections
3. Show all by default if settings not loaded

### Priority 5: Add Real-time Sync
Implement Supabase subscriptions for live updates.

**What it should do**:
1. Listen for database changes
2. Reload customization when changed
3. Refresh relevant page sections

### Priority 6: Add Preview
Allow admins to preview changes before saving.

**What it should do**:
1. Show live preview while editing
2. Restore original on cancel
3. Apply on save

---

## Key Code Locations

### AdminCustomization Component
- **Path**: `src/components/admin/AdminCustomization.tsx`
- **Lines 85-125**: Load settings logic
- **Lines 127-180**: Save settings logic
- **Lines 217-253**: Colors tab UI
- **Lines 255-325**: Typography tab UI
- **Lines 328-357**: Layout tab UI

### Database Schema
- **File**: `supabase/migrations/20251028202918_...sql`
- **Lines 1-8**: Table creation
- **Lines 10-23**: Admin RLS policy
- **Lines 25-29**: Public read RLS policy
- **Lines 31-45**: Auto-update trigger
- **Lines 47-72**: Default data seeding

### CSS System
- **File**: `src/index.css`
- **Lines 6-46**: Light mode CSS variables
- **Lines 48-76**: Dark mode CSS variables
- **File**: `tailwind.config.ts`
- **Lines 22-72**: Color theme extension

---

## Important Notes

1. **Settings are stored** but **not applied** to the frontend
2. **Page refresh is required** to see any UI changes (no real-time sync)
3. **Only admins can edit** customization (RLS enforced)
4. **Everyone can read** customization (for public display)
5. **All sections are visible** by default (visibility setting not checked)
6. **Colors use hex format** in UI but Tailwind uses HSL variables
7. **Fonts are defined** but never loaded or applied

---

## Common Issues & Troubleshooting

### Settings not saving?
- Check browser console for Supabase errors
- Verify you're logged in as admin
- Check RLS policy allows your user role

### Colors not changing on site?
- Settings are stored but not applied to frontend yet
- Needs CSS variable injection implementation
- Currently not a bug - feature not yet complete

### Fonts not changing?
- Fonts are stored but never loaded
- Needs Google Fonts API integration
- Currently not a bug - feature not yet complete

### Section visibility not working?
- Settings are stored but Index.tsx doesn't check them
- All sections render unconditionally
- Needs conditional rendering implementation

---

## Architecture Summary

```
User Interface (AdminCustomization.tsx)
    ↓ (Save Button)
    ↓
Supabase Client
    ↓ (UPSERT query)
    ↓
site_customization Table
    ↓ (RLS enforcement)
    ↓
Database (PostgreSQL)
    
────────────────────────
    
Database (PostgreSQL)
    ↓ (RLS check: public read)
    ↓
Supabase Client
    ↓ (SELECT query)
    ↓
useCustomization Hook [NEEDS TO BE CREATED]
    ↓
Frontend Components (Colors, Fonts, Sections)
    ↓
Rendered Website
```

---

## Success Criteria for Full Implementation

- [x] Admin UI for editing customization settings
- [x] Database table for storing customization
- [x] RLS policies for access control
- [ ] Hook to fetch customization on app load
- [ ] CSS variable injection for colors
- [ ] Font loading mechanism
- [ ] Conditional rendering of sections
- [ ] Real-time sync when settings change
- [ ] Preview functionality in admin panel
- [ ] Validation of input values
- [ ] Caching strategy to reduce database queries

---

## Support

For detailed code examples, see: `CUSTOMIZATION_CODE_REFERENCE.md`
For full analysis, see: `CUSTOMIZATION_ANALYSIS.md`

