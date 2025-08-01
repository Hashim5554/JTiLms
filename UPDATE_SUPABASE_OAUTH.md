# Update Supabase OAuth Settings

## Critical: Update Supabase Dashboard Settings

The OAuth redirect is still pointing to `localhost:3000` because the Supabase project settings need to be updated.

### Step 1: Update Supabase OAuth Redirect URLs

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `hovpbitodsfarvojjvqh`
3. **Navigate to**: Authentication → Providers
4. **Click on Google provider**
5. **Update Redirect URLs** to include your Vercel URL:

```
http://localhost:3000
https://your-vercel-app-name.vercel.app
```

Replace `your-vercel-app-name` with your actual Vercel app name.

### Step 2: Get Your Vercel URL

1. Go to your Vercel dashboard
2. Find your project
3. Copy the deployment URL (e.g., `https://my-app-123.vercel.app`)

### Step 3: Update Google OAuth Settings

1. **In Supabase Dashboard**:
   - Go to Authentication → Providers → Google
   - Add your Vercel URL to the redirect URLs list
   - Save the changes

2. **In Google Cloud Console** (if needed):
   - Go to https://console.cloud.google.com
   - Navigate to APIs & Services → Credentials
   - Find your OAuth 2.0 Client ID
   - Add your Vercel URL to "Authorized redirect URIs"

### Step 4: Test the Fix

1. Deploy your updated code to Vercel
2. Try logging in with Google OAuth
3. Verify you're redirected to your Vercel URL

## Code Changes Made

The code has been updated to:
- ✅ Use `window.location.origin` for dynamic redirect URLs
- ✅ Handle OAuth tokens in URL hash
- ✅ Provide better error logging
- ✅ Remove localhost fallback

## Troubleshooting

If you still see localhost:3000:

1. **Check Supabase Settings**: Make sure your Vercel URL is added to the redirect URLs
2. **Clear Browser Cache**: Clear cookies and cache
3. **Test in Incognito**: Try in a private/incognito window
4. **Check Console**: Look for OAuth errors in browser console

## Example Supabase Redirect URLs

```
http://localhost:3000
https://my-app-123.vercel.app
https://my-app-git-main-username.vercel.app
```

Make sure to include both localhost (for development) and your Vercel URL (for production). 