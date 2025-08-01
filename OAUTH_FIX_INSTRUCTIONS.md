# OAuth Redirect Fix Instructions

## Problem
After Google OAuth login, the app redirects to `localhost:3000` instead of your Vercel deployment URL.

## Solution

### 1. Update Supabase OAuth Settings

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your project: `hovpbitodsfarvojjvqh`
3. Go to **Authentication** → **Providers**
4. Click on **Google** provider
5. Update the **Redirect URL** to include your Vercel deployment URL:

```
https://your-app-name.vercel.app
```

Replace `your-app-name` with your actual Vercel app name.

### 2. Add Multiple Redirect URLs (Optional)

You can add multiple redirect URLs for different environments:

```
http://localhost:3000
https://your-app-name.vercel.app
```

### 3. Code Changes Made

The following code changes have been implemented to handle OAuth redirects properly:

1. **Dynamic Redirect URL**: The app now uses `window.location.origin` to automatically detect the current domain
2. **OAuth Session Handling**: Added client-side handling for OAuth redirect tokens
3. **Improved Error Handling**: Better error messages for OAuth failures

### 4. Test the Fix

1. Deploy the updated code to Vercel
2. Try logging in with Google OAuth
3. Verify that you're redirected to your Vercel URL instead of localhost

### 5. Environment Variables (Optional)

If you want to use environment variables for the redirect URL, you can add:

```env
VITE_SUPABASE_REDIRECT_URL=https://your-app-name.vercel.app
```

And update the `getRedirectUrl()` function in `src/lib/supabase.ts`:

```typescript
const getRedirectUrl = () => {
  if (import.meta.env.VITE_SUPABASE_REDIRECT_URL) {
    return import.meta.env.VITE_SUPABASE_REDIRECT_URL;
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:3000';
};
```

## Important Notes

- The redirect URL in Supabase must exactly match your Vercel deployment URL
- Make sure to include the protocol (https://)
- Don't include trailing slashes
- Test the OAuth flow after making changes

## Troubleshooting

If you still have issues:

1. Check the browser console for OAuth errors
2. Verify the redirect URL in Supabase matches your Vercel URL exactly
3. Clear browser cache and cookies
4. Try in an incognito/private window 