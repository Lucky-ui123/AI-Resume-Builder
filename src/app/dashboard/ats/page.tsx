import AtsClient from './AtsClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ATS Analyzer | HireCraft AI',
  description: 'Evaluate your resume ATS compliance score and formatting.',
};

export default function AtsPage() {
  return <AtsClient />;
}
