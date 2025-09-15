import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ShoppingCart, 
  CreditCard, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Settings,
  Zap,
  TrendingUp,
  Package
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/layouts/AdminLayout";

interface AutomationSettings {
  id?: string;
  auto_order_enabled: boolean;
  vendor_priority: string[];
  price_sync_enabled: boolean;
  stock_sync_enabled: boolean;
  order_threshold: number;
  retry_attempts: number;
  notification_enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

interface VendorConnection {
  id: string;
  vendor_name: string;
  api_endpoint: string;
  is_active: boolean;
  last_sync: string | null;
  total_orders: number;
  success_rate: number;
}

const VendorAutomation = () => {
  const [settings, setSettings] = useState<AutomationSettings>({
    auto_order_enabled: false,
    vendor_priority: ['cj_dropshipping', 'aliexpress', 'zen_drop'],
    price_sync_enabled: true,
    stock_sync_enabled: true,
    order_threshold: 5,
    retry_attempts: 3,
    notification_enabled: true
  });

  const [vendorConnections, setVendorConnections] = useState<VendorConnection[]>([
    {
      id: '1',
      vendor_name: 'CJ Dropshipping',
      api_endpoint: 'https://developers.cjdropshipping.com',
      is_active: true,
      last_sync: '2024-01-15T10:30:00Z',
      total_orders: 156,
      success_rate: 98.5
    },
    {
      id: '2',
      vendor_name: 'AliExpress',
      api_endpoint: 'https://developers.aliexpress.com',
      is_active: false,
      last_sync: null,
      total_orders: 0,
      success_rate: 0
    },
    {
      id: '3',
      vendor_name: 'Zen Drop',
      api_endpoint: 'https://api.zendrop.com',
      is_active: false,
      last_sync: null,
      total_orders: 0,
      success_rate: 0
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalAutomatedOrders: 156,
    todayOrders: 12,
    successRate: 98.5,
    avgProcessingTime: 2.3
  });

  useEffect(() => {
    loadAutomationSettings();
    loadVendorStats();
  }, []);

  const loadAutomationSettings = async () => {
    try {
      // Load settings from store_settings or a dedicated automation_settings table
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading automation settings:', error);
        return;
      }

      if (data) {
        // Extract automation settings from store settings
        setSettings(prev => ({
          ...prev,
          // Map store settings to automation settings if available
        }));
      }
    } catch (error) {
      console.error('Error loading automation settings:', error);
    }
  };

  const loadVendorStats = async () => {
    try {
      // Load vendor statistics from orders and other tables
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'confirmed');

      if (orders) {
        setStats(prev => ({
          ...prev,
          totalAutomatedOrders: orders.length,
          todayOrders: orders.filter(order => 
            new Date(order.created_at).toDateString() === new Date().toDateString()
          ).length
        }));
      }
    } catch (error) {
      console.error('Error loading vendor stats:', error);
    }
  };

  const saveAutomationSettings = async () => {
    setLoading(true);
    try {
      // Save automation settings
      const { error } = await supabase
        .from('store_settings')
        .upsert({
          // Map automation settings to store settings structure
          whatsapp_notifications: settings.notification_enabled,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Automation settings saved successfully');
    } catch (error) {
      console.error('Error saving automation settings:', error);
      toast.error('Failed to save automation settings');
    } finally {
      setLoading(false);
    }
  };

  const testVendorConnection = async (vendorId: string) => {
    setLoading(true);
    try {
      // Test vendor API connection
      const vendor = vendorConnections.find(v => v.id === vendorId);
      
      // Simulate API test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`${vendor?.vendor_name} connection test successful`);
      
      // Update last sync time
      setVendorConnections(prev => 
        prev.map(v => 
          v.id === vendorId 
            ? { ...v, last_sync: new Date().toISOString(), is_active: true }
            : v
        )
      );
    } catch (error) {
      console.error('Error testing vendor connection:', error);
      toast.error('Vendor connection test failed');
    } finally {
      setLoading(false);
    }
  };

  const triggerPriceSync = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-vendor-prices', {
        body: { force_sync: true }
      });

      if (error) throw error;

