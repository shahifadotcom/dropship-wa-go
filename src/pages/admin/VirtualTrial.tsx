import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Sparkles, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/layouts/AdminLayout';

interface VirtualTrialConfig {
  id: string;
  ai_provider: string;
  model_name: string;
  is_active: boolean;
}

const VirtualTrial = () => {
  const [config, setConfig] = useState<VirtualTrialConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasGeminiKey, setHasGeminiKey] = useState(false);

  useEffect(() => {
    fetchConfig();
    checkGeminiKey();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('virtual_trial_config')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching config:', error);
        toast.error('Failed to load configuration');
      } else {
        setConfig(data);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const checkGeminiKey = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-gemini-key');
      if (!error && data?.hasKey) {
        setHasGeminiKey(true);
      }
    } catch (error) {
      console.log('Gemini key not configured');
    }
  };

  const updateConfig = async (updatedFields: Partial<VirtualTrialConfig>) => {
    if (!config) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('virtual_trial_config')
        .update(updatedFields)
        .eq('id', config.id);

      if (error) {
        console.error('Error updating config:', error);
        toast.error('Failed to save configuration');
      } else {
        setConfig({ ...config, ...updatedFields });
        toast.success('Configuration saved successfully');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    if (!config) return;
    updateConfig({
      ai_provider: config.ai_provider,
      model_name: config.model_name,
      is_active: config.is_active,
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-center">Loading configuration...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!config) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-center">No configuration found</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8" />
            Virtual Try-On Configuration
          </h1>
          <p className="text-muted-foreground">Configure AI-powered virtual trial feature for clothing products</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Provider Settings</CardTitle>
              <CardDescription>
                Configure the AI model used for virtual try-on generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ai-provider">AI Provider</Label>
                <Select
                  value={config.ai_provider}
                  onValueChange={(value) => setConfig({ ...config, ai_provider: value })}
                >
                  <SelectTrigger id="ai-provider">
                    <SelectValue placeholder="Select AI provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini">Google Gemini</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model-name">Model Name</Label>
                <Select
                  value={config.model_name}
                  onValueChange={(value) => setConfig({ ...config, model_name: value })}
                >
                  <SelectTrigger id="model-name">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Experimental)</SelectItem>
                    <SelectItem value="gemini-2.5-flash-image-preview">Gemini 2.5 Flash (Image Preview)</SelectItem>
                    <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Recommended: Gemini 2.0 Flash for fast, high-quality results
                </p>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Enable Virtual Try-On</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow customers to virtually try on clothing products
                  </p>
                </div>
                <Switch
                  checked={config.is_active}
                  onCheckedChange={(checked) => setConfig({ ...config, is_active: checked })}
                />
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Configuration'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Key Configuration</CardTitle>
              <CardDescription>
                Manage your Google Gemini API key in Supabase secrets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Google Gemini API Key Status</span>
                  <span className={`text-sm ${hasGeminiKey ? 'text-green-600' : 'text-orange-600'}`}>
                    {hasGeminiKey ? '✓ Configured' : '⚠ Not Configured'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  The API key must be set as a Supabase secret named <code className="bg-background px-1 py-0.5 rounded">GEMINI_API_KEY</code>
                </p>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">To configure:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Go to Supabase Dashboard → Project Settings → Edge Functions</li>
                    <li>Add a new secret named <code className="bg-background px-1 py-0.5 rounded">GEMINI_API_KEY</code></li>
                    <li>Get your API key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Studio</a></li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="font-bold text-primary">1.</span>
                <p>Enable "Virtual Try-On" when adding/editing clothing products in the product form</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-primary">2.</span>
                <p>Customers upload their photo on the product detail page</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-primary">3.</span>
                <p>AI generates a realistic image showing how the product looks on them</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-primary">4.</span>
                <p>Results are displayed instantly, helping customers make confident purchase decisions</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default VirtualTrial;