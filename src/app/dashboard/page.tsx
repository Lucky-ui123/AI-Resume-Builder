import { getDashboardStats, getUserSubscription } from '@/lib/db-service';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const { userName } = await getUserSubscription();

  return (
    <DashboardClient 
      stats={stats} 
      userName={userName} 
    />
  );
}
