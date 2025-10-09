# Capacitor Calling Feature Setup

## Overview
The calling feature is already implemented in the React web app. This guide shows how to add it to your Capacitor Android/iOS app.

## What's Already Done ✅
- ✅ Floating call button in web app (`CallButton.tsx`)
- ✅ Full calling interface with WebRTC
- ✅ Chat functionality
- ✅ Contact management
- ✅ Subscription system
- ✅ Admin dashboard

## Setup Instructions for Android App

### Step 1: Export to GitHub & Clone
1. Click "Export to GitHub" in Lovable
2. Clone your repository locally:
```bash
git clone <your-repo-url>
cd <your-repo-name>
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Add Android Platform
```bash
npx cap add android
```

This creates an `android/` folder with your Capacitor Android app.

### Step 4: Add Required Permissions
Edit `android/app/src/main/AndroidManifest.xml` and add these permissions after the opening `<manifest>` tag:

```xml
<!-- Camera and Microphone Permissions for Calling -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />

<!-- Features -->
<uses-feature android:name="android.hardware.camera" android:required="false" />
<uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />
<uses-feature android:name="android.hardware.microphone" android:required="true" />
```

### Step 5: Build and Sync
```bash
npm run build
npx cap sync android
```

### Step 6: Run on Device/Emulator
```bash
npx cap run android
```

Or open in Android Studio:
```bash
npx cap open android
```

## How It Works

1. **User opens the app** → React app loads with all features
2. **User clicks the floating phone icon** (bottom right) → Calls feature UI appears
3. **User can:**
   - Add contacts by phone number
   - Make audio/video calls
   - Send real-time messages
   - View subscription status

## Permissions Handling

The app will automatically request permissions when:
- User tries to make an audio call → requests RECORD_AUDIO
- User tries to make a video call → requests CAMERA + RECORD_AUDIO

## Testing the Feature

### On Android Device:
1. Install the app on 2 devices
2. Both users need active calling subscriptions
3. User A adds User B as contact
4. User A initiates call
5. User B receives notification and can answer

### Requirements:
- Both users must have active calling subscriptions
- Both users need internet connection
- Calling server must be running on `localhost:3003` (configured in `src/pages/Calling.tsx`)

## Signaling Server

The calling feature needs the signaling server running:

```bash
cd calling-server
npm install
node server.js
```

For production, deploy this to a cloud server and update the URL in:
- `src/pages/Calling.tsx` (line 11)

## iOS Setup

Similar process for iOS:

```bash
npx cap add ios
npx cap sync ios
npx cap open ios
```

Add to `ios/App/App/Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>We need camera access for video calls</string>
<key>NSMicrophoneUsageDescription</key>
<string>We need microphone access for audio/video calls</string>
```

## Troubleshooting

### Camera/Microphone not working
- Check permissions are granted in device settings
- Verify `handlePermissions: true` in capacitor.config.ts
- Test on real device (emulators may not have camera/mic)

### Calls not connecting
- Verify both users have active subscriptions
- Check calling server is running and accessible
- Check STUN server configuration in `Calling.tsx`

### Build errors
- Run `npx cap sync` after any code changes
- Clean build: `cd android && ./gradlew clean`
- Update Capacitor: `npm install @capacitor/core@latest @capacitor/cli@latest`

## Production Deployment

1. **Build the web app:**
```bash
npm run build
```

2. **Sync to native:**
```bash
npx cap sync
```

3. **Generate signed APK:**
```bash
cd android
./gradlew assembleRelease
```

4. **Upload to Google Play Store**

## Notes

- The calling feature works seamlessly - users see it as part of the main app
- No separate app needed - it's integrated into your e-commerce platform
- The SMS scanner app (`android-app/`) remains separate for payment verification only
