import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Sparkles } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    name: 'Basic',
    price: '$0',
    period: 'forever',
    description: 'Perfect for entry-level candidates',
    features: ['1 Resume limit', 'Basic templates', 'PDF Export', 'Email support'],
    cta: 'Get Started',
    ctaVariant: 'outline' as const,
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$15',
    period: 'month',
    description: 'For serious job seekers',
    features: [
      'Unlimited resumes',
      'Premium templates',
      'PDF & DOCX Export',
      'Basic AI Rewrite (50/mo)',
      'Job Description Matcher',
      'Priority support',
    ],
    cta: 'Upgrade to Pro',
    ctaVariant: 'default' as const,
    highlight: true,
  },
  {
    name: 'Ultimate',
    price: '$29',
    period: 'month',
    description: 'Comprehensive career toolkit',
    features: [
      'Everything in Pro',
      'Unlimited AI suggestions',
      'Cover Letter Generator',
      'LinkedIn Optimizer',
      'ATS Mock Scoring',
      '24/7 Priority support',
    ],
    cta: 'Get Ultimate',
    ctaVariant: 'outline' as const,
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 py-20 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent text-sm font-semibold mb-6 border border-accent/30">
              <Sparkles className="h-4 w-4" />
              <span>Simple, transparent pricing</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-5 text-heading">
              Invest in your career
            </h1>
            <p className="text-xl text-muted-foreground">
              Choose the plan that best fits your career goals. Upgrade or downgrade at any time.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-start">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`flex flex-col transition-all duration-300 ${
                  plan.highlight
                    ? 'border-accent/50 shadow-md ring-1 ring-accent/50 md:-translate-y-2'
                    : 'hover:shadow-md'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-px inset-x-0 h-1 bg-accent rounded-t-lg" />
                )}
                {plan.highlight && (
                  <div className="flex justify-center -mt-4 mb-2">
                    <span className="bg-accent text-accent-foreground text-xs font-bold px-4 py-1.5 rounded-full shadow-md tracking-wide uppercase">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader className={`pb-6 ${plan.highlight ? 'pt-4' : 'pt-8'}`}>
                  <CardTitle className="text-2xl font-bold text-heading">{plan.name}</CardTitle>
                  <CardDescription className="text-muted-foreground mt-1">{plan.description}</CardDescription>
                  <div className="mt-5">
                    <span className="text-4xl font-extrabold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground ml-1">/ {plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 px-6">
                  <ul className="space-y-3.5">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${plan.highlight ? 'bg-accent/20' : 'bg-secondary'}`}>
                          <Check className={`h-3 w-3 ${plan.highlight ? 'text-accent' : 'text-muted-foreground'}`} />
                        </div>
                        <span className="text-sm text-foreground font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="px-6 pb-8 pt-6">
                  <Link href="/signup" className="w-full">
                    <Button 
                      className="w-full font-semibold"
                      size="lg"
                      variant={plan.ctaVariant}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-10">
            All plans include a 14-day money-back guarantee. No questions asked.
          </p>
        </div>
      </main>
    </div>
  );
}
