# Deployment Guide

This guide details the process for deploying HireCraft AI to Vercel.

## Pre-requisites
1. A Vercel account linked to your GitHub account.
2. A Supabase project set up.
3. A Google Gemini API key (obtain from [Google AI Studio](https://aistudio.google.com/apikey)).

## 1. Initial Vercel Setup
1. Log into your Vercel Dashboard.
2. Click **Add New** -> **Project**.
3. Import the `Lucky-ui123/AI-Rsume-Builder` repository from GitHub.
4. Leave the Framework Preset as **Next.js**.

## 2. Environment Variables
Before clicking "Deploy", expand the **Environment Variables** section and add all required variables. See `ENVIRONMENT.md` for the exact list.

## 3. Deployment Environments
Vercel automatically provisions different deployment environments based on your Git workflow:

- **Production**: Triggers automatically when you merge or push code to the `main` branch. This environment points to your live custom domain.
- **Preview (UAT)**: Triggers automatically when you create a Pull Request against `main`. It generates a unique URL for testing changes before they go live.
- **Development**: Your local environment (`npm run dev`).

## 4. Recommended Integrations (Optional)
Once deployed, consider enabling these Vercel features in your project settings:
- **Web Analytics**: For privacy-friendly page view tracking.
- **Speed Insights**: To monitor Core Web Vitals.

## Rollback Procedure
If a production deployment introduces a critical bug:
1. Go to the **Deployments** tab in your Vercel project dashboard.
2. Find the last stable deployment.
3. Click the three dots (...) next to it and select **Promote to Production** or **Assign Custom Domains** to instantly rollback.
