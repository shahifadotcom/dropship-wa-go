# Audio/Video Calling Feature - User Guide

## Overview
The calling feature enables registered users to make audio and video calls to other users through the platform. It requires an active subscription for making calls, but users can receive calls without a subscription.

## Features

### 1. Subscription System
- **Annual Plan (12 Months)**: 500 BDT

### 2. Call Types
- **Audio Calls**: Voice-only calls
- **Video Calls**: Video + audio calls with camera support

### 3. Real-time Chat
- Text messaging with other registered users
- Message history
- Read receipts
- Real-time delivery

### 4. Contacts Management
- Add contacts by phone number
- View online/offline status
- Quick access to call/chat

## How to Use

### For Users

#### Step 1: Purchase a Subscription
1. Browse to any calling subscription product in the store
2. Add to cart and complete checkout
3. Subscription activates automatically upon payment

#### Step 2: Access Calling Features
1. After login, you'll see a floating phone icon on the right side of the screen
2. Click the phone icon to open the calling interface

#### Step 3: Add Contacts
1. In the calling interface, enter a phone number to search for users
2. Click "Add Contact" to add them to your contacts list
3. Contacts appear in your list with quick action buttons

#### Step 4: Make a Call
1. From your contacts list, click the phone icon (audio) or video icon (video call)
2. Wait for the other user to answer
3. Use the controls during the call:
   - Mute/unmute microphone
   - Turn video on/off (video calls only)
   - End call button

#### Step 5: Chat with Contacts
1. Click the message icon for any contact
2. Type your message and press Enter or click Send
3. Messages appear in real-time

### For Non-Subscribers
- ✅ Can receive incoming calls
- ✅ Can chat with contacts
- ❌ Cannot initiate calls
- When attempting to make a call, you'll be prompted to purchase a subscription

## Technical Details

### System Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Stable internet connection (minimum 1 Mbps for audio, 3 Mbps for video)
- Microphone permission (for calls)
- Camera permission (for video calls)

### Server Requirements
The calling feature requires three servers to be running:
1. Main application (port 3000)
2. WhatsApp bridge (port 3001)
3. Calling server (port 3003)

All servers start automatically with `./start.sh`

### WebRTC Technology
The calling feature uses WebRTC for peer-to-peer connections:
- Low latency audio/video
- NAT traversal with STUN servers
- Secure encrypted connections

## Admin Panel

### Subscription Management
Admins can access the calling subscriptions page at `/admin/calling-subscriptions`

Features:
- View all subscriptions
- See subscription statistics
- Cancel active subscriptions
- Monitor revenue
- Track user activity

### Statistics Available
- Total subscriptions
- Active subscriptions
- Expired subscriptions
- Total revenue
- Days remaining for each subscription

## Troubleshooting

### Call Quality Issues
- Check internet connection speed
- Close other bandwidth-heavy applications
- Try disabling video to improve audio quality

### Cannot Make Calls
- Verify subscription is active
- Check subscription expiry date
- Ensure browser has microphone/camera permissions

### Cannot Find User
- Verify the phone number is registered
- User must have completed profile setup

### Connection Issues
- Ensure all three servers are running
- Check browser console for errors
- Verify firewall isn't blocking WebRTC

## Security & Privacy

### Data Protection
- All calls are encrypted with WebRTC
- Call logs are stored securely
- Personal information is protected with RLS policies

### Permissions
- Users can only view their own call logs
- Admins can manage all subscriptions
- Chat messages are private between users

### Subscription Validation
- Subscriptions are verified on every call attempt
- Expired subscriptions are automatically deactivated
- Backend validation prevents unauthorized calls

## API Integration

### Edge Functions
- `activate-calling-subscription`: Activates subscription after purchase
- Called automatically on order completion
- Handles subscription duration calculation

### Database Tables
- `calling_subscriptions`: User subscription data
- `call_logs`: Call history and statistics
- `chat_messages`: Message history
- `user_contacts`: User contact relationships

## Future Enhancements (Phase 6)
- Android app integration
- Push notifications for incoming calls
- Background service for always-on call reception
- Call recording (optional feature)
- Group calling
- Screen sharing
