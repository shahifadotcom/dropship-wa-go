# SMS Scanner APK Build Instructions

## Complete Setup - Everything Included

All files are now in place. Follow these steps to build your APK:

## Step 1: Export & Setup

```bash
# Export project to GitHub (use the button in Lovable)
# Then clone and setup:
git clone <your-repo-url>
cd <your-project>
npm install
```

## Step 2: Add Android Platform

```bash
# Add Android platform
npx cap add android

# Update dependencies
npx cap update android

# Build the web assets
npm run build

# Sync everything
npx cap sync android
```

## Step 3: Build APK

### Option A: Using Android Studio (Recommended)
```bash
# Open in Android Studio
npx cap open android

# Then in Android Studio:
# 1. Wait for Gradle sync to complete
# 2. Go to: Build > Build Bundle(s) / APK(s) > Build APK(s)
# 3. APK will be in: android-app/app/build/outputs/apk/debug/app-debug.apk
```

### Option B: Using Command Line
```bash
# Navigate to android directory
cd android-app

# Build debug APK
./gradlew assembleDebug

# APK location: app/build/outputs/apk/debug/app-debug.apk
```

## Step 4: Install on Device

### Via USB:
```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

### Via File Transfer:
1. Copy `app-debug.apk` to your phone
2. Enable "Install from Unknown Sources" in Android settings
3. Tap the APK file to install

## What's Included

✅ **LoginActivity** - Native login screen with admin authentication  
✅ **MainActivity** - SMS scanner with auth check  
✅ **AuthTokenManager** - Secure token storage  
✅ **SMSReceiver** - Automatic SMS detection  
✅ **Layout Files** - All XML resources in correct locations  
✅ **Menu** - Logout option  
✅ **Dependencies** - All required libraries

## App Flow

1. **Launch**: App opens to login screen
2. **Login**: Enter admin email and password
3. **Verify**: System checks admin role in database
4. **Access**: SMS scanner loads if authenticated
5. **Monitor**: App receives and forwards SMS transactions
6. **Logout**: Menu option to log out and return to login

## Troubleshooting Build Issues

### Gradle Sync Failed
```bash
# Clean and rebuild
cd android-app
./gradlew clean
./gradlew build
```

### Missing SDK/Tools
- Install Android Studio
- Install Android SDK 34
- Install Build Tools 34.0.0

### Permission Errors on Mac/Linux
```bash
chmod +x gradlew
```

## Security Notes

🔒 **Admin Only**: Only users with admin role can log in  
🔒 **Secure Auth**: Uses Supabase authentication  
🔒 **Token Storage**: Tokens stored securely in Android  
🔒 **API Auth**: All SMS transactions authenticated  

## After Installation

1. Open app on your Android device
2. Enter your admin email (e.g., admin@shahifa.com)
3. Enter your admin password
4. Grant SMS permissions when prompted
5. App will start monitoring SMS transactions
6. Transactions automatically sent to your admin panel

## Testing

Test with this SMS format:
```
You have received Tk 500.00 from 01954723595. 
Ref 95352. Fee Tk 0.00. Balance Tk 510.00. 
TrxID CI131K7A2D at 01/09/2025 11:32
```

The app will:
- Detect the transaction
- Extract amount, balance, and transaction ID
- Send to your admin panel for verification
- Show notification of success

## Support

- Check logs: `adb logcat | grep "SMSReceiver\|LoginActivity\|MainActivity"`
- View app info: Settings > Apps > SMS Scanner Admin
- Clear data: Settings > Apps > SMS Scanner Admin > Storage > Clear Data
