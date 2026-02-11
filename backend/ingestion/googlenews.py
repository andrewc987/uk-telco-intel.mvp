"""Google News RSS proxy – UK telco news."""

from __future__ import annotations

import json
import logging

from schemas import UpdateCreate
from ingestion.base import BaseIngestor, curl_fetch, parse_rss

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
                data = curl_fetch(feed_url)
                for entry in parse_rss(data, max_items=30):
                    title = entry["title"]
                    items.append(UpdateCreate(
                        source_type="news",
                        source_name=self.source_name,
                        title=title,
                        summary=entry["summary"],
                        link_url=entry["link"] or None,
                        tags="news,uk,telecoms",
                        importance_score=0.5,
                        raw_meta=json.dumps({
                            "published": entry["published"],
                        }),
                    ))
            except Exception as exc:
                logger.warning("Google News fetch error: %s", exc)
        return items
