import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Package, Users, ShoppingCart, Edit, Trash2, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdminProductForm } from '@/components/AdminProductForm';
import AdminLayout from '@/layouts/AdminLayout';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number;
  images: string[];
  category_id: string;
  brand?: string;
  in_stock: boolean;
  stock_quantity: number;
  sku: string;
  tags: string[];
  rating: number;
  review_count: number;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_email: string;
  status: string;
  total: number;
  created_at: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes, ordersRes] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('*'),
        supabase.from('orders').select('*').order('created_at', { ascending: false })
      ]);

      if (productsRes.error) throw productsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      if (ordersRes.error) throw ordersRes.error;

      setProducts(productsRes.data || []);
      setCategories(categoriesRes.data || []);
      setOrders(ordersRes.data || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product deleted successfully"
      });
      fetchData();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive"
      });
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      // Send notification for status change
      await supabase.functions.invoke('send-order-notification', {
        body: {
          orderId,
          templateName: `order_${newStatus}`
        }
      });

      toast({
        title: "Success",
        description: "Order status updated successfully"
      });
      fetchData();
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div>Loading admin dashboard...</div>
      </div>
    );
  }

  const stats = [
    { title: 'Total Products', value: products.length, icon: Package },
    { title: 'Total Orders', value: orders.length, icon: ShoppingCart },
    { title: 'In Stock Products', value: products.filter(p => p.in_stock).length, icon: Package },
    { title: 'Pending Orders', value: orders.filter(o => o.status === 'pending').length, icon: Users }
  ];

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex gap-2">
            <Button 
              onClick={() => navigate('/whatsapp-setup')}
              variant="outline"
            >
              <QrCode className="h-4 w-4 mr-2" />
              WhatsApp Setup
            </Button>
            <Button onClick={() => setShowAddProduct(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                    <IconComponent className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Products Management */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Products Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {products.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No products found</p>
              ) : (
                products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <img
                        src={product.images[0] || '/placeholder.svg'}
                        alt={product.name}
                        className="w-16 h-16 rounded object-cover"
                      />
                      <div>
                        <h3 className="font-semibold">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">${product.price}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant={product.in_stock ? 'default' : 'secondary'}>
                            {product.in_stock ? `In Stock (${product.stock_quantity})` : 'Out of Stock'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Orders Management */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orders.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No orders found</p>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">Order #{order.order_number}</h3>
                      <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                      <p className="text-sm">${order.total.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={order.status} onValueChange={(value) => updateOrderStatus(order.id, value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Product Form Modal */}
        <AdminProductForm
          isOpen={showAddProduct}
          onClose={() => setShowAddProduct(false)}
          categories={categories}
          onSuccess={fetchData}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;