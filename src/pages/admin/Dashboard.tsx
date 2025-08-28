import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Users, 
  ShoppingCart,
  BarChart3,
  PieChart
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminSidebar from "@/components/admin/AdminSidebar";

const Dashboard = () => {
  const stats = [
    {
      title: "Total Revenue",
      value: "$45,231.89",
      change: "+20.1%",
      trend: "up",
      icon: DollarSign
    },
    {
      title: "Total Expenses",
      value: "$12,234.00",
      change: "-4.3%",
      trend: "down",
      icon: TrendingDown
    },
    {
      title: "Net Profit",
      value: "$33,197.89",
      change: "+12.5%",
      trend: "up",
      icon: TrendingUp
    },
    {
      title: "Total Orders",
      value: "2,847",
      change: "+15.2%",
      trend: "up",
      icon: ShoppingCart
    },
    {
      title: "Total Products",
      value: "1,245",
      change: "+8.1%",
      trend: "up",
      icon: Package
    },
    {
      title: "Total Customers",
      value: "12,847",
      change: "+18.7%",
      trend: "up",
      icon: Users
    }
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <div className="flex-1 ml-64">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's what's happening with your store.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="bg-card border-navigation/20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-card-foreground">
                      {stat.title}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-navigation" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-card-foreground">{stat.value}</div>
                    <p className={`text-xs ${
                      stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {stat.change} from last month
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-navigation/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <BarChart3 className="h-5 w-5 text-navigation" />
                  Revenue Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-16 w-16 mx-auto mb-4 text-navigation" />
                    <p>Revenue chart will be displayed here</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-navigation/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <PieChart className="h-5 w-5 text-navigation" />
                  Sales by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <PieChart className="h-16 w-16 mx-auto mb-4 text-navigation" />
                    <p>Category breakdown chart will be displayed here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;