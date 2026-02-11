# UK Telco Intelligence Platform – MVP

A rolling intelligence board for the UK telecommunications sector. Aggregates policy documents, regulatory notices, trade press, general news, forum chatter, and weather/flood incident warnings from free public APIs and RSS feeds, then presents them in a dark "MI5 terminal" style dashboard.

## Project structure

```
backend/
  main.py              FastAPI application (API + frontend serving + scheduler)
  config.py            Constants and environment variable configuration
  database.py          SQLAlchemy engine, session factory, Base
  models.py            Update ORM model (SQLite)
  schemas.py           Pydantic request/response schemas
  requirements.txt     Python dependencies
  static/
    index.html         MI5-style intelligence terminal UI (served at /)
    styles.css         Dark-theme stylesheet (served at /static/styles.css)
  ingestion/
    __init__.py
    base.py            Abstract ingestor + dedup/persist helpers
    govuk.py           GOV.UK Content API (policy)
    ofcom_rss.py       Ofcom RSS feeds (regulation)
    thinkbroadband.py  ThinkBroadband RSS (trade press)
    ispreview.py       ISPReview RSS (trade press)
    googlenews.py      Google News RSS proxy (general news)
    reddit_stub.py     Reddit stub – requires API keys (forum)
    metoffice.py       Met Office weather warnings (incident)
    env_agency.py      Environment Agency flood warnings (incident)
    scheduler.py       APScheduler job definitions

frontend/              (legacy – kept for reference; backend/static/ is canonical)
  index.html
  styles.css

.replit                Replit run configuration
```

## Quick start

Everything runs as a **single FastAPI server** — one command, one port.

### One-command run (Replit or local)

```bash
cd backend && pip install -r requirements.txt && uvicorn main:app --host 0.0.0.0 --port 8000
```

On Replit this is already configured in `.replit` — just press **Run**.

### Local development with venv

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

On first startup the app will:
1. Create an SQLite database (`telco_intel.db`)
2. Run every ingestor once to populate the database
3. Start the background scheduler for recurring ingestion

Then visit **http://localhost:8000**:
- `/` serves the MI5-style dashboard
- `/api/*` provides JSON endpoints

## API endpoints

| Endpoint | Description |
|---|---|
| `GET /api/health` | Health check + DB row count |
| `GET /api/updates?limit=50&offset=0&source_type=policy&search=broadband` | Filtered, paginated updates (newest first) |
| `GET /api/updates/recent_summary` | Count of updates by source_type in the last 24 hours |

## Active ingestion sources

| Source | Type | Schedule | Notes |
|---|---|---|---|
| GOV.UK Content API | policy | every 10 min | Ofcom, DSIT, CMA documents |
| Ofcom RSS | regulation | every 10 min | News + consultations feeds |
| ThinkBroadband RSS | trade_press | every 15 min | UK broadband news |
| ISPReview RSS | trade_press | every 15 min | UK ISP news |
| Google News RSS | news | every 10 min | UK telecoms search proxy |
| Reddit | forum | every 15 min | **Stubbed** – needs `REDDIT_CLIENT_ID` and `REDDIT_CLIENT_SECRET` env vars |
| Met Office Warnings | incident | every 30 min | Severe weather RSS |
| Environment Agency | incident | every 30 min | Flood monitoring API |
| SystemCurator | curated | daily 06:00 UTC | Auto-generated 24h summary |

## Environment variables (optional)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | SQLAlchemy DB URL (default: `sqlite:///telco_intel.db`) |
| `REDDIT_CLIENT_ID` | Reddit API client ID |
| `REDDIT_CLIENT_SECRET` | Reddit API client secret |
| `REDDIT_USER_AGENT` | Reddit API user agent string |
