# UK Telco Intelligence Platform — Handoff Document

**Date:** 2026-06-10
**Author:** Andrew Cocks (andrewcocks@gmail.com)
**Repo:** andrewc987/uk-telco-intel.mvp
**Branch with all work:** `claude/setup-project-structure-kBrd4`
**Deployed on:** Replit (syncs from `main` branch)

---

## What Is This?

A rolling intelligence dashboard that aggregates UK telecom industry updates from free public data sources and displays them in a dark "MI5 terminal" style UI. It's a single FastAPI app that serves both the API and the frontend — one command to run.

**Live workflow:** FastAPI starts → SQLite DB initialised → all 9 data sources scraped immediately → APScheduler runs them every 10-15 minutes → frontend auto-refreshes every 60 seconds.

---

## Quick Start

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

Open `http://localhost:8000` — that's it. No separate frontend server needed.

On Replit: the `.replit` file handles this automatically.

---

## Architecture

```
Single Process (uvicorn)
├── FastAPI app (backend/main.py)
│   ├── GET /                    → serves frontend HTML
│   ├── GET /static/*            → serves CSS
│   ├── GET /api/updates         → returns updates JSON
│   ├── GET /api/health          → health check
│   └── GET /api/updates/recent_summary → last-24h summary
│
├── SQLite DB (telco_intel.db, auto-created)
│   └── updates table (id, created_at, source_type, source_name, title, summary, link_url, tags, importance_score, raw_meta)
│
├── APScheduler (background thread)
│   ├── Operator feeds: every 15 min (VMO2, Vodafone, Sky, TalkTalk)
│   ├── Government: every 10 min (DSIT, Ofcom)
│   ├── Google News: every 10 min
│   └── Trade press: every 15 min (ThinkBroadband, ISPReview)
│
└── Frontend (backend/static/)
    ├── index.html — MI5-style dashboard, vanilla JS
    └── styles.css — dark terminal theme
```

### Key Design Decisions

1. **No third-party HTTP/parsing libraries.** Python's `requests` library has SSL handshake failures with several UK telco sites. `feedparser` and `beautifulsoup4` can't build in the Replit environment (setuptools incompatibility). Solution: all HTTP fetching uses `subprocess.run(["curl", ...])` and parsing uses Python stdlib (`xml.etree.ElementTree` for RSS/Atom, `html.parser.HTMLParser` for HTML scraping).

2. **Single-server deployment.** FastAPI serves both the API and the static frontend. No NGINX, no separate frontend build step. One `uvicorn` command runs everything.

3. **Deduplication via content hash.** Each update is hashed as `SHA256(link_url + "|" + title)`. Duplicate items are silently skipped on re-ingestion.

4. **Only 4 Python dependencies:** fastapi, uvicorn, sqlalchemy, apscheduler.

---

## Data Sources (9 total)

| # | Source | Type | Feed URL | Method | Schedule |
|---|--------|------|----------|--------|----------|
| 1 | Virgin Media O2 | operator | `https://news.virginmediao2.co.uk/feed/` | RSS | 15 min |
| 2 | Vodafone (Three) | operator | `https://www.vodafone.co.uk/newscentre/feed/` | RSS | 15 min |
| 3 | Sky | operator | Google News RSS (targeted query) | RSS | 15 min |
| 4 | TalkTalk | operator | `https://www.talktalkgroup.com/newsroom` | HTML scrape | 15 min |
| 5 | DSIT | policy | GOV.UK Atom feeds (news + consultations) | Atom | 10 min |
| 6 | Ofcom | regulation | GOV.UK Atom feeds (news + consultations) | Atom | 10 min |
| 7 | Google News | news | Google News RSS (UK telecoms query) | RSS | 10 min |
| 8 | ThinkBroadband | trade_press | `https://www.thinkbroadband.com/news.rss` | RSS | 15 min |
| 9 | ISPReview | trade_press | `https://www.ispreview.co.uk/index.php/feed` | RSS | 15 min |

### Source-specific notes

- **Sky:** Their press site (`news.sky.com/stories`) is a fully JS-rendered Next.js app with no RSS feed and no scrapeable HTML. Uses a targeted Google News RSS query instead.
- **TalkTalk:** No RSS feed. Uses HTML scraping of the newsroom page, filtering links that contain `/newsroom/` in the path.
- **DSIT & Ofcom:** Use GOV.UK's Atom feeds, not the organisations' own sites. Ofcom discontinued their native RSS feeds (return 403).
- **ISPReview:** Returns 403 with bot-like User-Agent strings. Uses a browser-compatible UA header.

---

## File-by-File Reference

### Core Application
- **backend/main.py** — FastAPI app, lifespan (startup/shutdown), routes, CORS, static file serving
- **backend/models.py** — SQLAlchemy `Update` model (the single DB table)
- **backend/database.py** — SQLAlchemy engine, session factory, `init_db()`, `get_db()`
- **backend/schemas.py** — Pydantic `UpdateOut` and `UpdateCreate` models
- **backend/config.py** — `DATABASE_URL` and `TELCO_TAG_KEYWORDS` list
- **backend/requirements.txt** — 4 dependencies only

