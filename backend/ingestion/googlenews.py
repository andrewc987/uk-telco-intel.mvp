"""Google News RSS proxy – UK telco news."""

from __future__ import annotations

import json
import logging

import feedparser
import requests

from schemas import UpdateCreate
from ingestion.base import BaseIngestor

logger = logging.getLogger(__name__)

FEEDS = [
    (
        "https://news.google.com/rss/search?"
        "q=UK+telecoms+OR+UK+broadband+OR+UK+5G+OR+UK+mobile+operator+OR+Ofcom"
        "&hl=en-GB&gl=GB&ceid=GB:en"
    ),
]


class GoogleNewsIngestor(BaseIngestor):
    source_name = "GoogleNewsProxy"

    def fetch(self) -> list[UpdateCreate]:
        items: list[UpdateCreate] = []
        for feed_url in FEEDS:
            try:
                resp = requests.get(feed_url, timeout=15, headers={
                    "User-Agent": "uk-telco-intel/0.1",
                })
                resp.raise_for_status()
                feed = feedparser.parse(resp.content)
                for entry in feed.entries[:30]:
                    title = entry.get("title", "").strip()
                    if not title:
                        continue
                    link = entry.get("link", "")
                    summary = entry.get("summary", entry.get("description", ""))
                    if summary:
                        summary = summary[:500]
                    items.append(UpdateCreate(
                        source_type="news",
                        source_name=self.source_name,
                        title=title,
                        summary=summary or "",
                        link_url=link or None,
                        tags="news,uk,telecoms",
                        importance_score=0.5,
                        raw_meta=json.dumps({
                            "published": entry.get("published", ""),
                            "source": entry.get("source", {}).get("title", ""),
                        }),
                    ))
            except Exception as exc:
                logger.warning("Google News fetch error: %s", exc)
        return items
