import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function CJOAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing authorization...');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const connectionId = searchParams.get('connection_id');

      if (error) {
        setStatus('error');
        setMessage(`Authorization failed: ${error}`);
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setMessage('Missing required parameters in callback');
        return;
      }

      try {
        const body: any = { authCode: code, state };
        if (connectionId) body.connectionId = connectionId;

        const { data, error: callbackError } = await supabase.functions.invoke('cj-oauth-callback', {
          body
        });

        if (callbackError) {
          throw callbackError;
        }

        if (data?.success) {
          setStatus('success');
          setMessage('Authorization successful! You can now use this connection.');
          toast.success('CJ Dropshipping connection authorized successfully');
          
          // Redirect to admin after 2 seconds
          setTimeout(() => {
            navigate('/admin/cj-dropshipping');
          }, 2000);
        } else {
          setStatus('error');
          setMessage(data?.error || 'Authorization failed');
        }
      } catch (error) {
        console.error('Callback error:', error);
        setStatus('error');
        setMessage('Failed to complete authorization');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  const getIcon = () => {
    switch (status) {
      case 'processing':
        return <RefreshCw className="h-12 w-12 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case 'error':
        return <XCircle className="h-12 w-12 text-red-500" />;
    }
  };

  const getTitle = () => {
    switch (status) {
      case 'processing':
        return 'Processing Authorization';
      case 'success':
        return 'Authorization Successful';
      case 'error':
        return 'Authorization Failed';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex flex-col items-center space-y-4">
            {getIcon()}
            <CardTitle className="text-center">{getTitle()}</CardTitle>
            <CardDescription className="text-center">
              CJ Dropshipping OAuth Callback
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">{message}</p>
          
          {status === 'error' && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => navigate('/admin/cj-dropshipping')}
                className="flex-1"
              >
                Back to Admin
              </Button>
              <Button 
                onClick={() => window.location.reload()}
                className="flex-1"
              >
                Retry
              </Button>
            </div>
          )}

          {status === 'success' && (
            <Button 
              onClick={() => navigate('/admin/cj-dropshipping')}
              className="w-full"
            >
              Go to CJ Dropshipping
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}