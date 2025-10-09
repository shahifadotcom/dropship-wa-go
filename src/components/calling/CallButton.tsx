import { useState, useEffect } from 'react';
import { Phone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export const CallButton = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hasSubscription, setHasSubscription] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!user) return;

    checkSubscription();
  }, [user]);

  const checkSubscription = async () => {
    if (!user) return;

    const { data: subscription } = await supabase
      .from('calling_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .single();

    setHasSubscription(!!subscription);
  };

  const handleCallClick = () => {
    if (!hasSubscription) {
      // Navigate to subscription product
      navigate('/product-detail/calling-subscription');
    } else {
      // Open calling interface
      navigate('/calling');
    }
  };

  if (!user || !isVisible) return null;

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2">
      <Button
        onClick={handleCallClick}
        size="lg"
        className="rounded-full h-14 w-14 shadow-lg bg-primary hover:bg-primary/90"
      >
        <Phone className="h-6 w-6" />
      </Button>
      <Button
        onClick={() => setIsVisible(false)}
        variant="ghost"
        size="sm"
        className="rounded-full h-8 w-8 p-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};
