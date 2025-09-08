import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface RealtimeOrder {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total: number;
  created_at: string;
  updated_at: string;
  customer_id: string;
}

export const useRealtimeOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<RealtimeOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Load initial orders
    loadOrders();

    // Set up real-time subscription
    const channel = supabase
      .channel('order-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'orders',
          filter: `customer_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time order update:', payload);
          handleRealtimeUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRealtimeUpdate = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
      case 'INSERT':
        setOrders(prev => [newRecord, ...prev]);
        toast.success(`New order created: ${newRecord.order_number}`);
        break;

      case 'UPDATE':
        setOrders(prev => 
          prev.map(order => 
            order.id === newRecord.id ? newRecord : order
          )
        );
        
        // Notify about status changes
        if (oldRecord.status !== newRecord.status) {
          toast.info(`Order ${newRecord.order_number} status updated: ${newRecord.status}`);
        }
        if (oldRecord.payment_status !== newRecord.payment_status) {
          toast.success(`Payment ${newRecord.payment_status} for order ${newRecord.order_number}`);
        }
        break;

      case 'DELETE':
        setOrders(prev => prev.filter(order => order.id !== oldRecord.id));
        toast.info(`Order ${oldRecord.order_number} was removed`);
        break;
    }
  };

  return {
    orders,
    isLoading,
    refetch: loadOrders
  };
};

// Hook for admin real-time order monitoring
export const useRealtimeAdminOrders = () => {
  const [orders, setOrders] = useState<RealtimeOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAllOrders();

    // Set up real-time subscription for all orders
    const channel = supabase
      .channel('admin-order-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public', 
          table: 'orders'
        },
        (payload) => {
          console.log('Admin real-time order update:', payload);
          handleRealtimeUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadAllOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading admin orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRealtimeUpdate = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
      case 'INSERT':
        setOrders(prev => [newRecord, ...prev]);
        toast.success(`New order received: ${newRecord.order_number}`);
        break;

      case 'UPDATE':
        setOrders(prev => 
          prev.map(order => 
            order.id === newRecord.id ? newRecord : order
          )
        );
        break;

      case 'DELETE':
        setOrders(prev => prev.filter(order => order.id !== oldRecord.id));
        break;
    }
  };

  return {
    orders,
    isLoading,
    refetch: loadAllOrders
  };
};