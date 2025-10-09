import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function Stripe() {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState({
    publishable_key: "",
    secret_key: "",
    webhook_secret: "",
    is_active: false,
    is_sandbox: true,
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("stripe_config")
        .select("*")
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setConfig(data);
      }
    } catch (error: any) {
      console.error("Error loading Stripe config:", error);
      toast.error("Failed to load configuration");
    }
  };

  const handleSave = async () => {
    if (!config.publishable_key || !config.secret_key) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const { data: existing } = await supabase
        .from("stripe_config")
        .select("id")
        .single();

      if (existing) {
        const { error } = await supabase
          .from("stripe_config")
          .update(config)
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("stripe_config")
          .insert([config]);

        if (error) throw error;
      }

      toast.success("Stripe configuration saved successfully");
      loadConfig();
    } catch (error: any) {
      console.error("Error saving config:", error);
      toast.error("Failed to save configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-test");

      if (error) throw error;

      if (data.success) {
        toast.success("Stripe connection test successful!");
      } else {
        toast.error(data.error || "Connection test failed");
      }
    } catch (error: any) {
      console.error("Test error:", error);
      toast.error("Failed to test connection");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Stripe Payment Gateway</CardTitle>
          <CardDescription>
            Configure your Stripe API credentials for payment processing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="publishable_key">Publishable Key *</Label>
              <Input
                id="publishable_key"
                placeholder="pk_test_..."
                value={config.publishable_key}
                onChange={(e) =>
                  setConfig({ ...config, publishable_key: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secret_key">Secret Key *</Label>
              <Input
                id="secret_key"
                type="password"
                placeholder="sk_test_..."
                value={config.secret_key}
                onChange={(e) =>
                  setConfig({ ...config, secret_key: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhook_secret">Webhook Secret (Optional)</Label>
              <Input
                id="webhook_secret"
                type="password"
                placeholder="whsec_..."
                value={config.webhook_secret}
                onChange={(e) =>
                  setConfig({ ...config, webhook_secret: e.target.value })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_sandbox">Sandbox Mode (Test)</Label>
              <Switch
                id="is_sandbox"
                checked={config.is_sandbox}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, is_sandbox: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Enable Stripe</Label>
              <Switch
                id="is_active"
                checked={config.is_active}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, is_active: checked })
                }
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Configuration
            </Button>
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={testing || !config.secret_key}
            >
              {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test Connection
            </Button>
          </div>

          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="font-semibold mb-2">Setup Instructions:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Sign up for Stripe at stripe.com</li>
              <li>Get your API keys from the Stripe Dashboard</li>
              <li>Use test keys (pk_test_...) for sandbox mode</li>
              <li>Use live keys (pk_live_...) for production</li>
              <li>Configure webhook endpoint if needed</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
