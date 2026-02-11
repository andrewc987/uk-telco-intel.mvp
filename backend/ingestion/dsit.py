"""DSIT (Department for Science, Innovation and Technology) ingestor – GOV.UK Atom feeds."""

from __future__ import annotations

import json
import logging

from schemas import UpdateCreate
from ingestion.base import BaseIngestor, curl_fetch, parse_rss

logger = logging.getLogger(__name__)

# DSIT news releases and consultations via GOV.UK Atom feeds
DSIT_FEEDS = [
    {
        "url": (
            "https://www.gov.uk/search/news-and-communications.atom"
            "?organisations%5B%5D=department-for-science-innovation-and-technology"
        ),
        "label": "news",
        "source_type": "policy",
    },
    {
        "url": (
            "https://www.gov.uk/search/policy-papers-and-consultations.atom"
            "?organisations%5B%5D=department-for-science-innovation-and-technology"
        ),
        "label": "consultations",
        "source_type": "policy",
    },
]


class DSITIngestor(BaseIngestor):
    source_name = "DSIT"

    def fetch(self) -> list[UpdateCreate]:
        items: list[UpdateCreate] = []
        for feed_info in DSIT_FEEDS:
            feed_url = feed_info["url"]
            source_type = feed_info["source_type"]
            label = feed_info["label"]
            try:
                data = curl_fetch(feed_url)
                for entry in parse_rss(data, max_items=20):
                    title = entry["title"]
                    items.append(UpdateCreate(
                        source_type=source_type,
                        source_name=self.source_name,
                        title=title,
                        summary=entry["summary"],
                        link_url=entry["link"] or None,
                        tags=f"DSIT,{label}",
                        importance_score=0.7,
                        raw_meta=json.dumps({
                            "feed": label,
                            "published": entry["published"],
                        }),
                    ))
            except Exception as exc:
                logger.warning("DSIT feed error (%s): %s", label, exc)
        return items
