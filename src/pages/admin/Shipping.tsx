import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, MapPin, Clock, Package } from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';

const Shipping = () => {
  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Truck className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Shipping Management</h1>
            <p className="text-muted-foreground">Manage shipping options and delivery settings</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Zones</CardTitle>
              <MapPin className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-muted-foreground">Bangladesh, US, Australia, Canada</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Delivery</CardTitle>
              <Clock className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3-7 days</div>
              <p className="text-xs text-muted-foreground">Standard shipping time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Shipments</CardTitle>
              <Package className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Orders ready to ship</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Zones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { country: 'Bangladesh', rate: 'Free', time: '2-4 days' },
                  { country: 'United States', rate: '$15.00', time: '5-7 days' },
                  { country: 'Australia', rate: '$20.00', time: '7-10 days' },
                  { country: 'Canada', rate: '$18.00', time: '5-8 days' }
                ].map((zone, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">{zone.country}</h4>
                      <p className="text-sm text-muted-foreground">{zone.time}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{zone.rate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Truck className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Shipping Configuration</h3>
                <p className="text-muted-foreground">
                  Advanced shipping settings and carrier integration will be available soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Shipping;