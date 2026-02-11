"""APScheduler configuration – runs ingestion jobs in the background."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger

from database import SessionLocal
from models import Update
from ingestion.base import persist_updates

from ingestion.virgin_media_o2 import VirginMediaO2Ingestor
from ingestion.vodafone_three import VodafoneThreeIngestor
from ingestion.sky import SkyIngestor
from ingestion.talktalk import TalkTalkIngestor
from ingestion.dsit import DSITIngestor
from ingestion.ofcom_rss import OfcomIngestor
from ingestion.googlenews import GoogleNewsIngestor
from ingestion.thinkbroadband import ThinkBroadbandIngestor
from ingestion.ispreview import ISPReviewIngestor

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler(timezone="UTC")


def _run_ingestor(ingestor_cls):
    """Generic wrapper: instantiate, fetch, persist, log."""
    name = ingestor_cls.source_name
    try:
        ingestor = ingestor_cls()
        items = ingestor.fetch()
        created = persist_updates(items)
        logger.info("[%s] fetched=%d  new=%d", name, len(items), created)
    except Exception as exc:
        logger.error("[%s] job failed: %s", name, exc, exc_info=True)


def _run_daily_summary():
    """Generate a curated daily summary update."""
    try:
        db = SessionLocal()
        cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
        rows = db.query(Update.source_type, Update.source_name).filter(
            Update.created_at >= cutoff,
        ).all()
        db.close()

        if not rows:
            logger.info("[SystemCurator] No updates in last 24h – skipping summary.")
            return

        # Count by source_type
        type_counts: dict[str, int] = {}
        name_counts: dict[str, int] = {}
        for stype, sname in rows:
            type_counts[stype] = type_counts.get(stype, 0) + 1
            name_counts[sname] = name_counts.get(sname, 0) + 1

        parts = []
        for stype, count in sorted(type_counts.items(), key=lambda x: -x[1]):
            parts.append(f"{count} {stype}")
        type_str = ", ".join(parts)

        top_sources = sorted(name_counts.items(), key=lambda x: -x[1])[:3]
        source_str = ", ".join(s[0] for s in top_sources)

        summary = (
            f"In the last 24 hours there were {len(rows)} updates: {type_str}. "
            f"Key sources: {source_str}."
        )

        from schemas import UpdateCreate
        persist_updates([UpdateCreate(
            source_type="curated",
            source_name="SystemCurator",
            title="Daily UK telco intelligence summary",
            summary=summary,
            link_url=None,
            tags="summary,daily",
            importance_score=0.8,
        )])
        logger.info("[SystemCurator] Daily summary created.")
    except Exception as exc:
        logger.error("[SystemCurator] daily summary failed: %s", exc, exc_info=True)


def start_scheduler():
    """Register all jobs and start the scheduler."""

    # Operator news centres – every 15 minutes
    scheduler.add_job(
        _run_ingestor, IntervalTrigger(minutes=15),
        args=[VirginMediaO2Ingestor], id="vmo2", replace_existing=True,
    )
    scheduler.add_job(
        _run_ingestor, IntervalTrigger(minutes=15),
        args=[VodafoneThreeIngestor], id="vodafone_three", replace_existing=True,
    )
    scheduler.add_job(
        _run_ingestor, IntervalTrigger(minutes=15),
        args=[SkyIngestor], id="sky", replace_existing=True,
    )
    scheduler.add_job(
        _run_ingestor, IntervalTrigger(minutes=15),
        args=[TalkTalkIngestor], id="talktalk", replace_existing=True,
    )

    # Government & regulator – every 10 minutes
    scheduler.add_job(
        _run_ingestor, IntervalTrigger(minutes=10),
        args=[DSITIngestor], id="dsit", replace_existing=True,
    )
    scheduler.add_job(
        _run_ingestor, IntervalTrigger(minutes=10),
        args=[OfcomIngestor], id="ofcom", replace_existing=True,
    )

    # Google News – every 10 minutes
    scheduler.add_job(
        _run_ingestor, IntervalTrigger(minutes=10),
        args=[GoogleNewsIngestor], id="googlenews", replace_existing=True,
    )

    # Trade press – every 15 minutes
    scheduler.add_job(
        _run_ingestor, IntervalTrigger(minutes=15),
        args=[ThinkBroadbandIngestor], id="thinkbroadband", replace_existing=True,
    )
    scheduler.add_job(
        _run_ingestor, IntervalTrigger(minutes=15),
        args=[ISPReviewIngestor], id="ispreview", replace_existing=True,
    )

    # Daily at 06:00 UTC
    scheduler.add_job(
        _run_daily_summary, CronTrigger(hour=6, minute=0),
        id="daily_summary", replace_existing=True,
    )

    scheduler.start()
    logger.info("Scheduler started with %d jobs.", len(scheduler.get_jobs()))


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)


def run_all_once():
    """Trigger every ingestor once (useful on first startup)."""
    for cls in [
        VirginMediaO2Ingestor, VodafoneThreeIngestor, SkyIngestor,
        TalkTalkIngestor, DSITIngestor, OfcomIngestor,
        GoogleNewsIngestor, ThinkBroadbandIngestor, ISPReviewIngestor,
    ]:
        _run_ingestor(cls)
