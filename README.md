# ProofHire DE

ProofHire DE is a production-ready MVP for verifying Data Engineering candidates in India. Candidates sign in with Google or LinkedIn, upload resumes to Google Cloud Storage using signed URLs, optionally add portfolios and referees, and track verification status. Reviewers manage submissions through a secure admin dashboard, leaving audit notes and marking candidates verified or requesting rework.

## Tech stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **UI**: Tailwind CSS + shadcn-inspired components + Lucide icons
- **Auth**: NextAuth (Google & LinkedIn providers only)
- **Database**: PostgreSQL via Prisma (Neon friendly)
- **Storage**: Google Cloud Storage signed URLs (bucket in `asia-south1`)
- **Email**: Resend (referee invitation emails)
- **Testing**: ESLint, Prettier, Vitest, Playwright

## Features

- High-trust landing page with ProofHire DE branding (navy/indigo/teal palette, no red)
- Google / LinkedIn authentication and protected candidate flows
- Five-step onboarding with progress persistence, resume uploads (PDF/DOCX ≤10MB), optional portfolio and referee outreach
- Candidate dashboard for status tracking, resume re-uploads (archive-not-delete), and personalised improvement tips
- Reviewer/admin workspace with queue filters, resume download (signed URLs), referee visibility, reviewer notes, CSV export, and verification actions
- Minimal proof score logic for reviewers (+40 resume, +20 portfolio, +40 verified referee)
- Referee verification flow via Resend email + secure token endpoint
- Secure API route handlers for resume signed URLs, archiving, profile updates, portfolio upsert, referee requests, verification actions, and queue management
- Lighthouse-friendly SEO (OG tags, sitemap, robots.txt) and India-first locale defaults

## Local development

```bash
pnpm install
pnpm prisma generate
pnpm dev
```

Environment variables are required (see below). Without valid Google/LinkedIn, Neon, and GCS credentials some actions (auth, signed URLs) will not function.

### Environment variables

Create `.env.local` with the following keys:

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-strong-secret
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
DATABASE_URL=postgresql://user:password@host/db?sslmode=require
RESEND_API_KEY=...
GCS_PROJECT_ID=proofhire-project
GCS_BUCKET=proofhire-de-resumes
GCS_CLIENT_EMAIL=service-account@proofhire.iam.gserviceaccount.com
GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
APP_REGION=india
CURRENCY=INR
```

> **Private keys**: wrap Google Cloud private keys in quotes and replace real newlines with `\n` in `.env`.

### Database

1. Create a Neon Postgres project.
2. Copy the connection string into `DATABASE_URL` (with `sslmode=require`).
3. Run Prisma migrations locally (or `npx prisma migrate deploy` on deploy).
4. Seed demo accounts: `pnpm seed` (creates admin, reviewer, sample candidates).

### Google Cloud Storage

1. Create a bucket `proofhire-de-resumes` in region `asia-south1`.
2. Enable uniform bucket-level access.
3. Create a service account with `Storage Object Admin` rights.
4. Generate a JSON key and copy values to `GCS_*` env vars.
5. Ensure resumés are uploaded to `uploads/{candidateId}/{timestamp}.pdf` and archived to `archive/` prefix (handled automatically).

### Google & LinkedIn OAuth

- Configure Google OAuth consent, add authorised redirect URL `https://<your-domain>/api/auth/callback/google` (and localhost equivalent).
- Configure LinkedIn app with redirect `https://<your-domain>/api/auth/callback/linkedin` and select `r_liteprofile r_emailaddress` scopes.

### Resend

- Create API key and set `RESEND_API_KEY`.
- Add a verified sender domain or use a sandbox address for testing.

## Deploying to Vercel + Neon

1. Push this repo to GitHub.
2. Click “New Project” in Vercel, import the repo, and select the Next.js framework preset.
3. Add all environment variables from `.env.local` to Vercel project settings.
4. In Neon, create a production branch and copy the connection string to `DATABASE_URL` on Vercel.
5. Run `pnpm prisma migrate deploy` as a Vercel build command or execute manually via Vercel CLI once deployed.
6. In Google Cloud, allow the Vercel serverless egress IP (if using firewall) and ensure the service account key is configured in Vercel env vars.
7. Deploy—the admin dashboard will be reachable at `/admin` (restricted to reviewer/admin roles).

## Quality tooling

- `pnpm lint` – Next.js/ESLint + Tailwind plugin
- `pnpm test` – Vitest unit tests (placeholder suite ready for expansion)
- `pnpm e2e` – Playwright end-to-end tests (includes login → onboarding → admin verify scenario)
- `pnpm build` – Production build check

## Project scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start Next.js dev server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Lint codebase |
| `pnpm test` | Run Vitest tests |
| `pnpm e2e` | Run Playwright tests |
| `pnpm seed` | Seed database with demo data |

## Folder structure

```
src/
  app/                 # Next.js app router pages & routes
  components/          # UI components, onboarding/admin dashboards, providers
  lib/                 # Auth, Prisma, GCS, email, utility helpers
  types/               # Type augmentation for NextAuth
prisma/
  schema.prisma        # Data model and enums
  seed.ts              # Seed script
```

## Security & privacy notes

- Resume uploads use 7-day signed URLs (PUT/GET) and archive prior versions before new uploads.
- No PII encryption is applied (per MVP scope) but sensitive tokens are hashed and never logged.
- Middleware guards candidate, dashboard, and admin routes; admin APIs validate reviewer/admin roles.
- India-focused locale (`en-IN`), INR currency defaults, and consent copy aligned with DPDP expectations.

## Testing

To run all checks locally:

```bash
pnpm lint
pnpm test
pnpm e2e
```

Playwright requires environment variables for OAuth—use CI-safe mocks or skip when unavailable.

---

Built as an authenticity-first intake experience for ProofHire DE.
