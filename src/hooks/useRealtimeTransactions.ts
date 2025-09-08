import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RealtimeTransaction {
  id: string;
  transaction_id: string;
  payment_gateway: string;
  amount: number;
  status: string;
  order_id: string;
  created_at: string;
  verified_at?: string;
}

export const useRealtimeTransactions = () => {
  const [transactions, setTransactions] = useState<RealtimeTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    loadTransactions();

    // Set up real-time subscription for transaction updates
    const channel = supabase
      .channel('transaction-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transaction_verifications'
        },
        (payload) => {
          console.log('Real-time transaction update:', payload);
          handleRealtimeUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transaction_verifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setTransactions(data || []);
      setPendingCount(data?.filter(t => t.status === 'pending').length || 0);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRealtimeUpdate = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
      case 'INSERT':
        setTransactions(prev => [newRecord, ...prev]);
        setPendingCount(prev => prev + 1);
        
        // Show notification for new transaction
        toast.info(`New ${newRecord.payment_gateway} transaction: ${newRecord.transaction_id}`);
        
        // Play notification sound if available
        if ('Audio' in window) {
          try {
            const audio = new Audio('/notification.mp3');
            audio.play().catch(() => {}); // Ignore if audio fails
          } catch (e) {}
        }
        break;

      case 'UPDATE':
        setTransactions(prev => 
          prev.map(transaction => 
            transaction.id === newRecord.id ? newRecord : transaction
          )
        );
        
        // Update pending count
        if (oldRecord.status === 'pending' && newRecord.status !== 'pending') {
          setPendingCount(prev => Math.max(0, prev - 1));
        } else if (oldRecord.status !== 'pending' && newRecord.status === 'pending') {
          setPendingCount(prev => prev + 1);
        }

        // Notify about verification status changes
        if (oldRecord.status !== newRecord.status) {
          const statusColor = newRecord.status === 'verified' ? 'success' : 
                            newRecord.status === 'failed' ? 'error' : 'info';
          
          if (newRecord.status === 'verified') {
            toast.success(`Transaction ${newRecord.transaction_id} verified!`);
          } else if (newRecord.status === 'failed') {
            toast.error(`Transaction ${newRecord.transaction_id} rejected`);
          }
        }
        break;

      case 'DELETE':
        setTransactions(prev => {
          const filtered = prev.filter(transaction => transaction.id !== oldRecord.id);
          if (oldRecord.status === 'pending') {
            setPendingCount(prevCount => Math.max(0, prevCount - 1));
          }
          return filtered;
        });
        break;
    }
  };

  return {
    transactions,
    isLoading,
    pendingCount,
    refetch: loadTransactions
  };
};