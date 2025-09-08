import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Settings as SettingsIcon, Store, Mail, Phone, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/layouts/AdminLayout';

interface StoreSettings {
  id: string;
  store_name: string;
  store_tagline: string;
  store_description: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  site_title: string;
  currency: string;
  email_notifications: boolean;
  whatsapp_notifications: boolean;
  inventory_alerts: boolean;
  maintenance_mode: boolean;
}

const Settings = () => {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching settings:', error);
        toast.error('Failed to load settings');
      } else {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updatedFields: Partial<StoreSettings>) => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('store_settings')
        .update(updatedFields)
        .eq('id', settings.id);

      if (error) {
        console.error('Error updating settings:', error);
        toast.error('Failed to save settings');
      } else {
        setSettings({ ...settings, ...updatedFields });
        toast.success('Settings saved successfully');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleStoreInfoSave = () => {
    if (!settings) return;
    updateSettings({
      store_name: settings.store_name,
      store_tagline: settings.store_tagline,
      store_description: settings.store_description,
    });
  };

  const handleContactInfoSave = () => {
    if (!settings) return;
    updateSettings({
      contact_email: settings.contact_email,
      contact_phone: settings.contact_phone,
      contact_address: settings.contact_address,
    });
  };

  const handleGeneralSettingsSave = () => {
    if (!settings) return;
    updateSettings({
      email_notifications: settings.email_notifications,
      whatsapp_notifications: settings.whatsapp_notifications,
      inventory_alerts: settings.inventory_alerts,
    });
  };

  const handleWebsiteSettingsSave = () => {
    if (!settings) return;
    updateSettings({
      site_title: settings.site_title,
      currency: settings.currency,
      maintenance_mode: settings.maintenance_mode,
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-center">Loading settings...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!settings) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-center">No settings found</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your store settings</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Store Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="store-name">Store Name</Label>
                  <Input 
                    id="store-name" 
                    value={settings.store_name || ''}
                    onChange={(e) => setSettings({...settings, store_name: e.target.value})}
                    placeholder="Your Store Name" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store-tagline">Tagline</Label>
                  <Input 
                    id="store-tagline" 
                    value={settings.store_tagline || ''}
                    onChange={(e) => setSettings({...settings, store_tagline: e.target.value})}
                    placeholder="Your store tagline" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="store-description">Description</Label>
                <Textarea 
                  id="store-description" 
                  value={settings.store_description || ''}
                  onChange={(e) => setSettings({...settings, store_description: e.target.value})}
                  placeholder="Brief description of your store" 
                />
              </div>
              <Button onClick={handleStoreInfoSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Store Information'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Email</Label>
                  <Input 
                    id="contact-email" 
                    type="email" 
                    value={settings.contact_email || ''}
                    onChange={(e) => setSettings({...settings, contact_email: e.target.value})}
                    placeholder="contact@yourstore.com" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-phone">Phone</Label>
                  <Input 
                    id="contact-phone" 
                    value={settings.contact_phone || ''}
                    onChange={(e) => setSettings({...settings, contact_phone: e.target.value})}
                    placeholder="+880 123-456-789" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-address">Address</Label>
                <Textarea 
                  id="contact-address" 
                  value={settings.contact_address || ''}
                  onChange={(e) => setSettings({...settings, contact_address: e.target.value})}
                  placeholder="Store address" 
                />
              </div>
              <Button onClick={handleContactInfoSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Contact Information'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications for new orders
                  </p>
                </div>
                <Switch 
                  checked={settings.email_notifications}
                  onCheckedChange={(checked) => setSettings({...settings, email_notifications: checked})}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>WhatsApp Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send order confirmations via WhatsApp
                  </p>
                </div>
                <Switch 
                  checked={settings.whatsapp_notifications}
                  onCheckedChange={(checked) => setSettings({...settings, whatsapp_notifications: checked})}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Inventory Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when products are low in stock
                  </p>
                </div>
                <Switch 
                  checked={settings.inventory_alerts}
                  onCheckedChange={(checked) => setSettings({...settings, inventory_alerts: checked})}
                />
              </div>
              
              <Button onClick={handleGeneralSettingsSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save General Settings'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Website Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="site-title">Site Title</Label>
                  <Input 
                    id="site-title" 
                    value={settings.site_title || ''}
                    onChange={(e) => setSettings({...settings, site_title: e.target.value})}
                    placeholder="Your Site Title" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <select 
                    id="currency"
                    value={settings.currency || 'BDT'}
                    onChange={(e) => setSettings({...settings, currency: e.target.value})}
                    className="w-full p-2 border border-border rounded-md bg-background"
                  >
                    <option value="BDT">BDT (৳)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Temporarily disable the store for maintenance
                  </p>
                </div>
                <Switch 
                  checked={settings.maintenance_mode}
                  onCheckedChange={(checked) => setSettings({...settings, maintenance_mode: checked})}
                />
              </div>
              
              <Button onClick={handleWebsiteSettingsSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Website Settings'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Settings;