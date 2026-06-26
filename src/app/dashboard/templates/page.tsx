import { Metadata } from 'next';
import TemplatesClient from './TemplatesClient';

export const metadata: Metadata = {
  title: 'Resume Templates | HireCraft AI',
  description: 'Choose from our professional resume templates.',
};

export default function TemplatesPage() {
  return <TemplatesClient />;
}
