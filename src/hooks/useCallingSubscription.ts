import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Subscription {
  id: string;
  user_id: string;
  plan_duration: number;
  price: number;
  currency: string;
  status: string;
  starts_at: string;
  expires_at: string;
  created_at: string;
}

export const useCallingSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setHasActiveSubscription(false);
      setLoading(false);
      return;
    }

    fetchSubscription();
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) return;

    setLoading(true);

    const { data, error } = await supabase
      .from('calling_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching subscription:', error);
      setLoading(false);
      return;
    }

    setSubscription(data);
    setHasActiveSubscription(!!data);
    setLoading(false);
  };

  const activateSubscription = async (orderId: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { data, error } = await supabase.functions.invoke(
        'activate-calling-subscription',
        {
          body: { orderId, userId: user.id }
        }
      );

      if (error) throw error;

      // Refresh subscription data
      await fetchSubscription();

      return { success: true, data };
    } catch (error: any) {
      console.error('Error activating subscription:', error);
      return { success: false, error: error.message };
    }
  };

  const getDaysRemaining = () => {
    if (!subscription) return 0;

    const now = new Date();
    const expires = new Date(subscription.expires_at);
    const diffTime = expires.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  };

  return {
    subscription,
    loading,
    hasActiveSubscription,
    activateSubscription,
    getDaysRemaining,
    refetch: fetchSubscription
  };
};
