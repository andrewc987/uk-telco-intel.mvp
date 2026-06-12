# PROGRESS

Running log for the overnight rebuild (`tasks/halfpoint-overnight.md`).

## Phase 0 — Discovery & groundwork ✅ (2026-06-12)

**Environment**
- Repo at `/home/user/uk-telco-intel.mvp`, branch `claude/magical-ramanujan-eymo44`, remote `origin` on GitHub (`andrewc987/uk-telco-intel.mvp`).
- Live production deploy confirmed up: `https://uk-telco-intel-mvp.vercel.app` (HTTP 200, title "HALF·POINT — The fairest place to meet in London"). Vercel deploys via git integration; production tracks `main`.
- No Vercel CLI or `.vercel` link in this container; deploy-to-production = merge/push `main`.
- Outbound network open: `maps.googleapis.com` 200, `api.postcodes.io` 200, `api.tfl.gov.uk` 200 (all verified by curl this session).

**Keys**
- `GOOGLE_MAPS_API_KEY`: **NOT present in this container's env** (no `.env.local`, nothing in process env). It may exist in Vercel's Production env, but local dev and direct API verification from here cannot use Google. → See "Hand back to Andrew".
- TfL Unified API and postcodes.io are keyless/free and reachable — building tonight's journey/geocode providers on those, behind the provider-agnostic interface the spec mandates, so Google slots in as soon as the key is available.

**Baseline**
- `next build` green (Next.js 14, app router). Routes: `/` static + 6 API routes. One warning: `metadataBase` unset.
- No test suite, no lint config beyond Next defaults.
- Current app audit: working MVP with autocomplete (Google-or-postcodes.io fallback), 3 scoring methods, TfL journey calls **with a silent haversine fallback that fabricates times — must be removed per spec ("never invent a number")**, venue search, base64 share URLs. UI is a bare form — full rebuild per spec.

## Phases 1–3 — Input flow, engine, result screen ✅ (deployed & live-verified)

Commits `037e803` (input), `0d7ba52` (engine), `32f54b4` (result) — merged to `main`, deployed to production via Vercel git integration.

**Live verification (production URL, real TfL responses this session):**
- Homepage serves the new build (hero "The app that stops one person always winning" confirmed by curl).
- `POST /api/optimise` with the 4-person test group (Canary Wharf / Hammersmith / Camden / Brixton) returned, from live TfL lookups:
  - **Fairest: Westminster** — Ana 33 ("10-min walk, Jubilee line then 12-min walk"), Ben 36 (District line), Cam 32 (24 bus), Dee 25 (159 bus). Max 36, spread 11, total 126.
  - **Quickest: Oxford Circus** — diff sentence generated from actual numbers: "Quickest would save the group 7 minutes overall — but Ben's trip jumps to 41 minutes. Fairest keeps everyone within 36."
- Haversine fabricator deleted; failed legs surface as `ok:false`, candidates with failures excluded from ranking.

## Hand back to Andrew
- `GOOGLE_MAPS_API_KEY` is not available in this execution container. Add it to the container env (or confirm it in Vercel Production env) to activate the Google provider. Tonight's build runs on TfL + postcodes.io (free, real journey times) behind the same provider interface — no fabricated times.
- Vercel project rename off `uk-telco-intel-mvp` slug + domain/DNS — settings changes only Andrew can make.
