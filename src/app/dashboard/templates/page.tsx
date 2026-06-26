import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LayoutTemplate, CheckCircle2 } from 'lucide-react';

const templates = [
  {
    id: 'classic-ats',
    name: 'Classic ATS',
    description: 'A traditional, single-column layout optimized for maximum ATS readability.',
    isPremium: false,
    selected: true,
    color: 'bg-slate-50',
    accent: 'bg-slate-200'
  },
  {
    id: 'modern-professional',
    name: 'Modern Professional',
    description: 'Clean two-column design with a touch of color for modern tech companies.',
    isPremium: false,
    selected: false,
    color: 'bg-primary/10',
    accent: 'bg-primary/20'
  },
  {
    id: 'product-designer',
    name: 'Product Designer',
    description: 'Creative layout focusing on portfolio links and visual hierarchy.',
    isPremium: true,
    selected: false,
    color: 'bg-accent/50',
    accent: 'bg-accent'
  },
  {
    id: 'developer-clean',
    name: 'Developer Clean',
    description: 'Minimalist structure highlighting technical skills and GitHub projects.',
    isPremium: true,
    selected: false,
    color: 'bg-zinc-50',
    accent: 'bg-zinc-200'
  },
  {
    id: 'executive-minimal',
    name: 'Executive Minimal',
    description: 'Sophisticated serif typography for senior leadership roles.',
    isPremium: true,
    selected: false,
    color: 'bg-stone-50',
    accent: 'bg-stone-200'
  }
];

export default function TemplatesPage() {
  return (
    <div className="p-4 md:p-8 w-full space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-2.5 rounded-xl shadow-sm border border-primary/10">
            <LayoutTemplate className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Template Gallery</h1>
            <p className="text-muted-foreground mt-1 text-lg">Choose a design that fits your industry and style.</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {templates.map((template) => (
          <Card key={template.id} className={`overflow-hidden transition-all duration-300 flex flex-col h-full rounded-2xl ${template.selected ? 'ring-2 ring-primary border-primary shadow-md' : 'hover:border-primary/40 shadow-sm hover:shadow-md border-border'}`}>
            <div className={`aspect-[1/1.2] w-full ${template.color} border-b border-border/50 relative p-8 flex flex-col group`}>
              {/* Abstract Template Preview */}
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-3 w-2/3">
                  <div className={`h-4 ${template.accent} rounded-full w-full opacity-60`} />
                  <div className={`h-2.5 ${template.accent} rounded-full w-1/2 opacity-40`} />
                </div>
                <div className={`h-12 w-12 ${template.accent} rounded-full opacity-50`} />
              </div>
              <div className="space-y-4 flex-1">
                <div className={`h-2.5 ${template.accent} rounded-full w-full opacity-30`} />
                <div className={`h-2.5 ${template.accent} rounded-full w-5/6 opacity-30`} />
                <div className={`h-2.5 ${template.accent} rounded-full w-4/6 opacity-30`} />
                <div className={`mt-6 h-2.5 ${template.accent} rounded-full w-full opacity-30`} />
                <div className={`h-2.5 ${template.accent} rounded-full w-5/6 opacity-30`} />
                <div className={`h-2.5 ${template.accent} rounded-full w-3/4 opacity-30`} />
              </div>
              
              {template.selected && (
                <div className="absolute top-4 right-4 bg-primary text-primary-foreground p-1.5 rounded-full shadow-lg">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              )}
            </div>
            
            <CardHeader className="pb-3 flex-none">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-bold tracking-tight">{template.name}</CardTitle>
                {template.isPremium && (
                  <Badge variant="secondary" className="bg-warning-muted text-warning border-warning/20 font-bold tracking-wider text-[10px] uppercase">Premium</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <CardDescription className="text-[15px] leading-relaxed">{template.description}</CardDescription>
            </CardContent>
            <CardFooter className="pt-2 flex-none">
              <Button 
                variant={template.selected ? "secondary" : "default"} 
                className={`w-full font-semibold ${template.selected ? 'bg-primary/10 text-primary hover:bg-primary/20 border-transparent' : 'shadow-sm hover:shadow-md transition-shadow'}`}
                disabled={template.selected}
              >
                {template.selected ? 'Currently Selected' : 'Use Template'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
