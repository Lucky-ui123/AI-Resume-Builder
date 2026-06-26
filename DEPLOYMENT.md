# Deploying HireCraft AI to Vercel

HireCraft AI is fully compatible with Vercel's serverless infrastructure. Follow these steps to deploy the application to production.

## 1. Prerequisites
- A [Vercel](https://vercel.com) account.
- A GitHub repository containing the HireCraft AI codebase.
- A [Supabase](https://supabase.com) project for database and authentication.
- An [OpenAI](https://platform.openai.com) account with API billing enabled for AI features.

## 2. Environment Variables
You will need to configure the following environment variables in your Vercel project settings:

```env
# OpenAI API Key for generating AI suggestions
OPENAI_API_KEY=your_openai_api_key_here

# App URL for absolute references (Use your Vercel production domain)
NEXT_PUBLIC_APP_URL=https://your-production-domain.vercel.app

# Supabase Authentication & Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

**Note:** If `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are not provided, the application will gracefully fall back to mock data mode. The `OPENAI_API_KEY` operates independently—if missing, AI features will use mock responses while the rest of the application runs normally.

## 3. Deployment Steps

1. Push your code to a GitHub repository.
2. Log in to your Vercel dashboard and click **Add New...** -> **Project**.
3. Import the repository containing HireCraft AI.
4. In the **Configure Project** section, leave the Framework Preset as **Next.js**.
5. Expand the **Environment Variables** section and add the keys from Step 2.
6. Click **Deploy**. Vercel will build and deploy the application.

## 4. Supabase Setup (Database & Auth)

To ensure the database and authentication work correctly, run the necessary migrations or execute the SQL schema in your Supabase project's SQL Editor:

1. Create the `profiles`, `resumes`, and `resume_versions` tables.
2. Update the `profiles` table to include `plan` (text), `ai_usage_count` (int), `export_usage_count` (int), `billing_period_start` (timestamp), and `billing_period_end` (timestamp) columns for subscription management.
3. Enable **Row Level Security (RLS)** on all tables so users can only view and modify their own data.
4. Configure **Authentication** in Supabase to allow Email/Password sign-ups.

## 5. Post-Deployment Testing Checklist

After Vercel finishes deploying, visit your production URL and test the following:
- [ ] **Sign up / Log in**: Ensure Supabase auth successfully registers users and redirects to `/dashboard`.
- [ ] **Create/Edit Resume**: Navigate to the Resume Builder and modify data. Ensure the "Save" status appears, confirming database persistence.
- [ ] **Resume Upload**: Upload a PDF or DOCX file to verify the parsing server actions complete within the serverless limits.
- [ ] **AI Features**: Test the "Improve Summary" or "Job Matcher" to ensure OpenAI calls succeed.
- [ ] **Export Options**: Click "Export PDF" and "Export DOCX" to verify client-side blob generation works.

## 6. Known Limitations
- **PDF Parsing Limit**: The free tier of Vercel serverless functions has a strict 10-second timeout and a 4.5MB payload limit. The current upload parser handles basic files well, but exceptionally large or heavily image-based PDFs may hit these limits if parsing takes too long.
- **Mock Fallback Caution**: Ensure environment variables are populated correctly in Vercel's production environment settings; otherwise, users will see standard mock data instead of real database entries.
