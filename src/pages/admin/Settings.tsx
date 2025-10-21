import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Settings as SettingsIcon, Store, Mail, Phone, Globe, Upload, Image } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/layouts/AdminLayout';
import { useAuth } from '@/hooks/useAuth';

interface StoreSettings {
  id: string;
  store_name: string;
  store_tagline: string;
  store_description: string;
  store_logo?: string;
  favicon_url?: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  admin_whatsapp?: string;
  site_title: string;
  currency: string;
  email_notifications: boolean;
  whatsapp_notifications: boolean;
  inventory_alerts: boolean;
  maintenance_mode: boolean;
}

const Settings = () => {
  const { session } = useAuth();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [faviconUploading, setFaviconUploading] = useState(false);

  useEffect(() => {
    // Only fetch settings once we have a valid session
    if (session) {
      fetchSettings();
    }
  }, [session]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching settings:', error);
        toast.error('Failed to load settings');
        return;
      }

      const row = data?.[0] as StoreSettings | undefined;

      if (!row) {
        // If no settings exist, create default settings
        const { data: newRows, error: insertError } = await supabase
          .from('store_settings')
          .insert({
            store_name: 'My Store',
            store_tagline: 'Your Trusted Partner',
            store_description: 'Quality products with fast delivery',
            contact_email: 'admin@store.com',
            contact_phone: '+880 123-456-789',
            contact_address: 'Dhaka, Bangladesh',
            site_title: 'My E-commerce Store',
            currency: 'BDT',
            email_notifications: true,
            whatsapp_notifications: true,
            inventory_alerts: true,
            maintenance_mode: false,
          })
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);

        if (insertError) {
          console.error('Error creating settings:', insertError);
          toast.error('Failed to create settings');
          return;
        }

        const created = newRows?.[0] as StoreSettings | undefined;
        if (created) {
          setSettings(created);
          // Sync public settings so they are visible without login
          try {
            await supabase.from('store_settings_public').upsert({
              id: created.id,
              store_name: created.store_name,
              store_logo: created.store_logo,
              favicon_url: created.favicon_url,
              store_tagline: created.store_tagline,
              store_description: created.store_description,
              currency: created.currency,
            });
          } catch (e) {
            console.error('Error initializing public settings:', e);
          }
          toast.success('Settings initialized successfully');
        }
      } else {
        setSettings(row);
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
        toast.error(`Failed to save settings: ${error.message}`);
      } else {
        setSettings({ ...settings, ...updatedFields });
        // Also publish public-facing fields for anonymous users
        try {
          const current = { ...settings, ...updatedFields } as StoreSettings;
          await supabase.from('store_settings_public').upsert({
            id: current.id,
            store_name: current.store_name,
            store_logo: current.store_logo,
            favicon_url: current.favicon_url,
            store_tagline: current.store_tagline,
            store_description: current.store_description,
            currency: current.currency,
          });
        } catch (e) {
          console.error('Error syncing public settings:', e);
        }
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

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !settings) return;

    setLogoUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `store-logo-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (uploadError) {
        toast.error('Failed to upload logo');
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      await updateSettings({ store_logo: publicUrl });
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setLogoUploading(false);
    }
  };

  const handleFaviconUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !settings) return;

    setFaviconUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `favicon-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (uploadError) {
        toast.error('Failed to upload favicon');
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      await updateSettings({ favicon_url: publicUrl });
      toast.success('Favicon uploaded successfully. Please refresh the page to see changes.');
    } catch (error) {
      console.error('Error uploading favicon:', error);
      toast.error('Failed to upload favicon');
    } finally {
      setFaviconUploading(false);
    }
  };

  const handleContactInfoSave = () => {
    if (!settings) return;
    updateSettings({
      contact_email: settings.contact_email,
      contact_phone: settings.contact_phone,
      contact_address: settings.contact_address,
      admin_whatsapp: settings.admin_whatsapp,
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
      favicon_url: settings.favicon_url,
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
              {/* Logo Upload Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Store Logo</Label>
                  <div className="flex items-center gap-4">
                    {settings.store_logo && (
                      <img 
                        src={settings.store_logo} 
                        alt="Store Logo" 
                        className="w-16 h-16 object-contain rounded-lg border border-border"
                      />
                    )}
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={logoUploading}
                        className="cursor-pointer"
                      />
                      {logoUploading && (
                        <p className="text-sm text-muted-foreground mt-1">Uploading...</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
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
              <div className="space-y-2">
                <Label htmlFor="admin-whatsapp">Admin WhatsApp Number</Label>
                <Input 
                  id="admin-whatsapp" 
                  value={settings.admin_whatsapp || ''}
                  onChange={(e) => setSettings({...settings, admin_whatsapp: e.target.value})}
                  placeholder="+8801775777308" 
                />
                <p className="text-xs text-muted-foreground">
                  Order notifications will be sent to this WhatsApp number
                </p>
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
              {/* Favicon Upload Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Website Favicon</Label>
                  <div className="flex items-center gap-4">
                    {settings.favicon_url && (
                      <img 
                        src={settings.favicon_url} 
                        alt="Favicon" 
                        className="w-8 h-8 object-contain rounded border border-border"
                      />
                    )}
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/x-icon,image/png,image/svg+xml,image/jpeg"
                        onChange={handleFaviconUpload}
                        disabled={faviconUploading}
                        className="cursor-pointer"
                      />
                      {faviconUploading && (
                        <p className="text-sm text-muted-foreground mt-1">Uploading...</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Recommended: 32x32px or 16x16px .ico, .png, or .svg file
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
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