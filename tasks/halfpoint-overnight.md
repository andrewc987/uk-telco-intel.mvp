# HALF·POINT — Overnight Rebuild Spec for Claude Fable 5

Paste this whole file into the repo as `tasks/halfpoint-overnight.md`, then launch with the goal line below. It is the single up-front spec for one autonomous run. The current build (deployed at the `uk-telco-intel-mvp` Vercel project — a leftover slug, ignore the name) is a scrappy, glitchy MVP: a bare "Person 1 / Person 2 / add person / Find somewhere fair" form. The job is to rebuild it into the real thing.

The product in one line: the fairest place for a group to meet in London, accounting for where everyone starts, how they actually travel, and getting home — like Citymapper and Apple had a child that WhatsApp can't wait to share.

## How to launch (read first)

1. Save this file at `tasks/halfpoint-overnight.md` in the repo. Commit it.
2. Start Claude Code in the repo with Fable 5 and auto-approval:

```
claude --model claude-fable-5 --approval-mode full-auto
```

(`xhigh` effort is the default in Claude Code for this model family — right for a long-horizon build. Confirm with `claude --help`.)

3. Set the goal:

```
/goal "Work through tasks/halfpoint-overnight.md in phase order. The goal is met when every phase's Acceptance checks pass on the LIVE production deploy, the app builds/typechecks/lints/tests with no new errors, and each phase is committed and deployed. Treat 'Definition of done' as the bar. Stop only when all checks pass or you are blocked on something only Andrew can provide (an API key, a paid tier, a domain). Log progress and decisions to PROGRESS.md; never report a step done without pointing to a tool result — for visual/journey-time claims, a screenshot or API response from the live deploy."
```

4. Caps: set whatever iteration / budget cap your version exposes (`/goal --help`) so a looping evaluator can't burn the weekly limit. If the session drops, restart with `--continue`.
5. In the morning: read `PROGRESS.md`, open the live URL, then skim `DECISIONS.md`.

Before you launch (Andrew, ~5 min):

* In Google Cloud Console (the project for your key) enable: Routes API, Geocoding API, Places API (New), Maps JavaScript API — and Maps Static API if you want a map on the share card.
* Add the key to the Vercel project's Environment Variables (Production) as `GOOGLE_MAPS_API_KEY` (the agent wires local dev).
* Restrict the key to those APIs (no referrer restriction tonight, so server + browser both work); split into separate browser/server keys tomorrow.
* Set a Cloud Billing budget alert and a daily quota cap (e.g. on Routes API). This is a paid key running unsupervised overnight — the cap, plus the `/goal` cap below, is what stops a loop running up a bill.

## Operating rules (follow for the whole run)

You are operating autonomously. Andrew is asleep and cannot answer mid-task. Asking "Shall I…?" blocks the work. For reversible actions that follow from this spec, proceed without asking. Before ending a turn, check your last paragraph: if it's a plan, a question, or a promise ("I'll now…"), do that work now instead. End only when the goal is met or you're blocked on input only Andrew can provide.

Ground every progress claim. Before writing to `PROGRESS.md`, audit the claim against a tool result from this session. Journey times especially: only report numbers you actually got back from the data API on the live deploy — never a plausible-looking guess. If a test or a journey lookup fails, log it with the output.

Accuracy is sacred — this is the whole product. The old tools failed because they were lazy and approximate. Never fabricate or estimate a journey time. Every time shown to a user must come from a real journey lookup. If the data source can't answer a leg, the app must say so honestly and degrade gracefully — it must never invent a number or silently fall back to straight-line distance.

Mind the meter. The Google key is a paid account running unsupervised overnight. Keep the bill sane: cache every journey lookup and reuse it, prune the candidate set before querying, use tight field masks, batch the transit matrix to its 100-element cap, and never re-query something you already have. On a quota or billing error, log it to `PROGRESS.md` and back off — don't loop on it.

Stay in scope. Don't gold-plate. Don't add features, refactors, or abstractions beyond what a task requires. No backwards-compat shims, no error handling for cases that can't happen. Do the simplest thing that works well. Validate only at real boundaries (user input, external APIs).

Pause only for genuine blockers: an API key or paid tier only Andrew can provide, a domain/DNS change, or a real scope change. If you hit one, log it under "Hand back to Andrew" in `PROGRESS.md`, ship the best keyless/free-tier version of that feature so the live site still works, and keep going.

Memory & progress. Keep two files in the repo root:

* `PROGRESS.md` — running log: what's done (with evidence), what's blocked, what was deployed. Update after each phase.
* `DECISIONS.md` — one decision per entry with the why: data sources chosen, the fairness algorithm's exact definition, candidate-set choices, copy voice rules, UX fixes.

