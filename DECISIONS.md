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

## D4 — Deploy = push `main`
No Vercel CLI/token in the container; the project deploys via git integration with production tracking `main`. Per the spec's explicit clearance to deploy to production throughout, each phase is committed on the working branch and merged to `main` to deploy, then verified against the live URL.
