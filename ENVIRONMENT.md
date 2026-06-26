# Environment Variables Guide

This document explains the environment variables required to run HireCraft AI locally and in production.

## Public Variables (Safe for Browser)

- `NEXT_PUBLIC_SUPABASE_URL`: The URL of your Supabase project instance. Used by both the server and the browser client.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The anonymous API key for Supabase. Used by the browser client to securely interact with the database using Row Level Security (RLS).
- `NEXT_PUBLIC_ENABLE_MOCK_AUTH`: (Optional) Set to `true` to bypass real Supabase authentication during local development.

## Secret Variables (Server-Only)

**NEVER expose these to the browser (`NEXT_PUBLIC_`) and NEVER commit them to Git.**

- `SUPABASE_SERVICE_ROLE_KEY`: The service role key for Supabase. Used strictly in secure server environments (API routes, server actions) to bypass RLS for administrative actions (e.g., creating users, incrementing AI usage).
- `OPENAI_API_KEY`: Your OpenAI API key. Used by server API routes for generating AI suggestions, ATS reports, and parsing resumes.

## Managing Variables in Vercel
1. Go to your Project Dashboard -> **Settings** -> **Environment Variables**.
2. Add the variables above. You can optionally uncheck "Preview" or "Development" if you want to use different database instances for staging/local vs production.
