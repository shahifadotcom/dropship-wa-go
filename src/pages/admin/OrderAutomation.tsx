import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, Clock, AlertCircle, CheckCircle, Settings, Play, Pause } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/layouts/AdminLayout';

interface AutomationStats {
  totalOrders: number;
  automatedOrders: number;
  failedOrders: number;
  successRate: number;
}

interface VendorConfig {
  id: string;
  name: string;
  isEnabled: boolean;
  autoOrderEnabled: boolean;
  lastSync: string;
  orderCount: number;
}

const OrderAutomation = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [globalAutomation, setGlobalAutomation] = useState(true);
  const [stats, setStats] = useState<AutomationStats>({
    totalOrders: 0,
    automatedOrders: 0,
    failedOrders: 0,
    successRate: 95.2
  });
  const [vendors, setVendors] = useState<VendorConfig[]>([]);

  useEffect(() => {
    fetchAutomationData();
  }, []);

  const fetchAutomationData = async () => {
    try {
      // Fetch vendor automation configs
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('*');

      if (vendorError) throw vendorError;

      const vendorConfigs = vendorData?.map(vendor => ({
        id: vendor.id,
        name: vendor.name,
        isEnabled: vendor.is_active,
        autoOrderEnabled: vendor.auto_order_enabled,
        lastSync: vendor.last_sync_at || 'Never',
        orderCount: 0 // This would come from vendor_orders table
      })) || [];

      setVendors(vendorConfigs);

      // Fetch automation stats
      const { data: ordersData, error: ordersError } = await supabase
        .from('vendor_orders')
        .select('status');

      if (ordersError) throw ordersError;

      const total = ordersData?.length || 0;
      const automated = ordersData?.filter(order => order.status !== 'manual').length || 0;
      const failed = ordersData?.filter(order => order.status === 'failed').length || 0;

      setStats({
        totalOrders: total,
        automatedOrders: automated,
        failedOrders: failed,
        successRate: total > 0 ? ((automated - failed) / automated * 100) : 0
      });

    } catch (error) {
      console.error('Error fetching automation data:', error);
      toast({
        title: "Error",
        description: "Failed to load automation data",
        variant: "destructive"
      });
    }
  };

  const toggleVendorAutomation = async (vendorId: string, enabled: boolean) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('vendors')
        .update({ auto_order_enabled: enabled })
        .eq('id', vendorId);

      if (error) throw error;

      setVendors(prev => prev.map(vendor => 
        vendor.id === vendorId 
          ? { ...vendor, autoOrderEnabled: enabled }
          : vendor
      ));

      toast({
        title: "Success",
        description: `Automation ${enabled ? 'enabled' : 'disabled'} for vendor`,
      });
    } catch (error) {
      console.error('Error updating vendor automation:', error);
      toast({
        title: "Error",
        description: "Failed to update vendor automation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const runManualSync = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.functions.invoke('sync-vendor-prices');
      
      if (error) throw error;

      toast({
        title: "Success",
        description: "Price sync initiated successfully",
      });
      
      fetchAutomationData();
    } catch (error) {
      console.error('Error running manual sync:', error);
      toast({
        title: "Error",
        description: "Failed to initiate price sync",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-card-foreground">Order Automation</h1>
            <p className="text-muted-foreground">Manage automatic order processing and vendor integrations</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="global-automation"
                checked={globalAutomation}
                onCheckedChange={setGlobalAutomation}
              />
              <Label htmlFor="global-automation">Global Automation</Label>
            </div>
            <Button onClick={runManualSync} disabled={loading}>
              <Bot className="h-4 w-4 mr-2" />
              Run Sync
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Automated</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.automatedOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.failedOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.successRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="vendors" className="space-y-4">
          <TabsList>
            <TabsTrigger value="vendors">Vendor Configuration</TabsTrigger>
            <TabsTrigger value="settings">Automation Settings</TabsTrigger>
            <TabsTrigger value="logs">Activity Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="vendors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Vendor Automation Status</CardTitle>
                <CardDescription>
                  Configure automatic order processing for each vendor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vendors.map((vendor) => (
                    <div key={vendor.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-medium">{vendor.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Last sync: {vendor.lastSync} • {vendor.orderCount} orders processed
                          </p>
                        </div>
                        <Badge variant={vendor.isEnabled ? "default" : "secondary"}>
                          {vendor.isEnabled ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`automation-${vendor.id}`}
                            checked={vendor.autoOrderEnabled}
                            onCheckedChange={(checked) => toggleVendorAutomation(vendor.id, checked)}
                            disabled={loading || !vendor.isEnabled}
                          />
                          <Label htmlFor={`automation-${vendor.id}`}>Auto Order</Label>
                        </div>
                        {vendor.autoOrderEnabled ? (
                          <Play className="h-4 w-4 text-green-600" />
                        ) : (
                          <Pause className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Automation Settings</CardTitle>
                <CardDescription>
                  Configure global automation behavior
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Enable Price Sync</Label>
                    <p className="text-sm text-muted-foreground">Automatically sync prices from vendors</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Auto Order Processing</Label>
                    <p className="text-sm text-muted-foreground">Automatically place orders with vendors</p>
                  </div>
                  <Switch checked={globalAutomation} onCheckedChange={setGlobalAutomation} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">WhatsApp Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send tracking updates via WhatsApp</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  View recent automation activities and logs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Order AUTO001 processed successfully</p>
                      <p className="text-xs text-muted-foreground">AliExpress • 2 minutes ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Price sync completed</p>
                      <p className="text-xs text-muted-foreground">Updated 247 products • 5 minutes ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Order AUTO002 failed</p>
                      <p className="text-xs text-muted-foreground">CJ Dropshipping • Payment method invalid • 12 minutes ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default OrderAutomation;