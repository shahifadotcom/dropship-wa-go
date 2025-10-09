import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Facebook, Globe } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PlatformConfig {
  id?: string;
  platform: 'facebook' | 'tiktok' | 'google_ads';
  is_active: boolean;
  access_token: string;
  refresh_token?: string;
  ad_account_id: string;
  pixel_id: string;
  business_id?: string;
}

export default function AdPlatforms() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  
  const [facebook, setFacebook] = useState<PlatformConfig>({
    platform: 'facebook',
    is_active: false,
    access_token: '',
    ad_account_id: '',
    pixel_id: '',
    business_id: '',
  });

  const [tiktok, setTiktok] = useState<PlatformConfig>({
    platform: 'tiktok',
    is_active: false,
    access_token: '',
    ad_account_id: '',
    pixel_id: '',
  });

  const [googleAds, setGoogleAds] = useState<PlatformConfig>({
    platform: 'google_ads',
    is_active: false,
    access_token: '',
    refresh_token: '',
    ad_account_id: '',
    pixel_id: '',
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('ad_platforms')
        .select('*');

      if (error) throw error;

      data?.forEach(config => {
        if (config.platform === 'facebook') setFacebook({ ...config } as PlatformConfig);
        if (config.platform === 'tiktok') setTiktok({ ...config } as PlatformConfig);
        if (config.platform === 'google_ads') setGoogleAds({ ...config } as PlatformConfig);
      });
    } catch (error: any) {
      console.error('Error loading configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (config: PlatformConfig) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('ad_platforms')
        .upsert({
          id: config.id,
          platform: config.platform,
          is_active: config.is_active,
          access_token: config.access_token,
          refresh_token: config.refresh_token,
          ad_account_id: config.ad_account_id,
          pixel_id: config.pixel_id,
          business_id: config.business_id,
        }, { onConflict: 'platform' });

      if (error) throw error;

      toast({ title: `${config.platform} configuration saved!` });
      await fetchConfigs();
    } catch (error: any) {
      toast({
        title: 'Error saving configuration',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Ad Platforms</h1>
          <p className="text-muted-foreground">
            Connect your advertising platforms for AI-powered campaign management
          </p>
        </div>

        <Tabs defaultValue="facebook" className="space-y-6">
          <TabsList>
            <TabsTrigger value="facebook">
              <Facebook className="h-4 w-4 mr-2" />
              Facebook
            </TabsTrigger>
            <TabsTrigger value="tiktok">TikTok</TabsTrigger>
            <TabsTrigger value="google">
              <Globe className="h-4 w-4 mr-2" />
              Google Ads
            </TabsTrigger>
          </TabsList>

          <TabsContent value="facebook">
            <Card className="p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Facebook Ads</h3>
                    <p className="text-sm text-muted-foreground">
                      Connect your Facebook Business Manager
                    </p>
                  </div>
                  <Switch
                    checked={facebook.is_active}
                    onCheckedChange={(checked) =>
                      setFacebook({ ...facebook, is_active: checked })
                    }
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Access Token</Label>
                    <Input
                      type="password"
                      value={facebook.access_token}
                      onChange={(e) =>
                        setFacebook({ ...facebook, access_token: e.target.value })
                      }
                      placeholder="Enter your Facebook access token"
                    />
                  </div>

                  <div>
                    <Label>Ad Account ID</Label>
                    <Input
                      value={facebook.ad_account_id}
                      onChange={(e) =>
                        setFacebook({ ...facebook, ad_account_id: e.target.value })
                      }
                      placeholder="act_123456789"
                    />
                  </div>

                  <div>
                    <Label>Pixel ID</Label>
                    <Input
                      value={facebook.pixel_id}
                      onChange={(e) =>
                        setFacebook({ ...facebook, pixel_id: e.target.value })
                      }
                      placeholder="123456789012345"
                    />
                  </div>

                  <div>
                    <Label>Business ID (Optional)</Label>
                    <Input
                      value={facebook.business_id}
                      onChange={(e) =>
                        setFacebook({ ...facebook, business_id: e.target.value })
                      }
                      placeholder="123456789012345"
                    />
                  </div>

                  <Button onClick={() => saveConfig(facebook)} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      'Save Facebook Configuration'
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="tiktok">
            <Card className="p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">TikTok Ads</h3>
                    <p className="text-sm text-muted-foreground">
                      Connect your TikTok Business Center
                    </p>
                  </div>
                  <Switch
                    checked={tiktok.is_active}
                    onCheckedChange={(checked) =>
                      setTiktok({ ...tiktok, is_active: checked })
                    }
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Access Token</Label>
                    <Input
                      type="password"
                      value={tiktok.access_token}
                      onChange={(e) =>
                        setTiktok({ ...tiktok, access_token: e.target.value })
                      }
                      placeholder="Enter your TikTok access token"
                    />
                  </div>

                  <div>
                    <Label>Advertiser ID</Label>
                    <Input
                      value={tiktok.ad_account_id}
                      onChange={(e) =>
                        setTiktok({ ...tiktok, ad_account_id: e.target.value })
                      }
                      placeholder="1234567890123456"
                    />
                  </div>

                  <div>
                    <Label>Pixel Code</Label>
                    <Input
                      value={tiktok.pixel_id}
                      onChange={(e) =>
                        setTiktok({ ...tiktok, pixel_id: e.target.value })
                      }
                      placeholder="ABCDEFGHIJKLMNOP"
                    />
                  </div>

                  <Button onClick={() => saveConfig(tiktok)} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      'Save TikTok Configuration'
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="google">
            <Card className="p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Google Ads</h3>
                    <p className="text-sm text-muted-foreground">
                      Connect your Google Ads account
                    </p>
                  </div>
                  <Switch
                    checked={googleAds.is_active}
                    onCheckedChange={(checked) =>
                      setGoogleAds({ ...googleAds, is_active: checked })
                    }
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Access Token</Label>
                    <Input
                      type="password"
                      value={googleAds.access_token}
                      onChange={(e) =>
                        setGoogleAds({ ...googleAds, access_token: e.target.value })
                      }
                      placeholder="Enter your Google access token"
                    />
                  </div>

                  <div>
                    <Label>Refresh Token</Label>
                    <Input
                      type="password"
                      value={googleAds.refresh_token}
                      onChange={(e) =>
                        setGoogleAds({ ...googleAds, refresh_token: e.target.value })
                      }
                      placeholder="Enter your Google refresh token"
                    />
                  </div>

                  <div>
                    <Label>Customer ID</Label>
                    <Input
                      value={googleAds.ad_account_id}
                      onChange={(e) =>
                        setGoogleAds({ ...googleAds, ad_account_id: e.target.value })
                      }
                      placeholder="123-456-7890"
                    />
                  </div>

                  <div>
                    <Label>Conversion ID (Tag)</Label>
                    <Input
                      value={googleAds.pixel_id}
                      onChange={(e) =>
                        setGoogleAds({ ...googleAds, pixel_id: e.target.value })
                      }
                      placeholder="AW-123456789"
                    />
                  </div>

                  <Button onClick={() => saveConfig(googleAds)} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      'Save Google Ads Configuration'
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
