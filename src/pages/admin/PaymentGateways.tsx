import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Edit, 
  Trash2, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  DollarSign,
  Users,
  TrendingUp,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { PaymentService, PaymentGateway, TransactionVerification } from '@/services/paymentService';

interface Country {
  id: string;
  name: string;
  code: string;
}

export default function PaymentGateways() {
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [transactions, setTransactions] = useState<TransactionVerification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingGateway, setIsAddingGateway] = useState(false);
  const [editingGateway, setEditingGateway] = useState<PaymentGateway | null>(null);
  const [newGateway, setNewGateway] = useState({
    name: '',
    display_name: '',
    wallet_number: '',
    country_id: '',
    instructions: '',
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load countries
      const { data: countriesData, error: countriesError } = await supabase
        .from('countries')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (countriesError) throw countriesError;
      setCountries(countriesData || []);

      // Load payment gateways
      const { data: gatewaysData, error: gatewaysError } = await supabase
        .from('payment_gateways')
        .select(`
          *,
          countries(name, code)
        `)
        .order('display_name');

      if (gatewaysError) throw gatewaysError;
      setGateways(gatewaysData || []);

      // Load transactions
      const transactionsData = await PaymentService.getAllTransactions();
      setTransactions(transactionsData);

    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error('Failed to load payment gateways data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddGateway = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_gateways')
        .insert([newGateway])
        .select()
        .single();

      if (error) throw error;

      toast.success('Payment gateway added successfully');
      setIsAddingGateway(false);
      setNewGateway({
        name: '',
        display_name: '',
        wallet_number: '',
        country_id: '',
        instructions: '',
        is_active: true
      });
      loadData();
    } catch (error: any) {
      console.error('Error adding gateway:', error);
      toast.error('Failed to add payment gateway');
    }
  };

  const handleUpdateGateway = async () => {
    if (!editingGateway) return;

    try {
      const { error } = await supabase
        .from('payment_gateways')
        .update({
          display_name: editingGateway.display_name,
          wallet_number: editingGateway.wallet_number,
          instructions: editingGateway.instructions,
          is_active: editingGateway.is_active
        })
        .eq('id', editingGateway.id);

      if (error) throw error;

      toast.success('Payment gateway updated successfully');
      setEditingGateway(null);
      loadData();
    } catch (error: any) {
      console.error('Error updating gateway:', error);
      toast.error('Failed to update payment gateway');
    }
  };

  const handleDeleteGateway = async (gatewayId: string) => {
    try {
      const { error } = await supabase
        .from('payment_gateways')
        .delete()
        .eq('id', gatewayId);

      if (error) throw error;

      toast.success('Payment gateway deleted successfully');
      loadData();
    } catch (error: any) {
      console.error('Error deleting gateway:', error);
      toast.error('Failed to delete payment gateway');
    }
  };

  const handleVerifyTransaction = async (transactionId: string, isVerified: boolean) => {
    const success = await PaymentService.verifyTransaction(transactionId, isVerified);
    if (success) {
      toast.success(`Transaction ${isVerified ? 'verified' : 'rejected'} successfully`);
      loadData();
    } else {
      toast.error('Failed to update transaction status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const stats = {
    totalGateways: gateways.length,
    activeGateways: gateways.filter(g => g.is_active).length,
    pendingTransactions: transactions.filter(t => t.status === 'pending').length,
    verifiedTransactions: transactions.filter(t => t.status === 'verified').length,
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payment Gateways</h1>
          <p className="text-muted-foreground">Manage mobile payment systems and transaction verification</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Gateways</p>
                <p className="text-2xl font-bold">{stats.totalGateways}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Active Gateways</p>
                <p className="text-2xl font-bold">{stats.activeGateways}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pendingTransactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold">{stats.verifiedTransactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="gateways" className="space-y-4">
        <TabsList>
          <TabsTrigger value="gateways">Payment Gateways</TabsTrigger>
          <TabsTrigger value="transactions">Transaction Verification</TabsTrigger>
        </TabsList>

        <TabsContent value="gateways">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Payment Gateways</CardTitle>
                  <CardDescription>
                    Manage bKash, Nagad, Rocket and other mobile payment services
                  </CardDescription>
                </div>
                <Dialog open={isAddingGateway} onOpenChange={setIsAddingGateway}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Gateway
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Payment Gateway</DialogTitle>
                      <DialogDescription>
                        Configure a new mobile payment gateway for your store
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Gateway Name</Label>
                          <Select
                            value={newGateway.name}
                            onValueChange={(value) => {
                              setNewGateway(prev => ({ 
                                ...prev, 
                                name: value,
                                display_name: value.charAt(0).toUpperCase() + value.slice(1)
                              }));
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select gateway" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bkash">bKash</SelectItem>
                              <SelectItem value="nagad">Nagad</SelectItem>
                              <SelectItem value="rocket">Rocket</SelectItem>
                              <SelectItem value="upay">Upay</SelectItem>
                              <SelectItem value="mcash">mCash</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="display_name">Display Name</Label>
                          <Input
                            id="display_name"
                            value={newGateway.display_name}
                            onChange={(e) => setNewGateway(prev => ({ ...prev, display_name: e.target.value }))}
                            placeholder="bKash Payment"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="wallet_number">Wallet Number</Label>
                          <Input
                            id="wallet_number"
                            value={newGateway.wallet_number}
                            onChange={(e) => setNewGateway(prev => ({ ...prev, wallet_number: e.target.value }))}
                            placeholder="01XXXXXXXXX"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="country">Country</Label>
                          <Select
                            value={newGateway.country_id}
                            onValueChange={(value) => setNewGateway(prev => ({ ...prev, country_id: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                              {countries.map((country) => (
                                <SelectItem key={country.id} value={country.id}>
                                  {country.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="instructions">Payment Instructions</Label>
                        <Textarea
                          id="instructions"
                          value={newGateway.instructions}
                          onChange={(e) => setNewGateway(prev => ({ ...prev, instructions: e.target.value }))}
                          placeholder="Send money to the above number and enter the transaction ID below..."
                          rows={3}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="is_active"
                          checked={newGateway.is_active}
                          onCheckedChange={(checked) => setNewGateway(prev => ({ ...prev, is_active: checked }))}
                        />
                        <Label htmlFor="is_active">Active</Label>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddingGateway(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddGateway}>Add Gateway</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gateway</TableHead>
                    <TableHead>Wallet Number</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gateways.map((gateway) => (
                    <TableRow key={gateway.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          <div>
                            <p className="font-medium">{gateway.display_name}</p>
                            <p className="text-sm text-muted-foreground">{gateway.name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{gateway.wallet_number}</TableCell>
                      <TableCell>{(gateway as any).countries?.name}</TableCell>
                      <TableCell>
                        <Badge variant={gateway.is_active ? "default" : "secondary"}>
                          {gateway.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingGateway(gateway)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteGateway(gateway.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Verification</CardTitle>
              <CardDescription>
                Review and verify transactions received from Android SMS scanner
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Gateway</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono">{transaction.transaction_id}</TableCell>
                      <TableCell>{transaction.payment_gateway}</TableCell>
                      <TableCell>৳{transaction.amount}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(transaction.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {transaction.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVerifyTransaction(transaction.id, true)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Verify
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVerifyTransaction(transaction.id, false)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Gateway Dialog */}
      <Dialog open={!!editingGateway} onOpenChange={() => setEditingGateway(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Payment Gateway</DialogTitle>
            <DialogDescription>
              Update gateway information
            </DialogDescription>
          </DialogHeader>
          
          {editingGateway && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit_display_name">Display Name</Label>
                <Input
                  id="edit_display_name"
                  value={editingGateway.display_name}
                  onChange={(e) => setEditingGateway(prev => 
                    prev ? ({ ...prev, display_name: e.target.value }) : null
                  )}
                />
              </div>

              <div>
                <Label htmlFor="edit_wallet_number">Wallet Number</Label>
                <Input
                  id="edit_wallet_number"
                  value={editingGateway.wallet_number}
                  onChange={(e) => setEditingGateway(prev => 
                    prev ? ({ ...prev, wallet_number: e.target.value }) : null
                  )}
                />
              </div>

              <div>
                <Label htmlFor="edit_instructions">Instructions</Label>
                <Textarea
                  id="edit_instructions"
                  value={editingGateway.instructions}
                  onChange={(e) => setEditingGateway(prev => 
                    prev ? ({ ...prev, instructions: e.target.value }) : null
                  )}
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit_is_active"
                  checked={editingGateway.is_active}
                  onCheckedChange={(checked) => setEditingGateway(prev => 
                    prev ? ({ ...prev, is_active: checked }) : null
                  )}
                />
                <Label htmlFor="edit_is_active">Active</Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingGateway(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateGateway}>Update Gateway</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}