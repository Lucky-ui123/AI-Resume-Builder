import DashboardLayoutWrapper from '@/components/layout/DashboardLayoutWrapper';
import { getUserSubscription } from '@/lib/db-service';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { plan, userEmail, userName } = await getUserSubscription();

  return (
    <DashboardLayoutWrapper userPlan={plan} userEmail={userEmail} userName={userName}>
      {children}
    </DashboardLayoutWrapper>
  );
}
