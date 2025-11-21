# Customization System Setup Guide

## Quick Start

Follow these steps to enable the advanced customization system on your BeautyFetch platform.

## Step 1: Apply Database Migration

You need to run the database migration to create the customization tables.

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your BeautyFetch project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **"New query"**
5. Copy the entire contents of `supabase/migrations/20250118000000_enhanced_customization.sql`
6. Paste into the SQL Editor
7. Click **"Run"** button
8. You should see: "Success. No rows returned"

### Option B: Using Supabase CLI

If you have Supabase CLI installed:

```bash
npx supabase db push
```

### Verify Migration Success

Run this query in SQL Editor to verify the table was created:

```sql
SELECT * FROM site_customization LIMIT 5;
```

You should see 3-4 default rows with keys like:
- `global_theme`
- `global_typography`
- `homepage_layout`
- `component_header`, etc.

## Step 2: Verify the App is Running

The development server should be running on http://localhost:8080 or http://localhost:8081

If not already running:
```bash
npm run dev
```

## Step 3: Access the Customization Panel

1. **Open your browser** to http://localhost:8081 (or the port shown in terminal)

2. **Log in as admin**
   - If you don't have an admin account, create one or update an existing user:

   ```sql
   -- In Supabase SQL Editor, update a user to be admin:
   UPDATE profiles
   SET role = 'admin'
   WHERE email = 'your-email@example.com';
   ```

3. **Navigate to Admin Dashboard**
   - Go to: http://localhost:8081/admin
   - Click on the **"Customization"** tab

4. **You should see the new Enhanced Customization interface** with:
   - Quick Theme Presets (Light, Dark, Vibrant)
   - 4 tabs: Theme, Typography, Layout, Components
   - Live Preview panel on the right
   - Import/Export buttons

## Step 4: Test the Customization

### Test Theme Customization

1. Click the **"Theme"** tab
2. Expand the **"Colors"** section
3. Change the **Primary** color to a different color (e.g., #10b981 for green)
4. Notice the preview panel updates immediately
5. Click **"Save All Changes"**
6. Open a new tab and go to the homepage (http://localhost:8081/)
7. You should see the new primary color applied to buttons and accents

### Test Layout Customization

1. Click the **"Layout"** tab
2. Find **"Testimonials"** section
3. Toggle it **ON** (if it's off)
4. Click **"Save All Changes"**
5. Go to homepage and scroll down
6. The Reviews/Testimonials section should now be visible

### Test Section Ordering

1. In the **"Layout"** tab
2. Change the order of **"Featured Products"** from 3 to 1
3. Change the order of **"Hero Banner"** from 1 to 3
4. Click **"Save All Changes"**
5. Go to homepage
6. Featured Products should now appear before the Hero Banner

### Test Typography

1. Click the **"Typography"** tab
2. Expand **"Font Families"**
3. Change **Heading Font** to "Playfair Display"
4. Change **Body Font** to "Lato"
5. Click **"Save All Changes"**
6. Go to homepage
7. Headings should now use Playfair Display serif font
8. Body text should use Lato

### Test Theme Presets

1. Click **"Vibrant Theme"** button at the top
2. Notice all colors change in the preview
3. Click **"Save All Changes"**
4. Visit the homepage
5. The entire site should have a vibrant, colorful appearance

### Test Import/Export

1. Customize some settings (colors, fonts, etc.)
2. Click **"Export"** button
3. A JSON file will download: `beautyfetch-customization-[timestamp].json`
4. Change some settings to something different
5. Click **"Import"** button
6. Select the downloaded JSON file
7. Settings should revert to the exported configuration
8. Click **"Save All Changes"** to apply

## Step 5: Verify Real-Time Updates

1. Open the admin customization panel in one browser tab
2. Open the homepage in another tab
3. In the admin panel, change the primary color
4. Click **"Save All Changes"**
5. Watch the homepage tab - it should automatically update within 1-2 seconds without refreshing

## Troubleshooting

### Migration Errors

**Error: relation "site_customization" already exists**
- This means the table was created before
- Solution: Drop the old table first (if you're okay losing old data):
  ```sql
  DROP TABLE IF EXISTS site_customization CASCADE;
  ```
- Then re-run the migration

**Error: permission denied**
- Make sure you're logged in to Supabase Dashboard
- Check you have admin access to the project

### Customization Not Loading

**Blank customization panel**
- Check browser console (F12) for errors
- Verify the migration ran successfully
- Check that CustomizationProvider is in App.tsx (it should be)

**Changes not saving**
- Check browser console for errors
- Verify you're logged in as admin
- Check RLS policies in Supabase (the migration should have created these)

**Changes not appearing on frontend**
- Hard refresh the page (Cmd/Ctrl + Shift + R)
- Check browser console for errors
- Verify CustomizationProvider is wrapping the app

### Live Preview Not Working

**Preview panel is blank**
- Try toggling "Hide/Show Preview"
- Check for JavaScript errors in console
- Refresh the page

**Preview not updating when I change values**
- Make sure you're actually changing the value (click or type)
- Some inputs require you to press Enter or blur the field
- Try another input to verify it's working

### Real-Time Updates Not Working

**Changes not appearing automatically**
- Check Supabase connection in browser console
- Verify the Supabase realtime subscription is active
- Manual refresh should still show changes

## Next Steps

### Customize Your Site

1. **Choose a base theme**: Start with Light, Dark, or Vibrant
2. **Adjust colors**: Match your brand colors
3. **Select fonts**: Choose fonts that match your brand personality
4. **Configure layout**: Show/hide sections based on your needs
5. **Test on different devices**: Use the device preview buttons

### Advanced Customization

- Explore all color options (15+ colors)
- Fine-tune typography (8 font sizes, 4 weights, etc.)
- Adjust spacing for a unique layout
- Customize border radius for different feels (sharp vs. rounded)
- Play with shadows for depth

### Share Your Theme

1. Create your perfect customization
2. Click **"Export"**
3. Share the JSON file with team members
4. They can import it to get the same look instantly

## Support

If you encounter issues:

1. **Check the Console**: Press F12 and look for red errors
2. **Review Documentation**: See [CUSTOMIZATION_GUIDE.md](CUSTOMIZATION_GUIDE.md)
3. **Check Database**: Verify migration ran in Supabase Dashboard
4. **Restart Dev Server**: Stop (Ctrl+C) and restart (`npm run dev`)

## What's Working Now

✅ Database schema created
✅ CustomizationContext provider integrated
✅ Enhanced admin UI with live preview
✅ Theme customization (colors, spacing, borders, shadows)
✅ Typography customization (fonts, sizes, weights, line heights)
✅ Layout customization (section visibility and ordering)
✅ Homepage respects customization settings
✅ Real-time updates across browser tabs
✅ Import/Export functionality
✅ Theme presets (Light, Dark, Vibrant)
✅ Device preview (Desktop, Tablet, Mobile)

## What's Coming Soon

🔄 Component-specific customization (headers, footers, buttons, cards)
🔄 Page-specific themes (different themes for different pages)
🔄 Animation controls
🔄 Mobile-specific overrides
🔄 Visual click-to-edit mode

---

**Ready to customize?** Go to http://localhost:8081/admin and click the Customization tab!
