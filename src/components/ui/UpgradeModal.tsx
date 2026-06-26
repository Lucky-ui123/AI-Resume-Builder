'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function UpgradeModal({ 
  isOpen, 
  onClose, 
  title = "Upgrade to Pro", 
  description = "You've reached the limit of your current plan. Upgrade to unlock more features and higher usage limits." 
}: UpgradeModalProps) {
  const router = useRouter();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border border-border shadow-xl rounded-2xl">
        <DialogHeader className="text-center items-center pb-2">
          <div className="mx-auto bg-accent/20 border border-accent/30 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
            <Sparkles className="h-7 w-7 text-accent" />
          </div>
          <DialogTitle className="text-center text-xl font-bold text-foreground">{title}</DialogTitle>
          <DialogDescription className="text-center text-base pt-2 text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-secondary/40 border border-border p-5 rounded-xl my-2 space-y-3">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">What you&apos;ll get</p>
          <ul className="space-y-2.5">
            {[
              '10x AI Usage Limits',
              'Cover Letter & LinkedIn Generators',
              'Unlimited Exports & More Resumes',
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                  <Check className="h-3 w-3 text-accent" />
                </div>
                <span className="text-sm text-foreground font-medium">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter className="sm:justify-stretch flex-col sm:flex-col gap-2 pt-2">
          <Button 
            className="w-full h-11 text-base font-bold shadow-sm" 
            onClick={() => {
              onClose();
              router.push('/pricing');
            }}
          >
            View Pricing Plans <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            className="w-full text-muted-foreground hover:text-foreground hover:bg-secondary" 
            onClick={onClose}
          >
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
