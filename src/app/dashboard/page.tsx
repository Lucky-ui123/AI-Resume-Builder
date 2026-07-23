import { getDashboardStats, getUserSubscription } from '@/lib/db-service';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const [stats, { userName }] = await Promise.all([
    getDashboardStats(),
    getUserSubscription()
  ]);

  return (
    <DashboardClient 
      stats={stats} 
      userName={userName} 
    />
  );
}
