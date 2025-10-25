import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Calendar, TrendingUp, Loader2 } from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Reports = () => {
  const [loadingSales, setLoadingSales] = useState(false);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const downloadCSV = (data: string, filename: string) => {
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateSalesReport = async () => {
    setLoadingSales(true);
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total,
          payment_status,
          status,
          payment_method,
          created_at,
          customer_email
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!orders || orders.length === 0) {
        toast.info('No orders found to generate report');
        return;
      }

      // Calculate totals
      const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
      const paidOrders = orders.filter(o => o.payment_status === 'paid');
      const paidRevenue = paidOrders.reduce((sum, order) => sum + Number(order.total), 0);

      // Create CSV
      let csv = 'Sales Report\n\n';
      csv += `Total Orders,${orders.length}\n`;
      csv += `Total Revenue,$${totalRevenue.toFixed(2)}\n`;
      csv += `Paid Orders,${paidOrders.length}\n`;
      csv += `Paid Revenue,$${paidRevenue.toFixed(2)}\n\n`;
      csv += 'Order Number,Date,Customer,Total,Payment Status,Order Status,Payment Method\n';
      
      orders.forEach(order => {
        csv += `${order.order_number},${new Date(order.created_at).toLocaleDateString()},${order.customer_email},$${Number(order.total).toFixed(2)},${order.payment_status},${order.status},${order.payment_method || 'N/A'}\n`;
      });

      downloadCSV(csv, `sales-report-${new Date().toISOString().split('T')[0]}.csv`);
      toast.success('Sales report generated successfully');
    } catch (error) {
      console.error('Error generating sales report:', error);
      toast.error('Failed to generate sales report');
    } finally {
      setLoadingSales(false);
    }
  };

  const generateMonthlyReport = async () => {
    setLoadingMonthly(true);
    try {
      const currentDate = new Date();
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', firstDay.toISOString())
        .lte('created_at', lastDay.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!orders || orders.length === 0) {
        toast.info('No orders found for this month');
        return;
      }

      const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
      const paidOrders = orders.filter(o => o.payment_status === 'paid');
      const pendingOrders = orders.filter(o => o.payment_status === 'pending');

      let csv = `Monthly Summary Report - ${currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}\n\n`;
      csv += `Total Orders,${orders.length}\n`;
      csv += `Total Revenue,$${totalRevenue.toFixed(2)}\n`;
      csv += `Paid Orders,${paidOrders.length}\n`;
      csv += `Pending Orders,${pendingOrders.length}\n`;
      csv += `Average Order Value,$${(totalRevenue / orders.length).toFixed(2)}\n\n`;
      csv += 'Order Number,Date,Customer,Total,Status\n';
      
      orders.forEach(order => {
        csv += `${order.order_number},${new Date(order.created_at).toLocaleDateString()},${order.customer_email},$${Number(order.total).toFixed(2)},${order.payment_status}\n`;
      });

      downloadCSV(csv, `monthly-report-${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}.csv`);
      toast.success('Monthly report generated successfully');
    } catch (error) {
      console.error('Error generating monthly report:', error);
      toast.error('Failed to generate monthly report');
    } finally {
      setLoadingMonthly(false);
    }
  };

  const generateOrderReport = async () => {
    setLoadingOrders(true);
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            product_name,
            quantity,
            price
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!orders || orders.length === 0) {
        toast.info('No orders found to generate report');
        return;
      }

      let csv = 'Complete Order Report\n\n';
      csv += 'Order Number,Date,Customer Email,Total,Payment Status,Order Status,Payment Method,Items,Shipping Address\n';
      
      orders.forEach(order => {
        const items = order.order_items?.map((item: any) => 
          `${item.product_name} (${item.quantity}x$${Number(item.price).toFixed(2)})`
        ).join('; ') || 'N/A';
        
        const shippingAddress = order.shipping_address 
          ? `${(order.shipping_address as any).address1}, ${(order.shipping_address as any).city}, ${(order.shipping_address as any).country}`
          : 'N/A';

        csv += `${order.order_number},${new Date(order.created_at).toLocaleDateString()},${order.customer_email},$${Number(order.total).toFixed(2)},${order.payment_status},${order.status},${order.payment_method || 'N/A'},"${items}","${shippingAddress}"\n`;
      });

      downloadCSV(csv, `order-report-${new Date().toISOString().split('T')[0]}.csv`);
      toast.success('Order report generated successfully');
    } catch (error) {
      console.error('Error generating order report:', error);
      toast.error('Failed to generate order report');
    } finally {
      setLoadingOrders(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Reports</h1>
            <p className="text-muted-foreground">Generate and download business reports</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Sales Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Detailed sales analytics and revenue breakdown
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={generateSalesReport}
                disabled={loadingSales}
              >
                {loadingSales ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Monthly Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Monthly performance and growth metrics
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={generateMonthlyReport}
                disabled={loadingMonthly}
              >
                {loadingMonthly ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Order Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Complete order history and status tracking
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={generateOrderReport}
                disabled={loadingOrders}
              >
                {loadingOrders ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Custom Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Advanced Reporting Coming Soon</h3>
              <p className="text-muted-foreground">
                Custom report builder and automated scheduling will be available in future updates.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Reports;