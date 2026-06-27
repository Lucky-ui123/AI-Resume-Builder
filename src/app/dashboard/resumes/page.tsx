import ResumesClient from './ResumesClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Resumes | HireCraft AI',
  description: 'Manage your saved resumes.',
};

export default function ResumesPage() {
  return <ResumesClient />;
}
