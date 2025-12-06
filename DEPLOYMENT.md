# Deployment Guide

## Prerequisites

1. **GitHub Account** - For OAuth and API access
2. **Google Account** - For Google OAuth
3. **Vercel Account** - For hosting
4. **Convex Account** - For database

## Step 1: Set up GitHub OAuth

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create a new OAuth App with:
   - Application name: reposs
   - Homepage URL: Your Vercel domain (e.g., https://oss-finder.vercel.app)
   - Authorization callback URL: `https://your-domain.vercel.app/api/auth/callback/github`
3. Note your Client ID and Client Secret

## Step 2: Set up Google OAuth

1. Go to Google Cloud Console
2. Create a new project
3. Enable the Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URIs:
   - `https://your-domain.vercel.app/api/auth/callback/google`
6. Note your Client ID and Client Secret

## Step 3: Set up GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate a new token with `repo` and `public_repo` scopes
3. Copy the token

## Step 4: Set up Convex

1. Create a Convex account at https://www.convex.dev
2. Create a new project
3. Run `npx convex dev` to initialize and get your deployment URL

## Step 5: Deploy to Vercel

1. Push your code to GitHub
2. Go to Vercel and create a new project from your GitHub repository
3. Add environment variables:
   - `AUTH_URL`: Your Vercel domain (e.g., https://oss-finder.vercel.app)
   - `AUTH_SECRET`: Generate with `openssl rand -base64 33`
   - `AUTH_GITHUB_ID`: From GitHub OAuth App
   - `AUTH_GITHUB_SECRET`: From GitHub OAuth App
   - `AUTH_GOOGLE_ID`: From Google OAuth
   - `AUTH_GOOGLE_SECRET`: From Google OAuth
   - `GITHUB_TOKEN`: Your GitHub Personal Access Token
   - `NEXT_PUBLIC_CONVEX_URL`: Your Convex deployment URL
4. Deploy

## Development

\`\`\`bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local

# Run Convex in dev mode (in another terminal)
npm run convex

# Run Next.js in dev mode
npm run dev
\`\`\`

Visit http://localhost:3000 to see your app.

## Production Checklist

- [ ] All environment variables are set in Vercel
- [ ] GitHub OAuth app redirect URL is updated
- [ ] Google OAuth redirect URL is updated
- [ ] Convex deployment URL is set
- [ ] AUTH_SECRET is a strong random string
- [ ] GitHub Personal Access Token has appropriate scopes
- [ ] Domain is configured in AUTH_URL
