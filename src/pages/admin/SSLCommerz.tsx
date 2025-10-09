import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Save, TestTube2 } from "lucide-react";

interface SSLCommerzConfig {
  id?: string;
  store_id: string;
  store_password: string;
  is_sandbox: boolean;
  is_active: boolean;
}

export default function SSLCommerz() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState<SSLCommerzConfig>({
    store_id: "",
    store_password: "",
    is_sandbox: true,
    is_active: false,
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("sslcommerz_config")
        .select("*")
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setConfig(data);
      }
    } catch (error: any) {
      console.error("Error loading SSLCommerz config:", error);
      toast.error("Failed to load configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (!config.store_id || !config.store_password) {
        toast.error("Store ID and Store Password are required");
        return;
      }

      const { error } = config.id
        ? await supabase
            .from("sslcommerz_config")
            .update({
              store_id: config.store_id,
              store_password: config.store_password,
              is_sandbox: config.is_sandbox,
              is_active: config.is_active,
            })
            .eq("id", config.id)
        : await supabase.from("sslcommerz_config").insert([
            {
              store_id: config.store_id,
              store_password: config.store_password,
              is_sandbox: config.is_sandbox,
              is_active: config.is_active,
            },
          ]);

      if (error) throw error;

      toast.success("SSLCommerz configuration saved successfully");
      loadConfig();
    } catch (error: any) {
      console.error("Error saving SSLCommerz config:", error);
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      
      const { data, error } = await supabase.functions.invoke("sslcommerz-test", {
        body: {
          store_id: config.store_id,
          store_password: config.store_password,
          is_sandbox: config.is_sandbox,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Connection test successful!");
      } else {
        toast.error(data?.message || "Connection test failed");
      }
    } catch (error: any) {
      console.error("Error testing SSLCommerz connection:", error);
      toast.error("Failed to test connection");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>SSLCommerz Configuration</CardTitle>
          <CardDescription>
            Configure your SSLCommerz payment gateway for Bangladesh. Get your credentials from{" "}
            <a
              href="https://developer.sslcommerz.com/registration/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              SSLCommerz Developer Portal
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="store_id">Store ID</Label>
              <Input
                id="store_id"
                value={config.store_id}
                onChange={(e) =>
                  setConfig({ ...config, store_id: e.target.value })
                }
                placeholder="Enter your SSLCommerz Store ID"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="store_password">Store Password</Label>
              <Input
                id="store_password"
                type="password"
                value={config.store_password}
                onChange={(e) =>
                  setConfig({ ...config, store_password: e.target.value })
                }
                placeholder="Enter your SSLCommerz Store Password"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Sandbox Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Use sandbox for testing (recommended until you go live)
                </p>
              </div>
              <Switch
                checked={config.is_sandbox}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, is_sandbox: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Enable SSLCommerz</Label>
                <p className="text-sm text-muted-foreground">
                  Make SSLCommerz available as a payment option
                </p>
              </div>
              <Switch
                checked={config.is_active}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, is_active: checked })
                }
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Configuration
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing || !config.store_id || !config.store_password}
            >
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <TestTube2 className="mr-2 h-4 w-4" />
                  Test Connection
                </>
              )}
            </Button>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <h3 className="font-medium mb-2">Integration Notes:</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>SSLCommerz supports credit/debit cards, mobile banking, and internet banking</li>
              <li>Transactions are in BDT (Bangladeshi Taka)</li>
              <li>Success/Failure URLs will be automatically configured</li>
              <li>IPN (Instant Payment Notification) is enabled for real-time updates</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
