// Service Worker for background SMS monitoring
const CACHE_NAME = 'sms-scanner-v1';

// Install event
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for SMS processing
self.addEventListener('sync', event => {
  if (event.tag === 'sms-check') {
    event.waitUntil(processPendingSMS());
  }
});

// Message handling for SMS data
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SMS_RECEIVED') {
    handleSMSMessage(event.data.payload);
  }
});

async function processPendingSMS() {
  try {
    // This would interface with native Android SMS APIs
    console.log('Processing pending SMS messages...');
    
    // In a real implementation, this would:
    // 1. Read SMS messages from native Android APIs
    // 2. Parse transaction IDs using regex patterns
    // 3. Send to server via Supabase
    
    // For now, log that background processing is active
    console.log('Background SMS processing active');
  } catch (error) {
    console.error('Background SMS processing failed:', error);
  }
}

async function handleSMSMessage(smsData) {
  try {
    // Real Bangladesh Mobile Wallet SMS Pattern
    // Format: "You have received Tk 500.00 from 01954723595. Ref 95352. Fee Tk 0.00. Balance Tk 510.00. TrxID CI131K7A2D at 01/09/2025 11:32"
    const walletPattern = /You have received Tk\s*([0-9,.]+).*?Balance Tk\s*([0-9,.]+).*?TrxID\s*([A-Z0-9]+)/i;

    const message = smsData.message;
    const match = message.match(walletPattern);

    if (match) {
      const amount = match[1];
      const newBalance = match[2];
      const transactionId = match[3];
      
      console.log('Transaction found:', { transactionId, amount, newBalance });
      
      // Send to server with balance
      await sendTransactionToServer(transactionId, amount, newBalance, smsData);
      
      // Notify main app
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'TRANSACTION_FOUND',
            data: {
              transactionId,
              amount,
              newBalance,
              timestamp: smsData.timestamp
            }
          });
        });
      });
    }
  } catch (error) {
    console.error('SMS message handling failed:', error);
  }
}

async function sendTransactionToServer(transactionId, amount, newBalance, smsData) {
  try {
    // In a real implementation, this would send to Supabase
    console.log('Sending transaction to server:', {
      transactionId,
      amount,
      newBalance,
      timestamp: Date.now()
    });

    // This would be replaced with actual Supabase API call
    // using the transaction_verifications table
  } catch (error) {
    console.error('Failed to send transaction to server:', error);
  }
}

// Keep service worker alive
self.addEventListener('fetch', event => {
  // Don't interfere with normal requests
  return;
});
