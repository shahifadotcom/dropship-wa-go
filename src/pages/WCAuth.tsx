import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function WCAuth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const callbackUrl = searchParams.get('callback_url');
  const appName = searchParams.get('app_name');
  const userId = searchParams.get('user_id');
  const scope = searchParams.get('scope');
  const returnUrl = searchParams.get('return_url');

  const handleAuthorize = async () => {
    if (!user) {
      toast.error('Please log in to authorize the application');
      return;
    }

    setLoading(true);
    try {
      // Generate API keys for the authorized application
      const apiKey = `ck_${crypto.randomUUID().replace(/-/g, '')}`;
      const apiSecret = `cs_${crypto.randomUUID().replace(/-/g, '')}`;

      // Store the API keys in our database using raw SQL until types update
      const { error: insertError } = await supabase.rpc('store_woocommerce_api_key', {
        p_user_id: user.id,
        p_app_name: appName || 'Unknown App',
        p_api_key: apiKey,
        p_api_secret: apiSecret,
        p_scope: scope || 'read_write',
        p_callback_url: callbackUrl,
        p_external_user_id: userId
      });

      if (insertError) throw insertError;

      // Prepare callback parameters
      const callbackParams = new URLSearchParams({
        success: '1',
        user_id: userId || '',
        consumer_key: apiKey,
        consumer_secret: apiSecret,
        key_permissions: scope || 'read_write'
      });

      if (callbackUrl) {
        // Redirect to the callback URL with the generated keys
        window.location.href = `${callbackUrl}?${callbackParams.toString()}`;
      } else if (returnUrl) {
        // Fallback to return URL
        window.location.href = returnUrl;
      } else {
        // Fallback to admin dashboard
        navigate('/admin');
        toast.success('Application authorized successfully');
      }
    } catch (error) {
      console.error('Authorization error:', error);
      toast.error('Failed to authorize application');
      setLoading(false);
    }
  };

  const handleDeny = () => {
    if (callbackUrl) {
      const callbackParams = new URLSearchParams({
        success: '0',
        user_id: userId || '',
        error: 'access_denied',
        error_description: 'User denied the authorization request'
      });
      window.location.href = `${callbackUrl}?${callbackParams.toString()}`;
    } else if (returnUrl) {
      window.location.href = returnUrl;
    } else {
      navigate('/admin');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please log in to authorize the application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-center">Authorize Application</CardTitle>
          <CardDescription className="text-center">
            An external application is requesting access to your store
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Application:</span>
              <Badge variant="secondary">{appName || 'Unknown App'}</Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Requested Scope:</span>
              <Badge variant={scope === 'read_write' ? 'default' : 'outline'}>
                {scope || 'read_write'}
              </Badge>
            </div>

            {userId && (
              <div className="flex justify-between items-center">
                <span className="font-medium">External User ID:</span>
                <span className="text-sm text-muted-foreground font-mono">
                  {userId.length > 30 ? `${userId.substring(0, 30)}...` : userId}
                </span>
              </div>
            )}
          </div>

          <Separator />

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">This application will be able to:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {scope?.includes('read') && (
                <li>• Read your products, orders, and customer data</li>
              )}
              {scope?.includes('write') && (
                <li>• Create and modify products, orders, and customer data</li>
              )}
              <li>• Access your store information</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleDeny}
              className="flex-1"
              disabled={loading}
            >
              Deny
            </Button>
            <Button 
              onClick={handleAuthorize}
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Authorizing...' : 'Authorize'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}