import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import 'biings-ds/build/bds.css';
import './globals.css';
import { TooltipProvider } from '@/components/ui/tooltip';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'HireCraft AI - AI Resume Builder',
  description: 'Create ATS-friendly resumes, optimize with AI, and land your dream job.',
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
