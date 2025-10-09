import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Key } from 'lucide-react';

export default function AISettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_settings')
        .select('gemini_api_key')
        .single();

      if (error) throw error;
      setGeminiApiKey(data?.gemini_api_key || '');
    } catch (error: any) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('ai_settings')
        .update({ gemini_api_key: geminiApiKey })
        .eq('id', (await supabase.from('ai_settings').select('id').single()).data?.id);

      if (error) throw error;
      toast({ title: 'Settings saved successfully!' });
    } catch (error: any) {
      toast({ title: 'Error saving settings', description: error.message, variant: 'destructive' });
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
          <h1 className="text-3xl font-bold">AI Settings</h1>
          <p className="text-muted-foreground">Configure AI services for content generation</p>
        </div>

        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Key className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Google Gemini API</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Used for generating blog content, product descriptions, and SEO optimization.
                Get your API key from{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google AI Studio
                </a>
              </p>

              <div className="space-y-4">
                <div>
                  <Label>Gemini API Key</Label>
                  <Input
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="Enter your Gemini API key"
                  />
                </div>

                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-2">AI Features</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Blog post generation with SEO optimization</li>
                <li>• Product title and description generation</li>
                <li>• Automatic tag suggestions</li>
                <li>• Meta title and description generation</li>
                <li>• Social media preview text generation</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}