import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { TooltipProvider } from '@/components/ui/tooltip';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'HireCraft AI - AI Resume Builder',
  description: 'Create ATS-friendly resumes, optimize with AI, and land your dream job.',
  openGraph: {
    title: 'HireCraft AI - Land Your Dream Job',
    description: 'Build professional, ATS-optimized resumes in minutes using AI.',
    url: 'https://ai-resume-builder-lucky.vercel.app',
    siteName: 'HireCraft AI',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HireCraft AI - AI Resume Builder',
    description: 'Build professional, ATS-optimized resumes in minutes using AI.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jakarta.className} min-h-screen bg-background antialiased`}>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
