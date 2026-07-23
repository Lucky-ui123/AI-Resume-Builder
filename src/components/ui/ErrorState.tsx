import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  title?: string;
  description: string;
  onRetry?: () => void;
}

export function ErrorState({ title = "Something went wrong", description, onRetry }: ErrorStateProps) {
  return (
    <Card className="border-destructive/20 bg-destructive/5 rounded-2xl max-w-xl mx-auto mt-8">
      <CardContent className="flex flex-col items-center text-center p-8 gap-4">
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-destructive">{title}</h3>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{description}</p>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="border-destructive/20 hover:bg-destructive/10 text-destructive mt-2">
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
