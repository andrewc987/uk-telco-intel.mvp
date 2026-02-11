"""UK Telco Intelligence Platform – FastAPI application."""

from __future__ import annotations

import logging
import pathlib
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import FastAPI, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import func
from sqlalchemy.orm import Session

STATIC_DIR = pathlib.Path(__file__).resolve().parent / "static"

from database import init_db, get_db
from models import Update
from schemas import UpdateOut
from ingestion.scheduler import start_scheduler, stop_scheduler, run_all_once

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger(__name__)


# ── Lifespan ────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    logger.info("Database initialised.")
    # Run all ingestors once on startup so the DB isn't empty
    run_all_once()
    start_scheduler()
    yield
    stop_scheduler()
    logger.info("Scheduler stopped.")


app = FastAPI(title="UK Telco Intel", version="0.2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/api/health")
def health(db: Session = Depends(get_db)):
    """Health check – also reports DB row count."""
    count = db.query(func.count(Update.id)).scalar()
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "db_updates_count": count,
    }


@app.get("/api/updates", response_model=list[UpdateOut])
def get_updates(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    source_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Return updates from the database, newest first."""
    q = db.query(Update)
    if source_type:
        q = q.filter(Update.source_type == source_type)
    if search:
        pattern = f"%{search}%"
        q = q.filter(
            (Update.title.ilike(pattern)) | (Update.summary.ilike(pattern))
        )
    rows = q.order_by(Update.created_at.desc()).offset(offset).limit(limit).all()
    return rows


@app.get("/api/updates/recent_summary")
def recent_summary(db: Session = Depends(get_db)):
    """Count of updates by source_type in the last 24 hours."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    rows = (
        db.query(Update.source_type, func.count(Update.id))
        .filter(Update.created_at >= cutoff)
        .group_by(Update.source_type)
        .all()
    )
    return {stype: count for stype, count in rows}


# ── Frontend serving ────────────────────────────────────────────────────────

@app.get("/", include_in_schema=False)
def serve_index():
    """Serve the MI5-style dashboard at the root URL."""
    return FileResponse(STATIC_DIR / "index.html")


app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
