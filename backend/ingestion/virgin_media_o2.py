"""Virgin Media O2 News Centre ingestor – operator news via WordPress RSS."""

from __future__ import annotations

import json
import logging

import feedparser
import requests

from config import TELCO_TAG_KEYWORDS
from schemas import UpdateCreate
from ingestion.base import BaseIngestor

logger = logging.getLogger(__name__)

FEED_URL = "https://news.virginmediao2.co.uk/feed/"


def _extract_tags(text: str) -> str:
    lower = text.lower()
    found = [kw for kw in TELCO_TAG_KEYWORDS if kw.lower() in lower]
    if "Virgin Media" not in found:
        found.insert(0, "Virgin Media")
    return ",".join(found)


class VirginMediaO2Ingestor(BaseIngestor):
    source_name = "Virgin Media O2"

    def fetch(self) -> list[UpdateCreate]:
        items: list[UpdateCreate] = []
        try:
            resp = requests.get(FEED_URL, timeout=15, headers={
                "User-Agent": "uk-telco-intel/0.1",
            })
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
                    source_type="operator",
                    source_name=self.source_name,
                    title=title,
                    summary=summary or "",
                    link_url=link or None,
                    tags=tags,
                    importance_score=0.7,
                    raw_meta=json.dumps({
                        "published": entry.get("published", ""),
                    }),
                ))
        except Exception as exc:
            logger.warning("Virgin Media O2 fetch error: %s", exc)
        return items
