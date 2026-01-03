# PWA Setup Guide

## Progressive Web App (PWA) Configuration for PeerSpark

This document outlines the PWA setup for PeerSpark, enabling installation as a mobile app and offline functionality.

## What's Included

### 1. **Web App Manifest** (`public/manifest.json`)
- Defines app metadata (name, icons, colors)
- Specifies app shortcuts and screenshots
- Enables standalone mode for app-like experience

### 2. **Service Worker** (`public/sw.js`)
- Offline support and caching strategies
- Background sync capabilities
- Push notification handling
- Asset caching for faster load times

### 3. **Service Worker Registration** (`public/sw-register.js`)
- Automatically registers the service worker
- Handles registration errors gracefully

### 4. **Next.js PWA Configuration** (`next.config.mjs`)
- Integrated next-pwa plugin
- Runtime caching for API calls and fonts
- Optimized cache strategies

### 5. **Meta Tags** (`app/layout.tsx`)
- Apple Web App meta tags
- Mobile viewport configuration
- Theme color specifications
- Open Graph and Twitter card support

### 6. **Browser Config** (`public/browserconfig.xml`)
- Windows tile configuration
- Mobile shortcut icons

### 7. **Install Prompt Component** (`components/pwa-install-prompt.tsx`)
- User-friendly installation prompt
- Dismissible UI
- Automatic detection of installed app

## Installation & Deployment

### Installation Steps

1. **Mobile Devices (iOS)**
   - Open Safari
   - Tap Share icon
   - Select "Add to Home Screen"
   - Name the app and add

2. **Mobile Devices (Android)**
   - Open in Chrome/Firefox
   - Tap Menu (three dots)
   - Select "Install app"
   - Follow the prompts

3. **Desktop (Chrome/Edge)**
   - Visit the app URL
   - Click the install icon in address bar
   - Confirm installation

### Key Features

- **Offline Support**: App works offline using cached assets
- **Fast Loading**: Service worker caches critical assets
- **Background Sync**: Queues actions for sync when online
- **Push Notifications**: Can receive notifications
- **App Shortcuts**: Quick access to dashboard and create pod
- **Responsive Design**: Works on all screen sizes

### Testing PWA

1. Run `pnpm build` to create production build
2. Run `pnpm start` to start production server
3. Open DevTools (F12) and check "Application" tab
4. Verify Service Worker is registered
5. Check Manifest is loaded
6. Test offline functionality

### Caching Strategy

- **Cache First**: Static assets (JS, CSS, images)
- **Network First**: API calls (with fallback to cache)
- **Stale While Revalidate**: Fonts and stylesheets
- **Runtime Cache**: Dynamic API responses

### Files Modified/Created

- ✅ `public/manifest.json` - Web app manifest
- ✅ `public/sw.js` - Service worker
- ✅ `public/sw-register.js` - Service worker registration
- ✅ `public/browserconfig.xml` - Windows tile config
- ✅ `app/layout.tsx` - PWA meta tags and viewport
- ✅ `next.config.mjs` - next-pwa configuration
- ✅ `components/pwa-install-prompt.tsx` - Install prompt UI
- ✅ Dependencies: `next-pwa`, `workbox-window`

### Mobile App Icons

The app uses existing assets:
- `public/placeholder-icon.png` - 192x192 icon
- `public/placeholder-logo.png` - 512x512 icon
- `public/favicon.ico` - Favicon

For production, replace these with your branded icons.

### Browser Support

- ✅ Chrome 50+
- ✅ Firefox 44+
- ✅ Safari 11.1+ (limited)
- ✅ Edge 17+
- ✅ Samsung Internet 5+

### Additional Improvements

Consider adding:
1. Custom app splash screens for iOS
2. Enhanced notification handling
3. Workbox strategies for more granular control
4. Analytics for installation tracking
5. Update notification when new version available

### Troubleshooting

**Service Worker not registering?**
- Check console for errors
- Verify app is served over HTTPS
- Clear browser cache and try again

**Icons not showing?**
- Verify icon files exist in public/
- Check manifest.json icon paths
- Clear browser cache

**Install prompt not showing?**
- Add the PWAInstallPrompt component to your main app page
- Ensure HTTPS is enabled
- App must meet PWA criteria (manifest + service worker)

## Production Deployment

When deploying to production:

1. Use HTTPS everywhere
2. Add proper error handling
3. Set up CDN caching
4. Monitor service worker updates
5. Test on multiple devices
6. Configure push notifications backend
