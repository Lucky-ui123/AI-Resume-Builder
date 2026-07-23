'use client';

import { useState, Suspense } from 'react';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import { Menu, FileText } from 'lucide-react';

import { ResumeProvider } from '@/context/ResumeContext';
import { PageSkeleton } from '@/components/ui/PageSkeleton';

export default function DashboardLayoutWrapper({
  children,
  userPlan = 'free',
  userEmail = '',
  userName = 'User',
}: {
  children: React.ReactNode;
  userPlan?: string;
  userEmail?: string;
  userName?: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <ResumeProvider>
      <div className="flex h-[100dvh] bg-background overflow-hidden font-sans">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-foreground/30 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-all duration-300 ease-in-out shadow-xl md:shadow-none ${isCollapsed ? 'md:w-20' : 'md:w-64'}`}>
        <DashboardSidebar 
          onClose={() => setSidebarOpen(false)} 
          userPlan={userPlan} 
          userEmail={userEmail}
          userName={userName}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:!hidden sticky top-0 h-16 border-b border-border bg-card flex items-center justify-between px-4 z-30 shrink-0 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
              <span className="sr-only">HireCraft AI</span>
              <FileText className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold">HireCraft AI</span>
          </div>
          <button 
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <Menu className="h-5 w-5 pointer-events-none" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
    </ResumeProvider>
  );
}
