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
  amount: string;
  newBalance: string;
  timestamp: number;
}

export const useAndroidSMS = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [transactionCount, setTransactionCount] = useState(0);
  const [lastTransaction, setLastTransaction] = useState<TransactionData | null>(null);

  // Real Bangladesh Mobile Wallet SMS Pattern
  const walletPattern = /You have received Tk\s*([0-9,.]+).*?Balance Tk\s*([0-9,.]+).*?TrxID\s*([A-Z0-9]+)/i;

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
    
    const match = message.match(walletPattern);
    if (match) {
      const amount = match[1];
      const newBalance = match[2];
      const transactionId = match[3];
      
      const transactionData: TransactionData = {
        transactionId,
        amount,
        newBalance,
        timestamp: smsData.timestamp
      };

      await sendTransactionToServer(transactionData);
      setLastTransaction(transactionData);
      setTransactionCount(prev => prev + 1);
      
      return true;
    }
    
    return false;
  };

  const sendTransactionToServer = async (transactionData: TransactionData) => {
    try {
      // Store in sms_transactions table with new balance
      const { error } = await supabase
        .from('sms_transactions')
        .insert({
          transaction_id: transactionData.transactionId,
          sender_number: 'wallet',
          message_content: `Transaction: ${transactionData.transactionId}, Amount: ${transactionData.amount}, Balance: ${transactionData.newBalance}`,
          wallet_type: 'unknown',
          amount: parseFloat(transactionData.amount.replace(/[,]/g, '')),
          new_balance: parseFloat(transactionData.newBalance.replace(/[,]/g, ''))
        });

      if (error) throw error;

      console.log('Transaction sent to server:', transactionData);
      toast.success(`Transaction ${transactionData.transactionId} (Amount: ${transactionData.amount}, Balance: ${transactionData.newBalance}) detected and sent to server`);
      
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