import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ExternalLink } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface BinanceTransaction {
  id: string;
  order_id: string;
  transaction_id: string;
  amount: number;
  status: string;
  created_at: string;
  verified_at: string | null;
  orders: {
    order_number: string;
    customer_email: string;
  } | null;
}

export default function BinancePay() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [transactions, setTransactions] = useState<BinanceTransaction[]>([]);
  const [config, setConfig] = useState({
    id: "",
    api_key: "",
    api_secret: "",
    binance_pay_id: "",
    merchant_name: "",
    is_active: false,
    verification_mode: "manual",
    admin_whatsapp: "",
  });

  useEffect(() => {
    loadConfig();
    loadTransactions();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("binance_config")
        .select("*")
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConfig(data);
      }
    } catch (error) {
      console.error("Error loading Binance config:", error);
      toast.error("Failed to load Binance configuration");
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("transaction_verifications")
        .select(`
          id,
          order_id,
          transaction_id,
          amount,
          status,
          created_at,
          verified_at,
          orders (
            order_number,
            customer_email
          )
        `)
        .eq("payment_gateway", "binance_pay")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error loading transactions:", error);
      toast.error("Failed to load transaction history");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const configData = {
        api_key: config.api_key,
        api_secret: config.api_secret,
        binance_pay_id: config.binance_pay_id,
        merchant_name: config.merchant_name,
        is_active: config.is_active,
        verification_mode: config.verification_mode,
        admin_whatsapp: config.admin_whatsapp,
      };

      if (config.id) {
        const { error } = await supabase
          .from("binance_config")
          .update(configData)
          .eq("id", config.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("binance_config")
          .insert([configData])
          .select()
          .single();

        if (error) throw error;
        setConfig({ ...configData, id: data.id });
      }

      toast.success("Binance Pay configuration saved successfully");
      loadTransactions(); // Reload transactions after config save
    } catch (error) {
      console.error("Error saving Binance config:", error);
      toast.error("Failed to save Binance configuration");
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'secondary';
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Binance Pay Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure your Binance Pay integration for accepting cryptocurrency payments
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Credentials</CardTitle>
          <CardDescription>
            Enter your Binance Pay API credentials. You can obtain these from your Binance Merchant account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api_key">API Key</Label>
            <Input
              id="api_key"
              type="text"
              value={config.api_key}
              onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
              placeholder="Enter your Binance API Key"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="api_secret">API Secret</Label>
            <Input
              id="api_secret"
              type="password"
              value={config.api_secret}
              onChange={(e) => setConfig({ ...config, api_secret: e.target.value })}
              placeholder="Enter your Binance API Secret"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="binance_pay_id">Binance Pay ID</Label>
            <Input
              id="binance_pay_id"
              type="text"
              value={config.binance_pay_id}
              onChange={(e) => setConfig({ ...config, binance_pay_id: e.target.value })}
              placeholder="Enter your Binance Pay ID"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="merchant_name">Merchant Name (Optional)</Label>
            <Input
              id="merchant_name"
              type="text"
              value={config.merchant_name}
              onChange={(e) => setConfig({ ...config, merchant_name: e.target.value })}
              placeholder="Your store name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin_whatsapp">Admin WhatsApp Number (for payment notifications)</Label>
            <Input
              id="admin_whatsapp"
              type="tel"
              value={config.admin_whatsapp}
              onChange={(e) => setConfig({ ...config, admin_whatsapp: e.target.value })}
              placeholder="+8801775777308"
            />
            <p className="text-sm text-muted-foreground">
              Receive WhatsApp notifications when customers submit Binance payment details
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="verification_mode">Verification Mode</Label>
            <select
              id="verification_mode"
              value={config.verification_mode}
              onChange={(e) => setConfig({ ...config, verification_mode: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="manual">Manual Verification (Personal Account)</option>
              <option value="auto">Auto Verification (Merchant Account - Not Available)</option>
            </select>
            <p className="text-sm text-muted-foreground">
              {config.verification_mode === 'manual' 
                ? "Customers will see your Binance Pay ID and submit transaction ID after payment" 
                : "Auto verification requires a Binance Merchant account with API access"}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={config.is_active}
              onCheckedChange={(checked) => setConfig({ ...config, is_active: checked })}
            />
            <Label htmlFor="is_active">Enable Binance Pay</Label>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Configuration"
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            All Binance Pay transactions submitted by customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No transactions found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <a 
                          href={`/admin/orders`}
                          className="text-primary hover:underline flex items-center gap-1"
                          target="_blank"
                        >
                          #{transaction.orders?.order_number || 'N/A'}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {transaction.transaction_id}
                      </TableCell>
                      <TableCell>${transaction.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{transaction.orders?.customer_email || 'N/A'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
