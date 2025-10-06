# Logo Setup Guide

## 📁 Where to Place Your Logo

Place your logo PNG file in the `public` folder:

```
module-rp-fireforce-web/
├── public/
│   └── logo.png          ← Put your logo here!
├── src/
│   └── ...
```

**Full path:** `/Users/seanreptimiguell.ticzon/RP-FireForce/module-rp-fireforce-web/public/logo.png`

## 📐 Recommended Logo Specifications

### For Best Results:

1. **Format:** PNG with transparent background
2. **Size:** 512x512 pixels (or square aspect ratio)
3. **File size:** Keep under 200KB for fast loading
4. **Background:** Transparent (so it works on any background color)

### Alternative Sizes:

- **Small version:** 128x128px → Save as `logo-small.png` (optional)
- **Large version:** 1024x1024px → Save as `logo-large.png` (optional)

## 🎨 Logo Usage in the App

Your logo will appear in:

1. **Login Page Header** (40x40px display)
2. **Side Navigation** (32x32px display when expanded, 32x32px when collapsed)

The code automatically scales your image to fit these dimensions.

## ✅ After Placing the Logo

1. Put your `logo.png` in the `public` folder
2. Refresh your browser (Ctrl+R or Cmd+R)
3. Your logo will automatically appear!

## 🔧 Customization Options

### If your logo needs different sizing:

**LoginPage.jsx:**
```jsx
<img src="/logo.png" alt="FireForce Logo" className="w-10 h-10" />
// Change w-10 h-10 to your desired size (w-12 h-12, w-16 h-16, etc.)
```

**SideNavigation.jsx:**
```jsx
<img src="/logo.png" alt="FireForce Logo" className="w-8 h-8" />
// Change w-8 h-8 to your desired size
```

### If your logo is not square:

Add `object-contain` or `object-cover`:
```jsx
<img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
```

## 📝 File Naming Options

You can use any of these names (update the code accordingly):
- `logo.png` ← Recommended
- `fireforce-logo.png`
- `company-logo.png`
- `brand.png`

Just make sure to update the `src="/logo.png"` in both files to match your filename!

## 🎉 That's It!

Your real logo will now appear throughout the application instead of the flame icon!
