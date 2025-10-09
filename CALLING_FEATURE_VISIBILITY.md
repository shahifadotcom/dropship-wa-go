# Calling Feature Visibility Rules

## Overview
The audio/video calling feature is **ONLY** visible to users on the **native mobile app** (Android/iOS built with Capacitor). Browser users will not see any calling features.

## Visibility Matrix

| Platform | Calling Visible? | Notes |
|----------|-----------------|-------|
| Browser (Desktop) | ❌ NO | Hidden completely |
| Browser (Mobile) | ❌ NO | Hidden completely |
| Android Native App | ✅ YES | Via Capacitor |
| iOS Native App | ✅ YES | Via Capacitor |
| SMS Scanner App | ❌ NO | Separate app, payment only |

## How It Works

### Detection Logic
The `CallButton` component uses Capacitor's platform detection:

```typescript
import { Capacitor } from '@capacitor/core';

const isNativeApp = Capacitor.isNativePlatform();

// Only render if:
// 1. User is logged in
// 2. Running in native app (not browser)
if (!user || !isNativeApp) return null;
```

### What Browser Users See
- ✅ All e-commerce features (products, cart, checkout)
- ✅ Payment methods (mobile wallets, PayPal, etc.)
- ✅ Order management
- ✅ Profile settings
- ❌ NO calling icon
- ❌ NO chat interface
- ❌ NO contacts list

### What Native App Users See
- ✅ All e-commerce features
- ✅ All payment methods
- ✅ Floating call button (right side)
- ✅ Audio/video calling
- ✅ Real-time chat
- ✅ Contact management
- ✅ Subscription management

## Apps Explained

### 1. Main E-commerce Platform (This Project)
**Location:** Root directory (React + Capacitor)
**Purpose:** Full e-commerce platform with calling feature
**Platforms:** 
- Web (browser) - No calling
- Android (Capacitor) - Has calling
- iOS (Capacitor) - Has calling

### 2. SMS Scanner App (Separate)
**Location:** `android-app/` folder
**Purpose:** Payment verification only
**Platforms:** Android only
**Features:** 
- ✅ SMS monitoring for transactions
- ✅ Auto-match orders with payments
- ❌ NO calling features
- ❌ NO e-commerce features

## Building Native App with Calling

### Prerequisites
```bash
npm install
npm install @capacitor/core @capacitor/cli @capacitor/android
```

### Add Platform
```bash
npx cap add android  # For Android
npx cap add ios      # For iOS
```

### Build & Run
```bash
npm run build
npx cap sync android
npx cap run android
```

### Verify Calling Works
1. Install app on device
2. Login to your account
3. Look for floating phone icon on right side
4. Click to access calling features

## Testing Scenarios

### Scenario 1: Browser User
1. Open app in Chrome/Safari
2. Login
3. Browse products
4. Make purchase
5. **Cannot see calling icon** ✅ Expected

### Scenario 2: Native App User (No Subscription)
1. Open Capacitor Android app
2. Login
3. See floating phone icon
4. Click icon
5. Redirected to subscription purchase page ✅ Expected

### Scenario 3: Native App User (With Subscription)
1. Open Capacitor Android app
2. Login (has active subscription)
3. See floating phone icon
4. Click icon
5. Can add contacts, make calls, send messages ✅ Expected

## Why This Design?

### Security
- Calling requires active subscription verification
- Native apps provide better permission handling
- Browser WebRTC can be unreliable across devices

### User Experience
- Mobile calling is more intuitive on native apps
- Better integration with device features
- Push notifications work better in native apps

### Performance
- Native apps handle WebRTC better
- More reliable camera/microphone access
- Better battery management

## Troubleshooting

### "I don't see the calling icon"
✅ **Expected** if you're in a browser
✅ Only visible in Capacitor native apps

### "Calling icon appears in browser"
❌ This is a bug - check `Capacitor.isNativePlatform()` is working

### "SMS Scanner app shows calling"
❌ This is wrong - SMS scanner should only handle payment verification

## Summary

🌐 **Browser** = E-commerce only, no calling
📱 **Native App** = E-commerce + calling features
📨 **SMS Scanner** = Payment verification only

All three are separate with distinct purposes!