Self-verify with subagents, on the live deploy, with vision. After each phase, deploy to production, then spin up a fresh-context verifier subagent to check that phase's Acceptance checks against the live URL — screenshot the rendered pages and confirm with vision, and hit the live API paths to confirm real journey times come back. Separate context beats self-critique. Delegate independent subtasks (e.g. the map vs the venue layer) to parallel subagents and keep working while they run.

Commit per phase, keep the build green before each deploy, and deploy to production after each phase (see below). Don't squash phases.

Environment & live-test loop. This repo is on Git and hosted on Vercel, running in a cloud container already linked to the right repo. Work it out in Phase 0 and follow whatever previous agents established. Unlike a normal project, you are cleared to deploy straight to live production to test — the URL is private and unshared, so production is your test bed. After each phase: get the build green, deploy to production, then validate against the live URL with vision and live API calls. Don't deploy a broken build. Keep clean per-phase commits so Andrew can review or revert. Do not change Vercel project settings, secrets, or domains — those are hand-back items.

## Context (why this exists)

People waste real energy arguing about where to meet in London, and every existing "meet halfway" tool is a lazy geographic-midpoint calculator with a pin dropped in the wrong place. The midpoint of Canary Wharf and Hammersmith is somewhere near Elephant & Castle — which is not how anyone actually travels. HALF·POINT solves the real problem: given where each person starts (and optionally where they're heading home to), it finds the genuinely fairest place to meet by real public-transport time, lets the group choose what "fair" means, suggests somewhere actually worth meeting, and produces a result so clean that sending it is the plan.

Audience: Londoners in a group chat. The bar is Citymapper's data credibility and Apple's restraint, delivered as something WhatsApp-native and instantly shareable. It must never read or look AI-built.

## What "fair" means (the heart of the product — get this exactly right)

A meeting point's quality is judged on real journey times, not distance. Offer two modes and make the difference legible:

* **Fairest (default):** minimise the worst individual journey — nobody gets shafted — then tie-break toward the smallest spread between people. This is the mode that stops one person always winning.
* **Quickest:** minimise the total journey time across the group.

Always compute both, and surface the diff sentence in plain English, e.g. "Quickest would save the group 12 minutes overall — but Dave's trip jumps to 53 minutes. Fairest keeps everyone within 31." When both modes agree, say so: "Both modes agree: Bermondsey."

Full journey, last-train-aware. A person's origin is where they start; optionally they also set where they're heading home. Fairness can account for the trip home too, and for anyone whose home is outside London, the relevant mainline terminal and last train become a constraint, not an afterthought. (Last-train logic is its own later phase — the core can ship on to-the-meet-point fairness first.)

## Decisions already made — don't re-litigate

* **No accounts. Ever.** The shareable URL is the product. Every session produces a link; opening it reproduces the result.
* **Data sources — provider-agnostic interface, Google primary this run.** Put all journey / geocoding / venue / map access behind one swappable provider interface so TfL can slot in tomorrow without a rewrite. Tonight, use the Google Maps Platform key already in the env:
   * Journeys: Google Routes API, transit mode — `computeRoutes` for single journeys, `computeRouteMatrix` for the candidates × people grid. Real multimodal London times (tube, rail, Overground, DLR, Elizabeth line, bus).
   * Geocoding: Google Geocoding API (postcodes and named places).
   * Venues: Google Places API (New) near the meet point, plus Places Autocomplete for forgiving inputs.
   * Map: Google Maps JavaScript API (optionally Maps Static API for the share-card image).
   * Tomorrow: TfL Unified API will be added as the free, canonical-London alternative behind the same interface — leave a clean seam and note in `DECISIONS.md` where it plugs in.
   * **Transit-matrix limits — build to these:** `computeRouteMatrix` with `travelMode: TRANSIT` allows ≤ 100 elements (origins × destinations) per call, so prune candidates to a geographic shortlist first, then batch the matrix in ≤100-element chunks. Pass origins/destinations as lat/lng coordinates (not addresses) to avoid the separate 50-waypoint cap. Set a realistic `departureTime` and a tight field mask (duration, status, indices) for latency and cost.
* **Candidate meet points are curated, not brute-forced.** Maintain a set (~40–60) of London neighbourhoods/interchanges that are genuinely good places to meet — strong transport access and things to do. Score candidates by real journeys from each origin. This bounds API calls and means you only ever suggest places people actually want to go.
* **The result card is the share unit** — a dynamic OG image good enough that posting it needs no caption.
* **Voice is already set** (see Copy phase): dry, confident, blame-transferring. Keep Andrew's existing lines; refine, don't replace with generic copy.

## Definition of done (the bar — both are Andrew's own tests)

* **The Apple test:** someone half-cut in a group chat on a Friday can add four people and get a trusted answer in under 90 seconds. If a step makes that impossible, cut the step.
* **The One Thing That Must Be True:** a group of four — two in central London, one in Zone 3, one catching a train home from Liverpool Street — can use this in a group chat in under two minutes and trust the answer enough to book the first venue it suggests.

When both hold on the live deploy, with real journey times, a beautiful shareable result, and nothing that looks AI-built, it's done.

## The work — phased, impact-ordered. Each phase has Acceptance checks.

Order is by user-experience impact. Rebuild the existing app in place; keep nothing that's scrappy just because it's there.

### Phase 0 — Discovery & groundwork

* Read the handover first. Built by previous Claude agents — find and read `CLAUDE.md`, `README`, `/docs`, any `HANDOVER.md`/`PROGRESS.md`/`DECISIONS.md`, and recent commits. Follow established conventions, tooling and structure.
* Work out how it deploys (git remote, default branch, Vercel link) and what API keys/env vars already exist vs are missing. Confirm `GOOGLE_MAPS_API_KEY` is present. Early on, make one real call to each Google API you'll use (Routes, Geocoding, Places, Maps JS); if any returns a "not enabled"/permission error, log exactly which under "Hand back to Andrew" so he can enable it — don't spend the night blocked on it. Record in `PROGRESS.md`.
* Audit the current build honestly: what works, what's glitchy, what to keep. Record the build/typecheck/lint/test baseline.
* **Acceptance:** handover read; deploy + env/key situation understood and recorded; current app audited; baseline recorded; you can run it locally and deploy to production.

### Phase 1 — Input flow (the first 90 seconds)

A fast, beautiful group-input flow. Each person: an origin (postcode or place, with forgiving autocomplete), optionally a "heading home to," optionally their modes. Add/remove people frictionlessly. Mobile-first, thumb-friendly, no clutter. This is where the Apple test is won or lost.

* **Acceptance:** on the live deploy, mobile viewport, a verifier can add four people with mixed postcodes/place names in well under 90 seconds; inputs are forgiving (handles messy postcodes, partial place names); the flow is obviously usable with zero instructions. Screenshot-verified.

### Phase 2 — The engine (real journeys + fairness)

The core. Geocode each origin. Prune the curated candidate set to a sensible geographic shortlist, then compute each person's real journey time to each candidate via the journey provider (Google Routes transit this run), respecting the ≤100-element transit-matrix cap above (batch the calls). Rank candidates under both Fairest (minimax → spread) and Quickest (total). Cache every lookup; never fabricate a time; degrade honestly on lookup failure.

* **Acceptance:** for a known test group, the engine returns ranked candidates with per-person real transit times (verifier confirms a sample against direct Routes API calls); Fairest and Quickest produce correct, sometimes-different winners; a forced API failure produces an honest "couldn't compute this leg" state, never an invented number; matrix calls stay within the 100-element transit cap. All verified against the live deploy.

### Phase 3 — Result screen (the payoff)

A gorgeous result: the recommended area on a clean map, a personal journey card per person (not a table — make it feel personal), the Fairest/Quickest toggle, and the plain-English diff sentence. The recommendation should feel decided, not like a spreadsheet.

* **Acceptance:** result screen renders the map + per-person cards + working mode toggle + a correct diff sentence generated from the actual numbers; "both modes agree" case handled; reads as a confident recommendation. Screenshot-verified on mobile and desktop on the live deploy.

### Phase 4 — Venue layer (turn a point into a plan)

Near the recommended area, surface a few genuinely good places to actually meet (pub/café/restaurant as appropriate). Enough that the group can pick one and go — the "book the first venue" moment.

* **Acceptance:** the result shows real, sensible venues near the meet point with enough info to choose; degrades gracefully if the venue source is unavailable (the meet-point recommendation still stands). Verified live.

### Phase 5 — Share (the WhatsApp moment)

Every result has a short shareable URL that reproduces it. A dynamic OG card per result — recommended area, the group's journey times, the diff sentence — beautiful enough to post with no caption, unfurling correctly on WhatsApp, iMessage and X. Strong, obvious mobile share CTA.

* **Acceptance:** a real result URL reproduces the result; its OG card renders with the right content, dimensions and absolute URLs, returns 200, and visibly unfurls in a link-preview check; share CTA is prominent on mobile. Verified on the live deploy.

### Phase 6 — Map & motion polish (the Citymapper/Apple feel)

Make the map and transitions feel premium: considered map style, smooth state transitions, real loading states (subtle, not a spinner), the candidate-comparison moment given a little theatre. Restraint over flash.

* **Acceptance:** map and transitions feel deliberate and smooth on a mid-range phone; loading states are handled everywhere; nothing janky. Screenshot/interaction-verified live.

### Phase 7 — Copy polish + landing hook

Rewrite all empty/helper/share/error text in the established voice: dry, confident, slightly taking the piss out of the person who always picks somewhere inconvenient. Keep/refine Andrew's lines — hero options like "The app that stops one person always winning" and "Find the fairest place to meet. Then blame the algorithm."; sub-head "Multi-person. Multi-modal. Last-train-aware."; CTA "Find somewhere fair." Don't overexplain mechanics — let the UX carry it. Every string must pass: would this look AI-written? If yes, rewrite.

* **Acceptance:** no placeholder or mechanics-explaining microcopy; hero + CTA in voice; a 10-string spot-check reads as sharp human copy; voice rules recorded in `DECISIONS.md`.

### Phase 8 — Last-train-aware & outside-London homes

For anyone heading home outside London, factor the relevant mainline terminal and last train as a real constraint on the recommendation, and show it ("Liz makes the 23:42 from Liverpool Street with 14 min to spare"). This is the feature nobody else has — make it feel like magic, not a warning.

* **Acceptance:** a test group with one out-of-London home produces a recommendation that respects the last-train constraint and surfaces it clearly; the time shown is real, not assumed. Verified live.

### Phase 9 — Performance, mobile, accessibility, robustness

Fast first paint (don't block on map/venue calls), excellent on a phone, sensible contrast/focus states/keyboard nav, and honest empty/error states everywhere (bad postcode, no fair answer, API down). Cache to keep it quick and within free-tier limits.

* **Acceptance:** loads fast on a throttled mobile profile; all error/empty paths render honestly; basic accessibility holds; no console errors on the live deploy.

### Phase 10 — UX audit pass + final verification

Review the whole thing as a design-literate Londoner. Find friction, unclear affordances, missing feedback, anything that breaks expectation — and ship a specific fix for each (don't paper over UX with copy). Prioritise by UX impact. Then run the two Definition-of-done tests end to end on the live deploy.

* **Acceptance:** `DECISIONS.md` lists each issue, its fix, and impact rank; build/typecheck/lint/test green; a verifier completes both the Apple test and the One Thing That Must Be True on the live URL, mobile, with real journey times, and confirms the result is genuinely shareable.

## Always-on constraints

* **Nothing may look or read AI-built.** No generic AI cadence, no boilerplate, no tells — in the UI, the copy, or anything user-facing.
* **Accuracy is non-negotiable.** Real journey times only; honest degradation; never straight-line fakery.
* **Apple-grade restraint.** Premium, minimal, considered. Whitespace over clutter.
* **Mobile-first, group-chat-native.** This lives on phones and gets shared in chats. Every feature must be excellent on mobile.
* **No accounts, no friction.** The URL carries the state.
* **Speed.** The Apple test is a hard requirement, not an aspiration.

## Data & algorithm notes (a steer — choose the best way and document it)

* Fairness metric: Fairest = minimise max individual real journey time, tie-break on smallest spread; Quickest = minimise sum. Compute both every time; generate the diff sentence from the actual numbers.
* Candidate set: ~40–60 curated, well-connected, worth-meeting London areas/interchanges. Don't brute-force the city. Prune to a shortlist before the transit matrix.
* Bound, batch & cache journey calls (candidates × people): respect the ≤100-element transit-matrix cap, pass coordinates, set a departure time, use a tight field mask, and cache hard.
* Geocoding: Google Geocoding API this run (postcodes + named places); postcodes.io is the free fallback added with TfL tomorrow.
* Map: Google Maps JavaScript API this run; MapLibre/Mapbox remain options behind the map interface.
* Be outcome-led — these are the destination, not line-by-line instructions. Record what you actually chose and why in `DECISIONS.md`.

## Hand back to Andrew (log in `PROGRESS.md`, ship the free-tier version, keep going)

* **API keys / paid tiers.** Tonight runs on the Google key already in the env. Tomorrow: a TfL app key (free) becomes the canonical-London journey source and removes Google journey cost. In `PROGRESS.md`, be precise about any Google API that wasn't enabled or any key restriction that blocked a call. Everything stays behind env vars.
* **Domain / DNS** (e.g. pointing halfpoint.app) and renaming the Vercel project off the `uk-telco-intel-mvp` slug — settings changes for Andrew.
* **Anything that costs money** (paid API tiers, paid map styles).

Note: deploying to production is not a hand-back here — you are cleared to deploy straight to live production to test throughout. Just keep the build green and commits clean.
