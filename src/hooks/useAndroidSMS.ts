import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SMSData {
  sender: string;
  message: string;
  timestamp: number;
}

interface TransactionData {
  transactionId: string;
  gateway: string;
  amount: string;
  timestamp: number;
}

export const useAndroidSMS = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [transactionCount, setTransactionCount] = useState(0);
  const [lastTransaction, setLastTransaction] = useState<TransactionData | null>(null);

  // SMS patterns for Bangladesh payment gateways
  const patterns = {
    bkash: /bKash.*?(?:TrxID|Transaction ID):?\s*([A-Z0-9]+).*?(?:Amount|Tk):?\s*([0-9,.]+)/i,
    nagad: /Nagad.*?(?:TxnId|Transaction):?\s*([A-Z0-9]+).*?(?:Amount|Tk):?\s*([0-9,.]+)/i,
    rocket: /Rocket.*?(?:TxID|Reference):?\s*([A-Z0-9]+).*?(?:Amount|Tk):?\s*([0-9,.]+)/i,
    upay: /Upay.*?(?:TxnId|Transaction):?\s*([A-Z0-9]+).*?(?:Amount|Tk):?\s*([0-9,.]+)/i,
    mcash: /mCash.*?(?:TxID|Reference):?\s*([A-Z0-9]+).*?(?:Amount|Tk):?\s*([0-9,.]+)/i,
  };

  useEffect(() => {
    if (isMonitoring) {
      startSMSMonitoring();
    } else {
      stopSMSMonitoring();
    }

    return () => {
      stopSMSMonitoring();
    };
  }, [isMonitoring]);

  const startSMSMonitoring = () => {
    // Register service worker for background operation
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(registration => {
        console.log('Service Worker registered for SMS monitoring');

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

        // Start periodic sync for background SMS checking
        if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
          (registration as any).sync?.register('sms-check');
        }
      }).catch(error => {
        console.error('Service Worker registration failed:', error);
      });
    }

    // For web environment, simulate SMS monitoring
    if (!('Android' in window)) {
      simulateWebSMSMonitoring();
    }
  };

  const stopSMSMonitoring = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    }
  };

  const handleServiceWorkerMessage = (event: MessageEvent) => {
    if (event.data && event.data.type === 'TRANSACTION_FOUND') {
      const transactionData = event.data.data;
      processTransaction(transactionData);
    }
  };

  const simulateWebSMSMonitoring = () => {
    console.log('Starting web SMS simulation...');
    // This is for testing in web environment
    // Real Android implementation would use native SMS APIs
  };

  const processSMSMessage = async (smsData: SMSData): Promise<boolean> => {
    const { message } = smsData;
    
    for (const [gateway, pattern] of Object.entries(patterns)) {
      const match = message.match(pattern);
      if (match) {
        const transactionId = match[1];
        const amount = match[2];
        
        const transactionData: TransactionData = {
          transactionId,
          gateway,
          amount,
          timestamp: smsData.timestamp
        };

        await sendTransactionToServer(transactionData);
        setLastTransaction(transactionData);
        setTransactionCount(prev => prev + 1);
        
        return true;
      }
    }
    
    return false;
  };

  const sendTransactionToServer = async (transactionData: TransactionData) => {
    try {
      // Store in transaction_verifications table for matching
      const { error } = await supabase
        .from('transaction_verifications')
        .insert({
          transaction_id: transactionData.transactionId,
          payment_gateway: transactionData.gateway,
          amount: parseFloat(transactionData.amount.replace(/[,]/g, '')),
          status: 'pending'
        });

      if (error) throw error;

      console.log('Transaction sent to server:', transactionData);
      toast.success(`Transaction ${transactionData.transactionId} detected and sent to server`);
      
    } catch (error) {
      console.error('Failed to send transaction to server:', error);
      toast.error('Failed to send transaction to server');
    }
  };

  const processTransaction = (transactionData: any) => {
    setLastTransaction(transactionData);
    setTransactionCount(prev => prev + 1);
    toast.success(`New transaction detected: ${transactionData.transactionId}`);
  };

  const startMonitoring = () => {
    setIsMonitoring(true);
    toast.success('SMS monitoring started');
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    toast.info('SMS monitoring stopped');
  };

  return {
    isMonitoring,
    transactionCount,
    lastTransaction,
    startMonitoring,
    stopMonitoring,
    processSMSMessage,
  };
};