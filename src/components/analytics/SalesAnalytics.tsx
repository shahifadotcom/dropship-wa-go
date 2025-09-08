import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Package,
  Globe,
  CreditCard,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AnalyticsData {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  countrySales: Array<{
    country: string;
    sales: number;
    orders: number;
    percentage: number;
  }>;
  paymentGatewayStats: Array<{
    gateway: string;
    transactions: number;
    amount: number;
    success_rate: number;
  }>;
  salesTrend: Array<{
    date: string;
    sales: number;
    orders: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function SalesAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalSales: 0,
    totalOrders: 0,
    totalCustomers: 0,
    averageOrderValue: 0,
    countrySales: [],
    paymentGatewayStats: [],
    salesTrend: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      // Calculate date range
      const now = new Date();
      const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

      // Load orders data
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*)
        `)
        .gte('created_at', startDate.toISOString());

      if (ordersError) throw ordersError;

      // Load country data
      const { data: countries, error: countriesError } = await supabase
        .from('countries')
        .select('*');

      if (countriesError) throw countriesError;

      // Load payment gateway stats
      const { data: transactions, error: transactionsError } = await supabase
        .from('transaction_verifications')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (transactionsError) throw transactionsError;

      // Process analytics data
      const processedData = processAnalyticsData(orders || [], countries || [], transactions || []);
      setAnalyticsData(processedData);

    } catch (error: any) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const processAnalyticsData = (orders: any[], countries: any[], transactions: any[]): AnalyticsData => {
    // Basic stats
    const totalOrders = orders.length;
    const totalSales = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const uniqueCustomers = new Set(orders.map(o => o.customer_id)).size;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Country-wise sales (simulated based on order data)
    const countrySalesMap = new Map();
    orders.forEach(order => {
      // For demo, we'll simulate country distribution
      const countryGuess = order.billing_address?.country || 'Bangladesh';
      if (!countrySalesMap.has(countryGuess)) {
        countrySalesMap.set(countryGuess, { sales: 0, orders: 0 });
      }
      const current = countrySalesMap.get(countryGuess);
      current.sales += order.total || 0;
      current.orders += 1;
    });

    const countrySales = Array.from(countrySalesMap.entries()).map(([country, data]) => ({
      country,
      sales: data.sales,
      orders: data.orders,
      percentage: (data.sales / totalSales) * 100
    }));

    // Payment gateway stats
    const gatewayMap = new Map();
    transactions.forEach(transaction => {
      if (!gatewayMap.has(transaction.payment_gateway)) {
        gatewayMap.set(transaction.payment_gateway, {
          transactions: 0,
          amount: 0,
          verified: 0
        });
      }
      const current = gatewayMap.get(transaction.payment_gateway);
      current.transactions += 1;
      current.amount += transaction.amount || 0;
      if (transaction.status === 'verified') {
        current.verified += 1;
      }
    });

    const paymentGatewayStats = Array.from(gatewayMap.entries()).map(([gateway, data]) => ({
      gateway,
      transactions: data.transactions,
      amount: data.amount,
      success_rate: data.transactions > 0 ? (data.verified / data.transactions) * 100 : 0
    }));

    // Sales trend (last 7 days)
    const salesTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayOrders = orders.filter(order => 
        order.created_at.startsWith(dateStr)
      );
      
      salesTrend.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sales: dayOrders.reduce((sum, order) => sum + (order.total || 0), 0),
        orders: dayOrders.length
      });
    }

    return {
      totalSales,
      totalOrders,
      totalCustomers: uniqueCustomers,
      averageOrderValue,
      countrySales,
      paymentGatewayStats,
      salesTrend
    };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Sales Analytics</h2>
          <p className="text-muted-foreground">Track performance and customer insights</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadAnalytics}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
                <p className="text-2xl font-bold">৳{analyticsData.totalSales.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{analyticsData.totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Customers</p>
                <p className="text-2xl font-bold">{analyticsData.totalCustomers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Avg Order Value</p>
                <p className="text-2xl font-bold">৳{analyticsData.averageOrderValue.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Sales Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.salesTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="sales" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Country Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Sales by Country
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.countrySales}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ country, percentage }) => `${country}: ${percentage.toFixed(1)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="sales"
                >
                  {analyticsData.countrySales.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Payment Gateway Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Gateway Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.paymentGatewayStats.map((gateway) => (
              <div key={gateway.gateway} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold capitalize">{gateway.gateway}</h4>
                    <Badge variant="outline">
                      {gateway.transactions} transactions
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Total: ৳{gateway.amount.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Success Rate</p>
                  <div className="flex items-center gap-2">
                    <Progress value={gateway.success_rate} className="w-20 h-2" />
                    <span className="text-sm font-bold">
                      {gateway.success_rate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}