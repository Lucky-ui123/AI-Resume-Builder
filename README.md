# HireCraft AI - Resume Builder

HireCraft AI is an intelligent resume builder and job matching platform that leverages AI to help you land your dream job.

## Key Features
- **AI Resume Builder**: Automatically generate professional resume content, summaries, and bullet points.
- **Job Matcher**: Compare your resume against job descriptions to find gaps and improve your ATS score.
- **Cover Letter Generator**: Create tailored cover letters based on your resume and target job.
- **ATS Report**: Analyze your resume against Applicant Tracking Systems to maximize visibility.
- **LinkedIn Integration**: Optimize your LinkedIn profile for recruiters.

## Tech Stack
- Next.js 16 (App Router)
- React
- Tailwind CSS
- Supabase (Auth & Database)
- OpenAI API (GPT-4o-mini)

## Setup & Deployment

1. **Environment Variables**: Copy `.env.example` to `.env` and fill in your Supabase and OpenAI keys. See `ENVIRONMENT.md` for details.
2. **Local Development**: Run `npm install` then `npm run dev`.
3. **Deployment**: This project is optimized for deployment on Vercel. See `DEPLOYMENT.md` for detailed deployment instructions.

## Scripts
- `npm run dev` - Starts the local development server.
- `npm run build` - Builds the application for production.
- `npm run start` - Starts the production server.
- `npm run lint` - Runs ESLint.
- `npm run typecheck` - Runs TypeScript type checking.
