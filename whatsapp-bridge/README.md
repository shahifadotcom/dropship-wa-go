# WhatsApp Bridge Server

A Node.js bridge server that connects your Supabase Edge Functions to real WhatsApp Web.js for genuine QR code generation and message sending.

## Setup

1. Install dependencies:
```bash
cd whatsapp-bridge
npm install
```

2. Start the server:
```bash
npm start
```

3. The server will run on port 3001 by default

## API Endpoints

- `GET /status` - Check WhatsApp connection status
- `POST /initialize` - Generate real WhatsApp QR code
- `POST /send-message` - Send WhatsApp message
- `POST /disconnect` - Disconnect WhatsApp session

## Usage with Supabase

Once running, update your Supabase secret `WHATSAPP_BRIDGE_URL` to point to this server:
- Local: `http://localhost:3001`
- Production: `http://your-server-ip:3001`

## Security

For production use, consider:
- Adding API key authentication
- Using HTTPS
- Firewall restrictions
- Running behind a reverse proxy

## Deployment

You can deploy this to:
- VPS (recommended)
- Railway
- Render
- DigitalOcean App Platform
- Any Node.js hosting service