# Android SMS Scanner - Admin Login Setup

## Overview
The Android SMS scanner now requires admin authentication before use. The app has been updated with:

1. **Native Login Screen**: A new `LoginActivity` that shows first when the app starts
2. **Admin Verification**: Only users with admin role can access the SMS scanner
3. **Token Management**: Secure storage of authentication tokens for SMS transaction API calls

## Changes Made

### 1. New Files Created

#### `LoginActivity.java`
- Native Android login screen
- Authenticates with Supabase
- Verifies admin role
- Stores auth tokens securely

#### `activity_login.xml`
- Material Design login UI
- Email and password input fields
- Loading indicator and error messages

#### `AuthTokenManager.java`
- Manages auth token storage
- Provides JavaScript interface for WebView
- Used by SMS receiver to authenticate API calls

### 2. Modified Files

#### `MainActivity.java`
- Added authentication check on startup
- Redirects to login if not authenticated
- Registers AuthTokenManager for WebView

#### `AndroidManifest.xml`
- Made `LoginActivity` the launcher activity
- MainActivity now requires authentication

#### `build.gradle`
- Added Material Design library dependency

#### `SMSReceiver.java`
- Updated to use AuthTokenManager for token retrieval
- Shows notification if not authenticated

## How It Works

1. **App Launch**: LoginActivity is shown first
2. **Admin Login**: User enters admin email and password
3. **Authentication**: 
   - Calls Supabase auth API
   - Verifies user has admin role in `user_roles` table
4. **Token Storage**: Saves access and refresh tokens
5. **SMS Scanner**: MainActivity loads with authenticated session
6. **SMS Forwarding**: SMS receiver uses stored token to authenticate API calls

## Testing Instructions

### Prerequisites
- Export project to GitHub
- Run `git pull` to get latest changes
- Run `npm install` 
- Run `npx cap sync android`

### Build and Run
```bash
# Build the project
npm run build

# Sync to Android
npx cap sync android

# Run on device/emulator
npx cap run android
```

### Testing Login

1. **Valid Admin Login**:
   - Use your admin email and password
   - App should show success and navigate to main screen

2. **Non-Admin User**:
   - Use a regular user account
   - Should show "Access denied. Admin privileges required."

3. **Invalid Credentials**:
   - Use wrong password
   - Should show "Invalid credentials"

4. **Persistent Session**:
   - Close and reopen app
   - Should stay logged in (skip login screen)

## Security Features

✅ **Authentication Required**: SMS scanner only works when logged in  
✅ **Admin-Only Access**: Non-admin users are blocked  
✅ **Secure Token Storage**: Tokens stored in Android SharedPreferences  
✅ **Automatic Logout**: Tokens cleared on logout  
✅ **API Authentication**: All SMS transaction API calls include auth token

## File Structure

```
android-app/app/src/main/
├── java/.../
│   ├── LoginActivity.java          (NEW - Admin login screen)
│   ├── AuthTokenManager.java       (NEW - Token management)
│   ├── MainActivity.java           (MODIFIED - Auth check)
│   └── SMSReceiver.java           (MODIFIED - Uses AuthTokenManager)
├── res/layout/
│   └── activity_login.xml         (NEW - Login UI)
└── AndroidManifest.xml            (MODIFIED - LoginActivity launcher)
```

## Notes

- The layout file (`activity_login.xml`) needs to be created in the `res/layout` directory when you sync
- Material Design components require the dependency added in `build.gradle`
- Tokens are stored locally - logging out clears them
- Make sure to test both authenticated and unauthenticated SMS scenarios
