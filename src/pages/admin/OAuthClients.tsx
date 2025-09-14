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
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface OAuthClient {
  id: string;
  client_id: string;
  client_secret: string;
  name: string;
  description?: string;
  redirect_uris: string[];
  scopes: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function OAuthClients() {
  const [clients, setClients] = useState<OAuthClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  
  const [newClient, setNewClient] = useState({
    name: '',
    description: '',
    redirect_uris: [''],
    scopes: ['read', 'write']
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('oauth_clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading OAuth clients:', error);
      toast.error('Failed to load OAuth clients');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async () => {
    if (!newClient.name.trim()) {
      toast.error('Please enter a client name');
      return;
    }

    const validUris = newClient.redirect_uris.filter(uri => uri.trim() !== '');
    if (validUris.length === 0) {
      toast.error('Please provide at least one redirect URI');
      return;
    }

    try {
      const { data, error } = await supabase.rpc('generate_oauth_client', {
        p_name: newClient.name,
        p_description: newClient.description || null,
        p_redirect_uris: validUris,
        p_scopes: newClient.scopes
      });

      if (error) throw error;

      toast.success('OAuth client created successfully');
      setShowAddClient(false);
      setNewClient({
        name: '',
        description: '',
        redirect_uris: [''],
        scopes: ['read', 'write']
      });
      loadClients();
    } catch (error) {
      console.error('Error creating OAuth client:', error);
      toast.error('Failed to create OAuth client');
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this OAuth client? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('oauth_clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;

      toast.success('OAuth client deleted successfully');
      loadClients();
    } catch (error) {
      console.error('Error deleting OAuth client:', error);
      toast.error('Failed to delete OAuth client');
    }
  };

  const toggleClientStatus = async (clientId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('oauth_clients')
        .update({ is_active: !isActive })
        .eq('id', clientId);

      if (error) throw error;

      toast.success(`OAuth client ${!isActive ? 'activated' : 'deactivated'}`);
      loadClients();
    } catch (error) {
      console.error('Error updating OAuth client:', error);
      toast.error('Failed to update OAuth client');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const toggleSecretVisibility = (clientId: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [clientId]: !prev[clientId]
    }));
  };

  const addRedirectUri = () => {
    setNewClient(prev => ({
      ...prev,
      redirect_uris: [...prev.redirect_uris, '']
    }));
  };

  const removeRedirectUri = (index: number) => {
    setNewClient(prev => ({
      ...prev,
      redirect_uris: prev.redirect_uris.filter((_, i) => i !== index)
    }));
  };

  const updateRedirectUri = (index: number, value: string) => {
    setNewClient(prev => ({
      ...prev,
      redirect_uris: prev.redirect_uris.map((uri, i) => i === index ? value : uri)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">OAuth Clients</h1>
          <p className="text-muted-foreground">
            Manage OAuth client credentials for external integrations
          </p>
        </div>
        <Dialog open={showAddClient} onOpenChange={setShowAddClient}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create OAuth Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create OAuth Client</DialogTitle>
              <DialogDescription>
                Generate OAuth credentials to connect external services to your application
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Client Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., CJ Dropshipping Integration"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of what this client is used for"
                  value={newClient.description}
                  onChange={(e) => setNewClient({ ...newClient, description: e.target.value })}
                  rows={2}
                />
              </div>
              
              <div>
                <Label>Redirect URIs</Label>
                <div className="space-y-2">
                  {newClient.redirect_uris.map((uri, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="https://yourapp.com/oauth/callback"
                        value={uri}
                        onChange={(e) => updateRedirectUri(index, e.target.value)}
                      />
                      {newClient.redirect_uris.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeRedirectUri(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addRedirectUri}
                  >
                    Add Redirect URI
                  </Button>
                </div>
              </div>
              
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  After creating this client, you'll receive a Client ID and Client Secret. 
                  Keep the Client Secret secure and never share it publicly.
                </AlertDescription>
              </Alert>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddClient(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateClient}>
                Create Client
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {clients.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                No OAuth Clients
              </CardTitle>
              <CardDescription>
                Create your first OAuth client to start integrating with external services
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          clients.map((client) => (
            <Card key={client.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      {client.name}
                      <Badge variant={client.is_active ? "default" : "secondary"}>
                        {client.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </CardTitle>
                    {client.description && (
                      <CardDescription>{client.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleClientStatus(client.id, client.is_active)}
                    >
                      {client.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClient(client.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Client ID</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={client.client_id}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(client.client_id, 'Client ID')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Client Secret</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type={showSecrets[client.id] ? "text" : "password"}
                      value={client.client_secret}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleSecretVisibility(client.id)}
                    >
                      {showSecrets[client.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(client.client_secret, 'Client Secret')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {client.redirect_uris.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Redirect URIs</Label>
                    <div className="mt-1 space-y-1">
                      {client.redirect_uris.map((uri, index) => (
                        <div key={index} className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded">
                          {uri}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <Label className="text-sm font-medium">Scopes</Label>
                  <div className="flex gap-1 mt-1">
                    {client.scopes.map((scope, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {scope}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Created: {new Date(client.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>How to use:</strong> Create OAuth clients here, then use the Client ID and Client Secret 
          in external services (like CJ Dropshipping) to authorize them to connect to your application.
        </AlertDescription>
      </Alert>
    </div>
  );
}