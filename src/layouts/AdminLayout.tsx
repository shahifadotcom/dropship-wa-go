import { ReactNode } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
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