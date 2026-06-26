import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Sparkles,
  Target,
  Zap,
  Shield,
  ChevronRight,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function LandingPage() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        redirect("/dashboard");
      }
    } catch (error) {
      // Safely ignore if auth check fails
    }
  }
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 overflow-hidden relative font-sans">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-chart-1/10 blur-[120px] pointer-events-none" />

      {/* Navbar (Glassmorphic) */}
      <nav className="fixed top-0 inset-x-0 h-16 border-b border-border bg-background/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2 group">
            <div className="bg-primary p-1.5 rounded-lg shadow-sm group-hover:shadow-primary/25 transition-all">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight text-heading">
              HireCraft AI
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link
              href="#features"
              className="hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="hover:text-foreground transition-colors"
            >
              How it Works
            </Link>
            <Link
              href="#testimonials"
              className="hover:text-foreground transition-colors"
            >
              Success Stories
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              Sign In
            </Link>
            <Link href="/signup">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded-full px-6 shadow-sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-16 px-6">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto text-center space-y-10 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-2 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Sparkles className="h-4 w-4" />
            <span>AI-Powered Resume Builder 2.0 is live</span>
          </div>

          <h1 className="text-[3rem] leading-[1.1] md:text-[5.5rem] md:leading-[1.05] font-black tracking-tighter text-heading animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 drop-shadow-sm">
            Craft Your Perfect Resume <br className="hidden md:block" />
            <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-[#b87fe0]">
              Land Your Dream Job.
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-xl md:text-2xl text-muted-foreground font-medium tracking-tight animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            Build professional, ATS-optimized resumes in minutes. Our AI
            analyzes job descriptions and tailors your experience to beat the
            bots and impress recruiters.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
            <Link href="/signup">
              <Button
                size="lg"
                className="h-14 px-8 text-base bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-md hover:shadow-lg transition-all group"
              >
                Build Resume Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="#features">
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 text-base border-border text-foreground hover:bg-accent hover:text-accent-foreground rounded-full bg-background"
              >
                See How It Works
              </Button>
            </Link>
          </div>

          <div className="pt-10 flex items-center justify-center gap-8 text-muted-foreground text-sm font-medium animate-in fade-in duration-1000 delay-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" /> No credit card
              required
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" /> Free PDF
              downloads
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" /> AI content
              rewriting
            </div>
          </div>
        </section>

        {/* Content below Hero */}

        {/* Features Bento Grid */}
        <section
          id="features"
          className="max-w-7xl mx-auto mt-40 relative z-10"
        >
          <div className="text-center mb-20 space-y-6">
            <h2 className="text-4xl md:text-6xl font-extrabold text-heading tracking-tight drop-shadow-sm">
              Supercharge your job search
            </h2>
            <p className="text-muted-foreground text-xl md:text-2xl font-medium max-w-3xl mx-auto">
              Everything you need to stand out from the crowd, all in one
              powerful platform powered by cutting-edge AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="col-span-1 md:col-span-2 row-span-2 rounded-3xl bg-card border border-border shadow-sm p-8 flex flex-col justify-between relative overflow-hidden group hover:border-primary/50 transition-colors">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] group-hover:bg-primary/10 transition-colors" />
              <div className="space-y-6 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-heading">
                    AI Content Generation
                  </h3>
                  <p className="text-muted-foreground leading-relaxed max-w-md">
                    Struggling with writer's block? Our AI analyzes your role
                    and generates professional summaries and bullet points that
                    highlight your impact and achievements.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="col-span-1 rounded-3xl bg-card border border-border shadow-sm p-8 relative overflow-hidden group hover:border-primary/50 transition-colors">
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-chart-1/5 blur-[50px] group-hover:bg-chart-1/10 transition-colors" />
              <div className="space-y-6 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-chart-1/10 border border-chart-1/20 flex items-center justify-center">
                  <Target className="h-6 w-6 text-chart-1" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-heading">
                    ATS Job Matcher
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Paste a job description and instantly see your match score.
                    Find missing keywords to beat applicant tracking systems.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="col-span-1 rounded-3xl bg-card border border-border shadow-sm p-8 relative overflow-hidden group hover:border-primary/50 transition-colors">
              <div className="absolute top-0 left-0 w-32 h-32 bg-success/5 blur-[50px] group-hover:bg-success/10 transition-colors" />
              <div className="space-y-6 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-success/10 border border-success/20 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-success" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-heading">
                    Data Privacy
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Your data is yours. We use enterprise-grade encryption and
                    never sell your personal information to third parties.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="col-span-1 md:col-span-3 rounded-3xl bg-muted/50 border border-border shadow-sm p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-primary/30 transition-colors">
              <div className="space-y-4 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background border border-border text-foreground text-xs font-semibold">
                  <Zap className="h-3 w-3 text-warning" />
                  New Feature
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-heading">
                  Cover Letters in 1-Click
                </h3>
                <p className="text-muted-foreground">
                  Generate highly tailored cover letters that perfectly align
                  your resume with the target job description. Save hours of
                  writing and stand out instantly.
                </p>
              </div>
              <Link href="/signup">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full h-12 px-8 font-medium">
                  Try it now
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-5xl mx-auto mt-40 text-center relative z-10 mb-20 py-16 bg-white rounded-[3rem] border border-border/50 shadow-2xl">
          <div className="absolute inset-0 bg-primary/5 blur-[100px] pointer-events-none rounded-[3rem]" />
          <h2 className="text-4xl md:text-[4rem] font-black tracking-tight text-heading mb-8">
            Ready to land your next role?
          </h2>
          <p className="text-2xl text-muted-foreground mb-12 font-medium max-w-2xl mx-auto">
            Join thousands of job seekers who use HireCraft AI to get hired
            faster.
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              className="h-14 px-10 text-base bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-lg hover:scale-105 transition-all"
            >
              Create Your Resume Free
            </Button>
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg">
              <FileText className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-heading">HireCraft AI</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Contact
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} HireCraft AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
