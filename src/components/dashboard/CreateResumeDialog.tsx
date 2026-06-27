'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2 } from 'lucide-react';
import { showSuccess, showError, showLoading, dismissToast } from '@/lib/toast';
import { useResumes } from '@/context/ResumeContext';

export function CreateResumeDialog() {
  const router = useRouter();
  const { createResume } = useResumes();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      showError('Please enter a resume title.');
      return;
    }

    setIsSubmitting(true);
    const loadingToastId = showLoading('Creating resume...');
    
    try {
      const { id, error } = await createResume(title.trim(), targetRole.trim());
      
      dismissToast(loadingToastId);
      
      if (error) {
        showError(error || "Couldn't create your resume. Please try again.");
      } else if (id) {
        showSuccess('Resume created successfully');
        setOpen(false);
        setTitle('');
        setTargetRole('');
        // Navigate to builder with the new resume ID
        router.push(`/dashboard/builder?id=${id}`);
      }
    } catch {
      dismissToast(loadingToastId);
      showError('Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create Resume
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Resume</DialogTitle>
            <DialogDescription>
              Give your new resume a title and target role to get started.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Resume Title <span className="text-destructive">*</span></Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Software Engineer at Google"
                disabled={isSubmitting}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="targetRole">Target Role (Optional)</Label>
              <Input
                id="targetRole"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Frontend Developer"
                disabled={isSubmitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
