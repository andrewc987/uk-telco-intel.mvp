"""Met Office severe weather warnings ingestor."""

from __future__ import annotations

import json
import logging

import requests

from schemas import UpdateCreate
from ingestion.base import BaseIngestor

logger = logging.getLogger(__name__)

WARNINGS_URL = "https://www.metoffice.gov.uk/public/data/PWSCache/WarningsRSS/Region/UK"


class MetOfficeIngestor(BaseIngestor):
    source_name = "MetOffice"

    def fetch(self) -> list[UpdateCreate]:
        import feedparser

        items: list[UpdateCreate] = []
        try:
            resp = requests.get(WARNINGS_URL, timeout=15)
            resp.raise_for_status()
            feed = feedparser.parse(resp.content)
            for entry in feed.entries[:20]:
                title = entry.get("title", "").strip()
                if not title:
                    continue
                link = entry.get("link", "")
                summary = entry.get("summary", entry.get("description", ""))
                if summary:
                    summary = summary[:500]
                items.append(UpdateCreate(
                    source_type="incident",
                    source_name=self.source_name,
                    title=title,
                    summary=summary or "",
                    link_url=link or None,
                    tags="weather,risk",
                    importance_score=0.7,
                    raw_meta=json.dumps({
                        "published": entry.get("published", ""),
                    }),
                ))
        except Exception as exc:
            logger.warning("MetOffice fetch error: %s", exc)
        return items
