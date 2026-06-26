'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/(auth)/actions';
import { 
  FileText, 
  LayoutDashboard, 
  PenTool, 
  Target, 
  CheckCircle, 
  Sparkles, 
  FileSignature, 
  Network, 
  LayoutTemplate, 
  Download, 
  Settings,
  LogOut,
  X,
  UploadCloud,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Resumes', href: '/dashboard/resumes', icon: FileText },
  { name: 'Resume Builder', href: '/dashboard/builder', icon: PenTool },
  { name: 'Upload Resume', href: '/dashboard/upload', icon: UploadCloud },
  { name: 'Job Matcher', href: '/dashboard/matcher', icon: Target },
  { name: 'ATS Report', href: '/dashboard/ats-report', icon: CheckCircle },
  { name: 'AI Suggestions', href: '/dashboard/ai-suggestions', icon: Sparkles },
  { name: 'Cover Letters', href: '/dashboard/cover-letter', icon: FileSignature },
  { name: 'LinkedIn Optimizer', href: '/dashboard/linkedin', icon: Network },
  { name: 'Templates', href: '/dashboard/templates', icon: LayoutTemplate },
  { name: 'Exports', href: '/dashboard/export', icon: Download },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardSidebar({ 
  onClose, 
  userPlan = 'free',
  userEmail = '',
  userName = 'User',
  isCollapsed = false,
  onToggleCollapse
}: { 
  onClose?: () => void, 
  userPlan?: string,
  userEmail?: string,
  userName?: string,
  isCollapsed?: boolean,
  onToggleCollapse?: () => void
}) {
  const pathname = usePathname();

  return (
    <div className={`flex h-screen flex-col bg-sidebar border-r border-sidebar-border text-sidebar-foreground transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64 md:w-64'}`}>
      {/* Logo */}
      <div className={`flex items-center border-b border-sidebar-border shrink-0 transition-all duration-300 ${isCollapsed ? 'min-h-16 flex-col justify-center py-3 gap-3' : 'h-16 justify-between px-5'}`}>
        {!isCollapsed && (
          <Link href="/" className="flex items-center gap-2.5 group overflow-hidden">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-lg shadow-sm group-hover:bg-primary/90 transition-colors shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground whitespace-nowrap overflow-hidden">HireCraft AI</span>
          </Link>
        )}
        {isCollapsed && (
          <Link href="/" className="bg-primary text-primary-foreground p-1.5 rounded-lg shadow-sm">
            <FileText className="h-4 w-4" />
          </Link>
        )}
        
        <div className="flex items-center shrink-0">
          {onClose && (
            <button 
              type="button"
              className={`md:hidden inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${isCollapsed ? 'hidden' : ''}`}
              onClick={onClose}
            >
              <X className="h-5 w-5 pointer-events-none" />
            </button>
          )}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className={`hidden md:flex items-center justify-center rounded-md h-8 w-8 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors`}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        <nav className="space-y-0.5 px-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            
            const linkContent = (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center rounded-lg py-2.5 text-sm font-medium transition-all duration-200 ${
                  isCollapsed ? 'justify-center px-0 mx-2' : 'px-3'
                } ${
                  isActive
                    ? 'bg-primary !text-white shadow-md hover:shadow-lg'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
                onClick={() => onClose && onClose()}
              >
                <item.icon
                  className={`h-5 w-5 flex-shrink-0 transition-colors ${
                    !isCollapsed ? 'mr-3' : ''
                  } ${
                    isActive ? '!text-white' : 'text-muted-foreground group-hover:text-foreground'
                  }`}
                  aria-hidden="true"
                />
                {!isCollapsed && <span className={`whitespace-nowrap overflow-hidden ${isActive ? '!text-white' : ''}`}>{item.name}</span>}
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger render={linkContent} />
                  <TooltipContent side="right" className="flex items-center gap-4">
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return linkContent;
          })}
        </nav>
      </div>

      {/* User Footer */}
      <div className="border-t border-sidebar-border p-4 bg-sidebar flex flex-col gap-2">
        {!isCollapsed && (
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-secondary transition-colors cursor-pointer border border-transparent hover:border-border">
            <Avatar className="h-9 w-9 border border-border shrink-0">
              <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground font-bold text-sm">
                {userName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-semibold text-sidebar-foreground truncate">{userName}</span>
              <span className="text-xs text-muted-foreground truncate">{userEmail}</span>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="flex justify-center mb-2">
            <Avatar className="h-10 w-10 border border-border shrink-0">
              <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground font-bold text-sm">
                {userName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
        
        <form action={logout} className="w-full">
          <button
            type="submit"
            className={`group flex items-center justify-center rounded-lg py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors border border-transparent hover:border-destructive/20 w-full ${isCollapsed ? 'px-0' : 'px-3 justify-start'}`}
            title={isCollapsed ? "Sign out" : undefined}
          >
            <LogOut className={`h-4 w-4 flex-shrink-0 text-muted-foreground group-hover:text-destructive transition-colors ${!isCollapsed ? 'mr-3' : ''}`} />
            {!isCollapsed && <span>Sign out</span>}
          </button>
        </form>
      </div>
    </div>
  );
}
