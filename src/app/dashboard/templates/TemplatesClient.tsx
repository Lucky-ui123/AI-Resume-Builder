'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { LayoutTemplate, Search } from 'lucide-react';
import { templates, TemplateCategory } from '@/lib/templates';
import { useRouter } from 'next/navigation';
import { TemplateMiniPreview } from '@/components/resume/TemplateMiniPreview';
import { TemplatePreviewModal } from '@/components/dashboard/TemplatePreviewModal';

export default function TemplatesClient() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);

  const categories: TemplateCategory[] = ['All', 'ATS Friendly', 'Professional', 'Modern', 'Creative', 'Minimal'];

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = activeCategory === 'All' || template.category.includes(activeCategory);
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleUseTemplate = (templateId: string) => {
    // In a full flow, we might save this preference or redirect to a builder selection
    router.push(`/dashboard/builder?id=new&template=${templateId}`);
  };

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

      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {categories.map(cat => (
            <Button
              key={cat}
              variant={activeCategory === cat ? 'default' : 'outline'}
              onClick={() => setActiveCategory(cat)}
              className="rounded-full whitespace-nowrap"
            >
              {cat}
            </Button>
          ))}
        </div>
        <div className="relative w-full md:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-full"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className={`overflow-hidden transition-all duration-300 flex flex-col h-full rounded-2xl hover:border-primary/40 shadow-sm hover:shadow-md border-border group cursor-pointer`}>
            <div className={`aspect-[1/0.8] w-full bg-slate-50 border-b border-border/50 relative p-0 flex flex-col items-center justify-center`}>
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <TemplateMiniPreview templateId={template.id} />

              {/* Badges Overlay */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                {template.atsScore >= 90 && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 font-semibold border-green-200 shadow-sm h-6 px-2.5 rounded-full text-xs">
                    {template.atsScore}% ATS
                  </Badge>
                )}
                {template.popular && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100 font-semibold border-orange-200 shadow-sm h-6 px-2.5 rounded-full text-xs">
                    Popular
                  </Badge>
                )}
              </div>
            </div>

            <CardHeader className="px-4 pt-0 pb-0 flex-none">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base font-bold tracking-tight">{template.name}</CardTitle>
                {template.isPremium && (
                  <Badge variant="secondary" className="bg-warning-muted text-warning border-warning/20 font-semibold h-6 px-2.5 rounded-full text-[10px]">Premium</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-4 py-0 flex-1">
              <CardDescription className="text-sm leading-snug">{template.description}</CardDescription>
            </CardContent>
            <CardFooter className="px-4 pt-2 pb-3 flex-none flex gap-2">
              <Button size="sm" variant="outline" className="w-1/2 font-semibold" onClick={(e) => { e.stopPropagation(); setPreviewTemplateId(template.id); }}>Preview</Button>
              <Button size="sm" onClick={(e) => { e.stopPropagation(); setPreviewTemplateId(template.id); }} className="w-1/2 font-semibold">Use Template</Button>
            </CardFooter>
          </Card>
        ))}
        {filteredTemplates.length === 0 && (
          <div className="col-span-full py-20 text-center text-muted-foreground">
            No templates found matching your search.
          </div>
        )}
      </div>

      <TemplatePreviewModal
        isOpen={!!previewTemplateId}
        onClose={() => setPreviewTemplateId(null)}
        templateId={previewTemplateId}
        onApply={handleUseTemplate}
      />
    </div>
  );
}
