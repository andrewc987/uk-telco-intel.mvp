"""Ofcom ingestor – news releases and consultations via multiple feed sources."""

from __future__ import annotations

import json
import logging

from schemas import UpdateCreate
from ingestion.base import BaseIngestor, curl_fetch, parse_rss

logger = logging.getLogger(__name__)

OFCOM_FEEDS = [
    {
        "url": (
            "https://www.gov.uk/search/news-and-communications.atom"
            "?organisations%5B%5D=ofcom"
        ),
        "label": "news",
    },
    {
        "url": (
            "https://www.gov.uk/search/policy-papers-and-consultations.atom"
            "?organisations%5B%5D=ofcom"
        ),
        "label": "consultations",
    },
]


class OfcomIngestor(BaseIngestor):
    source_name = "Ofcom"

    def fetch(self) -> list[UpdateCreate]:
        items: list[UpdateCreate] = []
        seen_titles: set[str] = set()

        for feed_info in OFCOM_FEEDS:
            feed_url = feed_info["url"]
            label = feed_info["label"]
            try:
                data = curl_fetch(feed_url)
                for entry in parse_rss(data, max_items=20):
                    title = entry["title"]
                    title_key = title.lower()
                    if title_key in seen_titles:
                        continue
                    seen_titles.add(title_key)

                    items.append(UpdateCreate(
                        source_type="regulation",
                        source_name=self.source_name,
                        title=title,
                        summary=entry["summary"],
                        link_url=entry["link"] or None,
                        tags=f"Ofcom,{label}",
                        importance_score=0.7,
                        raw_meta=json.dumps({
                            "feed": feed_url,
                            "label": label,
                            "published": entry["published"],
                        }),
                    ))
            except Exception as exc:
                logger.warning("Ofcom feed error (%s): %s", feed_url, exc)
        return items
