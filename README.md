# POS System

[![CI](https://github.com/Ravi-Wijerathne/pos/actions/workflows/ci.yml/badge.svg?branch=master&event=push)](https://github.com/Ravi-Wijerathne/pos/actions/workflows/ci.yml?query=branch%3Amaster+event%3Apush)
[![CD](https://github.com/Ravi-Wijerathne/pos/actions/workflows/cd.yml/badge.svg?branch=master&event=workflow_run)](https://github.com/Ravi-Wijerathne/pos/actions/workflows/cd.yml?query=branch%3Amaster+event%3Aworkflow_run)

Production-ready Point of Sale system with a cloud-first architecture:
- Frontend: Next.js app deployed on Vercel
- Auth + API gateway: Supabase Auth + Supabase Edge Functions
- Database: Neon PostgreSQL (source of truth)

## Current Architecture

- `app/` and `components/`: Next.js 16 frontend
- `proxy.ts`: route protection for authenticated areas
- `lib/supabase/*`: browser/server/admin Supabase clients
- `lib/api-client.ts`: frontend API wrapper to Supabase Edge Functions
- `supabase/functions/*`: backend endpoints for categories/customers/products/sales/users
- `prisma/schema.prisma`: PostgreSQL schema for Neon

## Core Features

- Role-based access (Admin, Manager, Cashier)
- Product and inventory management with stock logs
- POS checkout with multiple payment methods
- Sales history and dashboard analytics
- Customer and user management

## Tech Stack

- Next.js 16, React 19, TypeScript
- Supabase Auth, Supabase Edge Functions
- Neon PostgreSQL
- Prisma ORM (schema + migrations/seed)
- Tailwind CSS + shadcn/ui

## Prerequisites

- Node.js 20+
- npm
- Supabase project
- Neon project
- Vercel account

## Environment Variables

Use `.env.example` and `.env.production.example` as templates.

Required variables:

```env
# Frontend/runtime
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL=

# Server/runtime
SUPABASE_SERVICE_ROLE_KEY=

# Database (Neon)
DATABASE_URL=
NEON_DATABASE_URL=

# App URL + auth secret
NEXTAUTH_URL=
NEXTAUTH_SECRET=
```

## Local Setup

1. Install dependencies

```bash
npm install
```

2. Configure `.env` from `.env.example`

3. Push schema and seed Neon DB

```bash
npm run db:push
npm run db:seed
```

4. Start Next.js app

```bash
npm run dev
```

5. (Optional) Run Supabase functions locally

```bash
npm run supabase:functions:serve
```

## Supabase Functions Deployment

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase secrets set NEON_DATABASE_URL="<neon-url>" DATABASE_URL="<neon-url>"
npm run supabase:functions:deploy
```

## Frontend Deployment (Vercel)

```bash
npx vercel link
npx vercel env add <KEY> production
npx vercel --prod
```

Set all required production environment variables in Vercel before deploying.

## GitHub Actions CI/CD

- CI workflow: `.github/workflows/ci.yml`
	- Runs on pull requests and pushes to `master`, `main`, and `develop`
	- Runs lint, production build, unit tests, and Playwright smoke tests
- CD workflow: `.github/workflows/cd.yml`
	- Runs automatically after CI succeeds on `master`
	- Can also be run manually using `workflow_dispatch`
	- Deploys the frontend to Vercel production

Required GitHub repository secrets for CD:

```env
VERCEL_TOKEN=
VERCEL_ORG_ID=
VERCEL_PROJECT_ID=
```

## Scripts

```bash
npm run dev                       # Next.js dev server
npm run build                     # Production build
npm run start                     # Run production build locally
npm run lint                      # ESLint
npm run test                      # Vitest unit tests
npm run test:e2e                  # Playwright E2E tests
npm run db:push                   # Push Prisma schema to Neon
npm run db:seed                   # Seed Neon database
npm run supabase:functions:serve  # Serve edge functions locally
npm run supabase:functions:deploy # Deploy edge functions
```

## Testing

```bash
npm run test
npm run test:e2e
```

For first-time Playwright setup:

```bash
npx playwright install chromium
```

## License

MIT License - see [LICENSE](LICENSE)
