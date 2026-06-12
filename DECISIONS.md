# DECISIONS

One decision per entry, with the why.

## D1 — Journey/geocode provider for this run: TfL Unified API + postcodes.io (not Google)
The spec's primary plan was Google Routes/Geocoding/Places using "the key already in the env" — but no `GOOGLE_MAPS_API_KEY` exists in this container (verified: no `.env.local`, nothing in process env). Per the spec's blocker rule, shipping the best keyless/free-tier version: TfL Journey Planner (real multimodal London transit times, free, no key required at low volume) for journeys, postcodes.io for postcode geocoding, TfL StopPoint search for named-place lookup. All behind one provider interface (`lib/providers/`) so Google plugs in by adding the key and a provider file — the exact seam the spec asked to leave for TfL is simply reversed.

## D2 — No fabricated journey times, ever
The old `lib/algorithm.ts` silently fell back to haversine distance estimates when TfL failed. Removed. A failed leg renders as an honest "couldn't compute" state and the candidate is penalised/excluded rather than scored on invented numbers.

## D3 — Fairness definition (exact)
- **Fairest (default):** argmin over candidates of max(per-person journey minutes); ties broken by smallest spread (max − min).
- **Quickest:** argmin of sum(per-person journey minutes).
Both always computed; the diff sentence is generated from the actual numbers ("Quickest would save the group X minutes overall — but NAME's trip jumps to Y. Fairest keeps everyone within Z."). Identical winners → "Both modes agree: PLACE."

## D5 — Engine shape: shortlist 13 + per-person nearest, concurrency 6, hour-bucket cache
Candidates are pruned to the 13 nearest the group centroid plus each person's single nearest candidate (coverage for far-flung origins), bounding calls at ≤ people × (13 + people). Journey calls run 6 at a time. The TfL provider caches every lookup in-memory keyed by coords rounded to 3 dp + departure hour bucket, so toggles/retries never re-query. A candidate with any failed leg is excluded from ranking (failure recorded in the response); fewer than 3 rankable candidates → honest 502, never an estimate.

## D6 — Place search: TfL StopPoint + postcodes.io behind one PlaceSearchProvider
`/api/places` merges TfL StopPoint search (stations, with lat/lng) and postcodes.io autocomplete (bulk-resolved to coords). Postcode-looking queries rank postcodes first; everything else ranks stations first. Max 6 suggestions, deduped by label. Google Places drops into the same `PlaceSearchProvider` interface when the key exists.

## D7 — Map is a dependency-free SVG minimap
No Google key and no appetite for a heavy map library tonight: the result screen plots people's origins and the winner on an inline SVG scaled to the group's lat/lng bounding box — dashed convergence lines, labelled dots, on-voice and weightless. Swappable for a real map (Google JS / MapLibre) behind the same component boundary later.

## D8 — Both modes precomputed; venue UI parked
`/api/optimise` returns Fairest and Quickest winners (plus top-5 ranked and per-person legs for each) in one response, so the result-screen toggle is instant with no refetch. The venue layer is a later phase: `/api/venues` is kept working as-is, but the result screen doesn't render venues yet.

## D4 — Deploy = push `main`
No Vercel CLI/token in the container; the project deploys via git integration with production tracking `main`. Per the spec's explicit clearance to deploy to production throughout, each phase is committed on the working branch and merged to `main` to deploy, then verified against the live URL.

## D9 — Venue source: Overpass (OpenStreetMap) as the live keyless path; mock venues deleted
No Google key in this env, and the old keyless fallback returned five hard-coded fake venues — fabrication, banned. `/api/venues` now queries Overpass (free, no key) for named `amenity=pub|bar|cafe|restaurant` nodes/ways within 400m of the meet point, dedupes by name, biases pubs/bars first (evening product), and labels each with a straight-line walking estimate (5 km/h) — honest because it's a distance-to-venue label, not a journey time. 8s timeout; any failure returns an empty list and the result screen simply doesn't render the "Where to go" section — the recommendation stands on its own. The Google Places path is kept and takes over automatically when `GOOGLE_MAPS_API_KEY` exists, falling back to Overpass if it returns nothing.

## D10 — Share state carries a compact result summary; shared links re-run the engine
The `?s=` base64 state still encodes the people (inputs), and now also a tiny result summary `r` — winning place, per-person name+minutes, diff sentence — written when the share link is generated. Opening a shared link auto-runs the engine (times shown to the opener are always fresh, real lookups), while `r` exists purely so the server can emit a correct OG card without running journey lookups inside `generateMetadata`. Encoding is now UTF-8-safe (btoa choked on non-Latin-1 names); old plain-base64 links still decode.

## D11 — Server page wrapper for per-result metadata
`app/page.tsx` was a client component, which can't emit per-URL OG tags. Simplest correct split: `app/page.tsx` is now a thin server component with `generateMetadata({ searchParams })` that decodes `?s=` and points og:image at `/api/og` with the result's params (og:title "Meet at {place}", diff as description); the whole interactive app moved unchanged to `components/HomeClient.tsx`. `metadataBase` set from `NEXT_PUBLIC_BASE_URL` with the Vercel URL as default — kills the build warning and makes OG URLs absolute.

## D12 — OG card: next/og ImageResponse, edge runtime, app palette
`/api/og` renders the 1200×630 card with `next/og` — light #FAFAFA ground, HALF·POINT wordmark with the accent dot, big place name (scales down for long names), per-person time pills, diff sentence in secondary grey, system sans throughout. All content comes from query params; nothing is invented at render time.

## D13 — Share CTA: native share sheet first
The result-screen CTA is full-width on mobile and calls `navigator.share` (title "Meet at {place}" + URL — the group-chat-native path on iOS/Android); where unavailable it copies to clipboard with a quiet "Copied. Send it in the group chat." confirmation. A dismissed share sheet is treated as a non-event, not an error.
