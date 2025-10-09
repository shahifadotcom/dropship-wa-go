# WebRTC Calling Server

This is the WebRTC signaling server for the audio/video calling feature.

## Features

- WebRTC signaling (offer, answer, ICE candidates)
- User presence management
- Subscription verification
- Call state management
- Real-time communication using Socket.IO

## Setup

1. Install dependencies:
```bash
cd calling-server
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update the `.env` file with your Supabase credentials.

## Running

The server is automatically started by the `start.sh` script in the project root.

To run manually:
```bash
npm start
```

## API Events

### Client to Server

- `register` - Register user with their ID and access token
- `check-subscription` - Check if user has active subscription
- `call-user` - Initiate a call to another user
- `answer-call` - Answer an incoming call
- `decline-call` - Decline an incoming call
- `end-call` - End an active call
- `ice-candidate` - Exchange ICE candidates for WebRTC
- `get-online-users` - Get list of online users

### Server to Client

- `registered` - Confirmation of successful registration
- `subscription-status` - Subscription status response
- `incoming-call` - Notification of incoming call
- `call-answered` - Call was answered by recipient
- `call-declined` - Call was declined
- `call-ended` - Call was ended
- `user-offline` - Target user is offline
- `ice-candidate` - Received ICE candidate
- `online-users` - List of online users
- `user-status` - User online/offline status
- `error` - Error message

## Default Port

3001 (configurable via `CALLING_SERVER_PORT` environment variable)
