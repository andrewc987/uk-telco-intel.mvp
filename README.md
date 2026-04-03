# HALF·POINT

**The fairest place to meet in London.**

A group meetup optimiser that finds the genuinely fairest place for multiple people to meet in London. Enter names and locations, hit one button — the app runs three fairness algorithms, picks the best answer, and gives you a shareable briefing with per-person routes and last-train warnings.

## Quick Start

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `GOOGLE_MAPS_API_KEY` | Optional | Places autocomplete + venue search |
| `TFL_APP_KEY` | Optional | Increases TfL API rate limits |
| `NEXT_PUBLIC_BASE_URL` | Optional | Base URL for internal API calls (default: http://localhost:3000) |

Works without any API keys — TfL and postcodes.io are free. Add `GOOGLE_MAPS_API_KEY` for Google Places autocomplete and real venue data.

## How It Works

1. Each person enters their name, where they're coming from, and where they're going home to
2. The app resolves locations to coordinates (Google Places or postcodes.io)
3. Non-London home locations auto-resolve to the correct London terminal (Waterloo, Liverpool Street, etc.)
4. Three fairness algorithms run simultaneously and the app picks the best recommendation
5. Journey times come from the TfL Journey Planner API
6. Result is a shareable briefing with routes, times, last-train warnings, and nearby venues

## Tech Stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- TfL Unified API + postcodes.io + Google Places API

## Deploy

```bash
npm run build && npm start
```
