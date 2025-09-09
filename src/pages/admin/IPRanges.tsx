import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Globe } from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';

interface IPRange {
  id: string;
  ip_prefix: string;
  country_id: string;
  description: string;
  created_at: string;
}

interface Country {
  id: string;
  name: string;
  code: string;
  currency: string;
  is_active: boolean;
}

const IPRanges = () => {
  const [ipRanges, setIpRanges] = useState<IPRange[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRange, setEditingRange] = useState<IPRange | null>(null);
  const [formData, setFormData] = useState({
    ip_prefix: '',
    country_id: '',
    description: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch IP ranges
      const { data: ipRangesData, error: ipError } = await supabase
        .from('ip_ranges')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch countries
      const { data: countriesData, error: countryError } = await supabase
        .from('countries')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (ipError) throw ipError;
      if (countryError) throw countryError;

      setIpRanges(ipRangesData || []);
      setCountries(countriesData || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch IP ranges data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.ip_prefix || !formData.country_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingRange) {
        // Update existing IP range
        const { error } = await supabase
          .from('ip_ranges')
          .update({
            ip_prefix: formData.ip_prefix,
            country_id: formData.country_id,
            description: formData.description
          })
          .eq('id', editingRange.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "IP range updated successfully"
        });
      } else {
        // Create new IP range
        const { error } = await supabase
          .from('ip_ranges')
          .insert({
            ip_prefix: formData.ip_prefix,
            country_id: formData.country_id,
            description: formData.description
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "IP range added successfully"
        });
      }

      setIsDialogOpen(false);
      setEditingRange(null);
      setFormData({ ip_prefix: '', country_id: '', description: '' });
      fetchData();
    } catch (error: any) {
      console.error('Error saving IP range:', error);
      toast({
        title: "Error",
        description: "Failed to save IP range",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (range: IPRange) => {
    setEditingRange(range);
    setFormData({
      ip_prefix: range.ip_prefix,
      country_id: range.country_id,
      description: range.description || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this IP range?')) return;

    try {
      const { error } = await supabase
        .from('ip_ranges')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "IP range deleted successfully"
      });
      
      fetchData();
    } catch (error: any) {
      console.error('Error deleting IP range:', error);
      toast({
        title: "Error",
        description: "Failed to delete IP range",
        variant: "destructive"
      });
    }
  };

  const getCountryName = (countryId: string) => {
    const country = countries.find(c => c.id === countryId);
    return country ? `${country.name} (${country.code})` : 'Unknown';
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Globe className="h-8 w-8" />
                IP Ranges & Geolocation
              </h1>
              <p className="text-muted-foreground">
                Manage IP address ranges for country-based geolocation detection
              </p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingRange(null);
                  setFormData({ ip_prefix: '', country_id: '', description: '' });
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add IP Range
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingRange ? 'Edit IP Range' : 'Add New IP Range'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="ip_prefix">IP Prefix (CIDR notation) *</Label>
                    <Input
                      id="ip_prefix"
                      value={formData.ip_prefix}
                      onChange={(e) => setFormData({ ...formData, ip_prefix: e.target.value })}
                      placeholder="e.g., 192.168.1.0/24"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="country_id">Country *</Label>
                    <Select 
                      value={formData.country_id} 
                      onValueChange={(value) => setFormData({ ...formData, country_id: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.id} value={country.id}>
                            {country.name} ({country.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Optional description"
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingRange ? 'Update' : 'Add'} IP Range
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>IP Address Ranges</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP Prefix</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ipRanges.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No IP ranges configured. Add your first IP range to start geolocation detection.
                        </TableCell>
                      </TableRow>
                    ) : (
                      ipRanges.map((range) => (
                        <TableRow key={range.id}>
                          <TableCell className="font-mono">{range.ip_prefix}</TableCell>
                          <TableCell>{getCountryName(range.country_id)}</TableCell>
                          <TableCell>{range.description || '-'}</TableCell>
                          <TableCell>{new Date(range.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(range)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(range.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>How IP Geolocation Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                IP geolocation allows your store to automatically detect customer locations based on their IP addresses.
                This helps with:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Automatic currency detection based on customer location</li>
                <li>Regional pricing and product availability</li>
                <li>Shipping cost calculation</li>
                <li>Compliance with regional regulations</li>
                <li>Analytics and regional performance tracking</li>
              </ul>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-950/50 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Tip:</strong> Use CIDR notation for IP ranges (e.g., 192.168.1.0/24). 
                  You can find IP range databases from services like MaxMind or IP2Location.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default IPRanges;