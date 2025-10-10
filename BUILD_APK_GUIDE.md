# Android APK Build Guide

## Prerequisites
- Node.js (v16 or higher)
- Android Studio installed
- Java JDK 11 or higher

## Step 1: Setup Project

1. **Clone/Pull your project from GitHub**
```bash
git pull origin main
```

2. **Install dependencies**
```bash
npm install
```

3. **Build the web app**
```bash
npm run build
```

## Step 2: Add Android Platform

1. **Add Android platform** (if not already added)
```bash
npx cap add android
```

2. **Sync the project**
```bash
npx cap sync android
```

## Step 3: Configure Build Settings

The project is already configured with:
- App ID: `app.lovable.f56ea3cdbd454fa5a24347efbd454051`
- App Name: `shahifa`
- Minimum SDK: 23 (Android 6.0)
- Target SDK: 34 (Android 14)

## Step 4: Build APK

### Option A: Using Android Studio (Recommended)

1. **Open project in Android Studio**
```bash
npx cap open android
```

2. In Android Studio:
   - Wait for Gradle sync to complete
   - Go to **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
   - Wait for build to complete
   - Click "locate" in the notification to find your APK

The APK will be located at:
```
android-app/app/build/outputs/apk/debug/app-debug.apk
```

### Option B: Using Command Line

```bash
cd android-app
./gradlew assembleDebug
```

The APK will be at: `android-app/app/build/outputs/apk/debug/app-debug.apk`

## Step 5: Build Signed Release APK

### Generate Keystore (First time only)

```bash
keytool -genkey -v -keystore shahifa-release.keystore -alias shahifa -keyalg RSA -keysize 2048 -validity 10000
```

Save the keystore file securely and remember the passwords!

### Configure Signing

1. Create `android-app/keystore.properties`:
```properties
storeFile=../shahifa-release.keystore
storePassword=YOUR_STORE_PASSWORD
keyAlias=shahifa
keyPassword=YOUR_KEY_PASSWORD
```

2. Update `android-app/app/build.gradle`:
```gradle
android {
    ...
    signingConfigs {
        release {
            def keystorePropertiesFile = rootProject.file("keystore.properties")
            def keystoreProperties = new Properties()
            keystoreProperties.load(new FileInputStream(keystorePropertiesFile))

            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Build Signed APK

Using Android Studio:
- **Build** → **Generate Signed Bundle / APK**
- Select **APK**
- Choose your keystore and enter passwords
- Select **release** build variant
- Click **Finish**

Using command line:
```bash
cd android-app
./gradlew assembleRelease
```

Release APK location: `android-app/app/build/outputs/apk/release/app-release.apk`

## Troubleshooting

### Build Fails

1. **Clean the project**
```bash
cd android-app
./gradlew clean
```

2. **Sync Capacitor**
```bash
npx cap sync android
```

3. **Check Java version**
```bash
java -version
```
Should be Java 11 or higher

### App crashes on launch

1. **Check logs**
```bash
npx cap run android -l
```

2. **Verify permissions in AndroidManifest.xml**

3. **Check internet connectivity** (app needs to load from server URL)

### White screen on app open

1. Verify the server URL in `capacitor.config.ts`
2. Make sure `npm run build` was executed before sync
3. Check if the web app loads in a browser

## App Features

### Storefront Access
- App opens directly to the storefront (no login required)
- Users can browse products freely

### Calling Feature
- Bottom navigation has a blue call button
- Clicking call button opens calling interface
- Login/registration required to use calling
- After successful authentication, users can make audio/video calls

### SMS Monitoring (Background)
- Requires admin login (separate from calling)
- Monitors SMS for transaction IDs
- Admin can login via the web interface in the app

## Testing the APK

1. **Enable Developer Options** on your Android device
2. **Enable USB Debugging**
3. **Install the APK**
```bash
adb install android-app/app/build/outputs/apk/debug/app-debug.apk
```

Or transfer the APK to your device and install manually.

## Production Deployment

### Google Play Store

1. Build signed release APK (see above)
2. Create a Google Play Console account
3. Create a new app listing
4. Upload the signed APK
5. Fill in store listing details
6. Submit for review

### Alternative Distribution

- Host the APK on your website
- Share via Firebase App Distribution
- Use other app distribution platforms

## Important Notes

- The app loads content from: `https://f56ea3cd-bd45-4fa5-a243-47efbd454051.lovableproject.com`
- For production, update the server URL to your deployed domain
- Always test on real devices before releasing
- Keep your keystore file secure and backed up
- Never commit keystore files or passwords to version control

## Next Steps After Building

1. Test the APK thoroughly on different devices
2. Check all features work correctly
3. Verify calling functionality with multiple users
4. Test payment flows and checkout
5. Review performance and optimize if needed
