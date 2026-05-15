# ScoreCard — Imajin Lead Generation Platform

A federated app on the Imajin platform for building scored assessments (quizzes with point values, tiers, and dynamic results) that generate qualified leads as Imajin DIDs.

## Architecture

ScoreCard is a standalone Next.js app, federated into Imajin via Sign in with Imajin (OAuth-like flow). It uses the Imajin identity system for authentication and creates leads as DIDs in the Imajin ecosystem.

## Ports & Environments

| Environment | Port | URL |
|------------|------|-----|
| Dev | 3402 | dev-scorecard.imajin.ai |
| Prod | 7402 | scorecard.imajin.ai |

## Database

Requires a Postgres database (e.g., `scorecard_dev` / `scorecard_prod` on the Imajin server).

Tables:
- `scorecards` — quiz/assessment definitions
- `questions` — individual questions
- `responses` — completed submissions
- `tier_results` — per-tier results page content

## Setup

1. Copy `.env.example` to `.env.local` and fill in values
2. Ensure the database exists
3. Run `pnpm install`
4. Run `pnpm db:push` to create tables
5. Run `pnpm dev`

## Auth Flow

Uses Sign in with Imajin:
1. User clicks "Sign in with Imajin" → redirects to Imajin auth
2. Imajin redirects back to `/api/auth/callback` with `attestation_id` + `user_did`
3. App fetches public profile, creates JWT session cookie
4. Session checked via `/api/auth/session`

## Schema

See `src/db/schema.ts` for full Drizzle ORM schema definition.

## Next Steps

- [ ] Scorecard builder UI (create/edit questions, scoring, tiers)
- [ ] Public quiz taking flow (shareable links)
- [ ] Lead gate (email/phone capture before/after quiz)
- [ ] Results page generator (per-tier dynamic content)
- [ ] Dashboard analytics (response counts, conversion rates)
- [ ] App registration in Imajin registry (get APP_ID, APP_DID)
