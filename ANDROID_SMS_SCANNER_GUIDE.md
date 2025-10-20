# Android SMS Transaction Scanner

## Overview
Simplified Android app that automatically detects transaction IDs from wallet SMS messages and sends them directly to Supabase with extracted transaction details.

## Features
✅ Automatically detects wallet SMS (bKash, Nagad, Rocket)  
✅ Extracts transaction IDs (TrxID or Ref numbers)  
✅ **NEW:** Extracts amount, balance, fee, and sender phone  
✅ Sends directly to Supabase `sms_transactions` table  
✅ Shows notifications for detected transactions  
✅ No authentication required  
✅ Lightweight and simple  

## Extracted Data

The app extracts the following information from SMS:
- **Transaction ID**: TrxID or Ref number (e.g., `CI131K7A2D` or `95352`)
- **Amount**: Transaction amount (e.g., `Tk 500.00`)
- **Balance**: New balance after transaction (e.g., `Tk 510.00`)
- **Fee**: Transaction fee (e.g., `Tk 0.00`)
- **Sender Phone**: Sender's phone number (e.g., `01954723595`)
- **Wallet Type**: Detected wallet (bkash, nagad, rocket, or unknown)
- **Transaction Date**: Timestamp from SMS (e.g., `01/09/2025 11:32`)

## Example SMS Format

The app can handle SMS messages like:
```
You have received Tk 500.00 from 01954723595. 
Ref 95352. Fee Tk 0.00. Balance Tk 510.00. 
TrxID CI131K7A2D at 01/09/2025 11:32
```

Extracted data:
- Transaction ID: `CI131K7A2D`
- Amount: `500.00`
- Balance: `510.00`
- Fee: `0.00`
- Sender Phone: `01954723595`
- Wallet: `unknown` (or bkash/nagad/rocket if mentioned)

## How It Works

1. **App Startup**: Requests SMS permissions
2. **Background Monitoring**: Service monitors incoming SMS 24/7
3. **SMS Detection**: Identifies wallet transaction SMS
4. **Data Extraction**: Parses transaction details using regex patterns
5. **Send to Supabase**: Sends extracted data to edge function
6. **Database Storage**: Data stored in `sms_transactions` table
7. **Order Matching**: Automatically matches with pending orders

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
│   ├── SMSReceiver.java           - Detects SMS and extracts transaction data
│   └── SMSMonitorService.java     - Background monitoring service
└── AndroidManifest.xml            - App configuration and permissions
```

## Transaction Detection Patterns

### TrxID Pattern (Priority 1)
```
TrxID CI131K7A2D
TrxID AB12345678
```

### Ref Pattern (Priority 2)
```
Ref 95352
Ref 12345
```

### Data Extraction Patterns
- **Amount**: `Tk 500.00` or `BDT 500`
- **Balance**: `Balance Tk 510.00`
- **Fee**: `Fee Tk 0.00`
- **Phone**: `from 01954723595`
- **Date**: `at 01/09/2025 11:32`

## Supported Wallets
- **bKash** - Auto-detected from SMS content
- **Nagad** - Auto-detected from SMS content
- **Rocket** - Auto-detected from SMS content
- **Unknown** - Default if wallet type not detected

## Permissions Required
- `RECEIVE_SMS` - Listen for incoming SMS
- `READ_SMS` - Read SMS content
- `POST_NOTIFICATIONS` - Show transaction notifications
- `INTERNET` - Send data to Supabase
- `FOREGROUND_SERVICE` - Background monitoring

## Supabase Integration

### Edge Function
**Endpoint**: `https://mofwljpreecqqxkilywh.supabase.co/functions/v1/sms-transaction-local`

### Request Format
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

### Database Table: `sms_transactions`

