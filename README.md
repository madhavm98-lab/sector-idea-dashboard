# Sector Idea Dashboard

Generate fresh idea candidates from YouTube podcasts and Reddit posts in the last 48 hours.

## Stack

- Next.js
- TypeScript
- Tailwind CSS
- Prisma
- Postgres

## Quick start

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:push
npm run seed
npm run dev
```

## Current status

This starter kit includes:

- a dashboard page
- a `/api/ideas` endpoint
- Prisma models for raw content and processed ideas
- stub ingestion jobs for Reddit and YouTube
- a simple heuristic extractor/classifier

## Next build steps

1. Replace the stub ingestion jobs with real Reddit and YouTube API clients.
2. Add an LLM-backed extractor in `lib/extract.ts`.
3. Add filters by sector, source, and sentiment.
4. Add cron-based refresh every 1 to 3 hours.
5. Deploy the app and worker jobs.
