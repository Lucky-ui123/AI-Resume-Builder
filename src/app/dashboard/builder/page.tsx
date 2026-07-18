import { getResume, getUserSubscription } from '@/lib/db-service';
import BuilderClient from './BuilderClient';

export default async function ResumeBuilderPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const params = await searchParams;
  const initialResume = await getResume(params.id);
  const userProfile = await getUserSubscription();
  return <BuilderClient initialResume={initialResume} userProfile={userProfile} />;
}
