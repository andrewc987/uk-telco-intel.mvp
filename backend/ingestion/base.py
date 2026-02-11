"""Base ingestor interface and shared persistence helpers."""

from __future__ import annotations

import hashlib
import json
import logging
from abc import ABC, abstractmethod
from datetime import datetime, timezone

from database import SessionLocal
from models import Update
from schemas import UpdateCreate

logger = logging.getLogger(__name__)


class BaseIngestor(ABC):
    """Every concrete ingestor must set source_name and implement fetch()."""

    source_name: str = "Unknown"

    @abstractmethod
    def fetch(self) -> list[UpdateCreate]:
        """Return a list of candidate updates (not yet persisted)."""
        ...


def _dedup_key(item: UpdateCreate) -> str:
    """Produce a stable hash for duplicate detection."""
    raw = (item.link_url or "") + "|" + item.title
    return hashlib.sha256(raw.encode()).hexdigest()


def persist_updates(items: list[UpdateCreate]) -> int:
    """Insert new updates, skip duplicates.  Returns count of new rows."""
    if not items:
        return 0

    db = SessionLocal()
    created = 0
    try:
        # Build a set of hashes already in the DB for the same source
        source_names = {i.source_name for i in items}
        existing_rows = (
            db.query(Update.link_url, Update.title)
            .filter(Update.source_name.in_(source_names))
            .all()
        )
        existing_keys = set()
        for url, title in existing_rows:
            raw = (url or "") + "|" + title
            existing_keys.add(hashlib.sha256(raw.encode()).hexdigest())

        for item in items:
            key = _dedup_key(item)
            if key in existing_keys:
                continue
            row = Update(
                created_at=datetime.now(timezone.utc),
                source_type=item.source_type,
                source_name=item.source_name,
                title=item.title,
                summary=item.summary,
                link_url=item.link_url,
                tags=item.tags,
                importance_score=item.importance_score,
                raw_meta=item.raw_meta,
            )
            db.add(row)
            existing_keys.add(key)
            created += 1

        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

    return created
