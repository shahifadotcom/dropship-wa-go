const express = require('express');
const cors = require('cors');
const { Client, RemoteAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

let client;
let currentQR = null;
let isReady = false;
let isInitializing = false;

// Initialize WhatsApp client
function initializeClient() {
    if (isInitializing) {
        return Promise.resolve(currentQR);
    }

    isInitializing = true;
    
    return new Promise((resolve, reject) => {
        client = new Client({
            authStrategy: new RemoteAuth({
                clientId: 'whatsapp-client',
                dataPath: './.wwebjs_auth'
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            }
        });

        client.on('qr', (qr) => {
            console.log('QR Code received');
            currentQR = qr;
            qrcode.generate(qr, { small: true });
            resolve(qr);
        });

        client.on('ready', () => {
            console.log('WhatsApp client is ready!');
            isReady = true;
            isInitializing = false;
            currentQR = null;
        });

        client.on('authenticated', () => {
            console.log('WhatsApp client authenticated');
        });

        client.on('auth_failure', (msg) => {
            console.error('Authentication failed:', msg);
            isInitializing = false;
            reject(new Error('Authentication failed'));
        });

        client.on('disconnected', (reason) => {
            console.log('Client was logged out:', reason);
            isReady = false;
            currentQR = null;
            client = null;
        });

        client.initialize();

        // Timeout after 2 minutes
        setTimeout(() => {
            if (!currentQR && !isReady) {
                isInitializing = false;
                reject(new Error('Initialization timeout'));
            }
        }, 120000);
    });
}

// API Routes
app.get('/status', (req, res) => {
    res.json({
        isReady,
        qrCode: currentQR,
        isInitializing
    });
});

app.post('/initialize', async (req, res) => {
    try {
        if (isReady) {
            return res.json({
                success: true,
                message: 'WhatsApp is already connected',
                isReady: true
            });
        }

        const qr = await initializeClient();
        res.json({
            success: true,
            qrCode: qr,
            message: 'QR code generated'
        });
    } catch (error) {
        console.error('Initialization error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/send-message', async (req, res) => {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
        return res.status(400).json({
            success: false,
            error: 'Phone number and message are required'
        });
    }

    if (!isReady || !client) {
        return res.status(400).json({
            success: false,
            error: 'WhatsApp client is not ready'
        });
    }

    try {
        // Format phone number (remove any non-digits and add country code if needed)
        const formattedNumber = phoneNumber.replace(/\D/g, '');
        const chatId = `${formattedNumber}@c.us`;

        await client.sendMessage(chatId, message);
        
        res.json({
            success: true,
            messageId: `msg_${Date.now()}`,
            timestamp: Date.now()
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/disconnect', async (req, res) => {
    try {
        if (client) {
            await client.logout();
            client = null;
        }
        isReady = false;
        currentQR = null;
        isInitializing = false;

        res.json({
            success: true,
            message: 'Disconnected successfully'
        });
    } catch (error) {
        console.error('Disconnect error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.listen(port, () => {
    console.log(`WhatsApp Bridge Server running on port ${port}`);
    console.log('Available endpoints:');
    console.log(`  GET  /status - Check connection status`);
    console.log(`  POST /initialize - Generate QR code`);
    console.log(`  POST /send-message - Send WhatsApp message`);
    console.log(`  POST /disconnect - Disconnect WhatsApp`);
});