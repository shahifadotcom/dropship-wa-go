import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Ban, CheckCircle, RefreshCw } from 'lucide-react';

interface Subscription {
  id: string;
  user_id: string;
  plan_duration: number;
  price: number;
  currency: string;
  status: string;
  starts_at: string;
  expires_at: string;
  created_at: string;
  profiles?: {
    email: string;
    phone: string;
    first_name: string;
    last_name: string;
  };
}

export default function CallingSubscriptions() {
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    revenue: 0
  });

  useEffect(() => {
    fetchSubscriptions();
    fetchStats();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);

    // First get all subscriptions
    const { data: subsData, error: subsError } = await supabase
      .from('calling_subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (subsError) {
      console.error('Error fetching subscriptions:', subsError);
      toast({
        title: 'Error',
        description: 'Failed to load subscriptions',
        variant: 'destructive'
      });
      setLoading(false);
      return;
    }

    // Then get profile data for each user
    const enrichedSubs = await Promise.all(
      (subsData || []).map(async (sub) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, phone, first_name, last_name')
          .eq('id', sub.user_id)
          .single();

        return {
          ...sub,
          profiles: profile || undefined
        };
      })
    );

    setSubscriptions(enrichedSubs);
    setLoading(false);
  };

  const fetchStats = async () => {
    const { data: allSubs } = await supabase
      .from('calling_subscriptions')
      .select('status, price');

    if (allSubs) {
      const active = allSubs.filter(s => s.status === 'active').length;
      const expired = allSubs.filter(s => s.status === 'expired').length;
      const revenue = allSubs.reduce((sum, s) => sum + Number(s.price), 0);

      setStats({
        total: allSubs.length,
        active,
        expired,
        revenue
      });
    }
  };

  const cancelSubscription = async (subscriptionId: string) => {
    const { error } = await supabase
      .from('calling_subscriptions')
      .update({ status: 'cancelled' })
      .eq('id', subscriptionId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel subscription',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Success',
        description: 'Subscription cancelled successfully'
      });
      fetchSubscriptions();
      fetchStats();
    }
  };

  const getStatusBadge = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date();

    if (isExpired && status === 'active') {
      return <Badge variant="destructive">Expired</Badge>;
    }

    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getDaysRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffTime = expires.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Calling Subscriptions</h1>
            <p className="text-muted-foreground">Manage audio/video calling subscriptions</p>
          </div>
          <Button onClick={() => { fetchSubscriptions(); fetchStats(); }}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expired</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.revenue.toFixed(2)} BDT</div>
            </CardContent>
          </Card>
        </div>

        {/* Subscriptions Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Subscriptions</CardTitle>
            <CardDescription>View and manage all calling subscriptions</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : subscriptions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No subscriptions found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Starts</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Days Left</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        {sub.profiles?.first_name && sub.profiles?.last_name
                          ? `${sub.profiles.first_name} ${sub.profiles.last_name}`
                          : sub.profiles?.email || 'Unknown'}
                      </TableCell>
                      <TableCell>{sub.profiles?.phone || '-'}</TableCell>
                      <TableCell>{sub.plan_duration} month(s)</TableCell>
                      <TableCell>{sub.price} {sub.currency}</TableCell>
                      <TableCell>{getStatusBadge(sub.status, sub.expires_at)}</TableCell>
                      <TableCell>
                        {sub.starts_at ? new Date(sub.starts_at).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        {sub.status === 'active' ? getDaysRemaining(sub.expires_at) : '-'}
                      </TableCell>
                      <TableCell>
                        {sub.status === 'active' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => cancelSubscription(sub.id)}
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
