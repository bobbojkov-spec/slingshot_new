# Project Icon Assets

This folder contains a comprehensive set of icons generated for your new project. These assets are optimized for web production, including support for various browsers, devices, and platforms.

## Files Included

### Favicons (Standard)
- `favicon.ico`: Standard multi-resolution icon for browsers (16x16, 32x32, 48x48).
- `favicon-16x16.png`: Smallest favicon for browser tabs.
- `favicon-32x32.png`: Standard favicon for browser tabs.
- `favicon-48x48.png`: Larger favicon for some desktop shortcuts.

### Apple Touch Icons (iOS)
- `apple-touch-icon.png`: Default icon for iPhone/iPad (180x180).
- `apple-touch-icon-57x57.png` to `apple-touch-icon-180x180.png`: Specific sizes for various iOS device generations.

### Android / PWA
- `android-chrome-192x192.png`: Icon for Android Chrome and PWA splash screens.
- `android-chrome-512x512.png`: High-resolution icon for PWA splash screens.

### Windows / Microsoft
- `mstile-150x150.png`: Icon for Windows tiles.

## Implementation Guide

To use these icons in your project, copy them to your web root (or an `assets/icons` folder) and add the following HTML to your `<head>` section:

```html
<!-- Standard Favicons -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">

<!-- Apple Touch Icons -->
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">

<!-- Android / PWA -->
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#ffffff">
```

*Note: You may need to create a `site.webmanifest` file to fully support Android/PWA features.*
