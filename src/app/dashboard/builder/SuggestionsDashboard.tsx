"use client";

import React, { useState } from 'react';
import { ResumeSuggestion, ResumeScores } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Check, X, Sparkles, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface SuggestionsDashboardProps {
  suggestions: ResumeSuggestion[];
  scores?: ResumeScores;
  onApply: (suggestion: ResumeSuggestion) => void;
  onUndo: (suggestionId: string) => void;
  onDismiss: (suggestionId: string) => void;
  isAnalyzing: boolean;
  canUndo: (suggestionId: string) => boolean;
}

export function SuggestionsDashboard({
  suggestions,
  scores,
  onApply,
  onUndo,
  onDismiss,
  isAnalyzing,
  canUndo
}: SuggestionsDashboardProps) {
  const [activeTab, setActiveTab] = useState('all');

  const filteredSuggestions = suggestions.filter(s => {
    if (activeTab === 'all') return true;
    return s.category.toLowerCase() === activeTab.toLowerCase();
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'destructive';
      case 'High': return 'default';
      case 'Medium': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Scoring Header */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-primary" /> 
            AI Resume Analysis
          </h3>
          {isAnalyzing && (
            <Badge variant="outline" className="animate-pulse bg-primary/10 text-primary border-primary/20">
              Analyzing changes...
            </Badge>
          )}
        </div>
        
        {scores ? (
          <div className="grid grid-cols-4 gap-4">
            <div className="flex flex-col items-center p-3 bg-background rounded-lg border shadow-sm">
              <span className="text-3xl font-bold text-primary">{scores.overall}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">Overall</span>
            </div>
            <div className="flex flex-col p-3 bg-background rounded-lg border shadow-sm justify-center">
              <span className="text-xs font-medium mb-1 flex justify-between">ATS <span className="font-bold">{scores.ats}</span></span>
              <Progress value={scores.ats} className="h-2" />
            </div>
            <div className="flex flex-col p-3 bg-background rounded-lg border shadow-sm justify-center">
              <span className="text-xs font-medium mb-1 flex justify-between">Content <span className="font-bold">{scores.content}</span></span>
              <Progress value={scores.content} className="h-2" />
            </div>
            <div className="flex flex-col p-3 bg-background rounded-lg border shadow-sm justify-center">
              <span className="text-xs font-medium mb-1 flex justify-between">Writing <span className="font-bold">{scores.writing}</span></span>
              <Progress value={scores.writing} className="h-2" />
            </div>
          </div>
        ) : (
          <div className="h-[76px] flex items-center justify-center border border-dashed rounded-lg text-muted-foreground text-sm">
            Make edits to your resume to generate a score.
          </div>
        )}
      </div>

      {/* Suggestions Content */}
      <div className="flex-1 overflow-auto p-4 bg-muted/10">
        {suggestions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Excellent!</h3>
              <p className="text-muted-foreground mt-2">No improvements found. Your resume looks highly optimized based on our current heuristics.</p>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All ({suggestions.length})</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="ats">ATS</TabsTrigger>
              <TabsTrigger value="writing">Writing</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4 mt-0">
              {filteredSuggestions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No suggestions in this category.</p>
              ) : (
                filteredSuggestions.map(sug => (
                  <Card key={sug.id} className="overflow-hidden border-border/50 shadow-sm transition-all hover:shadow-md">
                    <CardHeader className="pb-3 bg-muted/20">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-base font-semibold flex items-center gap-2">
                            {sug.priority === 'Critical' && <AlertTriangle className="w-4 h-4 text-destructive" />}
                            {sug.title}
                          </CardTitle>
                          <CardDescription className="text-xs flex gap-2 mt-1">
                            <Badge variant={getPriorityColor(sug.priority)} className="text-[10px] uppercase py-0">{sug.priority}</Badge>
                            <Badge variant="outline" className="text-[10px] uppercase py-0">{sug.category}</Badge>
                          </CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => onDismiss(sug.id)} className="h-6 w-6 text-muted-foreground hover:text-foreground">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="py-4 space-y-4 text-sm">
                      <p className="text-foreground">{sug.description}</p>
                      
                      <div className="bg-muted/50 p-3 rounded-md text-xs border border-border/50 space-y-2">
                        <div className="flex items-start gap-2">
                          <div className="min-w-16 font-semibold text-muted-foreground">Reason:</div>
                          <div>{sug.reason}</div>
                        </div>
                        
                        {sug.currentText && (
                          <div className="flex items-start gap-2 pt-2 border-t border-border/50 mt-2">
                            <div className="min-w-16 font-semibold text-destructive/80">Current:</div>
                            <div className="line-clamp-2 italic text-muted-foreground">{sug.currentText}</div>
                          </div>
                        )}
                        <div className="flex items-start gap-2 pt-2 border-t border-border/50 mt-2">
                          <div className="min-w-16 font-semibold text-green-600/80">Suggested:</div>
                          <div className="font-medium text-foreground">{sug.suggestedText}</div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0 pb-4 px-4 flex justify-end gap-2">
                      {canUndo(sug.id) ? (
                        <Button variant="outline" size="sm" onClick={() => onUndo(sug.id)}>
                          Undo
                        </Button>
                      ) : (
                        <Button variant="default" size="sm" onClick={() => onApply(sug)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                          Apply Suggestion
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
