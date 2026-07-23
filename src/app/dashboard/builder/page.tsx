import { getResume, getUserSubscription } from '@/lib/db-service';
import BuilderClient from './BuilderClient';

export default async function ResumeBuilderPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const params = await searchParams;
  const [initialResume, userProfile] = await Promise.all([
    getResume(params.id),
    getUserSubscription()
  ]);
  return <BuilderClient initialResume={initialResume} userProfile={userProfile} />;
}
