import { getAllResumes } from '@/lib/db-service';
import ResumesClient from './ResumesClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Resumes | HireCraft AI',
  description: 'Manage your saved resumes.',
};

export default async function ResumesPage() {
  const resumes = await getAllResumes();

  return <ResumesClient initialResumes={resumes} />;
}
