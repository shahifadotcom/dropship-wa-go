import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/layouts/AdminLayout';
import { ShoppingBag, Zap, Check, X, RefreshCw, ExternalLink } from 'lucide-react';

export default function GoogleServices() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [merchantConfig, setMerchantConfig] = useState<any>(null);

  useEffect(() => {
    loadGoogleConfig();
  }, []);

  const loadGoogleConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('google_services_config')
        .select('*')
        .eq('service_name', 'merchant_center')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setMerchantConfig(data);
    } catch (error) {
      console.error('Error loading Google config:', error);
    }
  };

  const saveGoogleConfig = async (config: any) => {
    setLoading(true);
    try {
      const configData = {
        service_name: 'merchant_center',
        ...config,
        updated_at: new Date().toISOString()
      };

      if (merchantConfig?.id) {
        const { error } = await supabase
          .from('google_services_config')
          .update(configData)
          .eq('id', merchantConfig.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('google_services_config')
          .insert(configData);
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Google Merchant Center configuration saved"
      });
      
      loadGoogleConfig();
    } catch (error) {
      console.error('Error saving Google config:', error);
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const syncProducts = async (action: 'sync_all_products' | 'sync_product') => {
    setSyncLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-merchant-sync', {
        body: { action }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: data.message || "Products synced successfully"
      });

      if (data.syncedCount !== undefined) {
        toast({
          title: "Sync Complete",
          description: `${data.syncedCount}/${data.totalProducts} products synced successfully`
        });
      }
    } catch (error) {
      console.error('Error syncing products:', error);
      toast({
        title: "Error",
        description: "Failed to sync products to Google Merchant Center",
        variant: "destructive"
      });
    } finally {
      setSyncLoading(false);
    }
  };

  const initiateGoogleAuth = () => {
    const scopes = [
      'https://www.googleapis.com/auth/content'
    ].join(' ');

    const authUrl = `https://accounts.google.com/oauth/authorize?` +
      `client_id=${merchantConfig?.client_id || 'YOUR_CLIENT_ID'}&` +
      `redirect_uri=${encodeURIComponent(window.location.origin + '/admin/google-services')}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `response_type=code&` +
      `access_type=offline&` +
      `prompt=consent`;

    window.open(authUrl, '_blank', 'width=500,height=600');
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Google Services</h1>
          <p className="text-muted-foreground">Connect and manage Google services integration</p>
        </div>

        <Tabs defaultValue="merchant-center" className="space-y-4">
          <TabsList>
            <TabsTrigger value="merchant-center">Merchant Center</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="ads">Google Ads</TabsTrigger>
          </TabsList>

          <TabsContent value="merchant-center" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Google Merchant Center
                </CardTitle>
                <CardDescription>
                  Connect your store to Google Shopping and showcase your products across Google
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">Connection Status</h3>
                    <p className="text-sm text-muted-foreground">
                      {merchantConfig?.last_sync 
                        ? `Last sync: ${new Date(merchantConfig.last_sync).toLocaleString()}`
                        : 'Never synced'
                      }
                    </p>
                  </div>
                  <Badge variant={merchantConfig?.is_enabled ? "default" : "secondary"}>
                    {merchantConfig?.is_enabled ? "Connected" : "Disconnected"}
                  </Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="client_id">Google Client ID</Label>
                    <Input
                      id="client_id"
                      value={merchantConfig?.client_id || ''}
                      onChange={(e) => setMerchantConfig({ 
                        ...merchantConfig, 
                        client_id: e.target.value 
                      })}
                      placeholder="Your Google OAuth Client ID"
                    />
                  </div>

                  <div>
                    <Label htmlFor="client_secret">Google Client Secret</Label>
                    <Input
                      id="client_secret"
                      type="password"
                      value={merchantConfig?.client_secret || ''}
                      onChange={(e) => setMerchantConfig({ 
                        ...merchantConfig, 
                        client_secret: e.target.value 
                      })}
                      placeholder="Your Google OAuth Client Secret"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="merchant_center_id">Merchant Center ID</Label>
                  <Input
                    id="merchant_center_id"
                    value={merchantConfig?.merchant_center_id || ''}
                    onChange={(e) => setMerchantConfig({ 
                      ...merchantConfig, 
                      merchant_center_id: e.target.value 
                    })}
                    placeholder="Your Google Merchant Center ID"
                  />
                </div>

                <div className="space-y-2">
                  <Button 
                    onClick={() => saveGoogleConfig(merchantConfig)}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? 'Saving...' : 'Save Configuration'}
                  </Button>

                  {merchantConfig?.client_id && (
                    <Button 
                      variant="outline"
                      onClick={initiateGoogleAuth}
                      className="w-full"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Authorize Google Access
                    </Button>
                  )}
                </div>

                {merchantConfig?.is_enabled && (
                  <div className="border-t pt-4 space-y-2">
                    <h3 className="font-medium">Product Sync</h3>
                    <div className="grid gap-2 md:grid-cols-2">
                      <Button 
                        onClick={() => syncProducts('sync_all_products')}
                        disabled={syncLoading}
                        variant="outline"
                        className="w-full"
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${syncLoading ? 'animate-spin' : ''}`} />
                        Sync All Products
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => window.open('https://merchants.google.com', '_blank')}
                        className="w-full"
                      >
                        Open Merchant Center
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Setup Instructions</CardTitle>
                <CardDescription>
                  Follow these steps to connect your Google Merchant Center
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Create a Google Cloud Project at <a href="https://console.cloud.google.com" target="_blank" className="text-blue-600 hover:underline">Google Cloud Console</a></li>
                  <li>Enable the Content API for Shopping</li>
                  <li>Create OAuth 2.0 credentials and add your domain to authorized origins</li>
                  <li>Set up your Google Merchant Center account</li>
                  <li>Enter your credentials above and authorize access</li>
                  <li>Start syncing your products to Google Shopping</li>
                </ol>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Google Analytics</CardTitle>
                <CardDescription>
                  Track your website performance and user behavior
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Google Analytics integration coming soon</p>
                  <Button variant="outline" onClick={() => window.open('https://analytics.google.com', '_blank')}>
                    Open Google Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ads" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Google Ads</CardTitle>
                <CardDescription>
                  Connect your Google Ads account for enhanced shopping campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Google Ads integration coming soon</p>
                  <Button variant="outline" onClick={() => window.open('https://ads.google.com', '_blank')}>
                    Open Google Ads
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}