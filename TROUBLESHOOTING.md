# Troubleshooting: Customization Tab Loading Issue

## Quick Fix Steps

### Step 1: Check Browser Console
1. Open the admin customization tab: http://localhost:8081/admin
2. Press **F12** to open Developer Tools
3. Click the **Console** tab
4. Look for any red error messages
5. Share the errors if you see any

### Step 2: Check What's Loading
Open the console and type this to check what the context has loaded:

```javascript
// In browser console
localStorage.getItem('cached_user_role')
```

### Step 3: Force Refresh
1. Go to the customization tab
2. Press **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)
3. This does a hard refresh, clearing cache

### Step 4: Check Network Tab
1. Open F12 → Network tab
2. Reload the page
3. Look for any failed requests (red text)
4. Specifically check for `site_customization` requests

## Common Issues and Fixes

### Issue 1: Stuck on "Loading customization settings..."

**Cause**: The CustomizationContext might be stuck loading

**Fix**:
1. Open browser console (F12)
2. Type: `location.reload(true)`
3. Or just refresh the page

### Issue 2: Shows error "Unable to load customization settings"

**Cause**: The context failed to load defaults

**Fix**:
1. Check browser console for errors
2. Click the "Retry" button
3. If still failing, check Supabase connection

### Issue 3: Blank/White screen

**Cause**: JavaScript error preventing render

**Fix**:
1. Check browser console (F12)
2. Look for error stack trace
3. Share the error message

### Issue 4: Supabase errors in console

**Cause**: Database connection issue

**Fix**:
1. Check `.env` file has correct Supabase credentials
2. Verify Supabase project is running
3. Check internet connection

## Manual Debug Commands

Open browser console (F12) and run these one by one:

### Check if CustomizationContext is loaded:
```javascript
// Check React DevTools or run this in console
console.log('Checking customization...');
```

### Check Supabase connection:
```javascript
// In your code, the context should log warnings
// Check console for: "Customization table not found, using defaults"
```

### Force default values:
The system should automatically use defaults if the table doesn't exist. If you see the loading spinner forever, there might be a JavaScript error.

## What to Share if Still Stuck

Please provide:

1. **Browser Console Output** (F12 → Console tab)
   - Copy all messages (errors, warnings, logs)

2. **Network Tab Errors** (F12 → Network tab)
   - Any failed requests (red items)

3. **What You See**
   - Spinning loader forever?
   - Error message?
   - Blank screen?
   - Something else?

4. **Steps You Took**
   - What did you click?
   - Any error messages shown?

## Expected Behavior

### What SHOULD Happen:

1. **Navigate to** `/admin` → Customization tab
2. **See brief loading** (1-2 seconds max)
3. **See blue banner** saying "Database Migration Required" (if migration not run)
4. **See full interface** with:
   - Header with Save/Import/Export buttons
   - Theme Presets section (Light/Dark/Vibrant buttons)
   - Tabs: Theme, Typography, Layout, Components
   - Live Preview panel on the right

### If Migration NOT Run:
- ✅ Interface loads
- ✅ Blue info banner at top
- ✅ All features work
- ⚠️ Save button shows warning about persistence

### If Migration IS Run:
- ✅ Interface loads
- ✅ No blue banner
- ✅ All features work
- ✅ Save button persists changes

## Direct Code Check

Let me verify the code is correct. Check this file exists and has content:

```bash
# In terminal
ls -la src/contexts/CustomizationContext.tsx
cat src/contexts/CustomizationContext.tsx | grep "getDefaultTheme"
```

Should show the file exists and contains the `getDefaultTheme` function.

## Nuclear Option: Reset Everything

If nothing works, try this:

1. **Stop dev server** (Ctrl+C in terminal)
2. **Clear browser cache**
   - Chrome: Ctrl+Shift+Delete → Clear browsing data
3. **Clear local storage**
   - F12 → Application tab → Local Storage → Clear All
4. **Restart dev server**
   ```bash
   npm run dev
   ```
5. **Hard refresh browser**
   - Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

## Still Not Working?

If the customization tab is still stuck loading after all these steps:

1. Share your browser console output (F12 → Console)
2. Share any error messages you see
3. Let me know what step you're stuck on

I'll help debug further with that information!

---

**Note**: The system is designed to work WITHOUT the database migration using smart defaults. If it's stuck loading, there's likely a JavaScript error or network issue that we can debug together.
