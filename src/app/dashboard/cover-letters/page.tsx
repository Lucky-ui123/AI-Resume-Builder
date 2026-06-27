import CoverLettersClient from './CoverLettersClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cover Letters | HireCraft AI',
  description: 'Generate and edit professional AI cover letters.',
};

export default function CoverLettersPage() {
  return <CoverLettersClient />;
}
