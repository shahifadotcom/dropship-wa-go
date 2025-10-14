# Comprehensive Fix Phases

## Phase 1: Order Success Page & URL ✅
- [x] Fix order-success page to handle missing orderId gracefully
- [x] Ensure URL shows only https://shahifa.com/order-success
- [x] Remove orderId from URL after order placement

## Phase 2: Admin Order Status Management ✅
- [x] Add status change dropdown in admin/orders page
- [x] Ensure status changes trigger proper notifications

## Phase 3: Notification System Refinement ✅
- [x] Send "confirmed" status notification to both admin and customer with full details
- [x] Send "processing" status notification to customer only with simple text
- [x] Send other status updates to customer only with simple text
- [x] Remove admin notification for non-confirmed statuses

## Phase 4: Review System Enhancements 🔄
- [x] Add approval system for product reviews (status: pending/approved/rejected)
- [ ] Create admin UI for review moderation
- [ ] Add custom review creation for admin
- [ ] Fix review image upload visibility
- [ ] Show "pending approval" message after review submission

## Phase 5: Binance Payment Manual/Auto Mode 🔄
- [ ] Add verification_mode field to binance_config (manual/auto)
- [ ] Update PaymentSelector to show Binance Pay ID for manual mode
- [ ] Update PaymentSelector to auto-verify for auto mode
- [ ] Show proper instructions based on selected mode

## Phase 6: SMS Transaction Scanner Fixes 🔄
- [ ] Update Android SMS server URL to 161.97.169.64:3000
- [ ] Make sms-transaction-handler public (no JWT required)
- [ ] Update SMSReceiver.java to use correct server IP
- [ ] Update AndroidApp.tsx to show correct server URL

## Phase 7: Store Branding Public Access 🔄
- [ ] Ensure store_settings_public is synced on every admin settings save
- [ ] Add trigger to auto-sync public settings on store_settings update
- [ ] Verify favicon and logo show without login

## Phase 8: OTP Rate Limit Removal ✅
- [x] Remove check_otp_rate_limit function
- [x] Remove rate limit check from send-otp edge function

## Current Status: Implementing Phases 4-8