Columns stored:
- `id` - UUID primary key
- `transaction_id` - Extracted transaction ID (unique)
- `sender_number` - SMS sender (e.g., "bKash")
- `sender_phone` - **NEW:** Extracted phone number
- `message_content` - Full SMS text
- `wallet_type` - Detected wallet (bkash/nagad/rocket/unknown)
- `amount` - **NEW:** Transaction amount
- `new_balance` - **NEW:** Balance after transaction
- `fee` - **NEW:** Transaction fee
- `transaction_date` - **NEW:** Parsed from SMS or timestamp
- `is_processed` - Whether matched with order
- `matched_order_id` - Linked order (if matched)
- `created_at` - Record creation time

### Automatic Order Matching

The system automatically:
1. Stores SMS transaction data
2. Calls `match_sms_transaction_with_order()` function
3. Searches for pending orders with matching transaction ID
4. Updates order status to "paid" when match found
5. Marks SMS transaction as processed

## Testing

### 1. Test SMS Format
Send this SMS to your device:
```
You have received Tk 500.00 from 01954723595. 
Ref 95352. Fee Tk 0.00. Balance Tk 510.00. 
TrxID CI131K7A2D at 01/09/2025 11:32
```

### 2. Check Android Logs
```bash
adb logcat | grep SMSReceiver
```

Expected output:
```
✓ Transaction ID detected: CI131K7A2D
✓ Found TrxID: CI131K7A2D
→ Sending to Supabase
← Response code: 200
✓ Transaction sent successfully
```

### 3. Verify in Supabase

**Check sms_transactions table:**
```sql
SELECT 
  transaction_id,
  wallet_type,
  amount,
  new_balance,
  fee,
  sender_phone,
  is_processed,
  transaction_date
FROM sms_transactions
ORDER BY created_at DESC
LIMIT 10;
```

**View unprocessed transactions:**
```sql
SELECT * FROM unprocessed_sms_transactions;
```

## Troubleshooting

### SMS Not Detected
- ✅ Ensure SMS permissions granted
- ✅ Check SMS contains "TrxID" or "Ref" keywords
- ✅ Verify wallet keywords present (bkash/nagad/rocket)
- ✅ View logs: `adb logcat | grep SMSReceiver`

### Data Not Extracting
- ✅ Check SMS format matches patterns
- ✅ View Supabase edge function logs
- ✅ Verify amount format: "Tk 500.00" or "BDT 500"
- ✅ Check balance format: "Balance Tk 510.00"

### Not Sending to Supabase
- ✅ Check internet connection
- ✅ Verify Supabase endpoint accessible
- ✅ Check edge function logs in Supabase dashboard
- ✅ Ensure anon key is correct in code

### App Crashes
- ✅ Run `npm install` after pulling
- ✅ Run `npx cap sync android` after code changes
- ✅ Check Android Studio logcat for errors
- ✅ Verify all dependencies installed

## Admin View

Admins can view unprocessed transactions in Supabase:

**SQL Query:**
```sql
SELECT 
  id,
  transaction_id,
  sender_phone,
  wallet_type,
  amount,
  fee,
  new_balance,
  message_content,
  created_at
FROM sms_transactions
WHERE is_processed = false
ORDER BY created_at DESC;
```

## Security

- ✅ **No credentials stored** - Uses anonymous Supabase key
- ✅ **RLS enabled** - Admin-only access to view data
- ✅ **Service role insert** - Android app can only insert
- ✅ **Duplicate prevention** - Unique constraint on transaction_id
- ✅ **Background processing** - Runs 24/7 without user interaction

## Notes

- App runs in background to monitor SMS continuously
- Notifications show when transactions detected
- Only processes wallet SMS, ignores others
- Automatically extracts all transaction details
- No manual input required from user
- Perfect for automated payment verification

## Building APK

To create installable APK:

```bash
# Build the project
npm run build

# Sync to Android
npx cap sync android

# Open in Android Studio
npx cap open android

# In Android Studio:
# Build > Build Bundle(s) / APK(s) > Build APK(s)
```

APK location: `android-app/app/build/outputs/apk/debug/app-debug.apk`
