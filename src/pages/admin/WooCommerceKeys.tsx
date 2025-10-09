import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Plus, 
  Copy,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  Key,
  Shield,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/layouts/AdminLayout';

interface WCAPIKey {
  id: string;
  user_id: string;
  app_name: string;
  api_key: string;
  api_secret: string;
  scope: string;
  is_active: boolean;
  created_at: string;
}

export default function WooCommerceKeys() {
  const [keys, setKeys] = useState<WCAPIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddKey, setShowAddKey] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [storeUrl, setStoreUrl] = useState('');
  
  const [newKey, setNewKey] = useState({
    app_name: 'CJ Dropshipping',
    scope: 'read_write'
  });

  useEffect(() => {
    loadKeys();
    loadStoreUrl();
  }, []);

  const loadStoreUrl = async () => {
    const { data } = await supabase
      .from('seo_settings')
      .select('canonical_url')
      .single();
    
    if (data?.canonical_url) {
      setStoreUrl(data.canonical_url);
    }
  };

  const loadKeys = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('woocommerce_api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKeys(data || []);
    } catch (error) {
      console.error('Error loading WooCommerce keys:', error);
      toast.error('Failed to load WooCommerce API keys');
    } finally {
      setLoading(false);
    }
  };

  const generateKey = () => {
    const prefix = 'ck_';
    const random = Array.from(crypto.getRandomValues(new Uint8Array(20)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return prefix + random;
  };

  const generateSecret = () => {
    const prefix = 'cs_';
    const random = Array.from(crypto.getRandomValues(new Uint8Array(20)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return prefix + random;
  };

  const handleCreateKey = async () => {
    if (!newKey.app_name.trim()) {
      toast.error('Please enter an application name');
      return;
    }

    try {
      const apiKey = generateKey();
      const apiSecret = generateSecret();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('woocommerce_api_keys')
        .insert({
          user_id: user.id,
          app_name: newKey.app_name,
          api_key: apiKey,
          api_secret: apiSecret,
          scope: newKey.scope,
          is_active: true
        });

      if (error) throw error;

      toast.success('WooCommerce API key created successfully');
      setShowAddKey(false);
      setNewKey({
        app_name: 'CJ Dropshipping',
        scope: 'read_write'
      });
      loadKeys();
    } catch (error) {
      console.error('Error creating WooCommerce key:', error);
      toast.error('Failed to create WooCommerce API key');
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('woocommerce_api_keys')
        .delete()
        .eq('id', keyId);

      if (error) throw error;

      toast.success('WooCommerce API key deleted successfully');
      loadKeys();
    } catch (error) {
      console.error('Error deleting WooCommerce key:', error);
      toast.error('Failed to delete WooCommerce API key');
    }
  };

  const toggleKeyStatus = async (keyId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('woocommerce_api_keys')
        .update({ is_active: !isActive })
        .eq('id', keyId);

      if (error) throw error;

      toast.success(`API key ${!isActive ? 'activated' : 'deactivated'}`);
      loadKeys();
    } catch (error) {
      console.error('Error updating WooCommerce key:', error);
      toast.error('Failed to update API key');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const toggleSecretVisibility = (keyId: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">WooCommerce API Keys</h1>
            <p className="text-muted-foreground">
              Generate REST API credentials for WooCommerce integrations like CJ Dropshipping
            </p>
          </div>
          <Dialog open={showAddKey} onOpenChange={setShowAddKey}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Generate API Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate WooCommerce API Key</DialogTitle>
                <DialogDescription>
                  Create REST API credentials for external WooCommerce integrations
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="app_name">Application Name</Label>
                  <Input
                    id="app_name"
                    placeholder="e.g., CJ Dropshipping"
                    value={newKey.app_name}
                    onChange={(e) => setNewKey({ ...newKey, app_name: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="scope">Permission Scope</Label>
                  <select
                    id="scope"
                    className="w-full px-3 py-2 border rounded-md"
                    value={newKey.scope}
                    onChange={(e) => setNewKey({ ...newKey, scope: e.target.value })}
                  >
                    <option value="read">Read only</option>
                    <option value="write">Write only</option>
                    <option value="read_write">Read & Write</option>
                  </select>
                </div>
                
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    After generating, you'll receive a Consumer Key and Consumer Secret. 
                    Keep these secure and never share them publicly.
                  </AlertDescription>
                </Alert>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddKey(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateKey}>
                  Generate Key
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>For CJ Dropshipping WooCommerce Plugin:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Generate a WooCommerce API key here</li>
              <li>Copy the Consumer Key and Consumer Secret</li>
              <li>In CJ Dropshipping's WooCommerce plugin settings, paste these credentials</li>
              <li>Set your store URL: <code className="bg-muted px-2 py-1 rounded">{storeUrl || 'https://yourstore.com'}</code></li>
            </ol>
          </AlertDescription>
        </Alert>

        <div className="grid gap-6">
          {keys.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  No API Keys
                </CardTitle>
                <CardDescription>
                  Generate your first WooCommerce API key to start integrating with external services
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            keys.map((key) => (
              <Card key={key.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        {key.app_name}
                        <Badge variant={key.is_active ? "default" : "secondary"}>
                          {key.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Scope: {key.scope.replace('_', ' & ')}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleKeyStatus(key.id, key.is_active)}
                      >
                        {key.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteKey(key.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Consumer Key</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        value={key.api_key}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(key.api_key, 'Consumer Key')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Consumer Secret</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type={showSecrets[key.id] ? "text" : "password"}
                        value={key.api_secret}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleSecretVisibility(key.id)}
                      >
                        {showSecrets[key.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(key.api_secret, 'Consumer Secret')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Created: {new Date(key.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>REST API Endpoint</CardTitle>
            <CardDescription>
              Use this endpoint for WooCommerce REST API calls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input
                value={`${storeUrl || 'https://yourstore.com'}/wp-json/wc/v3/`}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(`${storeUrl || 'https://yourstore.com'}/wp-json/wc/v3/`, 'API Endpoint')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Note: This endpoint is served by the edge function that proxies WooCommerce API requests
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