### Ingestion Layer
- **backend/ingestion/base.py** — `curl_fetch()`, `parse_rss()`, `extract_links()`, `persist_updates()`, `BaseIngestor` ABC
- **backend/ingestion/scheduler.py** — APScheduler wiring, `start_scheduler()`, `stop_scheduler()`, `run_all_once()`
- **backend/ingestion/virgin_media_o2.py** — VMO2 RSS ingestor
- **backend/ingestion/vodafone_three.py** — Vodafone RSS ingestor
- **backend/ingestion/sky.py** — Sky via Google News RSS ingestor
- **backend/ingestion/talktalk.py** — TalkTalk HTML scrape ingestor
- **backend/ingestion/dsit.py** — DSIT GOV.UK Atom ingestor (2 feeds)
- **backend/ingestion/ofcom_rss.py** — Ofcom GOV.UK Atom ingestor (2 feeds)
- **backend/ingestion/googlenews.py** — Google News RSS ingestor
- **backend/ingestion/thinkbroadband.py** — ThinkBroadband RSS ingestor
- **backend/ingestion/ispreview.py** — ISPReview RSS ingestor

### Frontend
- **backend/static/index.html** — Dashboard (canonical, served by FastAPI)
- **backend/static/styles.css** — MI5 terminal theme (canonical)
- **frontend/** — Legacy copies, kept for reference only

### Deployment
- **.replit** — Single run command for Replit
- **.gitignore** — Standard Python ignores + SQLite DB

---

## Known Gotchas & Lessons Learned

### 1. Python SSL is broken for some UK sites
VMO2 and Vodafone sites reject Python's SSL handshake (`SSLV3_ALERT_HANDSHAKE_FAILURE`). System curl works fine. **All HTTP fetching goes through `subprocess.run(["curl", ...])`.** Do NOT switch back to `requests`.

### 2. feedparser / beautifulsoup4 won't install
Both depend on packages that fail to build in certain environments (Replit, some CI) due to `setuptools` incompatibilities. **Use stdlib only:** `xml.etree.ElementTree` for XML, `html.parser.HTMLParser` for HTML.

### 3. ElementTree boolean trap
`Element.__bool__()` returns `False` for elements with no children, even if the element exists and has attributes. This means `<link href="https://..."/>` evaluates to `False` in boolean context. **Always use `is None` checks:**
```python
# WRONG - will skip valid childless elements
link_el = item.find("link[@href]") or item.find("link")

# CORRECT
link_el = item.find("link[@href]")
if link_el is None:
    link_el = item.find("link")
```

### 4. Atom namespace
GOV.UK Atom feeds use the `{http://www.w3.org/2005/Atom}` namespace. All `find()` calls need the namespace prefix:
```python
_ATOM_NS = "{http://www.w3.org/2005/Atom}"
item.find(f"{_ATOM_NS}title")
```

### 5. Git push restrictions
This environment can only push to `claude/*` branches. To deploy to Replit: push to feature branch → create PR on GitHub → merge on GitHub → Replit auto-syncs from `main`.

### 6. Replit imports from default branch
When importing a GitHub repo into Replit, it clones the default branch (`main`). Feature branch work won't appear until merged.

---

## Deployment Flow (GitHub → Replit)

```
Developer                    GitHub                    Replit
   │                           │                         │
   ├── push to claude/* ──────>│                         │
   │                           │                         │
   ├── create PR ─────────────>│                         │
   │                           │                         │
   ├── merge PR to main ──────>│── auto-sync ──────────>│
   │                           │                         │
   │                           │              uvicorn starts
   │                           │              DB auto-created
   │                           │              feeds ingested
   │                           │              dashboard live
```

---

## API Reference

### GET /api/updates
Returns array of update objects, newest first.

**Query params:**
- `limit` (int, default 50) — max items to return
- `offset` (int, default 0) — pagination offset
- `source_type` (string, optional) — filter by type (operator, policy, regulation, news, trade_press, curated)
- `search` (string, optional) — full-text search on title + summary

### GET /api/health
Returns `{"status": "ok", "updates_count": N}`

### GET /api/updates/recent_summary
Returns `{"total_24h": N, "by_source": {"VMO2": X, ...}}`

---

## What's Next (Suggested Improvements)

1. **Add more operator sources** — BT/EE (they have an RSS feed), Three UK post-merger updates
2. **AI summarisation** — Use an LLM API to generate daily briefings from the raw updates
3. **Email/Slack alerts** — Push notifications for high-importance updates
4. **Better deduplication** — Fuzzy title matching to catch near-duplicates across sources
5. **Sentiment/topic analysis** — Tag updates with themes (spectrum, broadband, regulation, M&A)
6. **Auth & multi-user** — Login, saved searches, personal watchlists
7. **Historical analytics** — Charts showing update volume over time by source/topic

---

## Commit History

```
68b56c3 Fix ingestion: replace feedparser/requests with curl+stdlib XML parsing
ce31d71 Replace sources: add VMO2, VodafoneThree, Sky, TalkTalk, DSIT, update Ofcom
72a46db Unify into single-server deployment: FastAPI serves frontend at /
d112cd6 Extend MVP: SQLite DB, real ingestion from 8 sources, MI5-style frontend
e86b8fc Add project skeleton: FastAPI backend + HTML/JS frontend
b579c9c Initial commit
```

---

## Contact

Built by Andrew Cocks (andrewcocks@gmail.com) with Claude Code assistance, June 2026.