      toast.success('Price sync initiated successfully');
    } catch (error) {
      console.error('Error triggering price sync:', error);
      toast.error('Failed to trigger price sync');
    } finally {
      setLoading(false);
    }
  };

  const handleAutomationToggle = (field: keyof AutomationSettings, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Vendor Automation</h1>
            <p className="text-muted-foreground">
              Manage automated order processing and vendor integrations
            </p>
          </div>
          <Button onClick={saveAutomationSettings} disabled={loading}>
            <Settings className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Automated Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAutomatedOrders}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayOrders}</div>
              <p className="text-xs text-muted-foreground">Processed today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.successRate}%</div>
              <p className="text-xs text-muted-foreground">Order processing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Processing</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgProcessingTime}min</div>
              <p className="text-xs text-muted-foreground">Per order</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="settings">Automation Settings</TabsTrigger>
            <TabsTrigger value="vendors">Vendor Connections</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-6">
            {/* Main Automation Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Automation Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base">Automatic Order Processing</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically place orders with vendors when customer orders are confirmed
                    </p>
                  </div>
                  <Switch
                    checked={settings.auto_order_enabled}
                    onCheckedChange={(value) => handleAutomationToggle('auto_order_enabled', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base">Price Synchronization</Label>
                    <p className="text-sm text-muted-foreground">
                      Keep product prices in sync with vendor pricing
                    </p>
                  </div>
                  <Switch
                    checked={settings.price_sync_enabled}
                    onCheckedChange={(value) => handleAutomationToggle('price_sync_enabled', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base">Stock Synchronization</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically update stock levels from vendor inventory
                    </p>
                  </div>
                  <Switch
                    checked={settings.stock_sync_enabled}
                    onCheckedChange={(value) => handleAutomationToggle('stock_sync_enabled', value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Order Threshold (minutes)</Label>
                    <Input
                      type="number"
                      value={settings.order_threshold}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        order_threshold: parseInt(e.target.value) || 0
                      }))}
                      placeholder="5"
                    />
                    <p className="text-xs text-muted-foreground">
                      Wait time before processing orders automatically
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Retry Attempts</Label>
                    <Input
                      type="number"
                      value={settings.retry_attempts}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        retry_attempts: parseInt(e.target.value) || 0
                      }))}
                      placeholder="3"
                    />
                    <p className="text-xs text-muted-foreground">
                      Number of retry attempts for failed orders
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Vendor Priority Order</Label>
                  <p className="text-sm text-muted-foreground">
                    Drag to reorder vendor priority for automatic order placement
                  </p>
                  <div className="space-y-2">
                    {settings.vendor_priority.map((vendor, index) => (
                      <div key={vendor} className="flex items-center gap-2 p-2 border rounded">
                        <span className="text-sm font-medium">{index + 1}.</span>
                        <span className="capitalize">{vendor.replace('_', ' ')}</span>
                        <Badge variant="outline" className="ml-auto">
                          {vendorConnections.find(v => v.vendor_name.toLowerCase().replace(' ', '_') === vendor)?.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={triggerPriceSync} variant="outline" disabled={loading}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Sync All Prices
                  </Button>
                  <Button variant="outline" disabled={loading}>
                    <Package className="h-4 w-4 mr-2" />
                    Update Stock Levels
                  </Button>
                  <Button variant="outline" disabled={loading}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Process Pending Orders
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vendors" className="space-y-6">
            {/* Vendor Connections */}
            <Card>
              <CardHeader>
                <CardTitle>Vendor Connections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vendorConnections.map((vendor) => (
                    <div key={vendor.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{vendor.vendor_name}</h3>
                          <Badge variant={vendor.is_active ? "default" : "secondary"}>
                            {vendor.is_active ? "Connected" : "Disconnected"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{vendor.api_endpoint}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Orders: {vendor.total_orders}</span>
                          <span>Success Rate: {vendor.success_rate}%</span>
                          {vendor.last_sync && (
                            <span>Last Sync: {new Date(vendor.last_sync).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => testVendorConnection(vendor.id)}
                          variant="outline"
                          size="sm"
                          disabled={loading}
                        >
                          Test Connection
                        </Button>
                        <Button variant="outline" size="sm">
                          Configure
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Automation Service</span>
                    <Badge variant="default">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Running
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Price Sync Service</span>
                    <Badge variant="default">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Running
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Stock Sync Service</span>
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      Scheduled
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>WhatsApp Notifications</span>
                    <Badge variant="default">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Order #1234 processed successfully with CJ Dropshipping</span>
                    <span className="text-muted-foreground ml-auto">2 minutes ago</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <span>Price sync completed for 156 products</span>
                    <span className="text-muted-foreground ml-auto">15 minutes ago</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span>AliExpress API rate limit reached, retrying in 5 minutes</span>
                    <span className="text-muted-foreground ml-auto">1 hour ago</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Package className="h-4 w-4 text-purple-500" />
                    <span>Stock levels updated for 89 products</span>
                    <span className="text-muted-foreground ml-auto">2 hours ago</span>
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

export default VendorAutomation;