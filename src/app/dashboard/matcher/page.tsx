import MatcherClient from './MatcherClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Job Matcher | HireCraft AI',
  description: 'Match your resume against any job description with AI.',
};

export default function MatcherPage() {
  return <MatcherClient />;
}
