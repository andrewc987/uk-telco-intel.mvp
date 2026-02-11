"""Ofcom RSS feed ingestor – regulatory updates."""

from __future__ import annotations

import json
import logging

import feedparser
import requests

from schemas import UpdateCreate
from ingestion.base import BaseIngestor

logger = logging.getLogger(__name__)

OFCOM_FEEDS = [
    "https://www.govwire.co.uk/rss/ofcom",
    "https://openrss.org/www.ofcom.org.uk/consultations-and-statements",
]


class OfcomRSSIngestor(BaseIngestor):
    source_name = "Ofcom RSS"

    def fetch(self) -> list[UpdateCreate]:
        items: list[UpdateCreate] = []
        for feed_url in OFCOM_FEEDS:
            try:
                resp = requests.get(feed_url, timeout=15)
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
                        source_type="regulation",
                        source_name=self.source_name,
                        title=title,
                        summary=summary or "",
                        link_url=link or None,
                        tags="ofcom",
                        importance_score=0.7,
                        raw_meta=json.dumps({
                            "feed": feed_url,
                            "published": entry.get("published", ""),
                        }),
                    ))
            except Exception as exc:
                logger.warning("Ofcom RSS fetch error feed=%s: %s", feed_url, exc)
        return items
