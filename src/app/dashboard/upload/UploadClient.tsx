'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, FileType, CheckCircle2, XCircle, Loader2, Edit3, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { saveResumeAction } from '../builder/actions';
import { Resume } from '@/types';

type ConfidenceScores = {
  personalInfo: number;
  summary: number;
  experience: number;
  education: number;
  skills: number;
  projects: number;
  certifications: number;
};

const ConfidenceBadge = ({ score }: { score: number }) => {
  let color = 'bg-muted text-muted-foreground';
  let text = 'Missing';
  
  if (score >= 80) {
    color = 'bg-success-muted text-success border-success/20';
    text = `High Confidence (${score}%)`;
  } else if (score > 0) {
    color = 'bg-warning-muted text-warning border-warning/20';
    text = `Partial Match (${score}%)`;
  }

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${color} font-medium`}>
      {text}
    </span>
  );
};

export function UploadClient() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'parsing' | 'review' | 'saving' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [parsedResume, setParsedResume] = useState<Resume | null>(null);
  const [confidenceScores, setConfidenceScores] = useState<ConfidenceScores | null>(null);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const validateFile = (selectedFile: File) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.docx')) {
      setErrorMessage('Unsupported file type. Please upload a PDF or DOCX file.');
      return false;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setErrorMessage('File is too large. Maximum size is 5MB.');
      return false;
    }
    setErrorMessage('');
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    }
  };

  const processUpload = async () => {
    if (!file) return;

    try {
      setStatus('uploading');
      
      const formData = new FormData();
      formData.append('file', file);

      setStatus('parsing');
      const response = await fetch('/api/ai/parse-resume', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse resume');
      }

      setParsedResume(data.resume);
      setConfidenceScores(data.confidence);
      setStatus('review');
    } catch (err: unknown) {
      console.error(err);
      setStatus('error');
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setErrorMessage(message);
    }
  };

  const saveAndContinue = async () => {
    if (!parsedResume) return;

    try {
      setStatus('saving');
      
      // Save parsed resume to database
      const saveResult = await saveResumeAction(parsedResume);
      
      if (saveResult.error) {
        throw new Error('Failed to save the imported resume: ' + saveResult.error);
      }

      setStatus('success');
      
      // Navigate to builder
      setTimeout(() => {
        router.push(`/dashboard/builder`);
      }, 1500);

    } catch (err: unknown) {
      console.error(err);
      setStatus('error');
      const message = err instanceof Error ? err.message : 'An unexpected error occurred while saving.';
      setErrorMessage(message);
    }
  };

  const resetUpload = () => {
    setStatus('idle');
    setFile(null);
    setErrorMessage('');
    setParsedResume(null);
    setConfidenceScores(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePersonalInfoChange = (field: string, value: string) => {
    if (!parsedResume) return;
    setParsedResume({
      ...parsedResume,
      personalInfo: {
        ...parsedResume.personalInfo,
        [field]: value
      }
    });
  };



  if (status === 'review' && parsedResume) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-accent/10 border border-accent/20 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
          <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-primary">Resume Parsed Successfully</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Please review the extracted information below. You can make quick edits here, or full adjustments later in the Resume Builder. Missing sections are intentionally left empty.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader className="pb-3 border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Personal Info</CardTitle>
                <ConfidenceBadge score={confidenceScores?.personalInfo || 0} />
              </div>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input 
                  value={parsedResume.personalInfo.firstName} 
                  onChange={(e) => handlePersonalInfoChange('firstName', e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input 
                  value={parsedResume.personalInfo.lastName} 
                  onChange={(e) => handlePersonalInfoChange('lastName', e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  value={parsedResume.personalInfo.email} 
                  onChange={(e) => handlePersonalInfoChange('email', e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input 
                  value={parsedResume.personalInfo.phone} 
                  onChange={(e) => handlePersonalInfoChange('phone', e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input 
                  value={parsedResume.personalInfo.location} 
                  onChange={(e) => handlePersonalInfoChange('location', e.target.value)} 
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Summary</CardTitle>
                <ConfidenceBadge score={confidenceScores?.summary || 0} />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <Textarea 
                value={parsedResume.summary} 
                onChange={(e) => setParsedResume({...parsedResume, summary: e.target.value})} 
                rows={4}
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-md">Experience</CardTitle>
                  <ConfidenceBadge score={confidenceScores?.experience || 0} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Found {parsedResume.experience?.length || 0} experience entries.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-md">Education</CardTitle>
                  <ConfidenceBadge score={confidenceScores?.education || 0} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Found {parsedResume.education?.length || 0} education entries.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-md">Skills</CardTitle>
                  <ConfidenceBadge score={confidenceScores?.skills || 0} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Found {parsedResume.skills?.length || 0} skills.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-md">Other Sections</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Projects: {parsedResume.projects?.length || 0} | Certs: {parsedResume.certifications?.length || 0}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button variant="outline" onClick={resetUpload}>
            <XCircle className="w-4 h-4 mr-2" /> Discard & Retry
          </Button>
          <Button onClick={saveAndContinue}>
            Save & Continue to Builder <Edit3 className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {!file ? (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 bg-card shadow-sm
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-primary/5'}
          `}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".pdf,.docx" 
            className="hidden" 
          />
          <div className="mx-auto w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center mb-4 border border-border">
            <UploadCloud className="h-6 w-6 text-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Drag & Drop your resume</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Supports PDF and DOCX (Max 5MB)
          </p>
          <Button variant="outline">Browse Files</Button>
          {errorMessage && (
            <p className="text-destructive text-sm mt-4 font-medium">{errorMessage}</p>
          )}
        </div>
      ) : (
        <div className="border border-border rounded-2xl p-6 bg-card shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-secondary rounded-2xl border border-border">
              <FileType className="h-6 w-6 text-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            {status === 'idle' && (
              <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                <XCircle className="h-4 w-4 mr-2" /> Remove
              </Button>
            )}
          </div>

          {status === 'idle' && (
            <Button onClick={processUpload} className="w-full">
              Extract & Import
            </Button>
          )}

          {['uploading', 'parsing', 'saving'].includes(status) && (
            <div className="space-y-4">
              <div className="flex items-center text-sm font-medium text-primary gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {status === 'uploading' && 'Uploading file...'}
                {status === 'parsing' && 'AI is extracting structured data...'}
                {status === 'saving' && 'Saving to your account...'}
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="flex items-center text-sm font-medium text-success gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Successfully imported! Redirecting to builder...
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="flex items-start text-sm font-medium text-destructive gap-2 bg-destructive/10 p-3 rounded-lg">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <Button variant="outline" onClick={resetUpload} className="w-full">
                Try Again
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
