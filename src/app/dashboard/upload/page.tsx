import { UploadClient } from './UploadClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload } from 'lucide-react';

export const metadata = {
  title: 'Upload Resume | HireCraft AI',
  description: 'Upload and parse your existing resume.',
};

export default function UploadPage() {
  return (
    <div className="p-4 md:p-8 w-full space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-2.5 rounded-xl shadow-sm border border-primary/10">
            <Upload className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Upload Resume</h1>
            <p className="text-muted-foreground mt-1 text-lg">Import an existing PDF or DOCX resume to jumpstart your profile.</p>
          </div>
        </div>
      </div>

      <Card className="shadow-sm border-border rounded-2xl">
        <CardHeader>
          <CardTitle>Import Resume</CardTitle>
          <CardDescription>
            We use AI to extract and structure your resume text. Once uploaded, you can review and edit the details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UploadClient />
        </CardContent>
      </Card>
    </div>
  );
}
