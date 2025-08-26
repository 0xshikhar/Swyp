import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useRequireAuth } from '@/hooks/use-auth';

interface DashboardLayoutWrapperProps {
  children: React.ReactNode;
}

export default function DashboardLayoutWrapper({ children }: DashboardLayoutWrapperProps) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}