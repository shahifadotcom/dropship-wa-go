# Android SMS Transaction Scanner

## Overview
Simple Android app that automatically detects transaction IDs from SMS messages and sends them directly to Supabase.

## Features
✅ Automatically detects wallet SMS (bKash, Nagad, Rocket)  
✅ Extracts transaction IDs (TrxID or Ref numbers)  
✅ Sends directly to Supabase sms_transactions table  
✅ Shows notifications for detected transactions  
✅ No authentication required  

## How It Works
1. App requests SMS permissions on startup
2. Background service monitors incoming SMS
3. When wallet SMS detected, extracts transaction ID
4. Sends to Supabase edge function: `sms-transaction-local`
5. Data stored in `sms_transactions` table

## Setup Instructions

### 1. Export and Pull Project
```bash
# Export to GitHub via Lovable UI
# Then pull to local machine
git pull
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Build and Sync
```bash
npm run build
npx cap sync android
```

### 4. Run on Device/Emulator
```bash
npx cap run android
```

Or open in Android Studio:
```bash
npx cap open android
```

## File Structure
```
android-app/app/src/main/
├── java/.../
│   ├── MainActivity.java           - Main activity, requests permissions
│   ├── SMSReceiver.java           - Detects SMS and extracts transaction ID
│   └── SMSMonitorService.java     - Background monitoring service
└── AndroidManifest.xml            - App configuration and permissions
```

## Transaction Detection Patterns

The app detects these transaction formats:

**TrxID Pattern:**
```
TrxID CI131K7A2D at 01/09/2025
```

**Ref Pattern:**
```
Ref 95352
```

## Supported Wallets
- bKash
- Nagad
- Rocket
- DBBL (Dutch-Bangla Bank)

## Permissions Required
- `RECEIVE_SMS` - Listen for incoming SMS
- `READ_SMS` - Read SMS content
- `POST_NOTIFICATIONS` - Show transaction notifications
- `INTERNET` - Send data to Supabase
- `FOREGROUND_SERVICE` - Background monitoring

## Supabase Integration

### Edge Function
Endpoint: `https://mofwljpreecqqxkilywh.supabase.co/functions/v1/sms-transaction-local`

### Data Format
```json
{
  "smsData": {
    "transaction_id": "CI131K7A2D",
    "sender_number": "bKash",
    "message_content": "Full SMS text...",
    "timestamp": 1673456789000
  }
}
```

### Database Table
Table: `sms_transactions`
- `transaction_id` - Extracted transaction ID
- `sender_number` - SMS sender
- `message_content` - Full SMS text
- `timestamp` - When SMS was received
- `wallet_type` - Detected wallet (bkash/nagad/rocket)

## Testing

### Test SMS Format
Send a test SMS to your device:
```
You have received Tk 500 from 01812345678.
TrxID CI131K7A2D at 01/09/2025 8:45 PM
Balance Tk 1,234.56
```

### Check Logs
```bash
# View Android logs
adb logcat | grep SMSReceiver
```

### Verify in Supabase
Check the `sms_transactions` table in Supabase dashboard to confirm data is being stored.

## Troubleshooting

### SMS Not Detected
- Ensure SMS permissions are granted
- Check if SMS contains "TrxID" or "Ref" keywords
- View logs: `adb logcat | grep SMSReceiver`

### Not Sending to Supabase
- Check internet connection
- Verify Supabase endpoint is accessible
- Check edge function logs in Supabase dashboard

### App Crashes
- Ensure all dependencies are installed
- Run `npx cap sync android` after code changes
- Check Android Studio logcat for detailed errors

## Notes
- App runs in background to monitor SMS 24/7
- Notifications show when transactions are detected
- No authentication required - simplified for ease of use
- Only processes wallet SMS, ignores other messages
