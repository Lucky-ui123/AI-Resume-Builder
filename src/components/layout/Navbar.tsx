'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileText, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from '@/components/ui/sheet';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Features', href: '/#features' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Testimonials', href: '/#testimonials' },
  ];

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'py-2' : 'py-4'}`}>
      <div className="container mx-auto px-4 sm:px-6">
        <div className={`mx-auto flex items-center justify-between rounded-full border transition-all duration-500 ${
          scrolled 
            ? 'bg-background/80 backdrop-blur-xl border-border/50 shadow-lg py-2 px-4 md:px-6' 
            : 'bg-transparent border-transparent py-2 px-2'
        }`}>
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-lg shadow-sm group-hover:scale-105 transition-transform duration-300">
              <FileText className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">HireCraft AI</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 bg-secondary/60 p-1.5 rounded-full border border-border/40 backdrop-blur-md">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href} 
                className="px-4 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-background rounded-full transition-all duration-200"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4 shrink-0">
            <Link href="/login" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors px-2">
              Log in
            </Link>
            <Link href="/signup">
              <Button className="rounded-full font-semibold shadow-md hover:shadow-lg transition-all duration-300 px-6">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden flex items-center shrink-0">
            <Sheet>
              <SheetTrigger className="inline-flex items-center justify-center rounded-full hover:bg-secondary/80 h-10 w-10 shrink-0">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2 text-left mt-4">
                    <div className="bg-primary text-primary-foreground p-1.5 rounded-lg shadow-sm">
                      <FileText className="h-5 w-5" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">HireCraft AI</span>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-6 mt-8">
                  <nav className="flex flex-col gap-4">
                    {navLinks.map((link) => (
                      <Link 
                        key={link.name} 
                        href={link.href} 
                        className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.name}
                      </Link>
                    ))}
                  </nav>
                  <div className="flex flex-col gap-3 mt-4 pt-6 border-t border-border/50">
                    <Link href="/login">
                      <Button variant="outline" className="w-full justify-center rounded-xl h-11">Log in</Button>
                    </Link>
                    <Link href="/signup">
                      <Button className="w-full justify-center rounded-xl h-11">Get Started</Button>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
