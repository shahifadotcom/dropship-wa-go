import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/layouts/AdminLayout';
import { Search, Globe, FileText, Zap, Check, X, RefreshCw } from 'lucide-react';

export default function SEO() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [seoSettings, setSeoSettings] = useState<any>(null);
  const [sitemapLoading, setSitemapLoading] = useState(false);

  useEffect(() => {
    loadSEOSettings();
  }, []);

  const loadSEOSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('seo_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSeoSettings(data);
      } else {
        // Create default settings
        const { data: newSettings, error: createError } = await supabase
          .from('seo_settings')
          .insert({
            site_title: 'Your E-commerce Store',
            site_description: 'Premium products with worldwide shipping',
            canonical_url: 'https://yourstore.com'
          })
          .select()
          .single();

        if (createError) throw createError;
        setSeoSettings(newSettings);
      }
    } catch (error) {
      console.error('Error loading SEO settings:', error);
      toast({
        title: "Error",
        description: "Failed to load SEO settings",
        variant: "destructive"
      });
    }
  };

  const updateSEOSettings = async (updates: any) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('seo_settings')
        .update(updates)
        .eq('id', seoSettings.id);

      if (error) throw error;

      setSeoSettings({ ...seoSettings, ...updates });
      toast({
        title: "Success",
        description: "SEO settings updated successfully"
      });
    } catch (error) {
      console.error('Error updating SEO settings:', error);
      toast({
        title: "Error",
        description: "Failed to update SEO settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSitemap = async () => {
    setSitemapLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-sitemap');
      
      if (error) throw error;

      toast({
        title: "Success",
        description: "Sitemap generated successfully"
      });
      
      loadSEOSettings(); // Refresh to show last generated time
    } catch (error) {
      console.error('Error generating sitemap:', error);
      toast({
        title: "Error",
        description: "Failed to generate sitemap",
        variant: "destructive"
      });
    } finally {
      setSitemapLoading(false);
    }
  };

  const submitToSearchEngine = async (engine: string) => {
    try {
      let submitUrl = '';
      const sitemapUrl = `${seoSettings.canonical_url}/sitemap.xml`;

      switch (engine) {
        case 'google':
          submitUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
          break;
        case 'bing':
          submitUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
          break;
        case 'yandex':
          submitUrl = `https://webmaster.yandex.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
          break;
      }

      // Open in new tab for manual submission
      window.open(submitUrl, '_blank');
      
      toast({
        title: "Submission URL opened",
        description: `${engine} search engine submission page opened in new tab`
      });
    } catch (error) {
      console.error('Error submitting to search engine:', error);
      toast({
        title: "Error",
        description: "Failed to submit to search engine",
        variant: "destructive"
      });
    }
  };

  if (!seoSettings) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="animate-pulse">Loading SEO settings...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">SEO & Search Engines</h1>
          <p className="text-muted-foreground">Manage your site's SEO settings and search engine visibility</p>
        </div>

        <Tabs defaultValue="seo" className="space-y-4">
          <TabsList>
            <TabsTrigger value="seo">SEO Settings</TabsTrigger>
            <TabsTrigger value="sitemap">Sitemap</TabsTrigger>
            <TabsTrigger value="search-engines">Search Engines</TabsTrigger>
          </TabsList>

          <TabsContent value="seo" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  General SEO Settings
                </CardTitle>
                <CardDescription>
                  Configure your site's basic SEO information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="site_title">Site Title</Label>
                  <Input
                    id="site_title"
                    value={seoSettings.site_title || ''}
                    onChange={(e) => setSeoSettings({ ...seoSettings, site_title: e.target.value })}
                    placeholder="Your E-commerce Store"
                  />
                </div>

                <div>
                  <Label htmlFor="site_description">Site Description</Label>
                  <Textarea
                    id="site_description"
                    value={seoSettings.site_description || ''}
                    onChange={(e) => setSeoSettings({ ...seoSettings, site_description: e.target.value })}
                    placeholder="Premium products with worldwide shipping"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="canonical_url">Canonical URL</Label>
                  <Input
                    id="canonical_url"
                    value={seoSettings.canonical_url || ''}
                    onChange={(e) => setSeoSettings({ ...seoSettings, canonical_url: e.target.value })}
                    placeholder="https://yourstore.com"
                  />
                </div>

                <div>
                  <Label htmlFor="site_keywords">Site Keywords (comma separated)</Label>
                  <Input
                    id="site_keywords"
                    value={seoSettings.site_keywords?.join(', ') || ''}
                    onChange={(e) => setSeoSettings({ 
                      ...seoSettings, 
                      site_keywords: e.target.value.split(',').map(k => k.trim()) 
                    })}
                    placeholder="ecommerce, products, shopping, store"
                  />
                </div>

                <div>
                  <Label htmlFor="google_analytics_id">Google Analytics ID</Label>
                  <Input
                    id="google_analytics_id"
                    value={seoSettings.google_analytics_id || ''}
                    onChange={(e) => setSeoSettings({ ...seoSettings, google_analytics_id: e.target.value })}
                    placeholder="G-XXXXXXXXXX"
                  />
                </div>

                <Button 
                  onClick={() => updateSEOSettings(seoSettings)} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Saving...' : 'Save SEO Settings'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Robots.txt</CardTitle>
                <CardDescription>
                  Configure how search engines crawl your site
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={seoSettings.robots_txt || ''}
                  onChange={(e) => setSeoSettings({ ...seoSettings, robots_txt: e.target.value })}
                  rows={10}
                  className="font-mono text-sm"
                />
                <Button 
                  onClick={() => updateSEOSettings({ robots_txt: seoSettings.robots_txt })}
                  disabled={loading}
                  className="mt-4"
                >
                  Update Robots.txt
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sitemap" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  XML Sitemap
                </CardTitle>
                <CardDescription>
                  Generate and manage your site's XML sitemap
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">Sitemap Status</h3>
                    <p className="text-sm text-muted-foreground">
                      {seoSettings.sitemap_last_generated 
                        ? `Last generated: ${new Date(seoSettings.sitemap_last_generated).toLocaleString()}`
                        : 'Never generated'
                      }
                    </p>
                  </div>
                  <Badge variant={seoSettings.sitemap_enabled ? "default" : "secondary"}>
                    {seoSettings.sitemap_enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Button 
                    onClick={generateSitemap}
                    disabled={sitemapLoading}
                    className="w-full"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${sitemapLoading ? 'animate-spin' : ''}`} />
                    {sitemapLoading ? 'Generating...' : 'Generate Sitemap'}
                  </Button>
                  
                  {seoSettings.canonical_url && (
                    <Button 
                      variant="outline" 
                      onClick={() => window.open(`${seoSettings.canonical_url}/sitemap.xml`, '_blank')}
                      className="w-full"
                    >
                      View Current Sitemap
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="search-engines" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-600" />
                    Google Search Console
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    {seoSettings.google_search_console_verified ? (
                      <>
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Verified</span>
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 text-red-600" />
                        <span className="text-sm">Not verified</span>
                      </>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => submitToSearchEngine('google')}
                      className="w-full"
                    >
                      Submit Sitemap
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open('https://search.google.com/search-console', '_blank')}
                      className="w-full"
                    >
                      Open Console
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-500" />
                    Bing Webmaster Tools
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    {seoSettings.bing_webmaster_verified ? (
                      <>
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Verified</span>
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 text-red-600" />
                        <span className="text-sm">Not verified</span>
                      </>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => submitToSearchEngine('bing')}
                      className="w-full"
                    >
                      Submit Sitemap
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open('https://www.bing.com/webmasters', '_blank')}
                      className="w-full"
                    >
                      Open Webmaster
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-red-600" />
                    Yandex Webmaster
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    {seoSettings.yandex_webmaster_verified ? (
                      <>
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Verified</span>
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 text-red-600" />
                        <span className="text-sm">Not verified</span>
                      </>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => submitToSearchEngine('yandex')}
                      className="w-full"
                    >
                      Submit Sitemap
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open('https://webmaster.yandex.com', '_blank')}
                      className="w-full"
                    >
                      Open Webmaster
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Fast track your SEO setup
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 md:grid-cols-2">
                  <Button 
                    variant="outline"
                    onClick={() => window.open('https://developers.google.com/search/docs/beginner/seo-starter-guide', '_blank')}
                  >
                    SEO Best Practices
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.open('https://schema.org/', '_blank')}
                  >
                    Schema Markup Guide
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.open('https://web.dev/measure/', '_blank')}
                  >
                    Page Speed Test
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.open('https://search.google.com/test/mobile-friendly', '_blank')}
                  >
                    Mobile-Friendly Test
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