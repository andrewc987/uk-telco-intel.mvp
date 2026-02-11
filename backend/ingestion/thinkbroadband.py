"""ThinkBroadband RSS ingestor – trade press."""

from __future__ import annotations

import json
import logging

import feedparser
import requests

from config import TELCO_TAG_KEYWORDS
from schemas import UpdateCreate
from ingestion.base import BaseIngestor

logger = logging.getLogger(__name__)

FEED_URL = "https://www.thinkbroadband.com/news.rss"


def _extract_tags(text: str) -> str:
    lower = text.lower()
    found = [kw for kw in TELCO_TAG_KEYWORDS if kw.lower() in lower]
    return ",".join(found) if found else "broadband"


class ThinkBroadbandIngestor(BaseIngestor):
    source_name = "ThinkBroadband"

    def fetch(self) -> list[UpdateCreate]:
        items: list[UpdateCreate] = []
        try:
            resp = requests.get(FEED_URL, timeout=15)
            resp.raise_for_status()
            feed = feedparser.parse(resp.content)
            for entry in feed.entries[:25]:
                title = entry.get("title", "").strip()
                if not title:
                    continue
                link = entry.get("link", "")
                summary = entry.get("summary", entry.get("description", ""))
                if summary:
                    summary = summary[:500]
                tags = _extract_tags(title + " " + (summary or ""))
                items.append(UpdateCreate(
                    source_type="trade_press",
                    source_name=self.source_name,
                    title=title,
                    summary=summary or "",
                    link_url=link or None,
                    tags=tags,
                    importance_score=0.5,
                    raw_meta=json.dumps({
                        "published": entry.get("published", ""),
                    }),
                ))
        except Exception as exc:
            logger.warning("ThinkBroadband fetch error: %s", exc)
        return items
