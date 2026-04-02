# HALF·POINT

**The fairest place to meet in London.**

Multi-person. Multi-modal. Last-train-aware.

A group meetup optimiser that finds the genuinely fairest place for multiple people to meet in London, accounting for different start points, travel modes, and everyone's journey home — including trains out of London.

## Quick Start

```bash
cd halfpoint
npm install
cp .env.local.example .env.local
# Edit .env.local with your API keys (optional for basic functionality)
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `GOOGLE_MAPS_API_KEY` | Optional | Maps display, Distance Matrix, Places API |
| `TFL_APP_KEY` | Optional | Increases TfL API rate limits |
| `NEXT_PUBLIC_BASE_URL` | Optional | Base URL for internal API calls (default: http://localhost:3000) |

The app works without any API keys — TfL journey data is free and postcodes.io requires no authentication. Without `GOOGLE_MAPS_API_KEY`, venue suggestions use mock data.

## How It Works

1. Each person enters their name, origin postcode, and travel mode
2. The app geocodes postcodes via postcodes.io
3. Non-London postcodes auto-resolve to the correct London terminal (e.g. Waterloo, Liverpool Street)
4. The algorithm scores 20 candidate tube stations across three fairness modes
5. Journey times come from the TfL Journey Planner API
6. Results show the optimal meeting point with per-person journey breakdowns

## Three Algorithm Modes

- **Shortest total** — minimises the sum of all journey times
- **Fairest for everyone** — minimises the worst individual journey (minimax)
- **Full journey fairness** — minimax including the trip home

## Two App Modes

- **Where should we meet?** — finds the optimal meeting point from everyone's current locations
- **How long can we stay?** — factors in home postcodes and last train times

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- TfL Unified API
- postcodes.io
- Google Places API (optional)

## Deploy

```bash
npm run build
npm start
```

Or deploy to Vercel:

```bash
npx vercel
```
