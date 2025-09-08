import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();

  // Quick admin access - in production, use proper authentication
  const handleQuickAdminLogin = async () => {
    // For development/demo purposes, create a temporary admin session
    // In production, redirect to proper login page
    try {
      await signIn('admin@example.com', 'admin123');
    } catch (error) {
      console.error('Admin login failed:', error);
      navigate('/auth');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-[400px]">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Admin Access Required</h2>
              <p className="text-muted-foreground">You need to be authenticated to access the admin panel.</p>
              <div className="space-y-2">
                <Button onClick={handleQuickAdminLogin} className="w-full">
                  Quick Admin Access
                </Button>
                <Button variant="outline" onClick={() => navigate('/auth')} className="w-full">
                  Go to Login Page
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />
      <main className="flex-1 ml-64">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;