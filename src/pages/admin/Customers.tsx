import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, Phone, Calendar } from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { toast } from 'sonner';

interface Customer {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  phone_number?: string;
  created_at: string;
}

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, phone, phone_number, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const toggleCustomerSelection = (customerId: string) => {
    const newSelection = new Set(selectedCustomers);
    if (newSelection.has(customerId)) {
      newSelection.delete(customerId);
    } else {
      newSelection.add(customerId);
    }
    setSelectedCustomers(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedCustomers.size === filteredCustomers.length) {
      setSelectedCustomers(new Set());
    } else {
      setSelectedCustomers(new Set(filteredCustomers.map(c => c.id)));
    }
  };

  const sendBulkWhatsApp = async () => {
    if (selectedCustomers.size === 0) {
      toast.error('Please select at least one customer');
      return;
    }

    const message = prompt('Enter your WhatsApp message:');
    if (!message) return;

    setSending(true);
    try {
      const selectedData = customers.filter(c => selectedCustomers.has(c.id));
      const results = { sent: 0, failed: 0 };

      for (const customer of selectedData) {
        const phone = customer.phone_number || customer.phone;
        if (!phone) {
          results.failed++;
          continue;
        }

        try {
          const { error } = await supabase.functions.invoke('send-whatsapp-message', {
            body: {
              to: phone,
              message: message,
            },
          });

          if (error) throw error;
          results.sent++;
        } catch (error) {
          console.error(`Failed to send to ${phone}:`, error);
          results.failed++;
        }

        // Add small delay between messages
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      toast.success(`Sent ${results.sent} messages successfully. ${results.failed} failed.`);
      setSelectedCustomers(new Set());
    } catch (error) {
      console.error('Error sending bulk messages:', error);
      toast.error('Failed to send messages');
    } finally {
      setSending(false);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const searchLower = searchTerm.toLowerCase();
    const phone = customer.phone_number || customer.phone || '';
    return (
      customer.email.toLowerCase().includes(searchLower) ||
      customer.first_name?.toLowerCase().includes(searchLower) ||
      customer.last_name?.toLowerCase().includes(searchLower) ||
      phone.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Customers</h1>
            <p className="text-muted-foreground mt-1">Manage your customer base</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Customers</h1>
            <p className="text-muted-foreground mt-1">Manage your customer base</p>
          </div>
          {selectedCustomers.size > 0 && (
            <Button
              onClick={sendBulkWhatsApp}
              disabled={sending}
            >
              {sending ? 'Sending...' : `Send WhatsApp to ${selectedCustomers.size} customer${selectedCustomers.size > 1 ? 's' : ''}`}
            </Button>
          )}
        </div>

        <div className="flex gap-4">
          <Input
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          {filteredCustomers.length > 0 && (
            <Button
              variant="outline"
              onClick={toggleSelectAll}
            >
              {selectedCustomers.size === filteredCustomers.length ? 'Deselect All' : 'Select All'}
            </Button>
          )}
        </div>

        {!loading && filteredCustomers.length === 0 && (
          <div className="text-center py-12 border rounded-lg">
            <p className="text-muted-foreground text-lg">No customers found</p>
          </div>
        )}

        {!loading && filteredCustomers.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCustomers.map((customer) => {
              const isSelected = selectedCustomers.has(customer.id);
              const phone = customer.phone_number || customer.phone;
              
              return (
                <Card 
                  key={customer.id}
                  className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => toggleCustomerSelection(customer.id)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span className="truncate">
                        {customer.first_name || customer.last_name
                          ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
                          : 'No name provided'}
                      </span>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCustomerSelection(customer.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4"
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                    {phone && (
                      <div className="flex items-center text-sm">
                        <Phone className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                        <span>{phone}</span>
                      </div>
                    )}
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>Joined {new Date(customer.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Customers;