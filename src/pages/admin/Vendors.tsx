import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Search, Edit, Trash2, Settings, CheckCircle, XCircle, RotateCw } from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface Vendor {
  id: string;
  name: string;
  api_type: string;
  api_endpoint: string;
  api_key?: string;
  access_token?: string;
  refresh_token?: string;
  client_id?: string;
  client_secret?: string;
  webhook_url?: string;
  is_active: boolean;
  auto_order_enabled: boolean;
  price_sync_enabled: boolean;
  last_sync_at?: string;
  settings: any;
  created_at: string;
  updated_at: string;
}

const Vendors = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [syncingVendor, setSyncingVendor] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVendors(data || []);
    } catch (error: any) {
      console.error('Error fetching vendors:', error);
      toast({
        title: "Error",
        description: "Failed to fetch vendors.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVendor = async (vendorData: any) => {
    try {
      if (editingVendor) {
        const { error } = await supabase
          .from('vendors')
          .update(vendorData)
          .eq('id', editingVendor.id);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Vendor updated successfully."
        });
      } else {
        const { error } = await supabase
          .from('vendors')
          .insert(vendorData);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Vendor created successfully."
        });
      }
      
      fetchVendors();
      setShowForm(false);
      setEditingVendor(null);
    } catch (error: any) {
      console.error('Error saving vendor:', error);
      toast({
        title: "Error",
        description: "Failed to save vendor.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteVendor = async (vendorId: string) => {
    if (!confirm('Are you sure you want to delete this vendor?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', vendorId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Vendor deleted successfully."
      });

      fetchVendors();
    } catch (error: any) {
      console.error('Error deleting vendor:', error);
      toast({
        title: "Error",
        description: "Failed to delete vendor.",
        variant: "destructive"
      });
    }
  };

  const handleSyncPrices = async (vendorId: string) => {
    setSyncingVendor(vendorId);
    try {
      const { data, error } = await supabase.functions.invoke('sync-vendor-prices', {
        body: { vendorId }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Price sync initiated successfully."
      });
    } catch (error: any) {
      console.error('Error syncing prices:', error);
      toast({
        title: "Error",
        description: "Failed to sync prices.",
        variant: "destructive"
      });
    } finally {
      setSyncingVendor(null);
    }
  };

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.api_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const VendorForm = ({ vendor, onSave, onClose }: any) => {
    const [formData, setFormData] = useState({
      name: vendor?.name || '',
      api_type: vendor?.api_type || '',
      api_endpoint: vendor?.api_endpoint || '',
      api_key: vendor?.api_key || '',
      access_token: vendor?.access_token || '',
      refresh_token: vendor?.refresh_token || '',
      client_id: vendor?.client_id || '',
      client_secret: vendor?.client_secret || '',
      webhook_url: vendor?.webhook_url || '',
      is_active: vendor?.is_active ?? true,
      auto_order_enabled: vendor?.auto_order_enabled ?? false,
      price_sync_enabled: vendor?.price_sync_enabled ?? false,
      settings: vendor?.settings || {}
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
    };

    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{vendor ? 'Edit Vendor' : 'Add New Vendor'}</DialogTitle>
            <DialogDescription>
              Configure dropshipping vendor settings and API credentials.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Vendor Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="api_type">API Type</Label>
                <Select value={formData.api_type} onValueChange={(value) => setFormData({ ...formData, api_type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select API type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cjdropshipping">CJ Dropshipping</SelectItem>
                    <SelectItem value="zendrop">Zendrop</SelectItem>
                    <SelectItem value="autods">AutoDS (AliExpress)</SelectItem>
                    <SelectItem value="spocket">Spocket</SelectItem>
                    <SelectItem value="printful">Printful</SelectItem>
                    <SelectItem value="dsers">DSers</SelectItem>
                    <SelectItem value="alibaba">Alibaba</SelectItem>
                    <SelectItem value="banggood">Banggood</SelectItem>
                    <SelectItem value="dhgate">DHgate</SelectItem>
                    <SelectItem value="wholesale_central">Wholesale Central</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="api_endpoint">API Endpoint</Label>
              <Input
                id="api_endpoint"
                value={formData.api_endpoint}
                onChange={(e) => setFormData({ ...formData, api_endpoint: e.target.value })}
                placeholder="https://api.vendor.com/v1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="api_key">API Key</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  placeholder="Enter API key"
                />
              </div>
              
              <div>
                <Label htmlFor="access_token">Access Token</Label>
                <Input
                  id="access_token"
                  type="password"
                  value={formData.access_token}
                  onChange={(e) => setFormData({ ...formData, access_token: e.target.value })}
                  placeholder="Enter access token"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_id">Client ID</Label>
                <Input
                  id="client_id"
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  placeholder="Enter client ID"
                />
              </div>
              
              <div>
                <Label htmlFor="client_secret">Client Secret</Label>
                <Input
                  id="client_secret"
                  type="password"
                  value={formData.client_secret}
                  onChange={(e) => setFormData({ ...formData, client_secret: e.target.value })}
                  placeholder="Enter client secret"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="webhook_url">Webhook URL</Label>
              <Input
                id="webhook_url"
                value={formData.webhook_url}
                onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                placeholder="https://your-webhook-url.com"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="auto_order_enabled"
                  checked={formData.auto_order_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, auto_order_enabled: checked })}
                />
                <Label htmlFor="auto_order_enabled">Enable Auto Order</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="price_sync_enabled"
                  checked={formData.price_sync_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, price_sync_enabled: checked })}
                />
                <Label htmlFor="price_sync_enabled">Enable Price Sync</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {vendor ? 'Update' : 'Create'} Vendor
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Dropshipping Vendors</h1>
            <p className="text-muted-foreground">Manage your vendor integrations and automation settings</p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
          </Button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid gap-4">
          {filteredVendors.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No vendors found. Add your first vendor to get started with dropshipping automation.</p>
              </CardContent>
            </Card>
          ) : (
            filteredVendors.map((vendor) => (
              <Card key={vendor.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {vendor.name}
                          <Badge variant={vendor.is_active ? "default" : "secondary"}>
                            {vendor.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          {vendor.auto_order_enabled && (
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              Auto Order
                            </Badge>
                          )}
                          {vendor.price_sync_enabled && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              Price Sync
                            </Badge>
                          )}
                        </CardTitle>
                        <p className="text-muted-foreground capitalize">{vendor.api_type.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {vendor.price_sync_enabled && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSyncPrices(vendor.id)}
                          disabled={syncingVendor === vendor.id}
                        >
                          <RotateCw className={`h-4 w-4 ${syncingVendor === vendor.id ? 'animate-spin' : ''}`} />
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setEditingVendor(vendor);
                          setShowForm(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteVendor(vendor.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="font-medium">API Endpoint</p>
                      <p className="text-muted-foreground truncate">{vendor.api_endpoint}</p>
                    </div>
                    <div>
                      <p className="font-medium">Last Sync</p>
                      <p className="text-muted-foreground">
                        {vendor.last_sync_at 
                          ? new Date(vendor.last_sync_at).toLocaleDateString()
                          : 'Never'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">API Status</p>
                      <div className="flex items-center gap-1">
                        {vendor.api_key || vendor.access_token ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-green-600">Configured</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span className="text-red-600">Not Configured</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">Created</p>
                      <p className="text-muted-foreground">
                        {new Date(vendor.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        
        {showForm && (
          <VendorForm
            vendor={editingVendor}
            onSave={handleSaveVendor}
            onClose={() => {
              setShowForm(false);
              setEditingVendor(null);
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default Vendors;