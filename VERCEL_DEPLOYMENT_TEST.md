# Vercel Deployment Test Guide

## Step 1: Check Your Vercel Deployment

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Find your project** in the list
3. **Check deployment status** - should be green/successful
4. **Copy the deployment URL** (e.g., `https://my-app-123.vercel.app`)

## Step 2: Test the Deployment URL

1. **Open the URL** in a browser
2. **Check if it loads** - should show your app
3. **If it doesn't load**, the deployment failed

## Step 3: Update Supabase Settings

### For Localhost (Development):
```
Site URL: http://localhost:3000
```

### For Vercel (Production):
```
Site URL: https://your-vercel-app-name.vercel.app
```

## Step 4: Test OAuth

### Test Localhost:
1. Run `npm run dev`
2. Go to `http://localhost:3000`
3. Try Google OAuth login
4. Should redirect back to `http://localhost:3000`

### Test Vercel:
1. Go to your Vercel URL
2. Try Google OAuth login
3. Should redirect back to your Vercel URL

## Troubleshooting

### If localhost keeps loading:
- Clear browser cache and cookies
- Try incognito/private window
- Check browser console for errors

### If Vercel gives "requested path is invalid":
- Verify the Vercel URL is correct
- Make sure deployment is successful
- Check if the URL loads in browser

### If OAuth fails:
- Check Supabase Site URL setting
- Verify Google OAuth is configured
- Check browser console for OAuth errors

## Common Issues

1. **"requested path is invalid"** - Vercel URL is wrong or deployment failed
2. **Endless loading** - OAuth redirect URL mismatch
3. **OAuth errors** - Supabase Site URL not set correctly

## Get Help

If you're still having issues:
1. Share your Vercel deployment URL
2. Share any error messages from browser console
3. Check if the Vercel deployment is successful 