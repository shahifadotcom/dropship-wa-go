# Audio/Video Calling Feature - Implementation Phases

## Phase 1: Database Setup ✅
- Create subscriptions table
- Create call_logs table
- Create chat_messages table
- Create user_contacts table
- Set up RLS policies

## Phase 2: Subscription Products 🚧
- Create calling subscription product in store
- Available in all countries (global)
- Pricing tiers:
  - 1 Month: 500 BDT
  - 3 Months: 1000 BDT
  - 6 Months: 2000 BDT
- Product visible to all users

## Phase 3: WebRTC Signaling Server 
- Node.js/Express server with Socket.IO
- Handle WebRTC signaling (offer, answer, ICE candidates)
- User presence management
- Call state management
- Add to start.sh script

## Phase 4: Frontend Calling Interface
- Floating call button (middle right side)
- Call initiation UI
- Incoming call notification
- Active call interface (audio/video controls)
- Subscription check before making calls

## Phase 5: Chat Functionality
- Real-time chat with other users
- Message history
- Online/offline status
- Typing indicators

## Phase 6: Mobile Integration
- Integrate with Android app
- Push notifications for incoming calls
- Background service for call reception
- Permission handling

## Current Status: Starting Phase 1
Creating database schema for subscriptions and calling features.
